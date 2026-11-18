"""Asisten Belajar RMT: konten, pemeriksaan deterministik, penjaga jawaban, DeepSeek (tiruan), API."""
import re

import pytest

from app import config
from app.core import tutor

SOLUTIONS = {
    "ml-provider": ["Diketahui: A = Rp2.000/GB, B = Rp30.000 + Rp1.000/GB, pemakaian 25 GB",
                    "mencari provider yang paling murah", "pakai rumus fungsi", "A(x) = 2.000x",
                    "B(x) = 30.000 + 1.000x", "A(25) = 50.000 dan B(25) = 55.000",
                    "Pilih provider A karena 50.000 < 55.000",
                    "aku paling banyak membandingkan dan untuk 40 GB dihitung lagi"],
    "ml-taksi": ["buka pintu 8.000, per km 4.500, jarak 10 km, uang 50.000", "apakah uangnya cukup untuk ongkos",
                 "rumus fungsi", "x = jarak perjalanan (km)", "f(x) = 8.000 + 4.500x",
                 "f(10) = 8.000 + 45.000 = 53.000", "Uang Budi tidak cukup karena 53.000 > 50.000",
                 "paling sulit model, untuk 9 km dihitung f(9)"],
    "ml-suhu": ["f(x) = -2x + 30, x jam setelah 12.00, ditanya pukul 15.30", "mencari suhu pukul 15.30",
                "garis bilangan waktu", "x = 3,5", "f(3,5) = -2(3,5) + 30 = -7 + 30 = 23",
                "Jadi suhu pukul 15.30 adalah 23 °C", "karena rumus butuh x, aku pakai pengodean"],
    "ml-tas": ["h(x) = 50.000x - 150.000, x banyak tas, h(2) = -50.000",
               "setuju atau tidak, makna -50.000, minimal tas", "tabel nilai h(x)", "50.000x - 150.000 > 0",
               "50.000x > 150.000 jadi x > 3", "h(3) = 0 dan h(4) = 50.000",
               "Tidak setuju, -50.000 artinya pedagang rugi 50.000", "minimal 4 tas karena h(4) > 0",
               "negatif berarti rugi dan aku memeriksa kewajaran"],
}


def _words(text: str) -> int:
    return len(re.findall(r"\w+", text))


# ---------------------------------------------------------------------------
# Konten
# ---------------------------------------------------------------------------
def test_content_structure_and_clt_limits():
    d = tutor.data()
    phase_ids = [p["id"] for p in d["phases"]]
    assert len(phase_ids) == 6
    assert {p["id"] for p in d["problems"]} == set(SOLUTIONS)
    for prob in d["problems"]:
        order = [phase_ids.index(s["phase"]) for s in prob["steps"]]
        assert order == sorted(order), f"{prob['id']}: tahap RMT harus berurutan"
        assert set(order) == set(range(6)), f"{prob['id']}: keenam tahap RMT harus dilalui"
        for s in prob["steps"]:
            assert s["check"]["type"] in {"numbers", "expression", "keywords", "groups", "free"}
            assert len(s["hints"]) == 3, "setiap langkah punya 3 tingkat petunjuk"
            assert _words(s["ask"]) <= 40, s["ask"]
            for h in s["hints"]:
                assert _words(h) <= 60, h
            assert s["cognitive"] and s["tool"] and s["ok"]


@pytest.mark.parametrize("pid", list(SOLUTIONS))
def test_model_solution_walks_all_steps(pid):
    prob = tutor.problem(pid)
    step = tutor.turn({"problem_id": pid, "action": "start"})["step"]
    for answer in SOLUTIONS[pid]:
        r = tutor.turn({"problem_id": pid, "action": "answer", "step": step, "message": answer})
        assert r["ok"] is True, (pid, step, answer, r["reply"])
        step = r["step"]
    assert step == len(prob["steps"]) and r["done"] is True
    assert "1–5" in r["reply"]


@pytest.mark.parametrize("pid", list(SOLUTIONS))
def test_hints_never_contain_the_answers(pid):
    prob = tutor.problem(pid)
    for i, s in enumerate(prob["steps"]):
        for h in s["hints"]:
            assert not tutor.leaks(h, prob, i), (pid, i, h)


# ---------------------------------------------------------------------------
# Pemeriksaan deterministik dan kesalahan khas siswa
# ---------------------------------------------------------------------------
def test_number_extraction_indonesian_format():
    assert tutor.extract_numbers("Rp2.000 per GB, 3,5 jam, pukul 15.30, −50.000, 12.00, x > 3") == \
        [2000, 3.5, 15.3, -50000, 12, 3]


