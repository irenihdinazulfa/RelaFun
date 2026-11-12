"""Dashboard guru: kemajuan kelas, kesalahan umum, pengaturan, ekspor CSV."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import content, progress
from ..core.checker import ERROR_LABELS
from ..core.security import require_teacher
from ..db import get_db
from ..models import Attempt, Classroom, User
from .auth import new_class_code

router = APIRouter(prefix="/api/teacher", tags=["guru"])


def _own_class(db: Session, teacher: User, class_id: int) -> Classroom:
    c = db.get(Classroom, class_id)
    if c is None or c.teacher_id != teacher.id:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    return c


@router.get("/classes")
def classes(teacher: User = Depends(require_teacher), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Classroom).where(Classroom.teacher_id == teacher.id).order_by(Classroom.id)).all()
    return [{"id": c.id, "name": c.name, "code": c.code, "leaderboard_enabled": c.leaderboard_enabled,
             "ai_enabled": c.ai_enabled,
             "student_count": sum(1 for s in c.students if s.role == "student")} for c in rows]


class ClassIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)


@router.post("/classes")
def create_class(body: ClassIn, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)) -> dict:
    c = Classroom(name=body.name.strip(), code=new_class_code(db), teacher_id=teacher.id)
    db.add(c)
    db.commit()
    return {"id": c.id, "name": c.name, "code": c.code}


class SettingsIn(BaseModel):
    leaderboard_enabled: bool | None = None
    ai_enabled: bool | None = None
    name: str | None = Field(None, max_length=60)


@router.patch("/classes/{class_id}")
def update_class(class_id: int, body: SettingsIn, teacher: User = Depends(require_teacher),
                 db: Session = Depends(get_db)) -> dict:
    c = _own_class(db, teacher, class_id)
    if body.leaderboard_enabled is not None:
        c.leaderboard_enabled = body.leaderboard_enabled
    if body.ai_enabled is not None:
        c.ai_enabled = body.ai_enabled
    if body.name:
        c.name = body.name.strip()
    db.commit()
    return {"id": c.id, "name": c.name, "leaderboard_enabled": c.leaderboard_enabled, "ai_enabled": c.ai_enabled}


def _overview(db: Session, c: Classroom) -> dict:
    students = [s for s in c.students if s.role == "student"]
    ids = [s.id for s in students]
    modules = content.all_modules()
    rows = []
    module_acc: dict[str, list[int]] = {m["id"]: [] for m in modules}
    for s in students:
        st = progress.module_stats(db, s.id)
        attempts = db.scalars(select(Attempt).where(Attempt.user_id == s.id)).all()
        correct = sum(1 for a in attempts if a.correct)
        for mid, v in st.items():
            if v["accuracy"] is not None:
                module_acc[mid].append(v["accuracy"])
        rows.append({
            "id": s.id, "nickname": s.nickname, "username": s.username, "points": s.points,
            "streak": progress.current_streak(s), "last_active": s.last_active_date,
            "solved": sum(v["solved"] for v in st.values()),
            "attempts": len(attempts),
            "accuracy": round(100 * correct / len(attempts)) if attempts else None,
            "modules": {mid: v["mastery"] for mid, v in st.items()},
        })

    # Soal tersulit: akurasi percobaan pertama terendah
    item_first: dict[str, list[bool]] = {}
    seen: set[tuple[int, str]] = set()
    for a in db.scalars(select(Attempt).where(Attempt.user_id.in_(ids)).order_by(Attempt.id)).all() if ids else []:
        key = (a.user_id, a.item_id)
        if key in seen:
            continue
        seen.add(key)
        item_first.setdefault(a.item_id, []).append(a.correct)
    titles = {it["id"]: (m["title"], it.get("prompt", "")[:90]) for m in modules for it in m.get("items", [])}
    hardest = sorted(
        ({"item_id": k, "module": titles.get(k, ("", ""))[0], "prompt": titles.get(k, ("", ""))[1],
          "students": len(v), "first_try_accuracy": round(100 * sum(v) / len(v))}
         for k, v in item_first.items() if len(v) >= 1),
        key=lambda r: (r["first_try_accuracy"], -r["students"]),
    )[:8]

    return {
        "class": {"id": c.id, "name": c.name, "code": c.code,
                  "leaderboard_enabled": c.leaderboard_enabled, "ai_enabled": c.ai_enabled},
        "modules": [{"id": m["id"], "title": m["title"], "group": m["group"],
                     "avg_accuracy": round(sum(module_acc[m["id"]]) / len(module_acc[m["id"]]))
                     if module_acc[m["id"]] else None} for m in modules],
        "students": sorted(rows, key=lambda r: r["nickname"].lower()),
        "errors": progress.error_counts(db, ids),
        "hardest_items": hardest,
    }


@router.get("/classes/{class_id}/overview")
def overview(class_id: int, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)) -> dict:
    return _overview(db, _own_class(db, teacher, class_id))


@router.get("/classes/{class_id}/export.csv")
def export_csv(class_id: int, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)):
    data = _overview(db, _own_class(db, teacher, class_id))
    buf = io.StringIO()
    buf.write("﻿")  # BOM agar Excel membaca UTF-8
    w = csv.writer(buf, delimiter=";")
    mods = data["modules"]
    w.writerow(["Nama panggilan", "Username", "Poin", "Soal benar", "Percobaan", "Akurasi (%)",
                "Terakhir aktif"] + [f"Penguasaan {m['title']} (%)" for m in mods])
    for s in data["students"]:
        w.writerow([s["nickname"], s["username"], s["points"], s["solved"], s["attempts"],
                    s["accuracy"] if s["accuracy"] is not None else "", s["last_active"] or ""]
                   + [s["modules"].get(m["id"], 0) for m in mods])
    w.writerow([])
    w.writerow(["Jenis kesalahan", "Jumlah"])
    for e in data["errors"]:
        w.writerow([ERROR_LABELS.get(e["type"], e["type"]), e["count"]])
    buf.seek(0)
    filename = f"relafun_{data['class']['code']}.csv"
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv; charset=utf-8",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})
