"""Membuat versi tanpa server RelaFun untuk GitHub Pages.

Pemakaian:  python scripts/build_static.py [folder_keluaran]   (bawaan: dist/)

Isi keluaran = apps/web + content/ + config.js (RELAFUN_STATIC = true) + content/manifest.json.
Semua perhitungan berjalan di peramban (js/local/*), data disimpan di perangkat.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def build(out: Path) -> Path:
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(ROOT / "apps" / "web", out)
    shutil.copytree(ROOT / "content", out / "content")
    (out / "config.js").write_text(
        "// Versi GitHub Pages: tanpa server, semua berjalan di peramban.\nwindow.RELAFUN_STATIC = true;\n",
        encoding="utf-8")
    modules = sorted(p.name for p in (out / "content" / "modules").glob("*.json"))
    (out / "content" / "manifest.json").write_text(json.dumps({"modules": modules}, indent=2), encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    return out


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
    print("Versi statis dibuat di:", build(target.resolve()))