@pytest.mark.parametrize("pid,idx,answer,fragment", [
    ("ml-provider", 3, "A(x) = 50.000", "bukan rumus"),          # kesalahan S01: substitusi tanpa bentuk umum
    ("ml-provider", 4, "B(x) = 31.000x", "tidak dikali x"),
    ("ml-taksi", 4, "f(x) = 8.000x + 4.500", "Tertukar"),
    ("ml-taksi", 5, "f(10) = 125.000", "dibayar sekali"),
    ("ml-suhu", 3, "x = 3,3", "30 menit bukan 0,3 jam"),
    ("ml-suhu", 3, "x = 15,5", "mulai pukul 12.00"),
    ("ml-suhu", 4, "hasilnya 37", "tanda"),
    ("ml-tas", 3, "h(x) >= 0", "Pakai tanda > saja"),
    ("ml-tas", 7, "minimal 3 tas karena h(4) = 50.000", "masih impas"),   # S01 tidak memeriksa batas
    ("ml-tas", 6, "ya setuju", "Coba pikirkan"),
])
def test_common_errors_get_specific_feedback(pid, idx, answer, fragment):
    res = tutor.check_step(tutor.problem(pid)["steps"][idx], answer)
    assert res["ok"] is False and fragment in res["note"]


def test_wrong_answer_raises_hint_level_and_allows_skip_after_three():
    req = {"problem_id": "ml-taksi", "action": "answer", "step": 4, "attempts": 0, "hint": 0, "message": "f(x) = 5x"}
    hints = []
    for _ in range(3):
        r = tutor.turn(req)
        assert r["ok"] is False and r["step"] == 4
        hints.append(r["hint"])
        req.update(attempts=r["attempts"], hint=r["hint"])
    assert hints == [1, 2, 3] and r["can_skip"] is True
    with pytest.raises(ValueError):
        tutor.turn({**req, "action": "next", "attempts": 2})
    r = tutor.turn({**req, "action": "next"})
    assert r["step"] == 5 and r["skipped"] is True


def test_confused_and_questions_do_not_count_as_attempts():
    r = tutor.turn({"problem_id": "ml-suhu", "action": "answer", "step": 3, "message": "aku bingung"})
    assert r["hint"] == 1 and r["attempts"] == 0 and r["ok"] is None
    r = tutor.turn({"problem_id": "ml-suhu", "action": "answer", "step": 3, "message": "apa itu variabel?"})
    assert r["attempts"] == 0 and "Variabel" in r["reply"] and "Kembali ke langkah kita" in r["reply"]


# ---------------------------------------------------------------------------
# DeepSeek tiruan + penjaga jawaban
# ---------------------------------------------------------------------------
def test_ai_reply_used_when_safe_and_messages_follow_rmt():
    seen = []

    def fake(msgs):
        seen.append(msgs)
        return "Kamu sudah memakai **pengodean**. Coba lihat lagi: bagian mana yang dibayar sekali?"

    r = tutor.turn({"problem_id": "ml-taksi", "action": "answer", "step": 4, "message": "f(x) = 12.500x"}, ai=fake)
    assert r["source"] == "ai" and r["ai_calls"] == 1 and "pengodean" in r["reply"]
    system, context = seen[0][0]["content"], seen[0][1]["content"]
    assert "Rigorous Mathematical Thinking" in system and "JANGAN PERNAH" in system
    assert "Tahap RMT 4/6" in context and "BELUM TEPAT" in context and "Tingkat bantuan: 1/3" in context
    assert "53.000" not in context and "53000" not in context  # kunci jawaban tidak dikirim ke AI
    assert seen[0][-1] == {"role": "user", "content": "f(x) = 12.500x"}


def test_ai_reply_that_leaks_answer_is_replaced_by_written_hint():
    leaky = lambda msgs: "Jawabannya f(10) = 53.000, jadi uangnya kurang."  # noqa: E731
    r = tutor.turn({"problem_id": "ml-taksi", "action": "hint", "step": 5, "hint": 0}, ai=leaky)
    assert r["source"] == "script" and r.get("guarded") and "53.000" not in r["reply"]
    assert r["reply"] == tutor.problem("ml-taksi")["steps"][5]["hints"][0]


def test_ai_failure_falls_back_to_script():
    def broken(msgs):
        raise tutor.TutorAIError("Saldo DeepSeek habis.")

    r = tutor.turn({"problem_id": "ml-provider", "action": "answer", "step": 0, "message": "2.000"}, ai=broken)
    assert r["source"] == "script" and r["ok"] is False and r["reply"]


