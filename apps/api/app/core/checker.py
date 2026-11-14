"""Pemeriksa jawaban latihan. Semua umpan balik memakai bahasa sehari-hari (EL01, EL03)."""
from __future__ import annotations

from typing import Any

import sympy as sp

from .mathfn import (
    MathInputError,
    X,
    analyze_relation,
    diagnose_linear_value,
    expressions_equal,
    fmt,
    numbers_equal,
    parse_function,
    parse_number,
    poly_terms,
    pretty,
)

ERROR_LABELS = {
    "salah_tanda": "Tanda + / − tertukar",
    "tidak_dikalikan": "x dijumlahkan, bukan dikalikan",
    "lupa_konstanta": "Lupa konstanta (b)",
    "angka_ditempel": "Angka ditempel (2x dibaca 2 dan x)",
    "koefisien_hilang": "Koefisien x terlewat",
    "salah_hitung": "Salah hitung",
    "konversi_waktu": "Salah konversi waktu",
    "salah_tafsir": "Salah menafsirkan hasil",
    "fungsi_bukan_fungsi": "Tertukar fungsi / bukan fungsi",
    "domain_kodomain_range": "Tertukar domain/kodomain/range",
    "pasangan_salah": "Pasangan panah salah",
    "rumus_salah": "Rumus fungsi salah",
    "a_b_tertukar": "Nilai a dan b tertukar",
    "notasi": "Penulisan notasi f(…) kurang tepat",
    "konsep": "Konsep belum tepat",
    "format": "Format jawaban",
}


class CheckResult(dict):
    """dict dengan kunci: correct, error_type, feedback, highlight."""


def _result(correct: bool, feedback: str, error_type: str | None = None, **extra: Any) -> CheckResult:
    r = CheckResult(correct=correct, feedback=feedback, error_type=None if correct else error_type)
    r.update(extra)
    return r


def correct_answer_text(item: dict) -> str:
    t = item["type"]
    if t == "mcq":
        return item["options"][item["answer"]]
    if t == "multi":
        return ", ".join(item["options"][i] for i in item["answer"])
    if t == "numeric":
        unit = item.get("unit", "")
        return fmt(parse_number(item["answer"])) + (f" {unit}" if unit else "")
    if t == "is_function":
        return "Fungsi" if item["answer"] else "Bukan fungsi"
    if t == "dnd":
        labels = {c["id"]: c["label"] for c in item["chips"]}
        bins = {b["id"]: b["label"] for b in item["bins"]}
        return "; ".join(f"{labels[c]} → {bins[b]}" for c, b in item["answer"].items())
    if t == "arrows":
        return "{" + ", ".join(f"({a}, {b})" for a, b in item["answer_pairs"]) + "}"
    if t == "expression":
        return f"{item.get('name', 'f')}(x) = {pretty(parse_function(item['answer']))}"
    return ""


def check(item: dict, answer: Any) -> CheckResult:
    t = item["type"]
    try:
        if t == "mcq":
            return _check_mcq(item, answer)
        if t == "multi":
            return _check_multi(item, answer)
        if t == "numeric":
            return _check_numeric(item, answer)
        if t == "is_function":
            return _check_is_function(item, answer)
        if t == "dnd":
            return _check_dnd(item, answer)
        if t == "arrows":
            return _check_arrows(item, answer)
        if t == "expression":
            return _check_expression(item, answer)
    except MathInputError as exc:
        return _result(False, str(exc), "format", retry_free=True)
    raise ValueError(f"Jenis soal tidak dikenal: {t}")


def _check_mcq(item: dict, answer: Any) -> CheckResult:
    try:
        idx = int(answer)
    except (TypeError, ValueError):
        return _result(False, "Pilih salah satu jawaban dulu.", "format", retry_free=True)
    if idx == item["answer"]:
        return _result(True, "Benar!")
    fb = item.get("option_feedback", {}).get(str(idx), "Belum tepat. Baca lagi pertanyaannya pelan-pelan.")
    return _result(False, fb, item.get("error_type", "konsep"))


def _check_multi(item: dict, answer: Any) -> CheckResult:
    chosen = {int(a) for a in (answer or [])}
    expected = set(item["answer"])
    if chosen == expected:
        return _result(True, "Benar, semua pilihanmu tepat!")
    missing, extra = expected - chosen, chosen - expected
    parts = []
    if missing:
        parts.append(f"masih ada {len(missing)} jawaban benar yang belum dipilih")
    if extra:
        parts.append(f"ada {len(extra)} pilihan yang seharusnya tidak dipilih")
    return _result(False, "Hampir! " + " dan ".join(parts).capitalize() + ".", item.get("error_type", "konsep"))


def _check_numeric(item: dict, answer: Any) -> CheckResult:
    given = parse_number(str(answer))
    expected = parse_number(item["answer"])
    if numbers_equal(expected, given, item.get("tolerance", 0)):
        return _result(True, "Benar!")
    for ce in item.get("common_errors", []):
        if numbers_equal(parse_number(ce["value"]), given, ce.get("tolerance", 0)):
            return _result(False, ce["message"], ce.get("type", "salah_hitung"))
    lin = item.get("linear")
    if lin:
        d = diagnose_linear_value(lin["a"], lin["b"], parse_number(str(lin["x"])), given)
        return _result(False, d.message, d.error_type)
    return _result(False, "Belum tepat. Coba periksa lagi langkah hitungmu.", item.get("error_type", "salah_hitung"))


