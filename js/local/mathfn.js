// Mesin matematika RelaFun versi JavaScript (mode tanpa server).
// Padanan 1:1 dari apps/api/app/core/mathfn.py — keluaran teksnya dibuat sama persis
// dan diuji silang dengan versi Python (lihat docs/10-TEST-PLAN.md).

import { Q, ZERO, ONE } from "./rational.js";

export const MINUS = "−";
const SUP = { 2: "²", 3: "³" };

export class MathInputError extends Error {}
const err = (m) => new MathInputError(m);

// ---------------------------------------------------------------------------
// Angka format Indonesia
// ---------------------------------------------------------------------------
const THOUSANDS = /\d{1,3}(?:\.\d{3})+(?:,\d+)?/g;

function idNumbers(s) {
  s = s.replace(THOUSANDS, (m) => m.replace(/\./g, "").replace(",", "."));
  return s.replace(/(\d),(\d)/g, "$1.$2");
}

export function parseNumber(text) {
  if (text === null || text === undefined) throw err("Jawaban masih kosong.");
  let s = String(text).trim().toLowerCase();
  s = s.split(MINUS).join("-").split("rp").join("").split(" ").join("");
  s = s.split("°c").join("").split("°").join("");
  if (!s) throw err("Jawaban masih kosong.");
  s = idNumbers(s);
  if (/^[+-]?\d+(?:\.\d+)?$/.test(s)) return Q.parseDecimal(s);
  const m = /^([+-]?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s);
  if (m && !Q.parseDecimal(m[2]).isZero()) return Q.parseDecimal(m[1]).div(Q.parseDecimal(m[2]));
  throw err("Tulis jawaban berupa angka, misalnya 23 atau 3,5.");
}

const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** 53.000 ; 3,5 ; −7 ; ≈ 9,33 */
export function fmt(value, decimals = 2) {
  const r = Q.of(value);
  const neg = r.isNeg();
  const a = r.abs();
  let approx = false;
  let body;
  if (a.isInt()) {
    body = group(a.n.toString());
  } else if (a.terminates()) {
    let k = 0;
    while ((10n ** BigInt(k)) % a.d !== 0n) k++;
    const scaled = (a.n * 10n ** BigInt(k)) / a.d;
    const s = scaled.toString().padStart(k + 1, "0");
    const ip = s.slice(0, s.length - k);
    const fp = s.slice(s.length - k).replace(/0+$/, "");
    body = group(ip) + (fp ? "," + fp : "");
  } else {
    approx = true;
    const [ip, fp] = a.toNumber().toFixed(decimals).split(".");
    body = group(ip) + (fp ? "," + fp : "");
  }
  const sign = neg && body !== "0" ? MINUS : "";
  return (approx ? "≈ " : "") + sign + body;
}

/** Seperti fmt, tetapi pecahan tak berhingga ditulis 28/3 (≈ 9,33). */
export function fmtExact(value) {
  const r = Q.of(value);
  if (!r.isInt() && !r.terminates()) {
    const sign = r.isNeg() ? MINUS : "";
    return `${sign}${r.abs().n}/${r.d} (${fmt(r)})`;
  }
  return fmt(r);
}

// ---------------------------------------------------------------------------
// Polinom: array koefisien Q, indeks = pangkat
// ---------------------------------------------------------------------------
const trim = (p) => { const c = p.slice(); while (c.length > 1 && c[c.length - 1].isZero()) c.pop(); return c.length ? c : [ZERO]; };
const padd = (a, b) => trim(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || ZERO).add(b[i] || ZERO)));
const pneg = (a) => a.map((c) => c.neg());
const pmul = (a, b) => {
  const out = Array.from({ length: a.length + b.length - 1 }, () => ZERO);
  a.forEach((x, i) => b.forEach((y, j) => { out[i + j] = out[i + j].add(x.mul(y)); }));
  return trim(out);
};
const isConst = (p) => trim(p).length === 1;

