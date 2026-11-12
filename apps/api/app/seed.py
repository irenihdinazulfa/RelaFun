"""Data demo: 1 guru, 1 kelas, 1 akun siswa demo, dan beberapa teman sekelas fiktif."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .core.security import hash_password
from .models import Classroom, User

DEMO_CLASS_CODE = "RF8A26"


def seed_demo(db: Session) -> None:
    if db.scalar(select(User).where(User.username == "guru")):
        return
    teacher = User(username="guru", password_hash=hash_password("guru123"), role="teacher",
                   nickname="Bu Guru Demo")
    db.add(teacher)
    db.flush()
    classroom = Classroom(name="8A (Demo)", code=DEMO_CLASS_CODE, teacher_id=teacher.id,
                          leaderboard_enabled=True, ai_enabled=False)
    db.add(classroom)
    db.flush()
    teacher.class_id = classroom.id

    db.add(User(username="siswa", password_hash=hash_password("siswa123"), role="student",
                nickname="Siswa Demo", class_id=classroom.id))
    # Teman sekelas fiktif agar papan peringkat tidak kosong (nama panggilan rekaan).
    for i, (nick, pts) in enumerate([("Bintang", 120), ("Cahya", 90), ("Damar", 60), ("Elok", 30)]):
        db.add(User(username=f"demo{i + 1}", password_hash=hash_password(f"demo{i + 1}pass"),
                    role="student", nickname=nick, class_id=classroom.id, points=pts))
    db.commit()
