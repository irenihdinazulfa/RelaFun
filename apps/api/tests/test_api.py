import pytest

from app import config
from app.core import ai


def test_health_and_web(client):
    assert client.get("/api/health").json()["ok"] is True
    r = client.get("/")
    assert r.status_code == 200 and "RelaFun" in r.text
    js = client.get("/js/app.js")
    assert js.status_code == 200 and "javascript" in js.headers["content-type"]
    assert client.get("/materi/r3-fungsi").status_code == 200   # rute SPA -> index.html
    assert client.get("/api/tidak-ada").status_code == 404


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"username": "siswa", "password": "salah"})
    assert r.status_code == 401


def test_requires_auth(client):
    assert client.get("/api/modules").status_code == 401


def test_register_student_with_class_code(client):
    r = client.post("/api/auth/register", json={"username": "murid_baru", "password": "rahasia1",
                                                "nickname": "Murid", "class_code": "rf8a26"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["class"]["code"] == "RF8A26"
    dup = client.post("/api/auth/register", json={"username": "murid_baru", "password": "rahasia1",
                                                  "nickname": "Murid", "class_code": ""})
    assert dup.status_code == 409
    bad = client.post("/api/auth/register", json={"username": "murid2", "password": "rahasia1",
                                                  "nickname": "Murid", "class_code": "ZZZZZZ"})
    assert bad.status_code == 404


def test_modules_and_hidden_answers(client, student):
    mods = client.get("/api/modules", headers=student).json()
    assert len(mods) == 13
    m = client.get("/api/modules/r3-fungsi", headers=student).json()
    assert all("answer" not in it for it in m["items"])
    assert client.get("/api/modules/tidak-ada", headers=student).status_code == 404


def test_check_answer_points_once(client, student):
    body = {"module_id": "r5-nilai-fungsi", "item_id": "r5-2", "answer": "15", "attempt": 1}
    wrong = client.post("/api/practice/check", json=body, headers=student).json()
    assert wrong["correct"] is False
    assert wrong["error_type"] == "lupa_konstanta"
    assert "solution" not in wrong

    body.update(answer="11", attempt=2)
    right = client.post("/api/practice/check", json=body, headers=student).json()
    assert right["correct"] is True
    assert right["progress"]["points_awarded"] == config.POINTS_RETRY
    assert right["solution"]["answer"] == "11"

    again = client.post("/api/practice/check", json=body, headers=student).json()
    assert again["progress"]["points_awarded"] == 0


def test_format_error_not_counted(client, student):
    body = {"module_id": "r5-nilai-fungsi", "item_id": "r5-3", "answer": "abc"}
    r = client.post("/api/practice/check", json=body, headers=student).json()
    assert r["correct"] is False and r.get("retry_free") is True and "progress" not in r


def test_first_try_points_and_summary(client, student):
    body = {"module_id": "r3-fungsi", "item_id": "r3-1", "answer": True}
    r = client.post("/api/practice/check", json=body, headers=student).json()
    assert r["correct"] and r["progress"]["points_awarded"] == config.POINTS_FIRST_TRY
    s = client.get("/api/me/summary", headers=student).json()
    assert s["points"] >= config.POINTS_FIRST_TRY
    assert s["streak"] == 1
    assert s["daily"]["correct"] >= 1
    assert s["continue"] is not None


def test_progress_save(client, student):
    r = client.post("/api/modules/r1-relasi/progress", json={"step_index": 3}, headers=student)
    assert r.json()["step_index"] == 3
    r = client.post("/api/modules/r1-relasi/progress", json={"step_index": 4, "lesson_done": True},
                    headers=student)
    assert r.json()["lesson_done"] is True


def test_leaderboard_toggle(client, student, teacher):
    lb = client.get("/api/leaderboard", headers=student).json()
    assert lb["enabled"] and any(r["me"] for r in lb["rows"])
    assert all("username" not in r for r in lb["rows"])   # hanya nama panggilan
    cls = client.get("/api/teacher/classes", headers=teacher).json()[0]
    client.patch(f"/api/teacher/classes/{cls['id']}", json={"leaderboard_enabled": False}, headers=teacher)
    assert client.get("/api/leaderboard", headers=student).json()["enabled"] is False
    client.patch(f"/api/teacher/classes/{cls['id']}", json={"leaderboard_enabled": True}, headers=teacher)


def test_teacher_overview_and_csv(client, teacher, student):
    assert client.get("/api/teacher/classes", headers=student).status_code == 403
    cls = client.get("/api/teacher/classes", headers=teacher).json()[0]
    ov = client.get(f"/api/teacher/classes/{cls['id']}/overview", headers=teacher).json()
    assert ov["class"]["code"] == "RF8A26"
    assert any(s["username"] == "siswa" for s in ov["students"])
    assert any(e["type"] == "lupa_konstanta" for e in ov["errors"])
    csv = client.get(f"/api/teacher/classes/{cls['id']}/export.csv", headers=teacher)
    assert csv.status_code == 200 and "Nama panggilan" in csv.text


def test_teacher_cannot_see_other_class(client):
    r = client.post("/api/auth/register", json={"username": "guru2", "password": "rahasia1",
                                                "nickname": "Guru Dua", "role": "teacher", "class_name": "8B"})
    h = {"Authorization": f"Bearer {r.json()['token']}"}
    assert client.get("/api/teacher/classes/1/overview", headers=h).status_code == 404


def test_tools_evaluate_and_relation(client, student):
    r = client.post("/api/tools/evaluate", json={"expr": "-2x + 30", "x": "3,5"}, headers=student).json()
    assert r["result"] == "23"
    bad = client.post("/api/tools/evaluate", json={"expr": "import os", "x": "1"}, headers=student)
    assert bad.status_code == 422
    rel = client.post("/api/tools/relation", json={"domain": ["1", "2"], "codomain": ["a"],
                                                   "pairs": [["1", "a"]]}, headers=student).json()
    assert rel["is_function"] is False


def test_modeler_solve_and_presets(client, student):
    presets = client.get("/api/tools/modeler/presets", headers=student).json()
    assert {p["id"] for p in presets} >= {"provider", "taksi", "suhu", "tas"}
    taksi = next(p for p in presets if p["id"] == "taksi")
    r = client.post("/api/tools/modeler/solve", json=taksi["expected"], headers=student).json()
    assert r["value"] == "53.000"


def test_ai_disabled_without_key(client, student):
    st = client.get("/api/tools/modeler/ai-status", headers=student).json()
    assert st["configured"] is False and st["available"] is False
    r = client.post("/api/tools/modeler/ai", json={"text": "Tarif taksi Rp8.000 dan Rp4.500 per km, 10 km."},
                    headers=student)
    assert r.status_code == 503


def test_ai_flow_with_mock(client, student, teacher, monkeypatch):
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-key")
    cls = client.get("/api/teacher/classes", headers=teacher).json()[0]
    client.patch(f"/api/teacher/classes/{cls['id']}", json={"ai_enabled": True}, headers=teacher)

    fake = {
        "supported": True, "reason": "", "variable_meaning": "jarak perjalanan", "variable_unit": "km",
        "output_unit": "rupiah",
        "models": [{"name": "f", "label": "Ongkos", "a": 4500, "b": 8000,
                    "meaning_a": "tarif per km", "meaning_b": "tarif buka pintu"}],
        "task": {"type": "evaluate", "x": 10, "x_explanation": "jarak 10 km", "op": "<=",
                 "target": 50000, "integer_x": False},
        "question_restated": "Apakah Rp50.000 cukup untuk 10 km?",
    }
    monkeypatch.setattr(ai, "extract_model", lambda text: fake)
    story = ("Sebuah perusahaan taksi menetapkan tarif buka pintu sebesar Rp8.000 dan tarif tambahan "
             "Rp4.500 untuk setiap kilometer. Budi memiliki uang Rp50.000 dan jaraknya 10 km.")
    r = client.post("/api/tools/modeler/ai", json={"text": story}, headers=student)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["verification"]["ok"] is True
    assert data["solution"]["value"] == "53.000"

    fake_bad = dict(fake, models=[dict(fake["models"][0], a=9999)])
    monkeypatch.setattr(ai, "extract_model", lambda text: fake_bad)
    data = client.post("/api/tools/modeler/ai", json={"text": story}, headers=student).json()
    assert any(c["code"] == "V3" and not c["ok"] for c in data["verification"]["checks"])

    client.patch(f"/api/teacher/classes/{cls['id']}", json={"ai_enabled": False}, headers=teacher)
    assert client.post("/api/tools/modeler/ai", json={"text": story}, headers=student).status_code == 403


def test_ai_quota(client, student, teacher, monkeypatch):
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setattr(config, "AI_DAILY_QUOTA", 0)
    cls = client.get("/api/teacher/classes", headers=teacher).json()[0]
    client.patch(f"/api/teacher/classes/{cls['id']}", json={"ai_enabled": True}, headers=teacher)
    r = client.post("/api/tools/modeler/ai", json={"text": "x" * 30}, headers=student)
    assert r.status_code == 429
    client.patch(f"/api/teacher/classes/{cls['id']}", json={"ai_enabled": False}, headers=teacher)


def test_ai_to_spec_rejects_incomplete():
    with pytest.raises(Exception):
        ai.to_spec({"models": [], "task": {"type": "evaluate"}})


def test_login_forgiving_spaces_and_username_case(client):
    r = client.post("/api/auth/login", json={"username": " Siswa ", "password": "siswa123 "})
    assert r.status_code == 200
    r = client.post("/api/auth/login", json={"username": "siswa", "password": "Siswa123"})
    assert r.status_code == 401 and "huruf besar/kecil" in r.json()["detail"]
    assert client.get("/api/health").json()["demo"] is True
