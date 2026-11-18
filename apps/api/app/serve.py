"""Menjalankan RelaFun di https://relafun (port 443) sekaligus http (port 80).

- Port 443: aplikasi lewat HTTPS dengan sertifikat lokal (app/tls.py), sehingga browser menampilkan
  gembok aman dan mengizinkan "pasang aplikasi" serta mode luring.
- Port 80: permintaan ke http://relafun dialihkan (308) ke https://relafun. Alamat lain, misalnya
  IP laptop yang dibuka dari HP di Wi-Fi yang sama, tetap dilayani lewat http seperti biasa.

Pemakaian (dari folder apps/api): python -m app.serve [--https-port 443] [--http-port 80]
"""
from __future__ import annotations

import argparse
import asyncio
import contextlib

import uvicorn

from . import tls


def redirect_host_to_https(inner, host: str = tls.HOST, https_port: int = 443):
    """Bungkus ASGI: http://<host>/... → https://<host>/...; host lain diteruskan ke aplikasi."""
    suffix = "" if https_port == 443 else f":{https_port}"

    async def asgi(scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers") or [])
            req_host = headers.get(b"host", b"").decode("latin-1").split(":")[0].strip().lower()
            if req_host == host:
                path = scope.get("raw_path") or scope.get("path", "/").encode()
                qs = scope.get("query_string") or b""
                location = f"https://{host}{suffix}".encode() + path + (b"?" + qs if qs else b"")
                await send({"type": "http.response.start", "status": 308,
                            "headers": [(b"location", location), (b"content-length", b"0")]})
                await send({"type": "http.response.body", "body": b""})
                return
        await inner(scope, receive, send)

    return asgi


class _Server(uvicorn.Server):
    """Dua server dalam satu proses: Ctrl+C ditangani asyncio.run untuk keduanya sekaligus."""

    @contextlib.contextmanager
    def capture_signals(self):
        yield


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--https-port", type=int, default=443)
    ap.add_argument("--http-port", type=int, default=80)
    a = ap.parse_args(argv)

    from .main import app  # impor di sini agar `python -m app.serve --help` tetap ringan

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
