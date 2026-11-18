// Pembuat soal acak untuk game "Lompat Wen".
// Setiap soal: { kind, prompt, visual?, options: [teks], answer: indeks, explain }.
// Semua angka dihitung & diformat dengan mesin hitung RelaFun (js/local/mathfn.js).

import { Q } from "../local/rational.js";
import { analyzeRelation, evaluateSteps, fmt, linearPoly, pretty } from "../local/mathfn.js";

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const nonZero = (a, b) => { let v = 0; while (v === 0) v = ri(a, b); return v; };
const num = (n) => fmt(Q.of(n));
const money = (n) => (n < 0 ? "−Rp" + fmt(Q.of(-n)) : "Rp" + fmt(Q.of(n)));
const setText = (arr) => "{" + arr.join(", ") + "}";
const formula = (name, a, b) => `${name}(x) = ${pretty(linearPoly(a, b))}`;

/** Susun pilihan jawaban unik (benar + pengecoh), diacak. */
function choices(correct, distractors, filler, size = 4) {
  const opts = [correct];
  for (const d of distractors) if (d !== undefined && d !== null && !opts.includes(d) && opts.length < size) opts.push(d);
  let guard = 0;
  while (opts.length < size && filler && guard++ < 50) {
    const f = filler();
    if (!opts.includes(f)) opts.push(f);
  }
  const shuffled = shuffle(opts);
  return { options: shuffled, answer: shuffled.indexOf(correct) };
}

function stepsText(name, a, b, x) {
  const ev = evaluateSteps(linearPoly(a, b), Q.of(x), name);
  const rhs = ev.steps.slice(1).map((s) => s.math.split(" = ").slice(1).join(" = "));
  return `${name}(${num(x)}) = ${rhs.join(" = ")}`;
}

// ---------------------------------------------------------------------------
// Jenis soal
// ---------------------------------------------------------------------------
const THEMES = [
  { left: "A", right: "B", dom: ["1", "2", "3", "4"], cod: ["a", "b", "c", "d"] },
  { left: "P", right: "Q", dom: ["p", "q", "r", "s"], cod: ["1", "2", "3", "4"] },
  { left: "Teman", right: "Warna kesukaan", dom: ["Ani", "Budi", "Citra", "Dodi"], cod: ["Merah", "Biru", "Hijau", "Kuning"] },
  { left: "Siswa", right: "Ekskul", dom: ["Rina", "Tono", "Sari", "Joko"], cod: ["Futsal", "Tari", "Pramuka", "Musik"] },
];

function randomRelation(nDom, nCod, makeFunction, theme = pick(THEMES)) {
  const dom = theme.dom.slice(0, nDom);
  const cod = theme.cod.slice(0, nCod);
  const pairs = dom.map((d) => [d, pick(cod)]);
  if (!makeFunction) {
    if (Math.random() < 0.5) {
      pairs.splice(ri(0, pairs.length - 1), 1);                   // ada anggota tanpa pasangan
    } else {
      const k = ri(0, pairs.length - 1);                          // ada anggota dengan 2 pasangan
      const other = cod.filter((c) => c !== pairs[k][1]);
      pairs.splice(k + 1, 0, [pairs[k][0], pick(other)]);
    }
  }
  return { left_label: theme.left, right_label: theme.right, domain: dom, codomain: cod, pairs };
}

function relationExplain(d) {
  const an = analyzeRelation(d.domain, d.codomain, d.pairs);
  return an.is_function
    ? "Setiap anggota kiri punya tepat satu pasangan, jadi ini fungsi."
    : "Bukan fungsi: " + an.problems.map((p) => p.message).join(" ");
}

function qFungsiDiagram(level) {
  const d = randomRelation(level === 1 ? 3 : 4, level === 1 ? 3 : 4, Math.random() < 0.5);
  const isF = analyzeRelation(d.domain, d.codomain, d.pairs).is_function;
  return { kind: "fungsi-diagram", prompt: "Apakah relasi ini fungsi?", visual: { type: "diagram", diagram: d },
    options: ["Fungsi", "Bukan fungsi"], answer: isF ? 0 : 1, explain: relationExplain(d),
    check: { type: "relation", d, isF } };
}

function qFungsiPasangan(level) {
  const d = randomRelation(level === 1 ? 3 : 4, 4, Math.random() < 0.5, THEMES[0]);
  const isF = analyzeRelation(d.domain, d.codomain, d.pairs).is_function;
  return { kind: "fungsi-pasangan", prompt: `Himpunan asal A = ${setText(d.domain)}. Apakah relasi ini fungsi?`,
    visual: { type: "text", text: setText(d.pairs.map(([a, b]) => `(${a}, ${b})`)) },
    options: ["Fungsi", "Bukan fungsi"], answer: isF ? 0 : 1, explain: relationExplain(d),
    check: { type: "relation", d, isF } };
}

