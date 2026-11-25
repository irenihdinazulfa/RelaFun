"""Membuat versi tanpa server RelaFun untuk GitHub Pages.

Pemakaian:  python scripts/build_static.py [folder_keluaran]   (bawaan: dist/)

Isi keluaran = apps/web + content/ + config.js + content/manifest.json.

Dua mode:
- Backend Supabase (bila scripts/supabase_url.txt atau RELAFUN_API_URL terisi): semua /api/* dikirim ke
  Supabase Edge Function; akun, kemajuan, dan kelas tersimpan di database Supabase. Lihat docs/20-SUPABASE.md.
- Tanpa server (bila kosong): semua perhitungan di peramban (js/local/*), data disimpan di perangkat.
"""
from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def ai_server_url() -> str:
    """Alamat server AI publik (Render) untuk Asisten di versi GitHub Pages.

    Urutan: variabel lingkungan RELAFUN_AI_URL, lalu berkas scripts/ai_url.txt. Kosong = tanpa AI.
    Ini alamat publik, bukan rahasia; kunci API tetap hanya di server.
    """
    url = os.getenv("RELAFUN_AI_URL")
    if url is None:
        f = ROOT / "scripts" / "ai_url.txt"
        url = f.read_text(encoding="utf-8").strip() if f.exists() else ""
    return url.strip().rstrip("/")


def api_server_url() -> str:
    """Alamat backend Supabase, mis. https://<ref>.supabase.co/functions/v1 (alamat publik, bukan rahasia).

    Urutan: variabel lingkungan RELAFUN_API_URL, lalu berkas scripts/supabase_url.txt. Kosong = tanpa server.
    """
    url = os.getenv("RELAFUN_API_URL")
    if url is None:
        f = ROOT / "scripts" / "supabase_url.txt"
        url = f.read_text(encoding="utf-8").strip() if f.exists() else ""
    url = url.strip().rstrip("/")
    if url and not url.startswith("https://"):
        raise SystemExit(f"Alamat backend harus diawali https:// (sekarang: {url!r}).")
    return url


def build(out: Path) -> Path:
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(ROOT / "apps" / "web", out)
    shutil.copytree(ROOT / "content", out / "content")
    api_url = api_server_url()
    if api_url:
        config = ("// Versi GitHub Pages dengan backend Supabase: akun, kemajuan, dan kelas tersimpan di database\n"
                  "// Supabase. Kunci API AI hanya di Secrets Supabase, tidak di sini.\n"
                  "window.RELAFUN_STATIC = false;\n"
                  f"window.RELAFUN_API_URL = {json.dumps(api_url)};\n")
    else:
        config = ("// Versi GitHub Pages: semua berjalan di peramban. Asisten memakai AI dari server online\n"
                  "// (kunci API hanya di server tersebut, tidak di sini).\n"
                  "window.RELAFUN_STATIC = true;\n"
                  f"window.RELAFUN_AI_URL = {json.dumps(ai_server_url())};\n")
    (out / "config.js").write_text(config, encoding="utf-8")
    modules = sorted(p.name for p in (out / "content" / "modules").glob("*.json"))
    (out / "content" / "manifest.json").write_text(json.dumps({"modules": modules}, indent=2), encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    return out


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
    print("Versi statis dibuat di:", build(target.resolve()))
