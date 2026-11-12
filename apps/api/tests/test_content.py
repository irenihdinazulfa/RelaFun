"""Validator konten: struktur, aturan CLT, keterlacakan ke wawancara, dan kunci jawaban."""
import re

import pytest

from app.core import checker, content

MODULES = content.all_modules()
ITEMS = [(m, it) for m in MODULES for it in m["items"]]
INTERVIEW_CODES = {"K01", "K02", "K03", "IL01", "IL02", "IL03", "EL01", "EL02", "EL03",
                   "GL01", "GL02", "GL03", "DS01", "DS02"}
MAX_WORDS = 70          # CLT: satu layar = satu gagasan singkat
MAX_SET_SIZE = 6        # EL02: diagram panah tidak boleh terlalu ramai
MAX_EXAMPLE_STEPS = 6   # CLT: contoh bertahap tetap pendek


def _words(text):
    return len(re.findall(r"\S+", text or ""))


def test_module_count_and_groups():
    assert len(MODULES) == 13
    assert {m["group"] for m in MODULES} == {"prasyarat", "inti", "literasi"}


def test_ids_unique():
    ids = [it["id"] for _, it in ITEMS]
    assert len(ids) == len(set(ids))
    assert len({m["id"] for m in MODULES}) == len(MODULES)


def test_every_interview_code_is_covered():
    covered = {c for m in MODULES for c in m["interview_codes"]}
    assert INTERVIEW_CODES <= covered, INTERVIEW_CODES - covered


@pytest.mark.parametrize("module", MODULES, ids=lambda m: m["id"])
def test_clt_rules(module):
    for step in module["steps"]:
        assert _words(step.get("body", "")) <= MAX_WORDS, (module["id"], step.get("title"))
        if step["type"] == "example":
            assert len(step["steps"]) <= MAX_EXAMPLE_STEPS
        if step["type"] == "diagram":
            d = step["diagram"]
            assert len(d["domain"]) <= MAX_SET_SIZE and len(d["codomain"]) <= MAX_SET_SIZE
    assert 3 <= len(module["items"]) <= 8


@pytest.mark.parametrize("module,item", ITEMS, ids=lambda v: v["id"] if isinstance(v, dict) else "")
def test_item_has_support(module, item):
    assert item.get("hint"), "setiap soal wajib punya petunjuk"
    assert item.get("explain"), "setiap soal wajib punya pembahasan bertahap"
    assert _words(item["prompt"]) <= 60
    if "diagram" in item:
        assert len(item["diagram"]["domain"]) <= MAX_SET_SIZE


def _correct_answer(item):
    t = item["type"]
    if t in ("mcq", "multi", "dnd", "is_function", "numeric", "expression"):
        return item["answer"]
    if t == "arrows":
        return item["answer_pairs"]
    raise AssertionError(t)


@pytest.mark.parametrize("module,item", ITEMS, ids=lambda v: v["id"] if isinstance(v, dict) else "")
def test_answer_key_is_accepted(module, item):
    r = checker.check(item, _correct_answer(item))
    assert r["correct"], (item["id"], r)
    assert checker.correct_answer_text(item)


@pytest.mark.parametrize("module,item", [(m, it) for m, it in ITEMS if it["type"] == "numeric"],
                         ids=lambda v: v["id"] if isinstance(v, dict) else "")
def test_common_errors_are_wrong_and_diagnosed(module, item):
    for ce in item.get("common_errors", []):
        r = checker.check(item, ce["value"])
        assert not r["correct"]
        assert r["feedback"] == ce["message"]


def test_public_module_hides_answers():
    for m in MODULES:
        pub = content.public_module(m)
        for it in pub["items"]:
            assert not (set(it) & content.SECRET_FIELDS)


def test_is_function_items_match_engine():
    from app.core.mathfn import analyze_relation
    for _, it in ITEMS:
        if it["type"] == "is_function":
            d = it["diagram"]
            assert analyze_relation(d["domain"], d["codomain"], d["pairs"])["is_function"] == it["answer"]
