"""Pemodel soal cerita fungsi linear f(x) = ax + b.

Mode A (terpandu) dan mode B (AI) memakai mesin yang SAMA di sini:
AI hanya menerjemahkan cerita menjadi spesifikasi model; semua hitungan
dan kesimpulan dibuat oleh SymPy. Lihat docs/13-WORD-PROBLEM-MODELER.md.
"""
from __future__ import annotations

import math
import re
from typing import Literal

import sympy as sp
from pydantic import BaseModel, Field, field_validator

from .mathfn import MINUS, MathInputError, X, evaluate_steps, fmt, fmt_exact, pretty

Op = Literal[">", ">=", "<", "<="]
_OP_TEXT = {">": ">", ">=": "≥", "<": "<", "<=": "≤"}
_FLIP = {">": "<", ">=": "<=", "<": ">", "<=": ">="}


class LinearModel(BaseModel):
    name: str = Field("f", max_length=1, description="Huruf nama fungsi, mis. f, g, h, A, B")
    label: str = Field("", max_length=60)
    a: float = Field(..., description="Laju perubahan / nilai per satuan x")
    b: float = Field(0, description="Nilai tetap / nilai awal")

    @field_validator("a", "b")
    @classmethod
    def _finite(cls, v: float) -> float:
        if not math.isfinite(v) or abs(v) > 1e12:
            raise ValueError("Angka terlalu besar atau tidak valid.")
        return v

    @property
    def ra(self) -> sp.Rational:
        return sp.nsimplify(self.a, rational=True)

    @property
    def rb(self) -> sp.Rational:
        return sp.nsimplify(self.b, rational=True)

    def expr(self) -> sp.Expr:
        return self.ra * X + self.rb

    def formula(self) -> str:
        return f"{self.name}(x) = {pretty(self.expr())}"

    def display_name(self) -> str:
        return self.label or self.name


class Task(BaseModel):
    type: Literal["evaluate", "compare", "threshold", "solve_for_x"]
    x: float | None = None
    op: Op | None = None
    target: float | None = None
    integer_x: bool = False


class ModelSpec(BaseModel):
    variable_meaning: str = Field("x", max_length=80)
    variable_unit: str = Field("", max_length=20)
    output_unit: str = Field("", max_length=20)
    models: list[LinearModel] = Field(..., min_length=1, max_length=2)
    task: Task


def _r(v: float | None) -> sp.Rational:
    if v is None:
        raise MathInputError("Ada nilai yang belum diisi.")
    return sp.nsimplify(v, rational=True)


def _unit(u: str) -> str:
    return f" {u}" if u else ""


def _money(value: sp.Rational, unit: str) -> str:
    if unit.lower() in ("rupiah", "rp"):
        s = fmt(value)
        return ("−Rp" + s[1:]) if s.startswith(MINUS) else "Rp" + s
    return fmt(value) + _unit(unit)


def _compare_text(v: sp.Rational, op: str, t: sp.Rational) -> bool:
    return {">": v > t, ">=": v >= t, "<": v < t, "<=": v <= t}[op]


