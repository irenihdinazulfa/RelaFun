"""Server ringan Vercel (server.py di akar repo): hanya Asisten publik, tanpa database."""
import json
import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]

SCRIPT = r"""
import json, sys
sys.path.insert(0, ".")
import server
from fastapi.testclient import TestClient
from app import config
c = TestClient(server.app)
out = {
  "db_loaded": any(m in sys.modules for m in ("app.db", "app.models", "sqlalchemy")),
  "data_dir_in_temp": "relafun" in str(config.DATA_DIR) and "apps" not in str(config.DATA_DIR),
  "health": c.get("/api/health").json(),
  "status": c.get("/api/public/tutor/status", headers={"origin": "https://irenihdinazulfa.github.io"}).json(),
  "cors": c.get("/api/public/tutor/status", headers={"origin": "https://irenihdinazulfa.github.io"}).headers.get("access-control-allow-origin"),
  "turn": c.post("/api/public/tutor/turn", json={"problem_id": "ml-taksi", "action": "start"}).json()["current"]["phase_no"],
  "login_route": c.post("/api/auth/login", json={"username": "siswa", "password": "siswa123"}).status_code,
}
print(json.dumps(out))
"""


def test_vercel_app_runs_without_database():
    env = {k: v for k, v in os.environ.items() if k not in ("RELAFUN_DATA_DIR", "DATABASE_URL", "PUBLIC_TUTOR_ORIGINS")}
    env.update(VERCEL="1", GEMINI_API_KEY="", DEEPSEEK_API_KEY="", TUTOR_AI_PROVIDER="", PUBLIC_TUTOR="0")
    r = subprocess.run([sys.executable, "-c", SCRIPT], cwd=REPO, env=env, capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stderr[-2000:]
    out = json.loads(r.stdout.strip().splitlines()[-1])
    assert out["db_loaded"] is False                      # tanpa SQLAlchemy/database
    assert out["data_dir_in_temp"] is True                # di Vercel hanya folder sementara yang bisa ditulisi
    assert out["health"]["public_tutor"] is True and out["health"]["tutor_ai_configured"] is False
    assert out["status"]["ai"] is False                   # tanpa kunci: terpandu
    assert out["cors"] == "https://irenihdinazulfa.github.io"
    assert out["turn"] == 1
    assert out["login_route"] == 404                      # rute berakun tidak ada di server ringan


def test_vercel_files_present_and_key_free():
    pyproject = (REPO / "pyproject.toml").read_text(encoding="utf-8")
    assert 'entrypoint = "server:app"' in pyproject
    for name in ("server.py", "pyproject.toml", ".vercelignore", "render.yaml"):
        text = (REPO / name).read_text(encoding="utf-8")
        assert "AQ." not in text and "sk-" not in text   # tidak ada kunci API di berkas deploy
    rules = [ln.strip() for ln in (REPO / ".vercelignore").read_text(encoding="utf-8").splitlines()
             if ln.strip() and not ln.lstrip().startswith("#")]
    # berkas yang dibutuhkan server ringan tidak boleh ikut dikecualikan
    for needed in ("content/tutor", "apps/api/app", "content/", "apps/api/", "apps/"):
        assert needed not in rules and needed.rstrip("/") not in rules
