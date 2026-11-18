"""Skema permintaan Asisten Belajar, dipakai router berakun (`routers/tutor.py`) dan router publik
(`routers/public_tutor.py`). Sengaja tanpa impor database, agar Asisten publik bisa jalan sendiri (Vercel)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


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
