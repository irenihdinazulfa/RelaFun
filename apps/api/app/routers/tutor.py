"""Asisten Belajar (chatbot RMT). AI = DeepSeek; kunci hanya dari .env di server."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import config
from ..core import progress, tutor
from ..core.security import get_current_user, require_teacher
from ..db import get_db
from ..models import Classroom, TutorLog, TutorUsage, User

router = APIRouter(prefix="/api/tutor", tags=["asisten"])


def _usage(db: Session, user: User) -> TutorUsage:
    day = progress.today()
    row = db.scalar(select(TutorUsage).where(TutorUsage.user_id == user.id, TutorUsage.date == day))
    if row is None:
        row = TutorUsage(user_id=user.id, date=day, calls=0)
        db.add(row)
        db.flush()
    return row


@router.get("/status")
def status(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    used = _usage(db, db.merge(user)).calls
    db.commit()
    return {"ai": config.tutor_ai_configured(), "provider": "DeepSeek", "model": config.DEEPSEEK_MODEL,
            "daily_quota": config.TUTOR_DAILY_QUOTA, "remaining": max(0, config.TUTOR_DAILY_QUOTA - used),
            "free_mode": config.tutor_ai_configured(), "static": False}


@router.get("/problems")
def problems(_: User = Depends(get_current_user)) -> dict:
    return tutor.catalog()


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field("", max_length=1200)


class TurnIn(BaseModel):
    problem_id: str = Field(..., max_length=40)
    action: Literal["start", "answer", "hint", "ask", "next"] = "answer"
    message: str = Field("", max_length=600)
    step: int = Field(0, ge=0, le=50)
    attempts: int = Field(0, ge=0, le=99)
    hint: int = Field(0, ge=0, le=3)
    phase: int = Field(0, ge=0, le=5)
    problem_text: str = Field("", max_length=1200)
    history: list[HistoryItem] = Field(default_factory=list, max_length=12)


@router.post("/turn")
def turn(body: TurnIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    user = db.merge(user)
    usage = _usage(db, user)
    quota_left = config.TUTOR_DAILY_QUOTA - usage.calls
    ai = tutor.deepseek_chat if (config.tutor_ai_configured() and quota_left > 0) else None
    req = body.model_dump()
    req["history"] = [h.model_dump() for h in body.history]
    try:
        if body.problem_id == tutor.FREE_ID:
            if not config.tutor_ai_configured():
                raise HTTPException(503, "Mode Soal Bebas memakai DeepSeek. Isi DEEPSEEK_API_KEY di file .env server.")
            if ai is None:
                raise HTTPException(429, "Kuota balasan AI hari ini sudah habis. Coba soal bawaan, ya.")
            out = tutor.turn_free(req, ai)
        else:
            out = tutor.turn(req, ai)
    except KeyError as exc:
        raise HTTPException(404, str(exc.args[0]) if exc.args else "Soal tidak ditemukan.")
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    usage.calls += out.pop("ai_calls", 0)
    db.commit()
    out.pop("ai_error", None)  # detail galat hanya di log server
    out["quota_left"] = max(0, config.TUTOR_DAILY_QUOTA - usage.calls)
    out["ai_available"] = config.tutor_ai_configured() and out["quota_left"] > 0
    return out


class FinishIn(BaseModel):
    problem_id: str = Field(..., max_length=40)
    steps_done: int = Field(0, ge=0, le=50)
    steps_total: int = Field(0, ge=0, le=50)
    hints_used: int = Field(0, ge=0, le=500)
    skipped: int = Field(0, ge=0, le=50)
    attempts: int = Field(0, ge=0, le=999)
    effort: int | None = Field(None, ge=1, le=5)
    seconds: int = Field(0, ge=0, le=36000)
    ai_used: bool = False


@router.post("/finish")
def finish(body: FinishIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    if body.problem_id != tutor.FREE_ID and tutor.problem(body.problem_id) is None:
        raise HTTPException(404, "Soal tidak ditemukan.")
    db.add(TutorLog(user_id=user.id, **body.model_dump()))
    db.commit()
    return {"saved": True}


@router.get("/summary")
def summary(teacher: User = Depends(require_teacher), db: Session = Depends(get_db)) -> list[dict]:
    """Ringkasan per soal untuk guru: banyak sesi, rata-rata petunjuk, dan rata-rata usaha mental (1–5)."""
    class_ids = db.scalars(select(Classroom.id).where(Classroom.teacher_id == teacher.id)).all()
    student_ids = db.scalars(select(User.id).where(User.class_id.in_(class_ids), User.role == "student")).all() if class_ids else []
    rows = db.scalars(select(TutorLog).where(TutorLog.user_id.in_(student_ids))).all() if student_ids else []
    titles = {p["id"]: p["title"] for p in tutor.catalog()["problems"]}
    titles[tutor.FREE_ID] = "Soal bebas"
    out = []
    for pid, title in titles.items():
        logs = [r for r in rows if r.problem_id == pid]
        efforts = [r.effort for r in logs if r.effort]
        out.append({"problem_id": pid, "title": title, "sessions": len(logs),
                    "avg_hints": round(sum(r.hints_used for r in logs) / len(logs), 1) if logs else None,
                    "skipped": sum(r.skipped for r in logs),
                    "avg_effort": round(sum(efforts) / len(efforts), 1) if efforts else None})
    return out
