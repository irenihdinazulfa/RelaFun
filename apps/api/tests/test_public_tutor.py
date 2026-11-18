"""Asisten publik untuk versi GitHub Pages: /api/public/tutor/* (tanpa akun, kunci tetap di server)."""
import pytest

from app import config
from app.core import tutor
from app.routers import public_tutor

ORIGIN = "https://contoh.github.io"


@pytest.fixture(autouse=True)
def _fresh(monkeypatch):
    public_tutor.limiter.reset()
    monkeypatch.setattr(config, "PUBLIC_TUTOR", True)
    monkeypatch.setattr(config, "TUTOR_AI_PROVIDER", "gemini")
    monkeypatch.setattr(config, "GEMINI_API_KEY", "")
    yield
    public_tutor.limiter.reset()


def _turn(client, ip="203.0.113.5", **body):
    return client.post("/api/public/tutor/turn", json=body, headers={"x-forwarded-for": ip, "origin": ORIGIN})


def test_disabled_by_default_returns_404(client, monkeypatch):
    monkeypatch.setattr(config, "PUBLIC_TUTOR", False)
    assert client.get("/api/public/tutor/status").status_code == 404
    assert client.post("/api/public/tutor/turn", json={"problem_id": "ml-taksi", "action": "start"}).status_code == 404


def test_without_key_guided_mode_still_works(client):
    s = client.get("/api/public/tutor/status").json()
    assert s["ai"] is False and s["free_mode"] is False
    r = _turn(client, problem_id="ml-taksi", action="start")
    assert r.status_code == 200 and r.json()["source"] == "script" and r.json()["current"]["phase_no"] == 1
    r = _turn(client, problem_id=tutor.FREE_ID, action="start", problem_text="Harga 3 pensil Rp6.000, 7 pensil berapa?")
    assert r.status_code == 503


def test_ai_reply_without_account_and_without_leaking_secrets(client, monkeypatch):
    monkeypatch.setattr(config, "GEMINI_API_KEY", "AQ.rahasia-server")
    monkeypatch.setattr(tutor, "gemini_chat", lambda msgs: "Coba lihat lagi: angka mana yang dibayar sekali saja?")
    s = client.get("/api/public/tutor/status")
    assert s.json()["ai"] is True and s.json()["provider"] == "Gemini" and "AQ.rahasia" not in s.text
    r = _turn(client, problem_id="ml-taksi", step=4, message="f(x) = 8.000x + 4.500")
    body = r.text
    assert r.status_code == 200 and r.json()["source"] == "ai" and r.json()["ok"] is False
    assert r.json()["provider"] == "Gemini"
    for secret in ("AQ.rahasia", '"check"', '"hints"', '"reveal"', '"common"', "ai_error", "ai_calls"):
        assert secret not in body
    r = _turn(client, problem_id=tutor.FREE_ID, action="start", problem_text="Harga 3 pensil Rp6.000, 7 pensil berapa?")
    assert r.status_code == 200 and r.json()["source"] == "ai"


def test_daily_limit_per_ip_falls_back_to_script(client, monkeypatch):
    monkeypatch.setattr(config, "GEMINI_API_KEY", "AQ.uji")
    monkeypatch.setattr(config, "PUBLIC_TUTOR_PER_IP", 2)
    monkeypatch.setattr(tutor, "gemini_chat", lambda msgs: "Petunjuk dari AI.")
    sources = [_turn(client, problem_id="ml-suhu", action="hint", step=3).json() for _ in range(3)]
    assert [s["source"] for s in sources] == ["ai", "ai", "script"]
    assert sources[-1]["quota_left"] == 0 and sources[-1]["ai_available"] is False
    # IP lain masih punya kuota
    assert _turn(client, ip="198.51.100.7", problem_id="ml-suhu", action="hint", step=3).json()["source"] == "ai"
    # soal bebas ditolak dengan pesan kuota, bukan galat server
    r = _turn(client, problem_id=tutor.FREE_ID, action="start", problem_text="Harga 3 pensil Rp6.000, 7 pensil berapa?")
    assert r.status_code == 429


def test_daily_total_cap(client, monkeypatch):
    monkeypatch.setattr(config, "GEMINI_API_KEY", "AQ.uji")
    monkeypatch.setattr(config, "PUBLIC_TUTOR_DAILY_TOTAL", 1)
    monkeypatch.setattr(tutor, "gemini_chat", lambda msgs: "Petunjuk dari AI.")
    assert _turn(client, ip="10.0.0.1", problem_id="ml-suhu", action="hint", step=3).json()["source"] == "ai"
    assert _turn(client, ip="10.0.0.2", problem_id="ml-suhu", action="hint", step=3).json()["source"] == "script"


def test_client_ip_uses_last_forwarded_entry(client, monkeypatch):
    # Proxy menambahkan IP asli di ujung; nilai palsu dari pengguna di depan tidak dipakai
    monkeypatch.setattr(config, "GEMINI_API_KEY", "AQ.uji")
    monkeypatch.setattr(config, "PUBLIC_TUTOR_PER_IP", 1)
    monkeypatch.setattr(tutor, "gemini_chat", lambda msgs: "Petunjuk dari AI.")
    assert _turn(client, ip="1.1.1.1, 203.0.113.9", problem_id="ml-suhu", action="hint", step=3).json()["source"] == "ai"
    assert _turn(client, ip="9.9.9.9, 203.0.113.9", problem_id="ml-suhu", action="hint", step=3).json()["source"] == "script"


def test_cors_only_for_allowed_origin(client):
    ok = client.options("/api/public/tutor/turn", headers={
        "origin": ORIGIN, "access-control-request-method": "POST", "access-control-request-headers": "content-type"})
    assert ok.headers.get("access-control-allow-origin") == ORIGIN
    bad = client.get("/api/public/tutor/status", headers={"origin": "https://situs-lain.example"})
    assert "access-control-allow-origin" not in bad.headers
    good = client.get("/api/public/tutor/status", headers={"origin": ORIGIN})
    assert good.headers.get("access-control-allow-origin") == ORIGIN


def test_invalid_problem_and_input(client):
    assert _turn(client, problem_id="tidak-ada", action="start").status_code == 404
    assert _turn(client, problem_id="ml-taksi", action="answer", step=99).status_code == 422
