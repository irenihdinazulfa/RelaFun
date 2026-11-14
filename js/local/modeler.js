// Pemodel soal cerita versi JavaScript — padanan apps/api/app/core/modeler.py (fungsi solve).

import { Q, ZERO } from "./rational.js";
import { MINUS, MathInputError, evaluateSteps, fmt, fmtExact, linearPoly, polyEval, pretty } from "./mathfn.js";

const OP_TEXT = { ">": ">", ">=": "≥", "<": "<", "<=": "≤" };
const FLIP = { ">": "<", ">=": "<=", "<": ">", "<=": ">=" };
const TYPES = ["evaluate", "compare", "threshold", "solve_for_x"];

export class SpecError extends Error {}

const unit = (u) => (u ? ` ${u}` : "");
function money(v, u) {
  if (["rupiah", "rp"].includes(String(u).toLowerCase())) {
    const s = fmt(v);
    return s.startsWith(MINUS) ? MINUS + "Rp" + s.slice(1) : "Rp" + s;
  }
  return fmt(v) + unit(u);
}
function r(v) {
  if (v === null || v === undefined || v === "") throw new MathInputError("Ada nilai yang belum diisi.");
  return Q.of(v);
}
const cmpOk = (v, op, t) => ({ ">": v.gt(t), ">=": v.ge(t), "<": v.lt(t), "<=": v.le(t) })[op];

/** Validasi seperti Pydantic ModelSpec; galat → SpecError (422). */
export function normalizeSpec(spec) {
  const s = spec || {};
  const models = Array.isArray(s.models) ? s.models : [];
  if (models.length < 1 || models.length > 2) throw new SpecError("Isian belum lengkap atau formatnya belum sesuai.");
  const ms = models.map((m) => {
    const a = Number(m.a);
    const b = m.b === undefined || m.b === null ? 0 : Number(m.b);
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 1e12 || Math.abs(b) > 1e12) {
      throw new SpecError("Isian belum lengkap atau formatnya belum sesuai.");
    }
    const name = String(m.name ?? "f");
    if (name.length > 1) throw new SpecError("Isian belum lengkap atau formatnya belum sesuai.");
    return { name: name || "f", label: String(m.label || "").slice(0, 60), a, b };
  });
  const t = s.task || {};
  if (!TYPES.includes(t.type) || (t.op != null && !(t.op in OP_TEXT))) throw new SpecError("Isian belum lengkap atau formatnya belum sesuai.");
  const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
  return {
    variable_meaning: String(s.variable_meaning ?? "x").slice(0, 80),
    variable_unit: String(s.variable_unit ?? "").slice(0, 20),
    output_unit: String(s.output_unit ?? "").slice(0, 20),
    models: ms,
    task: { type: t.type, x: num(t.x), op: t.op ?? null, target: num(t.target), integer_x: !!t.integer_x },
  };
}