export function polyEval(p, v) {
  let r = ZERO;
  for (let i = p.length - 1; i >= 0; i--) r = r.mul(v).add(p[i]);
  return r;
}

export function polyEqual(a, b) {
  const d = padd(a, pneg(b));
  return d.every((c) => c.isZero());
}

export function linearPoly(a, b) { return trim([Q.of(b), Q.of(a)]); }

// Pengurai rekursif: + − × / ^ ( ), perkalian tersirat (2x, 2(x+1), (x+1)(x−1))
function parseTokens(s) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    const m = /^(\d+(?:\.\d*)?|\.\d+)/.exec(s.slice(i));
    if (m) { toks.push({ t: "num", v: m[1] }); i += m[1].length; continue; }
    if ("x+-*/^()".includes(ch)) { toks.push({ t: ch }); i++; continue; }
    throw err("Rumus hanya boleh berisi angka, x, + − × : ( ) dan ^.");
  }
  return toks;
}

function parsePoly(s) {
  const toks = parseTokens(s);
  let k = 0;
  const peek = () => toks[k]?.t;
  const bad = () => err("Rumusnya belum bisa dibaca. Contoh penulisan: 2x + 3");

  function expr() {
    let left = term();
    while (peek() === "+" || peek() === "-") {
      const op = toks[k++].t;
      const right = term();
      left = op === "+" ? padd(left, right) : padd(left, pneg(right));
    }
    return left;
  }
  function term() {
    let left = factor();
    for (;;) {
      const t = peek();
      if (t === "*" || t === "/") {
        k++;
        const right = factor();
        if (t === "*") left = pmul(left, right);
        else {
          if (!isConst(right)) throw err("Kalkulator ini untuk fungsi bentuk ax + b atau ax² + bx + c.");
          if (right[0].isZero()) throw bad();
          const inv = ONE.div(right[0]);
          left = left.map((c) => c.mul(inv));
        }
      } else if (t === "num" || t === "x" || t === "(") {
        left = pmul(left, factor());   // perkalian tersirat
      } else return left;
    }
  }
  function factor() {
    if (peek() === "+") { k++; return factor(); }
    if (peek() === "-") { k++; return pneg(factor()); }
    return power();
  }
  function power() {
    const base = primary();
    if (peek() === "^") {
      k++;
      const tok = toks[k++];
      if (!tok || tok.t !== "num" || !/^[0-3]$/.test(tok.v)) throw err("Pangkat yang didukung hanya 0 sampai 3.");
      let r = [ONE];
      for (let i = 0; i < Number(tok.v); i++) r = pmul(r, base);
      return r;
    }
    return base;
  }
  function primary() {
    const tok = toks[k++];
    if (!tok) throw bad();
    if (tok.t === "num") return [Q.parseDecimal(tok.v.endsWith(".") ? tok.v.slice(0, -1) : tok.v)];
    if (tok.t === "x") return [ZERO, ONE];
    if (tok.t === "(") {
      const e = expr();
      if (toks[k++]?.t !== ")") throw bad();
      return e;
    }
    throw bad();
  }

  const result = expr();
  if (k !== toks.length) throw bad();
  return trim(result);
}

/** Baca "f(x) = 2x + 3", "-2x+30", "50.000x - 150.000", "x^2 - 1" → polinom. */
export function parseFunction(text) {
  if (text === null || text === undefined || !String(text).trim()) throw err("Rumus fungsi masih kosong.");
  let s = String(text).trim();
  if (s.length > 80) throw err("Rumusnya terlalu panjang.");
  s = s.split(MINUS).join("-").split("–").join("-").split("×").join("*")
    .split("·").join("*").split("÷").join("/").split(":").join("/")
    .split("²").join("^2").split("³").join("^3").split("**").join("^")
    .split("X").join("x");
  s = s.replace(/^\s*[a-z]\s*\(\s*x\s*\)\s*=/, "");
  s = s.replace(/^\s*y\s*=/, "");
  s = idNumbers(s);
  if (!/^[0-9x+\-*/^().\s]*$/.test(s)) throw err("Rumus hanya boleh berisi angka, x, + − × : ( ) dan ^.");
  if (/\^(?!\s*[0-3](?![\d.]))/.test(s)) throw err("Pangkat yang didukung hanya 0 sampai 3.");
  if ((s.match(/\(/g) || []).length !== (s.match(/\)/g) || []).length) throw err("Jumlah kurung buka dan kurung tutup belum sama.");
  return parsePoly(s.replace(/\^\s+/g, "^"));
}

