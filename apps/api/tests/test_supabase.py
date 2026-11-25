"""Backend Supabase (supabase/): salinan mesin, skema database, dan keamanan kunci.

Uji perilaku endpoint ada di supabase/functions/api/app_test.ts (Deno + PGlite).
"""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

from app.db import Base, engine_url

ROOT = Path(__file__).resolve().parents[3]
SUPA = ROOT / "supabase"
MIGRATIONS = sorted((SUPA / "migrations").glob("*.sql"))


def _sync_module():
    spec = importlib.util.spec_from_file_location("sync_supabase", ROOT / "scripts" / "sync_supabase.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_engine_copies_are_up_to_date():
    """Aturan 11: mesin di Supabase = salinan persis apps/web/js/local/*.js dan content/."""
    stale = _sync_module().stale_files()
    assert not stale, f"Jalankan: python scripts/sync_supabase.py (usang: {stale})"


def test_migration_matches_sqlalchemy_models():
    sql = "\n".join(p.read_text(encoding="utf-8") for p in MIGRATIONS).lower()
    for table in Base.metadata.tables.values():
        m = re.search(rf"create table if not exists {table.name} \((.*?)\n\);", sql, re.S)
        assert m, f"tabel {table.name} tidak ada di migrasi Supabase"
        body = m.group(1)
        for col in table.columns:
            assert re.search(rf"^\s*{col.name} ", body, re.M), f"kolom {table.name}.{col.name} tidak ada di migrasi"
        assert f"'{table.name}'" in sql, f"RLS belum dinyalakan untuk {table.name}"


def test_no_personal_data_columns():
    sql = "\n".join(p.read_text(encoding="utf-8") for p in MIGRATIONS).lower()
    for banned in ("email", "phone", "birth", "full_name", "tanggal_lahir"):
        assert banned not in sql


def test_no_api_keys_in_supabase_folder():
    pattern = re.compile(r"AIza[0-9A-Za-z_\-]{20,}|sk-ant-[0-9A-Za-z_\-]{10,}|\bAQ\.[0-9A-Za-z_\-]{20,}|sk-[0-9a-f]{32}")
    for path in SUPA.rglob("*"):
        if path.is_file() and path.suffix in {".ts", ".js", ".json", ".toml", ".sql", ".md"}:
            assert not pattern.search(path.read_text(encoding="utf-8")), f"kunci API tertulis di {path}"


def test_edge_function_has_no_answer_key_leak_paths():
    app = (SUPA / "functions" / "api" / "app.ts").read_text(encoding="utf-8")
    assert '"answer", "answer_pairs", "common_errors", "linear", "explain", "option_feedback", "tolerance"' in app
    from app.core.content import SECRET_FIELDS
    listed = set(re.search(r"SECRET_FIELDS = new Set\(\[(.*?)\]\)", app).group(1).replace('"', "").replace(" ", "").split(","))
    assert listed == SECRET_FIELDS


def test_engine_url_for_supabase():
    assert engine_url("postgres://u:p@h:5432/postgres") == "postgresql+psycopg://u:p@h:5432/postgres"
    assert engine_url("postgresql://u:p@h:6543/postgres") == "postgresql+psycopg://u:p@h:6543/postgres"
    assert engine_url("sqlite:///x.db") == "sqlite:///x.db"
