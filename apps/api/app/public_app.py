"""Server ringan khusus Asisten publik (dipasang di Vercel lewat `server.py` di akar repo).

Isinya hanya /api/public/tutor/* dan /api/health, tanpa database dan tanpa akun, sehingga cocok
untuk layanan serverless gratis. Versi GitHub Pages memanggilnya untuk balasan AI. Kunci
GEMINI_API_KEY diisi di pengaturan Environment Variables Vercel, tidak di GitHub.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .routers import public_tutor


def configure(app: FastAPI) -> FastAPI:
    config.PUBLIC_TUTOR = True  # tujuan satu-satunya server ini
    app.include_router(public_tutor.router)
    if config.PUBLIC_TUTOR_ORIGINS:
        app.add_middleware(CORSMiddleware, allow_origins=config.PUBLIC_TUTOR_ORIGINS, allow_credentials=False,
                           allow_methods=["GET", "POST"], allow_headers=["Content-Type"], max_age=600)

    @app.get("/api/health")
    def health() -> dict:
        return {"ok": True, "public_tutor": True, "tutor_ai_configured": config.tutor_ai_configured(),
                "provider": config.PROVIDER_NAMES.get(config.tutor_provider() or ""), "model": config.tutor_model()}

    @app.get("/")
    def root() -> dict:
        return {"app": "RelaFun — Asisten publik", "docs": "Aplikasi: https://irenihdinazulfa.github.io/RelaFun/"}

    return app