def solve(spec: ModelSpec) -> dict:
    """Jalankan tugas pada model dan kembalikan langkah + kesimpulan."""
    t = spec.task
    m0 = spec.models[0]
    steps: list[dict] = []
    var = spec.variable_meaning or "x"

    steps.append({
        "title": "1. Tentukan variabel",
        "lines": [f"Misalkan x = {var}" + (f" (dalam {spec.variable_unit})" if spec.variable_unit else "") + "."],
    })
    model_lines = []
    for m in spec.models:
        model_lines.append(
            f"{m.display_name()}: nilai tetap b = {fmt(m.rb)}, perubahan per satuan a = {fmt(m.ra)}"
        )
        model_lines.append(f"→ {m.formula()}")
    steps.append({"title": "2. Susun model fungsi f(x) = ax + b", "lines": model_lines})

    result: dict = {"models": [m.formula() for m in spec.models]}

    if t.type == "evaluate":
        xv = _r(t.x)
        lines = []
        for m in spec.models:
            ev = evaluate_steps(m.expr(), xv, m.name)
            lines += [s["math"] for s in ev["steps"][1:]]
        v = m0.expr().subs(X, xv)
        steps.append({"title": f"3. Hitung nilai fungsi untuk x = {fmt(xv)}", "lines": lines})
        conclusion = f"{m0.name}({fmt(xv)}) = {_money(v, spec.output_unit)}."
        if t.op and t.target is not None:
            tv = _r(t.target)
            ok = _compare_text(v, t.op, tv)
            diff = abs(v - tv)
            steps.append({
                "title": "4. Bandingkan dengan syarat soal",
                "lines": [f"Apakah {fmt(v)} {_OP_TEXT[t.op]} {fmt(tv)}? → {'Ya' if ok else 'Tidak'}"
                          + ("" if ok or diff == 0 else f" (selisih {fmt(diff)})")],
            })
            conclusion += (" Syarat terpenuhi." if ok else
                           f" Syarat tidak terpenuhi; selisihnya {_money(diff, spec.output_unit)}.")
            result["meets_condition"] = bool(ok)
            result["difference"] = fmt(diff)
        result.update(value=fmt(v), value_number=float(v))

    elif t.type == "compare":
        if len(spec.models) != 2:
            raise MathInputError("Untuk membandingkan, isi dua model fungsi.")
        m1 = spec.models[1]
        xv = _r(t.x)
        v0, v1 = m0.expr().subs(X, xv), m1.expr().subs(X, xv)
        lines = []
        for m in spec.models:
            ev = evaluate_steps(m.expr(), xv, m.name)
            lines += [s["math"] for s in ev["steps"][1:]]
        steps.append({"title": f"3. Hitung kedua fungsi untuk x = {fmt(xv)}", "lines": lines})
        if v0 == v1:
            cmp_line = f"{m0.display_name()} dan {m1.display_name()} sama besar ({_money(v0, spec.output_unit)})."
            smaller = None
        else:
            smaller, larger = (m0, m1) if v0 < v1 else (m1, m0)
            vs, vl = min(v0, v1), max(v0, v1)
            cmp_line = (f"{smaller.display_name()} lebih kecil: {_money(vs, spec.output_unit)} < "
                        f"{_money(vl, spec.output_unit)} (selisih {_money(vl - vs, spec.output_unit)}).")
        lines4 = [cmp_line]
        if m0.ra != m1.ra:
            xe = (m1.rb - m0.rb) / (m0.ra - m1.ra)
            lines4.append(f"Kedua fungsi bernilai sama ketika {pretty(m0.expr())} = {pretty(m1.expr())}, "
                          f"yaitu x = {fmt_exact(xe)}.")
            low_side = m0 if m0.ra < m1.ra else m1   # lebih landai -> lebih kecil untuk x besar
            high_side = m1 if low_side is m0 else m0
            lines4.append(f"Jika x < {fmt_exact(xe)}, {high_side.display_name()} lebih kecil; "
                          f"jika x > {fmt_exact(xe)}, {low_side.display_name()} lebih kecil.")
            result["equal_at"] = fmt_exact(xe)
        steps.append({"title": "4. Bandingkan hasilnya", "lines": lines4})
        conclusion = (f"Untuk x = {fmt(xv)}, pilih {smaller.display_name()} karena nilainya lebih kecil."
                      if smaller else cmp_line)
        result.update(values=[fmt(v0), fmt(v1)],
                      smaller=smaller.display_name() if smaller else None)

    elif t.type in ("threshold", "solve_for_x"):
        tv = _r(t.target if t.target is not None else 0)
        a, b = m0.ra, m0.rb
        if a == 0:
            raise MathInputError("Nilai a tidak boleh 0 untuk mencari x.")
        rel = "=" if t.type == "solve_for_x" else _OP_TEXT[t.op or ">"]
        lines = [f"{pretty(m0.expr())} {rel} {fmt(tv)}"]
        if b != 0:
            if tv != 0:
                lines.append(f"{pretty(a * X)} {rel} {fmt(tv)} {'+' if b < 0 else MINUS} {fmt(abs(b))}"
                             "   (pindahkan angka tetap ke ruas kanan)")
                lines.append(f"{pretty(a * X)} {rel} {fmt(tv - b)}")
            else:
                lines.append(f"{pretty(a * X)} {rel} {fmt(tv - b)}   (pindahkan angka tetap ke ruas kanan)")
        bound = (tv - b) / a
        op = t.op or ">"
        if t.type == "threshold" and a < 0:
            op = _FLIP[op]
            lines.append(f"x {_OP_TEXT[op]} {fmt_exact(bound)}   (dibagi {fmt(a)}; tanda dibalik karena pembaginya negatif)")
        else:
            lines.append(f"x {rel if t.type == 'solve_for_x' else _OP_TEXT[op]} {fmt_exact(bound)}   (bagi kedua ruas dengan {fmt(a)})")
        steps.append({"title": "3. Selesaikan untuk x", "lines": lines})

        if t.type == "solve_for_x":
            conclusion = f"x = {fmt_exact(bound)}" + _unit(spec.variable_unit) + "."
            result.update(x=fmt_exact(bound))
        else:
            conclusion = f"Nilai x yang memenuhi: x {_OP_TEXT[op]} {fmt_exact(bound)}."
            result.update(solution=f"x {_OP_TEXT[op]} {fmt_exact(bound)}")
            if t.integer_x:
                if op == ">":
                    best = sp.floor(bound) + 1
                    word = "paling sedikit"
                elif op == ">=":
                    best = sp.ceiling(bound)
                    word = "paling sedikit"
                elif op == "<":
                    best = sp.ceiling(bound) - 1
                    word = "paling banyak"
                else:
                    best = sp.floor(bound)
                    word = "paling banyak"
                check_v = m0.expr().subs(X, best)
                steps.append({
                    "title": "4. Karena x berupa bilangan bulat",
                    "lines": [f"x {word} = {fmt(best)}",
                              f"Cek: {m0.name}({fmt(best)}) = {fmt(check_v)} {_OP_TEXT[t.op or '>']} {fmt(tv)} ✓"],
                })
                conclusion = f"x {word} {fmt(best)}" + _unit(spec.variable_unit) + "."
                result.update(integer_answer=int(best))
    else:  # pragma: no cover
        raise MathInputError("Jenis tugas tidak dikenal.")

    result.update(steps=steps, conclusion=conclusion)
    return result


