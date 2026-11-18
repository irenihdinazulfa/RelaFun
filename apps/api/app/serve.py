"""Menjalankan server RelaFun untuk scripts/start.ps1.

Mode `localhost` (bawaan): satu server http (port 80). Alamatnya http://relafun.localhost.
  Browser menganggap *.localhost sebagai alamat aman, sehingga aplikasi bisa dipasang dan
  dipakai luring tanpa sertifikat. Permintaan ke http://relafun (nama lama) dialihkan ke
  http://relafun.localhost. Alamat lain, misalnya IP laptop dari HP, dilayani seperti biasa.

Mode `https` (pilihan): https://relafun di port 443 dengan sertifikat lokal (app/tls.py), dan
  port 80 yang mengalihkan http://relafun ke https. IP untuk HP tetap dilayani lewat http.

Pemakaian (dari folder apps/api):
  python -m app.serve [--mode localhost] [--port 80]
  python -m app.serve --mode https [--https-port 443] [--http-port 80]
"""
from __future__ import annotations

import argparse
import asyncio
import contextlib

import uvicorn

from . import tls

LOCAL_HOST = "relafun.localhost"


def redirect_host(inner, from_host: str, to_base: str):
    """Bungkus ASGI: permintaan dengan Host `from_host` dialihkan (308) ke `to_base` + path."""
    async def asgi(scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers") or [])
            req_host = headers.get(b"host", b"").decode("latin-1").split(":")[0].strip().lower()
            if req_host == from_host:
                path = scope.get("raw_path") or scope.get("path", "/").encode()
                qs = scope.get("query_string") or b""
                location = to_base.encode() + path + (b"?" + qs if qs else b"")
                await send({"type": "http.response.start", "status": 308,
                            "headers": [(b"location", location), (b"content-length", b"0")]})
                await send({"type": "http.response.body", "body": b""})
                return
        await inner(scope, receive, send)

    return asgi


def redirect_host_to_https(inner, host: str = tls.HOST, https_port: int = 443):
    """http://<host>/... → https://<host>/... (mode https)."""
    suffix = "" if https_port == 443 else f":{https_port}"
    return redirect_host(inner, host, f"https://{host}{suffix}")


def redirect_old_name(inner, port: int = 80):
    """http://relafun/... → http://relafun.localhost/... (mode localhost)."""
    suffix = "" if port == 80 else f":{port}"
    return redirect_host(inner, tls.HOST, f"http://{LOCAL_HOST}{suffix}")


class _Server(uvicorn.Server):
    """Dua server dalam satu proses: Ctrl+C ditangani asyncio.run untuk keduanya sekaligus."""

    @contextlib.contextmanager
    def capture_signals(self):
        yield


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--mode", choices=["localhost", "https"], default="localhost")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=80, help="port mode localhost")
    ap.add_argument("--https-port", type=int, default=443)
    ap.add_argument("--http-port", type=int, default=80)
    a = ap.parse_args(argv)

    from .main import app  # impor di sini agar `python -m app.serve --help` tetap ringan

    if a.mode == "localhost":
        uvicorn.run(redirect_old_name(app, a.port), host=a.host, port=a.port)
        return

    crt, key, _ = tls.ensure()
    servers = [
        _Server(uvicorn.Config(app, host=a.host, port=a.https_port, ssl_certfile=str(crt), ssl_keyfile=str(key),
                               lifespan="on")),
        _Server(uvicorn.Config(redirect_host_to_https(app, https_port=a.https_port), host=a.host,
                               port=a.http_port, lifespan="off")),
    ]

    async def run() -> None:
        await asyncio.gather(*(s.serve() for s in servers))

    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(run())


if __name__ == "__main__":
    main()