export function solve(rawSpec) {
  const spec = normalizeSpec(rawSpec);
  const t = spec.task;
  const M = spec.models.map((m) => {
    const ra = Q.of(m.a);
    const rb = Q.of(m.b);
    const expr = linearPoly(ra, rb);
    return { ...m, ra, rb, expr, formula: `${m.name}(x) = ${pretty(expr)}`, disp: m.label || m.name };
  });
  const m0 = M[0];
  const steps = [];
  const v_ = spec.variable_meaning || "x";

  steps.push({ title: "1. Tentukan variabel",
    lines: [`Misalkan x = ${v_}` + (spec.variable_unit ? ` (dalam ${spec.variable_unit})` : "") + "."] });
  const modelLines = [];
  for (const m of M) {
    modelLines.push(`${m.disp}: nilai tetap b = ${fmt(m.rb)}, perubahan per satuan a = ${fmt(m.ra)}`);
    modelLines.push(`→ ${m.formula}`);
  }
  steps.push({ title: "2. Susun model fungsi f(x) = ax + b", lines: modelLines });

  const out = { models: M.map((m) => m.formula) };
  let conclusion;
  const evalLines = (xv) => M.flatMap((m) => evaluateSteps(m.expr, xv, m.name).steps.slice(1).map((s) => s.math));

  if (t.type === "evaluate") {
    const xv = r(t.x);
    const v = polyEval(m0.expr, xv);
    steps.push({ title: `3. Hitung nilai fungsi untuk x = ${fmt(xv)}`, lines: evalLines(xv) });
    conclusion = `${m0.name}(${fmt(xv)}) = ${money(v, spec.output_unit)}.`;
    if (t.op && t.target !== null) {
      const tv = r(t.target);
      const ok = cmpOk(v, t.op, tv);
      const diff = v.sub(tv).abs();
      steps.push({ title: "4. Bandingkan dengan syarat soal",
        lines: [`Apakah ${fmt(v)} ${OP_TEXT[t.op]} ${fmt(tv)}? → ${ok ? "Ya" : "Tidak"}` + (ok || diff.isZero() ? "" : ` (selisih ${fmt(diff)})`)] });
      conclusion += ok ? " Syarat terpenuhi." : ` Syarat tidak terpenuhi; selisihnya ${money(diff, spec.output_unit)}.`;
      out.meets_condition = ok;
      out.difference = fmt(diff);
    }
    out.value = fmt(v);
    out.value_number = v.toNumber();
  } else if (t.type === "compare") {
    if (M.length !== 2) throw new MathInputError("Untuk membandingkan, isi dua model fungsi.");
    const m1 = M[1];
    const xv = r(t.x);
    const v0 = polyEval(m0.expr, xv);
    const v1 = polyEval(m1.expr, xv);
    steps.push({ title: `3. Hitung kedua fungsi untuk x = ${fmt(xv)}`, lines: evalLines(xv) });
    let cmpLine;
    let smaller = null;
    if (v0.eq(v1)) {
      cmpLine = `${m0.disp} dan ${m1.disp} sama besar (${money(v0, spec.output_unit)}).`;
    } else {
      smaller = v0.lt(v1) ? m0 : m1;
      const vs = v0.lt(v1) ? v0 : v1;
      const vl = v0.lt(v1) ? v1 : v0;
      cmpLine = `${smaller.disp} lebih kecil: ${money(vs, spec.output_unit)} < ${money(vl, spec.output_unit)} (selisih ${money(vl.sub(vs), spec.output_unit)}).`;
    }
    const lines4 = [cmpLine];
    if (!m0.ra.eq(m1.ra)) {
      const xe = m1.rb.sub(m0.rb).div(m0.ra.sub(m1.ra));
      lines4.push(`Kedua fungsi bernilai sama ketika ${pretty(m0.expr)} = ${pretty(m1.expr)}, yaitu x = ${fmtExact(xe)}.`);
      const low = m0.ra.lt(m1.ra) ? m0 : m1;
      const high = low === m0 ? m1 : m0;
      lines4.push(`Jika x < ${fmtExact(xe)}, ${high.disp} lebih kecil; jika x > ${fmtExact(xe)}, ${low.disp} lebih kecil.`);
      out.equal_at = fmtExact(xe);
    }
    steps.push({ title: "4. Bandingkan hasilnya", lines: lines4 });
    conclusion = smaller ? `Untuk x = ${fmt(xv)}, pilih ${smaller.disp} karena nilainya lebih kecil.` : cmpLine;
    out.values = [fmt(v0), fmt(v1)];
    out.smaller = smaller ? smaller.disp : null;
  } else {
    const tv = r(t.target ?? 0);
    const a = m0.ra;
    const b = m0.rb;
    if (a.isZero()) throw new MathInputError("Nilai a tidak boleh 0 untuk mencari x.");
    const solveX = t.type === "solve_for_x";
    const rel = solveX ? "=" : OP_TEXT[t.op || ">"];
    const ax = pretty(linearPoly(a, 0));
    const lines = [`${pretty(m0.expr)} ${rel} ${fmt(tv)}`];
    if (!b.isZero()) {
      if (!tv.isZero()) {
        lines.push(`${ax} ${rel} ${fmt(tv)} ${b.isNeg() ? "+" : MINUS} ${fmt(b.abs())}   (pindahkan angka tetap ke ruas kanan)`);
        lines.push(`${ax} ${rel} ${fmt(tv.sub(b))}`);
      } else {
        lines.push(`${ax} ${rel} ${fmt(tv.sub(b))}   (pindahkan angka tetap ke ruas kanan)`);
      }
    }
    const bound = tv.sub(b).div(a);
    let op = t.op || ">";
    if (!solveX && a.isNeg()) {
      op = FLIP[op];
      lines.push(`x ${OP_TEXT[op]} ${fmtExact(bound)}   (dibagi ${fmt(a)}; tanda dibalik karena pembaginya negatif)`);
    } else {
      lines.push(`x ${solveX ? rel : OP_TEXT[op]} ${fmtExact(bound)}   (bagi kedua ruas dengan ${fmt(a)})`);
    }
    steps.push({ title: "3. Selesaikan untuk x", lines });

    if (solveX) {
      conclusion = `x = ${fmtExact(bound)}` + unit(spec.variable_unit) + ".";
      out.x = fmtExact(bound);
    } else {
      conclusion = `Nilai x yang memenuhi: x ${OP_TEXT[op]} ${fmtExact(bound)}.`;
      out.solution = `x ${OP_TEXT[op]} ${fmtExact(bound)}`;
      if (t.integer_x) {
        let best;
        let word;
        if (op === ">") { best = bound.floor().add(1); word = "paling sedikit"; }
        else if (op === ">=") { best = bound.ceil(); word = "paling sedikit"; }
        else if (op === "<") { best = bound.ceil().sub(1); word = "paling banyak"; }
        else { best = bound.floor(); word = "paling banyak"; }
        const checkV = polyEval(m0.expr, best);
        steps.push({ title: "4. Karena x berupa bilangan bulat",
          lines: [`x ${word} = ${fmt(best)}`, `Cek: ${m0.name}(${fmt(best)}) = ${fmt(checkV)} ${OP_TEXT[t.op || ">"]} ${fmt(tv)} ✓`] });
        conclusion = `x ${word} ${fmt(best)}` + unit(spec.variable_unit) + ".";
        out.integer_answer = Number(best.n);
      }
    }
  }
  out.steps = steps;
  out.conclusion = conclusion;
  return out;
}