# ---------------------------------------------------------------------------
# Verifikasi model buatan AI (V1–V6)
# ---------------------------------------------------------------------------
_NUM_IN_TEXT = re.compile(r"\d+(?:[.,]\d+)*")


def numbers_in_text(text: str) -> set[sp.Rational]:
    found: set[sp.Rational] = set()
    for tok in _NUM_IN_TEXT.findall(text or ""):
        variants = {tok}
        if re.fullmatch(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?", tok):
            variants.add(tok.replace(".", "").replace(",", "."))
        variants.add(tok.replace(",", "."))
        for v in variants:
            try:
                found.add(sp.Rational(v))
            except (TypeError, ValueError):
                continue
    return found


def verify_spec(story: str, spec: ModelSpec) -> dict:
    """Periksa model hasil AI sebelum dihitung. Return {"ok", "checks": [...]}."""
    checks = []
    nums = numbers_in_text(story)

    def add(code: str, ok: bool, msg: str, level: str = "error") -> None:
        checks.append({"code": code, "ok": ok, "level": "ok" if ok else level, "message": msg})

    add("V1", True, "Format model lengkap dan bisa dibaca.")
    t = spec.task
    need_two = t.type == "compare"
    add("V2", (len(spec.models) == 2) if need_two else True,
        "Jumlah model sesuai jenis pertanyaan." if (not need_two or len(spec.models) == 2)
        else "Untuk membandingkan diperlukan dua fungsi.")

    for m in spec.models:
        for label, val in (("a", m.ra), ("b", m.rb)):
            present = val == 0 or abs(val) in nums
            add("V3", present,
                f"{m.display_name()}: {label} = {fmt(val)} " +
                ("ditemukan di soal." if present else "tidak tertulis langsung di soal — periksa lagi."),
                level="warning")

    if t.type in ("evaluate", "compare"):
        ok = t.x is not None
        add("V4", ok, "Nilai x yang ditanyakan sudah ada." if ok else "Nilai x yang ditanyakan belum ditemukan.")
        if ok and sp.nsimplify(t.x, rational=True) not in nums:
            add("V5", False, f"x = {fmt(sp.nsimplify(t.x, rational=True))} merupakan hasil olahan "
                "(misalnya konversi waktu). Pastikan perhitungannya benar.", level="warning")
    if t.type in ("threshold", "solve_for_x"):
        ok = t.target is not None
        add("V4", ok, "Batas/target sudah ada." if ok else "Batas/target belum ditemukan.")
        if t.type == "threshold":
            add("V4", t.op is not None, "Tanda pertidaksamaan sudah ada." if t.op else "Tanda pertidaksamaan belum ada.")

    try:
        solve(spec)
        add("V6", True, "Model dapat diselesaikan oleh SymPy.")
    except MathInputError as exc:
        add("V6", False, f"Model belum bisa diselesaikan: {exc}")

    blocking = [c for c in checks if c["level"] == "error"]
    return {"ok": not blocking, "checks": checks}
