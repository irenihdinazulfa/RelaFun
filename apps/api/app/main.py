"""Titik masuk aplikasi: API di /api/*, aplikasi web (PWA) di /."""
from __future__ import annotations

import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path

# Windows kadang memetakan .js ke text/plain lewat registry -> modul ES gagal dimuat.
for _ext, _type in {".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
                    ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json",
                    ".json": "application/json", ".png": "image/png"}.items():
    mimetypes.add_type(_type, _ext)

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from . import config
from .db import Base, SessionLocal, engine
from .routers import auth, learn, teacher, tools
from .seed import seed_demo


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if config.SEED_DEMO:
        with SessionLocal() as db:
            seed_demo(db)
    yield


app = FastAPI(title="RelaFun API", version="1.0.0", lifespan=lifespan,
              docs_url="/api/docs", openapi_url="/api/openapi.json")

app.include_router(auth.router)
app.include_router(learn.router)
app.include_router(tools.router)
app.include_router(teacher.router)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "ai_configured": config.ai_configured(), "demo": config.SEED_DEMO}


@app.exception_handler(HTTPException)
async def http_error(_, exc: HTTPException):
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code, headers=exc.headers)


# ---------------------------------------------------------------------------
# Aplikasi web statis (tanpa proses build). Rute yang tidak dikenal -> index.html
# ---------------------------------------------------------------------------
WEB = Path(config.WEB_DIR).resolve()
_NO_CACHE = {"Cache-Control": "no-cache"}


@app.get("/{path:path}", include_in_schema=False)
def web(path: str):
    if path.startswith("api/"):
        raise HTTPException(404, "Endpoint tidak ditemukan.")
    target = (WEB / path).resolve()
    if path and target.is_file() and WEB in target.parents:
        headers = dict(_NO_CACHE)
        if target.name == "sw.js":
            headers["Service-Worker-Allowed"] = "/"
        return FileResponse(target, headers=headers)
    index = WEB / "index.html"
    if not index.exists():
        raise HTTPException(404, "Folder apps/web tidak ditemukan.")
    return FileResponse(index, headers=_NO_CACHE)
