#!/usr/bin/env bash
# Menjalankan RelaFun di macOS / Linux:  bash scripts/start.sh
set -euo pipefail
PORT="${PORT:-8000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="$ROOT/apps/api"
VENV="$API/.venv"
PY="$VENV/bin/python"

command -v python3 >/dev/null || { echo "Python 3.10+ belum terpasang: https://www.python.org/downloads/"; exit 1; }
[ -x "$PY" ] || python3 -m venv "$VENV"
HASH="$(shasum -a 256 "$API/requirements.txt" | cut -d' ' -f1)"
if [ ! -f "$VENV/.req-hash" ] || [ "$(cat "$VENV/.req-hash")" != "$HASH" ]; then
  "$PY" -m pip install -q --upgrade pip
  "$PY" -m pip install -q -r "$API/requirements.txt"
  echo "$HASH" > "$VENV/.req-hash"
fi
[ -f "$ROOT/.env" ] || cp "$ROOT/.env.example" "$ROOT/.env"

echo "Buka: http://localhost:$PORT   (akun demo: siswa/siswa123, guru/guru123, kode kelas RF8A26)"
cd "$API"
exec "$PY" -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
