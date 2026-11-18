"""Titik masuk Vercel: server ringan Asisten publik RelaFun (AI Gemini untuk versi GitHub Pages).

Vercel mencari objek FastAPI bernama `app` di berkas ini (lihat pyproject.toml, [tool.vercel]).
Isinya hanya /api/public/tutor/* dan /api/health; aplikasi lengkap tetap di apps/api (start.bat).
Kunci GEMINI_API_KEY diisi di Vercel → Settings → Environment Variables, tidak di GitHub.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "apps" / "api"))

from fastapi import FastAPI  # noqa: E402

from app.public_app import configure  # noqa: E402

app = FastAPI(title="RelaFun — Asisten publik", docs_url=None, redoc_url=None)
configure(app)
