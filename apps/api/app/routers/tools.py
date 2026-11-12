"""Kalkulator fungsi bertahap, pemeriksa relasi, dan pemodel soal cerita (mode A & B)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from .. import config
from ..core import ai, content, progress
from ..core.mathfn import MathInputError, analyze_relation, evaluate_steps
from ..core.modeler import ModelSpec, solve, verify_spec
from ..core.security import get_current_user
from ..db import get_db
from ..models import User

router = APIRouter(prefix="/api/tools", tags=["alat"])


class EvaluateIn(BaseModel):
    expr: str = Field(..., max_length=80)
    x: str = Field(..., max_length=20)
    name: str = Field("f", max_length=1)


@router.post("/evaluate")
def evaluate(body: EvaluateIn, _: User = Depends(get_current_user)) -> dict:
    try:
        return evaluate_steps(body.expr, body.x, body.name)
    except MathInputError as exc:
        raise HTTPException(422, str(exc))


class RelationIn(BaseModel):
    domain: list[str] = Field(..., max_length=8)
    codomain: list[str] = Field(..., max_length=8)
    pairs: list[list[str]] = Field(default_factory=list, max_length=64)


@router.post("/relation")
def relation(body: RelationIn, _: User = Depends(get_current_user)) -> dict:
    try:
        return analyze_relation(body.domain, body.codomain, body.pairs)
    except MathInputError as exc:
        raise HTTPException(422, str(exc))


@router.get("/modeler/presets")
def presets(_: User = Depends(get_current_user)) -> list[dict]:
    return content.modeler_presets()


@router.post("/modeler/solve")
def modeler_solve(spec: ModelSpec, _: User = Depends(get_current_user)) -> dict:
    """Mode A (terpandu): siswa sudah mengisi model; SymPy menghitung."""
    try:
        return solve(spec)
    except MathInputError as exc:
        raise HTTPException(422, str(exc))


@router.get("/modeler/ai-status")
def ai_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    user = db.merge(user)
    class_on = bool(user.classroom and user.classroom.ai_enabled) or user.role == "teacher"
    return {
        "configured": config.ai_configured(),
        "class_enabled": class_on,
        "available": config.ai_configured() and class_on,
        "daily_quota": config.AI_DAILY_QUOTA,
    }


class StoryIn(BaseModel):
    text: str = Field(..., min_length=20, max_length=1500)


@router.post("/modeler/ai")
def modeler_ai(body: StoryIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    """Mode B: Claude menerjemahkan cerita -> model; diverifikasi lalu dihitung SymPy."""
    user = db.merge(user)
    status = ai_status(user, db)
    if not status["configured"]:
        raise HTTPException(503, "Fitur AI belum aktif di server ini. Gunakan mode terpandu.")
    if not status["class_enabled"]:
        raise HTTPException(403, "Fitur AI belum diaktifkan oleh gurumu. Gunakan mode terpandu.")
    try:
        remaining = progress.use_ai_quota(db, user)
    except PermissionError as exc:
        raise HTTPException(429, str(exc))

    try:
        data = ai.extract_model(body.text)
    except ai.AIUnavailable as exc:
        raise HTTPException(502, str(exc))

    if not data.get("supported", True):
        return {"supported": False, "reason": data.get("reason", "Soal ini belum didukung."),
                "remaining": remaining}
    try:
        spec = ai.to_spec(data)
    except (ValidationError, KeyError, TypeError) as exc:
        raise HTTPException(502, "Model dari AI tidak lengkap. Coba lagi atau pakai mode terpandu.") from exc

    verification = verify_spec(body.text, spec)
    out = {
        "supported": True,
        "spec": spec.model_dump(),
        "explanations": {
            "models": [{"name": m.get("name"), "meaning_a": m.get("meaning_a", ""),
                        "meaning_b": m.get("meaning_b", "")} for m in data.get("models", [])],
            "x": data.get("task", {}).get("x_explanation", ""),
            "question": data.get("question_restated", ""),
        },
        "verification": verification,
        "remaining": remaining,
    }
    if verification["ok"]:
        out["solution"] = solve(spec)
    return out
