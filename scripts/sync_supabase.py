"""Menyalin mesin JavaScript dan konten ke backend Supabase (supabase/functions/api/_gen/).

Pemakaian (dari folder proyek):
    python scripts/sync_supabase.py           # salin ulang (jalankan sebelum `supabase functions deploy`)
    python scripts/sync_supabase.py --check   # hanya periksa; keluar dengan kode 1 bila salinan usang

Kenapa disalin, bukan diimpor langsung? Supabase CLI hanya membundel berkas di dalam folder supabase/.
Mesin penilaian tetap SATU sumber: apps/web/js/local/*.js (aturan 11: identik dengan mesin Python).
Konten (termasuk kunci jawaban) hanya ada di sisi server fungsi; peramban menerima versi tanpa
kolom rahasia (content.SECRET_FIELDS).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGINE_SRC = ROOT / "apps" / "web" / "js" / "local"
CONTENT_SRC = ROOT / "content"
GEN = ROOT / "supabase" / "functions" / "api" / "_gen"

# Berkas mesin murni (tanpa DOM/localStorage saat diimpor). backend.js TIDAK disalin.
ENGINE_FILES = ["rational.js", "mathfn.js", "checker.js", "modeler.js", "tutor.js", "ai.js"]
HEADER = "// BERKAS SALINAN — jangan diubah di sini. Sumber: apps/web/js/local/{name}\n" \
         "// Perbarui dengan: python scripts/sync_supabase.py\n"


def content_bundle() -> dict:
    modules = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((CONTENT_SRC / "modules").glob("*.json"))]
    modules.sort(key=lambda m: m["order"])
    return {
        "modules": modules,
        "glossary": json.loads((CONTENT_SRC / "glossary.json").read_text(encoding="utf-8")),
        "presets": json.loads((CONTENT_SRC / "modeler_presets.json").read_text(encoding="utf-8")),
        "tutor": json.loads((CONTENT_SRC / "tutor" / "tutor.json").read_text(encoding="utf-8")),
    }


def expected_files() -> dict[str, str]:
    out = {name: HEADER.format(name=name) + (ENGINE_SRC / name).read_text(encoding="utf-8") for name in ENGINE_FILES}
    out["content.json"] = json.dumps(content_bundle(), ensure_ascii=False, separators=(",", ":")) + "\n"
    return out


def stale_files() -> list[str]:
    """Nama berkas di _gen/ yang tidak sama dengan sumbernya (atau belum ada)."""
    stale = []
    for name, text in expected_files().items():
        path = GEN / name
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            stale.append(name)
    return stale


def sync() -> list[str]:
    GEN.mkdir(parents=True, exist_ok=True)
    changed = stale_files()
    for name, text in expected_files().items():
        if name in changed:
            (GEN / name).write_text(text, encoding="utf-8", newline="\n")
    return changed


if __name__ == "__main__":
    if "--check" in sys.argv:
        bad = stale_files()
        if bad:
            print("Salinan Supabase usang:", ", ".join(bad), "→ jalankan: python scripts/sync_supabase.py")
            sys.exit(1)
        print("Salinan Supabase sudah sama dengan sumbernya.")
    else:
        changed = sync()
        print("Diperbarui:", ", ".join(changed) if changed else "(tidak ada, semua sudah sama)")
