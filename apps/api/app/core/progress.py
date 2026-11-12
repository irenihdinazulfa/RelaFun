"""Poin, streak, sasaran harian, dan ringkasan kemajuan siswa."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import config
from ..models import Attempt, DailyStat, ModuleProgress, User
from . import content


def today() -> str:
    return date.today().isoformat()


def _daily(db: Session, user: User, day: str | None = None) -> DailyStat:
    day = day or today()
    stat = db.scalar(select(DailyStat).where(DailyStat.user_id == user.id, DailyStat.date == day))
    if stat is None:
        stat = DailyStat(user_id=user.id, date=day, correct_count=0, points=0, ai_calls=0)
        db.add(stat)
        db.flush()
    return stat


def record_attempt(db: Session, user: User, module_id: str, item_id: str,
                   correct: bool, error_type: str | None, answer: str) -> dict:
    """Simpan percobaan dan beri poin. Poin hanya diberikan sekali per soal."""
    prior = db.scalars(select(Attempt).where(Attempt.user_id == user.id, Attempt.item_id == item_id)).all()
    already_solved = any(a.correct for a in prior)
    points = 0
    if correct and not already_solved:
        points = config.POINTS_FIRST_TRY if not prior else config.POINTS_RETRY

    db.add(Attempt(user_id=user.id, module_id=module_id, item_id=item_id, correct=correct,
                   error_type=error_type, answer=answer[:500], points=points))

    stat = _daily(db, user)
    if correct and not already_solved:
        stat.correct_count += 1
        stat.points += points
        user.points += points
        t = today()
        if user.last_active_date != t:
            yesterday = (date.today() - timedelta(days=1)).isoformat()
            user.streak = user.streak + 1 if user.last_active_date == yesterday else 1
            user.last_active_date = t
    db.commit()
    return {
        "points_awarded": points,
        "already_solved": already_solved,
        "total_points": user.points,
        "streak": current_streak(user),
        "daily": {"correct": stat.correct_count, "goal": config.DAILY_GOAL},
        "first_try": not prior,
    }


def current_streak(user: User) -> int:
    if not user.last_active_date:
        return 0
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    return user.streak if user.last_active_date in (today(), yesterday) else 0


def use_ai_quota(db: Session, user: User) -> int:
    """Tambah pemakaian AI hari ini; kembalikan sisa kuota. Error bila habis."""
    stat = _daily(db, user)
    if stat.ai_calls >= config.AI_DAILY_QUOTA:
        raise PermissionError(f"Kuota analisis AI hari ini sudah habis ({config.AI_DAILY_QUOTA} kali). "
                              "Coba mode terpandu, ya.")
    stat.ai_calls += 1
    db.commit()
    return config.AI_DAILY_QUOTA - stat.ai_calls


def module_stats(db: Session, user_id: int) -> dict[str, dict]:
    """Per modul: soal yang sudah benar, total soal, akurasi percobaan pertama, status pelajaran."""
    attempts = db.scalars(select(Attempt).where(Attempt.user_id == user_id).order_by(Attempt.id)).all()
    progress = {p.module_id: p for p in db.scalars(
        select(ModuleProgress).where(ModuleProgress.user_id == user_id)).all()}
    out: dict[str, dict] = {}
    for m in content.all_modules():
        items = [it["id"] for it in m.get("items", [])]
        solved, first, first_ok = set(), set(), 0
        for a in attempts:
            if a.module_id != m["id"]:
                continue
            if a.item_id not in first:
                first.add(a.item_id)
                first_ok += int(a.correct)
            if a.correct:
                solved.add(a.item_id)
        p = progress.get(m["id"])
        total = len(items)
        out[m["id"]] = {
            "solved": len(solved & set(items)),
            "total": total,
            "accuracy": round(100 * first_ok / len(first)) if first else None,
            "lesson_done": bool(p and p.lesson_done),
            "step_index": p.step_index if p else 0,
            "mastery": round(100 * len(solved & set(items)) / total) if total else 0,
            "updated_at": p.updated_at.isoformat() if p and p.updated_at else None,
        }
    return out


def summary(db: Session, user: User) -> dict:
    stats = module_stats(db, user.id)
    modules = content.all_modules()
    cont = None
    touched = [(stats[m["id"]]["updated_at"] or "", m) for m in modules
               if stats[m["id"]]["updated_at"] and stats[m["id"]]["mastery"] < 100]
    if touched:
        cont = max(touched, key=lambda t: t[0])[1]
    else:
        cont = next((m for m in modules if stats[m["id"]]["mastery"] < 100), modules[0] if modules else None)
    stat = _daily(db, user)
    db.commit()
    total_solved = sum(s["solved"] for s in stats.values())
    total_items = sum(s["total"] for s in stats.values())
    return {
        "nickname": user.nickname,
        "points": user.points,
        "streak": current_streak(user),
        "daily": {"correct": stat.correct_count, "goal": config.DAILY_GOAL},
        "continue": content.module_summary(cont) | {"stats": stats[cont["id"]]} if cont else None,
        "modules": [content.module_summary(m) | {"stats": stats[m["id"]]} for m in modules],
        "overall": {"solved": total_solved, "total": total_items},
    }


def error_counts(db: Session, user_ids: list[int]) -> list[dict]:
    if not user_ids:
        return []
    rows = db.execute(
        select(Attempt.error_type, func.count()).where(
            Attempt.user_id.in_(user_ids), Attempt.correct.is_(False), Attempt.error_type.is_not(None),
            Attempt.error_type != "format",
        ).group_by(Attempt.error_type).order_by(func.count().desc())
    ).all()
    from .checker import ERROR_LABELS
    return [{"type": t, "label": ERROR_LABELS.get(t, t), "count": n} for t, n in rows]
