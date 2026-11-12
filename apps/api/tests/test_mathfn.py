import itertools
import random

import pytest
import sympy as sp

from app.core.mathfn import (
    MINUS,
    MathInputError,
    analyze_relation,
    diagnose_linear_value,
    evaluate_steps,
    expressions_equal,
    fmt,
    fmt_exact,
    linear_through,
    parse_function,
    parse_number,
)


@pytest.mark.parametrize("text,expected", [
    ("23", 23), ("-7", -7), ("−7", -7), ("3,5", sp.Rational(7, 2)), ("3.5", sp.Rational(7, 2)),
    ("2.000", 2000), ("Rp53.000", 53000), ("1.500.000", 1500000), ("0,25", sp.Rational(1, 4)),
    ("9,33", sp.Rational(933, 100)), ("28/3", sp.Rational(28, 3)), (" 23 °C ", 23),
])
def test_parse_number(text, expected):
    assert parse_number(text) == expected


@pytest.mark.parametrize("bad", ["", "abc", "2x", "1/0"])
def test_parse_number_rejects(bad):
    with pytest.raises(MathInputError):
        parse_number(bad)


def test_fmt_indonesian():
    assert fmt(53000) == "53.000"
    assert fmt(-50000) == MINUS + "50.000"
    assert fmt(sp.Rational(7, 2)) == "3,5"
    assert fmt(sp.Rational(28, 3)) == "≈ 9,33"
    assert fmt_exact(sp.Rational(28, 3)) == "28/3 (≈ 9,33)"
    assert fmt(0) == "0"


@pytest.mark.parametrize("text", [
    "f(x) = 2x + 3", "2x+3", "2*x + 3", "3 + 2x", "y = 2x + 3", "2(x + 1) + 1", "4x/2 + 3",
])
def test_parse_function_equivalent_forms(text):
    assert expressions_equal("2x + 3", text)


def test_parse_function_indonesian_numbers():
    assert parse_function("50.000x - 150.000") == 50000 * sp.Symbol("x") - 150000
    assert parse_function("h(x) = 4.500x + 8.000") == 4500 * sp.Symbol("x") + 8000


@pytest.mark.parametrize("bad", [
    "__import__('os').system('dir')", "x^99", "9^9^9", "2y + 1", "x**x", "", "(2x + 1",
    "exec('1')", "lambda: 1",
])
def test_parse_function_rejects_unsafe_or_invalid(bad):
    with pytest.raises(MathInputError):
        parse_function(bad)


def test_evaluate_steps_suhu():
    r = evaluate_steps("-2x + 30", "3,5")
    assert r["result"] == "23"
    maths = [s["math"] for s in r["steps"]]
    assert maths[1] == f"f(3,5) = {MINUS}2 × (3,5) + 30"
    assert maths[2] == f"f(3,5) = {MINUS}7 + 30"


def test_evaluate_steps_quadratic_negative_x():
    r = evaluate_steps("x^2 - 3x + 2", "-1")
    assert r["result"] == "6"
    assert any("pangkat" in s["title"] for s in r["steps"])


def test_evaluate_steps_random_linear():
    rng = random.Random(8)
    for _ in range(500):
        a = rng.randint(-20, 20) or 1
        b = rng.randint(-50, 50)
        x = sp.Rational(rng.randint(-40, 40), rng.choice([1, 2, 4, 5, 10]))
        r = evaluate_steps(f"{a}x + ({b})", str(float(x)))
        assert sp.Rational(str(r["result_value"])) == sp.Rational(str(float(a * x + b))) or \
            abs(r["result_value"] - float(a * x + b)) < 1e-9


def test_analyze_relation_function_and_not():
    ok = analyze_relation(["p", "q", "r"], ["1", "2"], [["p", "1"], ["q", "1"], ["r", "2"]])
    assert ok["is_function"] and ok["range"] == ["1", "2"]
    bad = analyze_relation(["1", "2", "3"], ["a", "b"], [["1", "a"], ["1", "b"], ["2", "a"]])
    assert not bad["is_function"]
    assert {p["element"] for p in bad["problems"]} == {"1", "3"}


def test_analyze_relation_exhaustive_small():
    domain, codomain = ["1", "2"], ["a", "b"]
    all_pairs = [list(p) for p in itertools.product(domain, codomain)]
    for mask in range(1 << len(all_pairs)):
        pairs = [all_pairs[i] for i in range(len(all_pairs)) if mask >> i & 1]
        counts = {d: sum(1 for p in pairs if p[0] == d) for d in domain}
        expected = all(c == 1 for c in counts.values())
        assert analyze_relation(domain, codomain, pairs)["is_function"] == expected


def test_analyze_relation_rejects_foreign_elements():
    with pytest.raises(MathInputError):
        analyze_relation(["1"], ["a"], [["2", "a"]])


@pytest.mark.parametrize("answer,error", [
    (1, "salah_tanda"),        # 2*3 - 5
    (10, "tidak_dikalikan"),   # 2 + 3 + 5
    (6, "lupa_konstanta"),     # 2*3
    (28, "angka_ditempel"),    # "23" + 5
    (8, "koefisien_hilang"),   # 3 + 5
    (12, "salah_hitung"),
])
def test_diagnose_linear_value(answer, error):
    assert diagnose_linear_value(2, 5, 3, answer).error_type == error


def test_linear_through():
    assert linear_through((1, 5), (3, 11)) == (3, 2)
    with pytest.raises(MathInputError):
        linear_through((1, 1), (1, 2))