function qNilai(level) {
  let a; let b; let x;
  if (level === 1) { a = ri(1, 5); b = ri(0, 9); x = ri(1, 5); }
  else if (level === 2) { a = nonZero(-6, 6); b = ri(-10, 10); x = ri(-4, 5); }
  else { a = nonZero(-6, 8); b = ri(-12, 12); x = pick([0.5, 1.5, 2.5, -0.5, -1.5, 3.5]); }
  const name = pick(["f", "g", "h"]);
  const y = Q.of(a).mul(Q.of(x)).add(Q.of(b));
  const ax = Q.of(a).mul(Q.of(x));
  const correct = num(y);
  const ds = [
    b !== 0 ? num(ax.sub(Q.of(b))) : null,                  // salah tanda
    num(ax.neg().add(Q.of(b))),                             // salah tanda
    b !== 0 ? num(ax) : null,                               // lupa konstanta
    num(Q.of(a).add(Q.of(x)).add(Q.of(b))),                 // tidak dikalikan
    a > 0 && Number.isInteger(x) && x >= 0 ? num(Number(`${a}${x}`) + b) : null,  // angka ditempel
  ];
  const c = choices(correct, shuffle(ds), () => num(y.add(Q.of(nonZero(-3, 3)))));
  return { kind: "nilai", prompt: `${formula(name, a, b)}. Berapa ${name}(${num(x)})?`, ...c,
    explain: stepsText(name, a, b, x), check: { type: "eval", a, b, x } };
}

function qPasanganRelasi() {
  const rules = [
    { name: "setengah dari", f: (k) => 2 * k },
    { name: "satu kurangnya dari", f: (k) => k + 1 },
    { name: "dua kurangnya dari", f: (k) => k + 2 },
    { name: "sepertiga dari", f: (k) => 3 * k },
  ];
  const r = pick(rules);
  const k = ri(1, 6);
  const correct = `(${k}, ${r.f(k)})`;
  const ds = [`(${r.f(k)}, ${k})`, `(${k}, ${r.f(k) + 1})`, `(${k}, ${r.f(k) - 1})`, `(${k + 1}, ${r.f(k)})`];
  const c = choices(correct, shuffle(ds).filter((t) => t !== correct));
  return { kind: "pasangan", prompt: `Relasi “${r.name}” dari A ke B. Pasangan mana yang benar?`, ...c,
    explain: `${k} ${r.name} ${r.f(k)}, jadi pasangannya ${correct}. Angka pertama selalu dari himpunan asal.`,
    check: { type: "rule", k, y: r.f(k) } };
}

const TERMS = [
  ["Daerah asal disebut juga …", "Domain"],
  ["Daerah kawan disebut juga …", "Kodomain"],
  ["Daerah hasil disebut juga …", "Range"],
  ["Anggota kanan yang kena panah termasuk …", "Range"],
  ["Semua anggota himpunan kiri disebut …", "Domain"],
  ["Jika f(3) = 7, maka 7 disebut …", "Bayangan dari 3"],
  ["Relasi yang setiap anggota asalnya punya tepat satu pasangan disebut …", "Fungsi"],
  ["Nama lain fungsi adalah …", "Pemetaan"],
];
function qIstilah() {
  const [p, ans] = pick(TERMS);
  const pool = ["Domain", "Kodomain", "Range", "Bayangan dari 3", "Fungsi", "Pemetaan", "Relasi"];
  const c = choices(ans, shuffle(pool.filter((t) => t !== ans)));
  return { kind: "istilah", prompt: p, ...c, explain: `Jawabannya: ${ans}.`, check: { type: "term", p, ans } };
}

function qRange(level) {
  const n = level >= 3 ? 4 : 3;
  const dom = ["1", "2", "3", "4"].slice(0, n);
  const cod = ["a", "b", "c", "d"];
  const pairs = dom.map((d) => [d, pick(cod)]);
  const used = cod.filter((c) => pairs.some((p) => p[1] === c));
  const askDomain = Math.random() < 0.25;
  const correct = askDomain ? setText(dom) : setText(used);
  const ds = askDomain
    ? [setText(cod), setText(used), setText(dom.slice(0, -1))]
    : [setText(cod), setText(dom), used.length > 1 ? setText(used.slice(0, -1)) : setText(cod.filter((c) => !used.includes(c)).slice(0, 2))];
  const c = choices(correct, ds.filter((t) => t !== correct), () => setText(shuffle(cod).slice(0, ri(1, 3)).sort()));
  return { kind: "range", prompt: `Fungsi dari A = ${setText(dom)} ke B = ${setText(cod)}. ${askDomain ? "Domain" : "Range"}-nya adalah …`,
    visual: { type: "text", text: setText(pairs.map(([x, y]) => `(${x}, ${y})`)) }, ...c,
    explain: askDomain ? `Domain = semua anggota asal = ${setText(dom)}.` : `Range = anggota B yang dipakai sebagai pasangan = ${setText(used)}.`,
    check: { type: "range", askDomain, dom, used } };
}

