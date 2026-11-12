"""Mesin matematika RelaFun (berbasis SymPy).

Semua perhitungan yang menentukan benar/salah dilakukan di sini, bukan oleh AI.

Konvensi angka Indonesia:
  * koma = desimal            -> "3,5"  = 3.5
  * titik + 3 digit = ribuan  -> "2.000" = 2000, "1.500.000" = 1500000
  * titik dengan 1-2 digit    -> dianggap desimal ("3.5" = 3.5)
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import sympy as sp
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

X = sp.Symbol("x")
MINUS = "−"  # tanda minus tipografis
_TRANSFORMS = standard_transformations + (implicit_multiplication_application, convert_xor)
_SUPERSCRIPT = {2: "²", 3: "³"}


class MathInputError(ValueError):
    """Masukan tidak bisa dibaca. Pesannya ditampilkan langsung ke siswa."""


# ---------------------------------------------------------------------------
# Membaca & menulis angka
# ---------------------------------------------------------------------------
_THOUSANDS = re.compile(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?")


def _id_numbers_to_python(s: str) -> str:
    """Ubah angka format Indonesia di dalam teks menjadi format Python."""
    s = _THOUSANDS.sub(lambda m: m.group(0).replace(".", "").replace(",", "."), s)
    return re.sub(r"(\d),(\d)", r"\1.\2", s)


def parse_number(text: str) -> sp.Rational:
    """Baca satu angka (boleh pecahan a/b) dari masukan siswa."""
    if text is None:
        raise MathInputError("Jawaban masih kosong.")
    s = str(text).strip().lower()
    s = s.replace(MINUS, "-").replace("rp", "").replace(" ", "")
    s = s.replace("°c", "").replace("°", "")
    if not s:
        raise MathInputError("Jawaban masih kosong.")
    s = _id_numbers_to_python(s)
    if re.fullmatch(r"[+-]?\d+(?:\.\d+)?", s):
        return sp.Rational(s)
    m = re.fullmatch(r"([+-]?\d+(?:\.\d+)?)/(\d+(?:\.\d+)?)", s)
    if m and sp.Rational(m.group(2)) != 0:
        return sp.Rational(m.group(1)) / sp.Rational(m.group(2))
    raise MathInputError("Tulis jawaban berupa angka, misalnya 23 atau 3,5.")


def _terminates(r: sp.Rational) -> bool:
    q = int(r.q)
    for p in (2, 5):
        while q % p == 0:
            q //= p
    return q == 1


def _group_thousands(int_str: str) -> str:
    out = []
    for i, ch in enumerate(reversed(int_str)):
        if i and i % 3 == 0:
            out.append(".")
        out.append(ch)
    return "".join(reversed(out))


def fmt(value: sp.Expr | int | float, decimals: int = 2) -> str:
    """Tulis angka dalam format Indonesia: 53.000 ; 3,5 ; −7 ; ≈ 9,33."""
    r = sp.nsimplify(value) if not isinstance(value, sp.Rational) else value
    if not isinstance(r, sp.Rational):
        r = sp.Rational(str(round(float(r), decimals)))
    neg = r < 0
    r = abs(r)
    approx = False
    if r.q == 1:
        body = _group_thousands(str(int(r.p)))
    else:
        if _terminates(r):
            dec = str(sp.Float(r, 30))
            dec = dec.rstrip("0").rstrip(".") if "." in dec else dec
        else:
            approx = True
            dec = f"{float(r):.{decimals}f}"
        int_part, _, frac_part = dec.partition(".")
        body = _group_thousands(int_part) + ("," + frac_part if frac_part else "")
    sign = MINUS if neg and body not in ("0",) else ""
    return ("≈ " if approx else "") + sign + body


def fmt_exact(value) -> str:
    """Seperti fmt, tetapi pecahan tak berhingga ditulis 28/3 (≈ 9,33)."""
    r = sp.nsimplify(value)
    if isinstance(r, sp.Rational) and r.q != 1 and not _terminates(r):
        sign = MINUS if r < 0 else ""
        return f"{sign}{abs(r.p)}/{r.q} ({fmt(r)})"
    return fmt(r)


# ---------------------------------------------------------------------------
# Membaca rumus fungsi
# ---------------------------------------------------------------------------
_ALLOWED = re.compile(r"[0-9x+\-*/^().\s]*")


def parse_function(text: str) -> sp.Expr:
    """Baca rumus seperti "f(x) = 2x + 3", "-2x+30", "50.000x - 150.000", "x^2 - 1"."""
    if text is None or not str(text).strip():
        raise MathInputError("Rumus fungsi masih kosong.")
    s = str(text).strip()
    if len(s) > 80:
        raise MathInputError("Rumusnya terlalu panjang.")
    s = (
        s.replace(MINUS, "-").replace("–", "-").replace("×", "*")
        .replace("·", "*").replace("÷", "/").replace(":", "/")
        .replace("²", "^2").replace("³", "^3").replace("**", "^")
        .replace("X", "x")
    )
    s = re.sub(r"^\s*[a-z]\s*\(\s*x\s*\)\s*=", "", s)   # buang "f(x) ="
    s = re.sub(r"^\s*y\s*=", "", s)
    s = _id_numbers_to_python(s)
    if not _ALLOWED.fullmatch(s):
        raise MathInputError("Rumus hanya boleh berisi angka, x, + − × : ( ) dan ^.")
    if re.search(r"\^(?!\s*[0-3](?![\d.]))", s):
        raise MathInputError("Pangkat yang didukung hanya 0 sampai 3.")
    if s.count("(") != s.count(")"):
        raise MathInputError("Jumlah kurung buka dan kurung tutup belum sama.")
    try:
        expr = parse_expr(s, local_dict={"x": X}, transformations=_TRANSFORMS, evaluate=True)
    except Exception as exc:  # noqa: BLE001 - pesan ramah untuk siswa
        raise MathInputError("Rumusnya belum bisa dibaca. Contoh penulisan: 2x + 3") from exc
    expr = sp.nsimplify(sp.sympify(expr), rational=True)
    if not expr.free_symbols <= {X}:
        raise MathInputError("Gunakan huruf x sebagai variabel.")
    return sp.expand(expr)


def poly_terms(expr: sp.Expr) -> list[tuple[sp.Rational, int]]:
    """Daftar (koefisien, pangkat) dari pangkat tertinggi; error bila bukan polinom ≤ 3."""
    try:
        poly = sp.Poly(expr, X)
    except sp.PolynomialError as exc:
        raise MathInputError("Kalkulator ini untuk fungsi bentuk ax + b atau ax² + bx + c.") from exc
    if poly.degree() > 3:
        raise MathInputError("Pangkat tertinggi yang didukung adalah 3.")
    terms = [(sp.Rational(c), int(m[0])) for m, c in poly.terms() if c != 0]
    terms.sort(key=lambda t: -t[1])
    return terms or [(sp.Rational(0), 0)]


def _join(parts: list[tuple[bool, str]]) -> str:
    """Gabungkan suku: parts = [(negatif?, teks_tanpa_tanda)]."""
    out = ""
    for i, (neg, body) in enumerate(parts):
        if i == 0:
            out = (MINUS if neg else "") + body
        else:
            out += f" {MINUS} " if neg else " + "
            out += body
    return out


def pretty(expr: sp.Expr) -> str:
    parts = []
    for c, p in poly_terms(expr):
        a = abs(c)
        if p == 0:
            body = fmt(a)
        else:
            coef = "" if a == 1 else fmt(a)
            body = coef + "x" + _SUPERSCRIPT.get(p, "")
        parts.append((c < 0, body))
    return _join(parts)


# ---------------------------------------------------------------------------
# Kalkulator nilai fungsi langkah demi langkah (IL02, GL03)
# ---------------------------------------------------------------------------
def evaluate_steps(expr_text: str | sp.Expr, x_value: str | sp.Rational, name: str = "f") -> dict:
    expr = parse_function(expr_text) if isinstance(expr_text, str) else sp.expand(expr_text)
    v = parse_number(x_value) if isinstance(x_value, str) else sp.Rational(x_value)
    terms = poly_terms(expr)
    name = (name or "f").strip()[:1] or "f"
    vs = fmt(v)
    lhs = f"{name}({vs})"

    steps = [{"title": "Tulis rumus fungsinya", "math": f"{name}(x) = {pretty(expr)}"}]

    sub_parts = []
    for c, p in terms:
        a = abs(c)
        if p == 0:
            body = fmt(a)
        elif a == 1:
            body = f"({vs})" + _SUPERSCRIPT.get(p, "")
        else:
            body = f"{fmt(a)} × ({vs})" + _SUPERSCRIPT.get(p, "")
        sub_parts.append((c < 0, body))
    steps.append({
        "title": f"Ganti setiap x dengan {vs}",
        "math": f"{lhs} = {_join(sub_parts)}",
        "note": "Pakai kurung supaya tanda negatif dan desimal tidak tertukar.",
    })

    if any(p >= 2 for _, p in terms):
        pow_parts = []
        for c, p in terms:
            a = abs(c)
            if p == 0:
                body = fmt(a)
            elif p == 1:
                body = f"({vs})" if a == 1 else f"{fmt(a)} × ({vs})"
            else:
                pv = v ** p
                body = fmt(pv) if a == 1 else f"{fmt(a)} × {fmt(pv) if pv >= 0 else '(' + fmt(pv) + ')'}"
            pow_parts.append((c < 0, body))
        steps.append({"title": "Hitung pangkatnya dulu", "math": f"{lhs} = {_join(pow_parts)}"})

    values = [c * v ** p for c, p in terms]
    if len(terms) > 1 or terms[0][1] > 0:
        val_parts = [(t < 0, fmt(abs(t))) for t in values]
        steps.append({"title": "Kerjakan perkaliannya", "math": f"{lhs} = {_join(val_parts)}"})

    result = sum(values, sp.Rational(0))
    if len(terms) > 1:
        steps.append({"title": "Jumlahkan atau kurangkan", "math": f"{lhs} = {fmt(result)}"})

    return {
        "expr": pretty(expr),
        "x": vs,
        "steps": steps,
        "result": fmt(result),
        "result_value": float(result),
        "summary": f"Jadi, {lhs} = {fmt(result)}.",
    }


# ---------------------------------------------------------------------------
# Relasi & fungsi (IL01, GL02)
# ---------------------------------------------------------------------------
def analyze_relation(domain: list, codomain: list, pairs: list) -> dict:
    """Periksa apakah relasi adalah fungsi: tiap anggota domain punya TEPAT SATU pasangan."""
    domain = [str(d) for d in domain]
    codomain = [str(c) for c in codomain]
    clean_pairs: list[tuple[str, str]] = []
    for pair in pairs:
        a, b = str(pair[0]), str(pair[1])
        if a not in domain or b not in codomain:
            raise MathInputError(f"Pasangan ({a}, {b}) tidak berasal dari kedua himpunan.")
        if (a, b) not in clean_pairs:
            clean_pairs.append((a, b))

    outgoing: dict[str, list[str]] = {a: [] for a in domain}
    for a, b in clean_pairs:
        outgoing[a].append(b)

    problems = []
    for a in domain:
        n = len(outgoing[a])
        if n == 0:
            problems.append({"element": a, "count": 0,
                             "message": f"{a} tidak punya pasangan sama sekali."})
        elif n > 1:
            problems.append({"element": a, "count": n,
                             "message": f"{a} punya {n} pasangan ({', '.join(outgoing[a])})."})

    used = {b for _, b in clean_pairs}
    rng = [c for c in codomain if c in used]
    return {
        "is_function": not problems,
        "problems": problems,
        "domain": domain,
        "codomain": codomain,
        "range": rng,
        "pairs": [list(p) for p in clean_pairs],
        "pairs_text": "{" + ", ".join(f"({a}, {b})" for a, b in clean_pairs) + "}",
        "rule": "Setiap anggota daerah asal harus punya tepat satu pasangan.",
    }


# ---------------------------------------------------------------------------
# Pemeriksaan jawaban
# ---------------------------------------------------------------------------
def numbers_equal(expected: sp.Rational, given: sp.Rational, tolerance: str | float = 0) -> bool:
    tol = sp.Rational(str(tolerance)) if tolerance else 0
    return abs(sp.Rational(expected) - sp.Rational(given)) <= tol


def expressions_equal(expected: str, given: str) -> bool:
    return sp.simplify(parse_function(expected) - parse_function(given)) == 0


@dataclass
class Diagnosis:
    error_type: str
    message: str


def diagnose_linear_value(a, b, x0, answer) -> Diagnosis:
    """Tebak jenis kesalahan saat menghitung f(x0) untuk f(x) = ax + b (IL02)."""
    a, b, x0, y = (sp.Rational(v) for v in (a, b, x0, answer))
    if y == a * x0 - b or y == -a * x0 + b:
        return Diagnosis("salah_tanda",
                         "Sepertinya ada tanda + / − yang tertukar. Perhatikan tanda di depan setiap angka.")
    if y == a + x0 + b:
        return Diagnosis("tidak_dikalikan",
                         "Ingat: ax artinya a dikali x. Nilai x harus dikalikan, bukan dijumlahkan.")
    if y == a * x0 and b != 0:
        return Diagnosis("lupa_konstanta",
                         "Perkaliannya sudah benar, tapi angka tetapnya (konstanta) belum ikut dihitung.")
    if a.q == 1 and x0.q == 1 and a > 0 and x0 >= 0:
        glued = sp.Rational(int(f"{int(a.p)}{int(x0.p)}"))
        if y == glued + b:
            return Diagnosis("angka_ditempel",
                             "2x artinya 2 × x, bukan angka 2 ditempel dengan nilai x.")
    if a != 1 and y == x0 + b:
        return Diagnosis("koefisien_hilang",
                         "Koefisien di depan x belum dikalikan. Coba ulangi langkah penggantian x.")
    return Diagnosis("salah_hitung",
                     "Langkahmu mungkin sudah benar, tetapi ada salah hitung. Cek lagi perkalian dan penjumlahannya.")


def linear_through(p1: tuple, p2: tuple) -> tuple[sp.Rational, sp.Rational]:
    """Cari a dan b pada f(x) = ax + b yang melalui dua titik."""
    (x1, y1), (x2, y2) = [(sp.Rational(px), sp.Rational(py)) for px, py in (p1, p2)]
    if x1 == x2:
        raise MathInputError("Dua titik harus punya nilai x yang berbeda.")
    a = (y2 - y1) / (x2 - x1)
    return a, y1 - a * x1
