"""Membuat versi tanpa server RelaFun untuk GitHub Pages.

Pemakaian:  python scripts/build_static.py [folder_keluaran]   (bawaan: dist/)

Isi keluaran = apps/web + content/ + config.js (RELAFUN_STATIC = true) + content/manifest.json.
Semua perhitungan berjalan di peramban (js/local/*), data disimpan di perangkat.
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


def build(out: Path) -> Path:
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(ROOT / "apps" / "web", out)
    shutil.copytree(ROOT / "content", out / "content")
    ai_url = ai_server_url()
    (out / "config.js").write_text(
        "// Versi GitHub Pages: semua berjalan di peramban. Asisten memakai AI dari server online\n"
        "// (kunci API hanya di server tersebut, tidak di sini).\n"
        "window.RELAFUN_STATIC = true;\n"
        f"window.RELAFUN_AI_URL = {json.dumps(ai_url)};\n",
        encoding="utf-8")
    modules = sorted(p.name for p in (out / "content" / "modules").glob("*.json"))
    (out / "content" / "manifest.json").write_text(json.dumps({"modules": modules}, indent=2), encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    return out


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
    print("Versi statis dibuat di:", build(target.resolve()))