function qRumusTabel() {
  const a = nonZero(-4, 5);
  let b = ri(-6, 9);
  if (b === a) b += 1;
  const xs = [0, 1, 2, 3];
  const ys = xs.map((x) => a * x + b);
  const correct = formula("f", a, b);
  const ds = [formula("f", b === 0 ? a + 1 : b, a), formula("f", a, b + a), formula("f", a + 1, b), formula("f", a, b - 1), formula("f", -a, b)];
  const c = choices(correct, shuffle(ds).filter((t) => t !== correct));
  return { kind: "rumus", prompt: "Rumus fungsi yang sesuai tabel ini adalah …",
    visual: { type: "table", headers: ["x", ...xs.map(String)], rows: [["f(x)", ...ys.map(num)]] }, ...c,
    explain: `Saat x = 0, nilainya ${num(b)} → b = ${num(b)}. Setiap x naik 1, nilainya ${a > 0 ? "naik" : "turun"} ${num(Math.abs(a))} → a = ${num(a)}.`,
    check: { type: "formula", a, b, xs, ys } };
}

function qCariX() {
  const a = nonZero(-5, 6);
  const b = ri(-10, 12);
  const k = ri(-3, 7);
  const y = a * k + b;
  const correct = num(k);
  const c = choices(correct, shuffle([num(k + 1), num(k - 1), num(y), num(-k)]).filter((t) => t !== correct), () => num(k + nonZero(-4, 4)));
  return { kind: "cari-x", prompt: `${formula("f", a, b)}. Jika f(k) = ${num(y)}, berapa nilai k?`, ...c,
    explain: `${num(a)}k ${b < 0 ? "−" : "+"} ${num(Math.abs(b))} = ${num(y)} → ${num(a)}k = ${num(y - b)} → k = ${num(k)}.`,
    check: { type: "solve", a, b, y, k } };
}

function qCerita() {
  const ctx = pick([
    { what: "Tarif ojek", start: "saat mulai", per: "per km", unit: "km", b: pick([3000, 5000, 6000]), a: pick([2000, 2500, 3000]) },
    { what: "Tarif taksi", start: "buka pintu", per: "per km", unit: "km", b: pick([7000, 8000, 9000]), a: pick([4000, 4500, 5000]) },
    { what: "Sewa sepeda", start: "biaya awal", per: "per jam", unit: "jam", b: pick([5000, 10000]), a: pick([3000, 4000, 5000]) },
  ]);
  const x = ri(2, 9);
  const total = ctx.a * x + ctx.b;
  const correct = money(total);
  const ds = [money(ctx.a * x), money(ctx.b * x + ctx.a), money(ctx.a + ctx.b), money(total + ctx.a)];
  const c = choices(correct, shuffle(ds).filter((t) => t !== correct));
  return { kind: "cerita", prompt: `${ctx.what}: ${money(ctx.b)} ${ctx.start}, lalu ${money(ctx.a)} ${ctx.per}. Berapa biaya untuk ${x} ${ctx.unit}?`, ...c,
    explain: `f(x) = ${num(ctx.a)}x + ${num(ctx.b)} → f(${x}) = ${num(ctx.a * x)} + ${num(ctx.b)} = ${money(total)}.`,
    check: { type: "eval", a: ctx.a, b: ctx.b, x, money: true } };
}

// ---------------------------------------------------------------------------
// Level
// ---------------------------------------------------------------------------
export const LEVELS = [
  { id: 1, name: "Padang Wortel", difficulty: "Mudah", emoji: "🥕",
    desc: "Fungsi atau bukan, nilai fungsi, pasangan relasi, istilah.",
    gens: [() => qFungsiDiagram(1), () => qNilai(1), qPasanganRelasi, qIstilah, () => qFungsiPasangan(1)] },
  { id: 2, name: "Hutan Panah", difficulty: "Sedang", emoji: "🌳",
    desc: "Bilangan negatif, domain & range, pasangan berurutan.",
    gens: [() => qFungsiDiagram(2), () => qFungsiPasangan(2), () => qNilai(2), () => qRange(2), qIstilah] },
  { id: 3, name: "Gunung Fungsi", difficulty: "Sulit", emoji: "⛰️",
    desc: "Rumus dari tabel, mencari x, desimal, soal cerita.",
    gens: [() => qNilai(3), qRumusTabel, qCariX, qCerita, () => qRange(3)] },
];

/** 10 soal acak untuk satu permainan; jenis soal bergiliran agar bervariasi. */
export function makeRound(levelId, n = 10) {
  const level = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const out = [];
  let order = [];
  while (out.length < n) {
    if (!order.length) order = shuffle(level.gens);
    const q = order.pop()();
    if (out.length && out[out.length - 1].prompt === q.prompt) continue;
    out.push(q);
  }
  return out;
}

export const _gen = { qFungsiDiagram, qFungsiPasangan, qNilai, qPasanganRelasi, qIstilah, qRange, qRumusTabel, qCariX, qCerita };
