"""Konfigurasi aplikasi, dibaca dari variabel lingkungan / file .env di akar proyek."""
from __future__ import annotations

import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

API_DIR = Path(__file__).resolve().parent.parent          # apps/api
ROOT_DIR = API_DIR.parent.parent                           # akar proyek
load_dotenv(ROOT_DIR / ".env")

DATA_DIR = Path(os.getenv("RELAFUN_DATA_DIR", API_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{(DATA_DIR / 'relafun.db').as_posix()}")
CONTENT_DIR = Path(os.getenv("CONTENT_DIR", ROOT_DIR / "content"))
WEB_DIR = Path(os.getenv("WEB_DIR", ROOT_DIR / "apps" / "web"))


def _secret_key() -> str:
    """Pakai SECRET_KEY dari .env; jika kosong, buat sekali dan simpan di folder data."""
    key = os.getenv("SECRET_KEY", "").strip()
    if key:
        return key
    key_file = DATA_DIR / ".secret_key"
    if key_file.exists():
        return key_file.read_text(encoding="utf-8").strip()
    key = secrets.token_urlsafe(48)
    key_file.write_text(key, encoding="utf-8")
    return key


SECRET_KEY = _secret_key()
TOKEN_DAYS = int(os.getenv("TOKEN_DAYS", "7"))

# --- Pemodel soal cerita berbasis AI (opsional) ---
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", "claude-opus-5-5")
AI_EFFORT = os.getenv("AI_EFFORT", "medium")
AI_DAILY_QUOTA = int(os.getenv("AI_DAILY_QUOTA", "10"))


def ai_configured() -> bool:
    return bool(ANTHROPIC_API_KEY)


# --- Gamifikasi ---
DAILY_GOAL = int(os.getenv("DAILY_GOAL", "5"))      # jawaban benar per hari
POINTS_FIRST_TRY = 10
POINTS_RETRY = 5

SEED_DEMO = os.getenv("SEED_DEMO", "1") == "1"
