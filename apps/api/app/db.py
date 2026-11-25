from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import DATABASE_URL


def engine_url(url: str) -> str:
    """Alamat SQLAlchemy dari DATABASE_URL. Alamat PostgreSQL (mis. Supabase) memakai driver psycopg 3."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


URL = engine_url(DATABASE_URL)
IS_SQLITE = URL.startswith("sqlite")
IS_POSTGRES = URL.startswith("postgresql")

if IS_SQLITE:
    engine = create_engine(URL, connect_args={"check_same_thread": False})
elif IS_POSTGRES:
    # prepare_threshold=None: aman untuk pooler Supabase (mode transaksi, port 6543).
    engine = create_engine(URL, connect_args={"prepare_threshold": None}, pool_pre_ping=True,
                           pool_size=5, max_overflow=5, pool_recycle=300)
else:
    engine = create_engine(URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def lock_down_postgres() -> None:
    """Supabase: nyalakan RLS di semua tabel RelaFun (tanpa kebijakan) agar Data API publik tidak bisa
    membaca data siswa. Sama dengan supabase/migrations/*_relafun_schema.sql; aman diulang."""
    if not IS_POSTGRES:
        return
    with engine.begin() as conn:
        for table in Base.metadata.tables:
            conn.execute(text(f'alter table "{table}" enable row level security'))


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