def test_deepseek_request_format(monkeypatch):
    captured = {}

    class Resp:
        status_code = 200

        @staticmethod
        def json():
            return {"choices": [{"message": {"role": "assistant", "content": "Halo dari Wen"}}]}

    def fake_post(url, json, timeout, headers):
        captured.update(url=url, json=json, headers=headers)
        return Resp()

    monkeypatch.setattr(config, "DEEPSEEK_API_KEY", "sk-uji-palsu")
    monkeypatch.setattr(tutor.httpx, "post", fake_post)
    assert tutor.deepseek_chat([{"role": "user", "content": "hai"}]) == "Halo dari Wen"
    assert captured["url"] == "https://api.deepseek.com/chat/completions"
    assert captured["headers"]["Authorization"] == "Bearer sk-uji-palsu"
    assert captured["json"]["model"] == "deepseek-flash"
    assert captured["json"]["thinking"] == {"type": "disabled"} and captured["json"]["stream"] is False


def test_deepseek_without_key_raises(monkeypatch):
    monkeypatch.setattr(config, "DEEPSEEK_API_KEY", "")
    with pytest.raises(tutor.TutorAIError):
        tutor.deepseek_chat([])


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------
def test_api_problems_hide_keys_and_hints(client, student):
    r = client.get("/api/tutor/problems", headers=student)
    assert r.status_code == 200
    body = r.text
    for secret in ('"check"', '"hints"', '"reveal"', '"common"', "53000"):
        assert secret not in body
    assert len(r.json()["problems"]) == 4 and len(r.json()["phases"]) == 6


def test_api_status_never_exposes_key(client, student, monkeypatch):
    monkeypatch.setattr(config, "DEEPSEEK_API_KEY", "sk-rahasia-123")
    r = client.get("/api/tutor/status", headers=student)
    assert r.json()["ai"] is True and "sk-rahasia" not in r.text


def test_api_turn_without_key_uses_guided_mode(client, student, monkeypatch):
    monkeypatch.setattr(config, "DEEPSEEK_API_KEY", "")
    r = client.post("/api/tutor/turn", headers=student, json={"problem_id": "ml-suhu", "action": "start"})
    assert r.status_code == 200 and r.json()["current"]["phase_no"] == 1
    assert "Orientasi" in r.json()["reply"] and r.json()["source"] == "script"
    r = client.post("/api/tutor/turn", headers=student, json={"problem_id": "ml-suhu", "step": 3, "message": "x = 3,5"})
    assert r.json()["ok"] is True and r.json()["current"]["phase_no"] == 5
    r = client.post("/api/tutor/turn", headers=student, json={"problem_id": tutor.FREE_ID, "action": "start",
                                                             "problem_text": "Harga 3 pensil Rp6.000, berapa harga 5 pensil?"})
    assert r.status_code == 503


def test_api_turn_with_fake_deepseek_counts_quota(client, student, monkeypatch):
    monkeypatch.setattr(config, "DEEPSEEK_API_KEY", "sk-uji")
    monkeypatch.setattr(config, "TUTOR_DAILY_QUOTA", 2)
    monkeypatch.setattr(tutor, "deepseek_chat", lambda msgs: "Coba ingat lagi: berapa menit dalam satu jam?")
    before = client.get("/api/tutor/status", headers=student).json()["remaining"]
    r = client.post("/api/tutor/turn", headers=student, json={"problem_id": "ml-suhu", "action": "hint", "step": 3})
    assert r.json()["source"] == "ai"
    assert r.json()["quota_left"] == before - 1
    r = client.post("/api/tutor/turn", headers=student, json={"problem_id": tutor.FREE_ID, "action": "start",
                                                             "problem_text": "Harga 3 pensil Rp6.000, berapa harga 5 pensil?"})
    assert r.status_code == 200 and r.json()["phase_no"] == 1 and r.json()["source"] == "ai"
    r = client.post("/api/tutor/turn", headers=student, json={"problem_id": "ml-suhu", "action": "hint", "step": 3})
    assert r.json()["source"] == "script" and r.json()["quota_left"] == 0  # kuota habis -> petunjuk tertulis


def test_api_finish_and_teacher_summary(client, student, teacher):
    r = client.post("/api/tutor/finish", headers=student, json={
        "problem_id": "ml-taksi", "steps_done": 8, "steps_total": 8, "hints_used": 2, "skipped": 0,
        "attempts": 3, "effort": 3, "seconds": 400, "ai_used": False})
    assert r.json() == {"saved": True}
    rows = {x["problem_id"]: x for x in client.get("/api/tutor/summary", headers=teacher).json()}
    assert rows["ml-taksi"]["sessions"] >= 1 and rows["ml-taksi"]["avg_effort"] is not None
    assert client.get("/api/tutor/summary", headers=student).status_code == 403