/** [[koef, pangkat], …] dari pangkat tertinggi; galat bila pangkat > 3. */
export function polyTerms(p) {
  p = trim(p);
  if (p.length - 1 > 3) throw err("Pangkat tertinggi yang didukung adalah 3.");
  const terms = [];
  for (let i = p.length - 1; i >= 0; i--) if (!p[i].isZero()) terms.push([p[i], i]);
  return terms.length ? terms : [[ZERO, 0]];
}

function join(parts) {
  let out = "";
  parts.forEach(([neg, body], i) => {
    if (i === 0) out = (neg ? MINUS : "") + body;
    else out += (neg ? ` ${MINUS} ` : " + ") + body;
  });
  return out;
}

export function pretty(p) {
  return join(polyTerms(p).map(([c, pw]) => {
    const a = c.abs();
    if (pw === 0) return [c.isNeg(), fmt(a)];
    return [c.isNeg(), (a.eq(ONE) ? "" : fmt(a)) + "x" + (SUP[pw] || "")];
  }));
}

// ---------------------------------------------------------------------------
// Kalkulator nilai fungsi bertahap
// ---------------------------------------------------------------------------
export function evaluateSteps(exprText, xValue, name = "f") {
  const p = typeof exprText === "string" ? parseFunction(exprText) : trim(exprText);
  const v = typeof xValue === "string" ? parseNumber(xValue) : Q.of(xValue);
  const terms = polyTerms(p);
  name = String(name || "f").trim().slice(0, 1) || "f";
  const vs = fmt(v);
  const lhs = `${name}(${vs})`;

  const steps = [{ title: "Tulis rumus fungsinya", math: `${name}(x) = ${pretty(p)}` }];

  const sub = terms.map(([c, pw]) => {
    const a = c.abs();
    let body;
    if (pw === 0) body = fmt(a);
    else if (a.eq(ONE)) body = `(${vs})` + (SUP[pw] || "");
    else body = `${fmt(a)} × (${vs})` + (SUP[pw] || "");
    return [c.isNeg(), body];
  });
  steps.push({ title: `Ganti setiap x dengan ${vs}`, math: `${lhs} = ${join(sub)}`,
    note: "Pakai kurung supaya tanda negatif dan desimal tidak tertukar." });

  if (terms.some(([, pw]) => pw >= 2)) {
    const pp = terms.map(([c, pw]) => {
      const a = c.abs();
      let body;
      if (pw === 0) body = fmt(a);
      else if (pw === 1) body = a.eq(ONE) ? `(${vs})` : `${fmt(a)} × (${vs})`;
      else {
        const pv = v.pow(pw);
        body = a.eq(ONE) ? fmt(pv) : `${fmt(a)} × ${pv.ge(ZERO) ? fmt(pv) : "(" + fmt(pv) + ")"}`;
      }
      return [c.isNeg(), body];
    });
    steps.push({ title: "Hitung pangkatnya dulu", math: `${lhs} = ${join(pp)}` });
  }

  const values = terms.map(([c, pw]) => c.mul(v.pow(pw)));
  if (terms.length > 1 || terms[0][1] > 0) {
    steps.push({ title: "Kerjakan perkaliannya", math: `${lhs} = ${join(values.map((t) => [t.isNeg(), fmt(t.abs())]))}` });
  }
  const result = values.reduce((s, t) => s.add(t), ZERO);
  if (terms.length > 1) steps.push({ title: "Jumlahkan atau kurangkan", math: `${lhs} = ${fmt(result)}` });

  return {
    expr: pretty(p), x: vs, steps, result: fmt(result), result_value: result.toNumber(),
    summary: `Jadi, ${lhs} = ${fmt(result)}.`,
  };
}

