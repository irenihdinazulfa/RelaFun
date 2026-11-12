"""Model data (SQLAlchemy). Lihat docs/07-ARCHITECTURE.md bagian Model Data."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    teacher_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    leaderboard_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    students: Mapped[list[User]] = relationship(
        back_populates="classroom", foreign_keys="User.class_id"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(10), default="student")  # student | teacher
    nickname: Mapped[str] = mapped_column(String(30))
    class_id: Mapped[int | None] = mapped_column(ForeignKey("classrooms.id"), nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    classroom: Mapped[Classroom | None] = relationship(
        back_populates="students", foreign_keys=[class_id]
    )


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    module_id: Mapped[str] = mapped_column(String(40), index=True)
    item_id: Mapped[str] = mapped_column(String(60), index=True)
    correct: Mapped[bool] = mapped_column(Boolean)
    error_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    answer: Mapped[str] = mapped_column(Text, default="")
    points: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ModuleProgress(Base):
    __tablename__ = "module_progress"
    __table_args__ = (UniqueConstraint("user_id", "module_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    module_id: Mapped[str] = mapped_column(String(40))
    step_index: Mapped[int] = mapped_column(Integer, default=0)
    lesson_done: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class DailyStat(Base):
    __tablename__ = "daily_stats"
    __table_args__ = (UniqueConstraint("user_id", "date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[str] = mapped_column(String(10))
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=0)
    ai_calls: Mapped[int] = mapped_column(Integer, default=0)
