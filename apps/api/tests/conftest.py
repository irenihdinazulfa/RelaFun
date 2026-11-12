import os
import sys
import tempfile
from pathlib import Path

# Database sementara untuk pengujian — harus diatur sebelum modul app diimpor.
_TMP = tempfile.mkdtemp(prefix="relafun_test_")
os.environ["RELAFUN_DATA_DIR"] = _TMP
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_TMP, 'test.db').as_posix()}"
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["SEED_DEMO"] = "1"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def login(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="session")
def student(client):
    return login(client, "siswa", "siswa123")


@pytest.fixture(scope="session")
def teacher(client):
    return login(client, "guru", "guru123")