def _check_is_function(item: dict, answer: Any) -> CheckResult:
    d = item["diagram"]
    analysis = analyze_relation(d["domain"], d["codomain"], d["pairs"])
    if isinstance(answer, str):
        answer = answer.lower() in ("true", "ya", "fungsi", "1")
    given = bool(answer)
    highlight = [p["element"] for p in analysis["problems"]]
    if given == analysis["is_function"]:
        if analysis["is_function"]:
            fb = "Benar! Setiap anggota daerah asal punya tepat satu pasangan, jadi ini fungsi."
        else:
            fb = "Benar, ini bukan fungsi. " + " ".join(p["message"] for p in analysis["problems"])
        return _result(True, fb, highlight=highlight)
    if analysis["is_function"]:
        fb = ("Coba cek satu per satu dari kiri: setiap anggota punya tepat satu panah. "
              "Boleh saja dua anggota menunjuk ke pasangan yang sama — itu tetap fungsi.")
    else:
        fb = "Perhatikan lagi: " + " ".join(p["message"] for p in analysis["problems"]) + \
             " Fungsi mensyaratkan setiap anggota punya tepat satu pasangan."
    return _result(False, fb, "fungsi_bukan_fungsi", highlight=highlight)


def _check_dnd(item: dict, answer: Any) -> CheckResult:
    answer = answer or {}
    expected: dict = item["answer"]
    unplaced = [c for c in expected if c not in answer]
    if unplaced:
        return _result(False, "Masih ada kartu yang belum ditempatkan.", "format",
                       retry_free=True, wrong=unplaced)
    wrong = [c for c, b in expected.items() if answer.get(c) != b]
    if not wrong:
        return _result(True, "Benar, semua kartu sudah di tempat yang tepat!")
    fb = item.get("wrong_feedback", f"Ada {len(wrong)} kartu yang belum tepat. Kartu itu ditandai merah.")
    return _result(False, fb, item.get("error_type", "domain_kodomain_range"), wrong=wrong)


def _check_arrows(item: dict, answer: Any) -> CheckResult:
    given = {(str(a), str(b)) for a, b in (answer or [])}
    expected = {(str(a), str(b)) for a, b in item["answer_pairs"]}
    if given == expected:
        return _result(True, "Benar, semua panahnya tepat!")
    missing, extra = expected - given, given - expected
    msgs = []
    if extra:
        msgs.append("Panah " + ", ".join(f"{a} → {b}" for a, b in sorted(extra)) + " belum sesuai aturan.")
    if missing:
        msgs.append(f"Masih ada {len(missing)} panah yang belum dibuat.")
    d = item["diagram"]
    try:
        analysis = analyze_relation(d["domain"], d["codomain"], sorted(given))
        if item.get("must_be_function") and not analysis["is_function"]:
            msgs.append("Ingat, setiap anggota harus punya tepat satu panah.")
    except MathInputError:
        pass
    return _result(False, " ".join(msgs), "pasangan_salah",
                   wrong=[f"{a}|{b}" for a, b in sorted(extra)])


def _linear_ab(expr: sp.Expr) -> tuple[sp.Rational, sp.Rational] | None:
    terms = poly_terms(expr)
    if any(p > 1 for _, p in terms):
        return None
    a = next((c for c, p in terms if p == 1), sp.Rational(0))
    b = next((c for c, p in terms if p == 0), sp.Rational(0))
    return a, b


def _check_expression(item: dict, answer: Any) -> CheckResult:
    given_expr = parse_function(str(answer))
    if expressions_equal(item["answer"], str(answer)):
        return _result(True, f"Benar! {item.get('name', 'f')}(x) = {pretty(given_expr)}")
    exp_ab = _linear_ab(parse_function(item["answer"]))
    giv_ab = _linear_ab(given_expr)
    if exp_ab and giv_ab:
        (ea, eb), (ga, gb) = exp_ab, giv_ab
        if ga == eb and gb == ea:
            return _result(False, "Nilai a dan b tertukar. a adalah angka yang dikalikan x, "
                                  "b adalah angka tetap.", "a_b_tertukar")
        if ga == ea and gb != eb:
            return _result(False, "Bagian yang dikali x (a) sudah benar. Cek lagi angka tetapnya (b): "
                                  "berapa nilai fungsi saat x = 0?", "rumus_salah")
        if gb == eb and ga != ea:
            return _result(False, "Angka tetapnya (b) sudah benar. Cek lagi perubahannya (a): "
                                  "bertambah berapa setiap x naik 1?", "rumus_salah")
    sample = item.get("check_points")
    if sample:
        bad = [px for px in sample if given_expr.subs(X, sp.Rational(str(px))) !=
               parse_function(item["answer"]).subs(X, sp.Rational(str(px)))]
        if bad:
            return _result(False, f"Coba masukkan x = {fmt(sp.Rational(str(bad[0])))} ke rumusmu. "
                                  "Apakah hasilnya sama dengan tabel?", "rumus_salah")
    return _result(False, "Rumusnya belum tepat. Cari dulu nilai tetap (b), lalu perubahan per satu x (a).",
                   "rumus_salah")
