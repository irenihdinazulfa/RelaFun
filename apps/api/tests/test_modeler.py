"""Keempat soal pada Lembar_Soal_Siswa_Relasi_Fungsi harus dijawab benar oleh mesin."""
import json
from pathlib import Path

import pytest

from app.core.modeler import ModelSpec, numbers_in_text, solve, verify_spec

PRESETS = {p["id"]: p for p in json.loads(
    (Path(__file__).resolve().parents[3] / "content" / "modeler_presets.json").read_text(encoding="utf-8"))}


def run(preset_id):
    return solve(ModelSpec(**PRESETS[preset_id]["expected"]))


def test_soal1_provider():
    r = run("provider")
    assert r["values"] == ["50.000", "55.000"]
    assert r["smaller"] == "Provider A"
    assert r["equal_at"] == "30"


def test_soal2_taksi():
    r = run("taksi")
    assert r["value"] == "53.000"
    assert r["meets_condition"] is False
    assert r["difference"] == "3.000"


def test_soal3_suhu():
    assert run("suhu")["value"] == "23"


def test_soal4_tas():
    r = run("tas")
    assert r["integer_answer"] == 4
    assert r["solution"] == "x > 3"


def test_lilin_solve_for_x():
    assert run("lilin")["x"] == "10"


def test_threshold_negative_a_flips_sign():
    spec = ModelSpec(models=[{"name": "f", "a": -2, "b": 30}],
                     task={"type": "threshold", "op": ">", "target": 20, "integer_x": True})
    r = solve(spec)
    assert r["solution"] == "x < 5"
    assert r["integer_answer"] == 4


@pytest.mark.parametrize("pid", list(PRESETS))
def test_presets_pass_verification(pid):
    p = PRESETS[pid]
    v = verify_spec(p["story"], ModelSpec(**p["expected"]))
    assert v["ok"], v


def test_numbers_in_text_indonesian():
    nums = numbers_in_text("Rp2.000 per GB, Rp30.000, 25 GB, suhu 3,5")
    assert {2000, 30000, 25} <= nums


def test_verify_flags_invented_number():
    spec = ModelSpec(models=[{"name": "f", "a": 777, "b": 8000}], task={"type": "evaluate", "x": 10})
    v = verify_spec(PRESETS["taksi"]["story"], spec)
    assert any(c["code"] == "V3" and not c["ok"] for c in v["checks"])


def test_verify_blocks_compare_with_one_model():
    spec = ModelSpec(models=[{"name": "f", "a": 2000, "b": 0}], task={"type": "compare", "x": 25})
    assert verify_spec(PRESETS["provider"]["story"], spec)["ok"] is False
