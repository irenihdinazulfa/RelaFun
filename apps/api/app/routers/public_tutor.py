"""Asisten Belajar untuk versi GitHub Pages (tanpa akun): balasan AI dari server ini.

Versi GitHub Pages tidak boleh menyimpan kunci API (arahan dosen). Halaman Asisten di sana memanggil
endpoint ini lintas origin (CORS hanya untuk origin yang diizinkan, lihat config.PUBLIC_TUTOR_ORIGINS).
Kunci AI tetap di variabel lingkungan server.

- Pemeriksaan jawaban tetap oleh mesin (`tutor.check_step`), identik dengan mesin JavaScript, sehingga
  peramban bisa melanjutkan sendiri bila server tidur, gagal, atau kuota habis.
- Tidak ada akun dan tidak ada data siswa yang disimpan. Yang dikirim hanya teks soal dan percakapan.
- Batas harian per alamat IP dan total harian, agar kuota gratis tidak dihabiskan satu orang.
- Nonaktif (404) kecuali PUBLIC_TUTOR=1.
"""
from __future__ import annotations

import datetime as dt
import logging
import threading

from fastapi import APIRouter, HTTPException, Request

from .. import config
from ..core import tutor
from ..tutor_schemas import TurnIn

log = logging.getLogger("relafun.public_tutor")
router = APIRouter(prefix="/api/public/tutor", tags=["tutor-publik"])


class DailyLimiter:
    """Penghitung panggilan AI per IP per hari dan total per hari (di memori; reset saat server mulai)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._day: dt.date | None = None
        self._per_ip: dict[str, int] = {}
        self._total = 0

    def _roll(self) -> None:
        today = dt.datetime.now(dt.timezone.utc).date()
        if self._day != today:
            self._day, self._per_ip, self._total = today, {}, 0

    def remaining(self, ip: str) -> int:
        with self._lock:
            self._roll()
            return max(0, min(config.PUBLIC_TUTOR_PER_IP - self._per_ip.get(ip, 0),
                              config.PUBLIC_TUTOR_DAILY_TOTAL - self._total))

    def add(self, ip: str, calls: int) -> None:
        if calls <= 0:
            return
        with self._lock:
            self._roll()
            self._per_ip[ip] = self._per_ip.get(ip, 0) + calls
            self._total += calls

    def reset(self) -> None:
        with self._lock:
            self._day, self._per_ip, self._total = None, {}, 0


limiter = DailyLimiter()


def client_ip(request: Request) -> str:
    """IP pengguna. Di belakang proxy (Render), alamat asli ditambahkan proxy di ujung X-Forwarded-For."""
    parts = [p.strip() for p in request.headers.get("x-forwarded-for", "").split(",") if p.strip()]
    if parts:
        return parts[-1]
    return request.client.host if request.client else "?"


def _require_enabled() -> None:
    if not config.PUBLIC_TUTOR:
        raise HTTPException(404, "Tidak ditemukan.")


@router.get("/status")
def status(request: Request) -> dict:
    _require_enabled()
    provider = config.tutor_provider()
    left = limiter.remaining(client_ip(request)) if provider else 0
    on = provider is not None and left > 0
    return {"ai": on, "provider": config.PROVIDER_NAMES.get(provider or ""), "model": config.tutor_model(),
            "remaining": left, "free_mode": on, "static": True}


@router.post("/turn")
def turn(body: TurnIn, request: Request) -> dict:
    _require_enabled()
    ip = client_ip(request)
    can_ai = config.tutor_ai_configured() and limiter.remaining(ip) > 0
    ai = tutor.ai_chat if can_ai else None
    req = body.model_dump()
    req["history"] = [h.model_dump() for h in body.history]
    try:
        if body.problem_id == tutor.FREE_ID:
            if not config.tutor_ai_configured():
                raise HTTPException(503, "AI belum aktif di server.")
            if ai is None:
                raise HTTPException(429, "Kuota balasan AI hari ini sudah habis. Coba soal bawaan, ya.")
            out = tutor.turn_free(req, ai)
        else:
            out = tutor.turn(req, ai)
    except KeyError as exc:
        raise HTTPException(404, str(exc.args[0]) if exc.args else "Soal tidak ditemukan.")
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    limiter.add(ip, out.pop("ai_calls", 0))
    out.pop("ai_error", None)  # detail galat hanya di log server
    out["quota_left"] = limiter.remaining(ip)
    out["ai_available"] = config.tutor_ai_configured() and out["quota_left"] > 0
    out["provider"] = config.PROVIDER_NAMES.get(config.tutor_provider() or "")
    return out