export { ZERO };

// ---------------------------------------------------------------------------
// Verifikasi model buatan AI (V1–V6) — padanan verify_spec() di modeler.py
// ---------------------------------------------------------------------------
export function numbersInText(text) {
  const found = [];
  const add = (v) => { try { const q = Q.parseDecimal(v); if (!found.some((f) => f.eq(q))) found.push(q); } catch { /* lewati */ } };
  for (const tok of String(text || "").match(/\d+(?:[.,]\d+)*/g) || []) {
    const variants = new Set([tok]);
    if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(tok)) variants.add(tok.replace(/\./g, "").replace(",", "."));
    variants.add(tok.replace(/,/g, "."));
    for (const v of variants) add(v);
  }
  return found;
}

export function verifySpec(story, rawSpec) {
  const spec = normalizeSpec(rawSpec);
  const checks = [];
  const nums = numbersInText(story);
  const has = (q) => nums.some((n) => n.eq(q));
  const add = (code, ok, message, level = "error") => checks.push({ code, ok, level: ok ? "ok" : level, message });
  add("V1", true, "Format model lengkap dan bisa dibaca.");
  const t = spec.task;
  const needTwo = t.type === "compare";
  add("V2", needTwo ? spec.models.length === 2 : true,
    !needTwo || spec.models.length === 2 ? "Jumlah model sesuai jenis pertanyaan." : "Untuk membandingkan diperlukan dua fungsi.");
  for (const m of spec.models) {
    const disp = m.label || m.name;
    for (const [label, val] of [["a", Q.of(m.a)], ["b", Q.of(m.b)]]) {
      const present = val.isZero() || has(val.abs());
      add("V3", present, `${disp}: ${label} = ${fmt(val)} ` + (present ? "ditemukan di soal." : "tidak tertulis langsung di soal — periksa lagi."), "warning");
    }
  }
  if (t.type === "evaluate" || t.type === "compare") {
    const ok = t.x !== null;
    add("V4", ok, ok ? "Nilai x yang ditanyakan sudah ada." : "Nilai x yang ditanyakan belum ditemukan.");
    if (ok && !has(Q.of(t.x))) {
      add("V5", false, `x = ${fmt(Q.of(t.x))} merupakan hasil olahan (misalnya konversi waktu). Pastikan perhitungannya benar.`, "warning");
    }
  }
  if (t.type === "threshold" || t.type === "solve_for_x") {
    const ok = t.target !== null;
    add("V4", ok, ok ? "Batas/target sudah ada." : "Batas/target belum ditemukan.");
    if (t.type === "threshold") add("V4", t.op !== null, t.op !== null ? "Tanda pertidaksamaan sudah ada." : "Tanda pertidaksamaan belum ada.");
  }
  try {
    solve(spec);
    add("V6", true, "Model dapat diselesaikan oleh mesin hitung.");
  } catch (e) {
    if (!(e instanceof MathInputError)) throw e;
    add("V6", false, `Model belum bisa diselesaikan: ${e.message}`);
  }
  return { ok: !checks.some((c) => c.level === "error"), checks };
}
