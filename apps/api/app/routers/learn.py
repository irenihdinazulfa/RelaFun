"""Materi, latihan, kemajuan, glosarium, dan papan peringkat."""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import checker, content, progress
from ..core.security import get_current_user
from ..db import get_db
from ..models import ModuleProgress, User

router = APIRouter(prefix="/api", tags=["belajar"])


@router.get("/modules")
def list_modules(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    stats = progress.module_stats(db, user.id)
    return [content.module_summary(m) | {"stats": stats[m["id"]]} for m in content.all_modules()]


@router.get("/modules/{module_id}")
def get_module(module_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    module = content.get_module(module_id)
    if not module:
        raise HTTPException(404, "Materi tidak ditemukan.")
    stats = progress.module_stats(db, user.id)[module_id]
    return content.public_module(module) | {"stats": stats}


class ProgressIn(BaseModel):
    step_index: int = Field(0, ge=0, le=200)
    lesson_done: bool = False


@router.post("/modules/{module_id}/progress")
def save_progress(module_id: str, body: ProgressIn, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)) -> dict:
    if not content.get_module(module_id):
        raise HTTPException(404, "Materi tidak ditemukan.")
    p = db.scalar(select(ModuleProgress).where(ModuleProgress.user_id == user.id,
                                               ModuleProgress.module_id == module_id))
    if p is None:
        p = ModuleProgress(user_id=user.id, module_id=module_id, step_index=0, lesson_done=False)
        db.add(p)
    p.step_index = max(p.step_index, body.step_index) if not body.lesson_done else body.step_index
    p.lesson_done = p.lesson_done or body.lesson_done
    db.commit()
    return {"ok": True, "step_index": p.step_index, "lesson_done": p.lesson_done}


class CheckIn(BaseModel):
    module_id: str
    item_id: str
    answer: Any = None
    attempt: int = Field(1, ge=1, le=50)


@router.post("/practice/check")
def check_answer(body: CheckIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    item = content.get_item(body.module_id, body.item_id)
    if not item:
        raise HTTPException(404, "Soal tidak ditemukan.")
    result = checker.check(item, body.answer)
    out: dict = dict(result)
    if result.get("retry_free"):
        # Masukan belum lengkap / format salah: tidak dihitung sebagai percobaan.
        return out
    db_user = db.merge(user)
    out["progress"] = progress.record_attempt(
        db, db_user, body.module_id, body.item_id, result["correct"], result.get("error_type"),
        json.dumps(body.answer, ensure_ascii=False),
    )
    if result["correct"] or body.attempt >= 2:
        out["solution"] = {
            "answer": checker.correct_answer_text(item),
            "explain": item.get("explain", []),
        }
    out["error_label"] = checker.ERROR_LABELS.get(result.get("error_type") or "", None)
    return out


@router.get("/me/summary")
def my_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return progress.summary(db, db.merge(user))


@router.get("/leaderboard")
def leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    user = db.merge(user)
    c = user.classroom
    if c is None:
        return {"enabled": False, "reason": "Kamu belum bergabung ke kelas."}
    if not c.leaderboard_enabled:
        return {"enabled": False, "reason": "Papan peringkat dimatikan oleh gurumu."}
    students = db.scalars(select(User).where(User.class_id == c.id, User.role == "student")
                          .order_by(User.points.desc(), User.nickname)).all()
    rows = [{"rank": i + 1, "nickname": s.nickname, "points": s.points, "me": s.id == user.id}
            for i, s in enumerate(students)]
    return {"enabled": True, "class_name": c.name, "rows": rows}


@router.get("/glossary")
def glossary() -> list[dict]:
    return content.glossary()
