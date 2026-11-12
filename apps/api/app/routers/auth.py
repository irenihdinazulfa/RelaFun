from __future__ import annotations

import re
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Classroom, User
from ..core.security import create_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginIn(BaseModel):
    username: str = Field(..., max_length=40)
    password: str = Field(..., max_length=100)


class RegisterIn(BaseModel):
    username: str = Field(..., min_length=3, max_length=40)
    password: str = Field(..., min_length=6, max_length=100)
    nickname: str = Field(..., min_length=2, max_length=30)
    class_code: str = Field("", max_length=12)
    role: str = Field("student", pattern="^(student|teacher)$")
    class_name: str = Field("", max_length=60)


def user_out(user: User) -> dict:
    c = user.classroom
    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "role": user.role,
        "class": {"id": c.id, "name": c.name, "code": c.code,
                  "leaderboard_enabled": c.leaderboard_enabled, "ai_enabled": c.ai_enabled} if c else None,
    }


def new_class_code(db: Session) -> str:
    alphabet = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"
    while True:
        code = "".join(secrets.choice(alphabet) for _ in range(6))
        if not db.scalar(select(Classroom).where(Classroom.code == code)):
            return code


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.username == body.username.strip().lower()))
    # Spasi di awal/akhir (sering terbawa keyboard HP atau isi-otomatis) diabaikan.
    ok = user is not None and (verify_password(body.password, user.password_hash)
                               or verify_password(body.password.strip(), user.password_hash))
    if not ok:
        raise HTTPException(401, "Nama pengguna atau kata sandi salah. Periksa huruf besar/kecil "
                                 "(kata sandi demo semuanya huruf kecil).")
    return {"token": create_token(user), "user": user_out(user)}


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)) -> dict:
    username = body.username.strip().lower()
    if not re.fullmatch(r"[a-z0-9_.]{3,40}", username):
        raise HTTPException(422, "Nama pengguna hanya boleh huruf kecil, angka, titik, dan garis bawah.")
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(409, "Nama pengguna sudah dipakai. Coba nama lain.")

    if body.role == "student":
        code = body.class_code.strip().upper()
        classroom = db.scalar(select(Classroom).where(Classroom.code == code)) if code else None
        if code and classroom is None:
            raise HTTPException(404, "Kode kelas tidak ditemukan. Tanyakan kode kelas ke gurumu.")
        user = User(username=username, password_hash=hash_password(body.password.strip()),
                    nickname=body.nickname.strip(), role="student",
                    class_id=classroom.id if classroom else None)
        db.add(user)
    else:
        user = User(username=username, password_hash=hash_password(body.password.strip()),
                    nickname=body.nickname.strip(), role="teacher")
        db.add(user)
        db.flush()
        classroom = Classroom(name=body.class_name.strip() or "Kelas 8", code=new_class_code(db),
                              teacher_id=user.id)
        db.add(classroom)
        db.flush()
        user.class_id = classroom.id
    db.commit()
    db.refresh(user)
    return {"token": create_token(user), "user": user_out(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return user_out(user)


class JoinIn(BaseModel):
    class_code: str = Field(..., max_length=12)


@router.post("/join-class")
def join_class(body: JoinIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    classroom = db.scalar(select(Classroom).where(Classroom.code == body.class_code.strip().upper()))
    if classroom is None:
        raise HTTPException(404, "Kode kelas tidak ditemukan.")
    user = db.merge(user)
    user.class_id = classroom.id
    db.commit()
    db.refresh(user)
    return user_out(user)