// ---------------------------------------------------------------------------
// Relasi & fungsi
// ---------------------------------------------------------------------------
export function analyzeRelation(domain, codomain, pairs) {
  domain = domain.map(String);
  codomain = codomain.map(String);
  const clean = [];
  for (const pair of pairs) {
    const a = String(pair[0]);
    const b = String(pair[1]);
    if (!domain.includes(a) || !codomain.includes(b)) throw err(`Pasangan (${a}, ${b}) tidak berasal dari kedua himpunan.`);
    if (!clean.some(([x, y]) => x === a && y === b)) clean.push([a, b]);
  }
  const outgoing = Object.fromEntries(domain.map((a) => [a, []]));
  for (const [a, b] of clean) outgoing[a].push(b);
  const problems = [];
  for (const a of domain) {
    const n = outgoing[a].length;
    if (n === 0) problems.push({ element: a, count: 0, message: `${a} tidak punya pasangan sama sekali.` });
    else if (n > 1) problems.push({ element: a, count: n, message: `${a} punya ${n} pasangan (${outgoing[a].join(", ")}).` });
  }
  const used = new Set(clean.map(([, b]) => b));
  return {
    is_function: problems.length === 0, problems, domain, codomain,
    range: codomain.filter((c) => used.has(c)),
    pairs: clean.map((p) => p.slice()),
    pairs_text: "{" + clean.map(([a, b]) => `(${a}, ${b})`).join(", ") + "}",
    rule: "Setiap anggota daerah asal harus punya tepat satu pasangan.",
  };
}

// ---------------------------------------------------------------------------
// Pemeriksaan jawaban
// ---------------------------------------------------------------------------
export function numbersEqual(expected, given, tolerance = 0) {
  const tol = tolerance ? Q.parseDecimal(String(tolerance)) : ZERO;
  return Q.of(expected).sub(Q.of(given)).abs().le(tol);
}

export function expressionsEqual(expected, given) {
  return polyEqual(parseFunction(expected), parseFunction(given));
}

export function diagnoseLinearValue(a, b, x0, answer) {
  a = Q.of(a); b = Q.of(b); x0 = Q.of(x0);
  const y = Q.of(answer);
  if (y.eq(a.mul(x0).sub(b)) || y.eq(a.neg().mul(x0).add(b))) {
    return { error_type: "salah_tanda", message: "Sepertinya ada tanda + / − yang tertukar. Perhatikan tanda di depan setiap angka." };
  }
  if (y.eq(a.add(x0).add(b))) {
    return { error_type: "tidak_dikalikan", message: "Ingat: ax artinya a dikali x. Nilai x harus dikalikan, bukan dijumlahkan." };
  }
  if (y.eq(a.mul(x0)) && !b.isZero()) {
    return { error_type: "lupa_konstanta", message: "Perkaliannya sudah benar, tapi angka tetapnya (konstanta) belum ikut dihitung." };
  }
  if (a.isInt() && x0.isInt() && a.gt(ZERO) && x0.ge(ZERO)) {
    const glued = new Q(BigInt(`${a.n}${x0.n}`));
    if (y.eq(glued.add(b))) return { error_type: "angka_ditempel", message: "2x artinya 2 × x, bukan angka 2 ditempel dengan nilai x." };
  }
  if (!a.eq(ONE) && y.eq(x0.add(b))) {
    return { error_type: "koefisien_hilang", message: "Koefisien di depan x belum dikalikan. Coba ulangi langkah penggantian x." };
  }
  return { error_type: "salah_hitung", message: "Langkahmu mungkin sudah benar, tetapi ada salah hitung. Cek lagi perkalian dan penjumlahannya." };
}
