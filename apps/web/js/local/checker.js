// Pemeriksa jawaban versi JavaScript — padanan apps/api/app/core/checker.py.

import { Q, ZERO } from "./rational.js";
import {
  MathInputError, analyzeRelation, diagnoseLinearValue, expressionsEqual, fmt, numbersEqual,
  parseFunction, parseNumber, polyEval, polyTerms, pretty,
} from "./mathfn.js";

export const ERROR_LABELS = {
  salah_tanda: "Tanda + / − tertukar",
  tidak_dikalikan: "x dijumlahkan, bukan dikalikan",
  lupa_konstanta: "Lupa konstanta (b)",
  angka_ditempel: "Angka ditempel (2x dibaca 2 dan x)",
  koefisien_hilang: "Koefisien x terlewat",
  salah_hitung: "Salah hitung",
  konversi_waktu: "Salah konversi waktu",
  salah_tafsir: "Salah menafsirkan hasil",
  fungsi_bukan_fungsi: "Tertukar fungsi / bukan fungsi",
  domain_kodomain_range: "Tertukar domain/kodomain/range",
  pasangan_salah: "Pasangan panah salah",
  rumus_salah: "Rumus fungsi salah",
  a_b_tertukar: "Nilai a dan b tertukar",
  notasi: "Penulisan notasi f(…) kurang tepat",
  konsep: "Konsep belum tepat",
  format: "Format jawaban",
};

const result = (correct, feedback, errorType = null, extra = {}) =>
  ({ correct, feedback, error_type: correct ? null : errorType, ...extra });

export function correctAnswerText(item) {
  switch (item.type) {
    case "mcq": return item.options[item.answer];
    case "multi": return item.answer.map((i) => item.options[i]).join(", ");
    case "numeric": return fmt(parseNumber(item.answer)) + (item.unit ? ` ${item.unit}` : "");
    case "is_function": return item.answer ? "Fungsi" : "Bukan fungsi";
    case "dnd": {
      const labels = Object.fromEntries(item.chips.map((c) => [c.id, c.label]));
      const bins = Object.fromEntries(item.bins.map((b) => [b.id, b.label]));
      return Object.entries(item.answer).map(([c, b]) => `${labels[c]} → ${bins[b]}`).join("; ");
    }
    case "arrows": return "{" + item.answer_pairs.map(([a, b]) => `(${a}, ${b})`).join(", ") + "}";
    case "expression": return `${item.name || "f"}(x) = ${pretty(parseFunction(item.answer))}`;
    default: return "";
  }
}

export function check(item, answer) {
  try {
    switch (item.type) {
      case "mcq": return checkMcq(item, answer);
      case "multi": return checkMulti(item, answer);
      case "numeric": return checkNumeric(item, answer);
      case "is_function": return checkIsFunction(item, answer);
      case "dnd": return checkDnd(item, answer);
      case "arrows": return checkArrows(item, answer);
      case "expression": return checkExpression(item, answer);
      default: throw new Error(`Jenis soal tidak dikenal: ${item.type}`);
    }
  } catch (e) {
    if (e instanceof MathInputError) return result(false, e.message, "format", { retry_free: true });
    throw e;
  }
}

function checkMcq(item, answer) {
  const idx = Number(answer);
  if (answer === null || answer === undefined || answer === "" || !Number.isInteger(idx)) {
    return result(false, "Pilih salah satu jawaban dulu.", "format", { retry_free: true });
  }
  if (idx === item.answer) return result(true, "Benar!");
  const fb = (item.option_feedback || {})[String(idx)] || "Belum tepat. Baca lagi pertanyaannya pelan-pelan.";
  return result(false, fb, item.error_type || "konsep");
}

function checkMulti(item, answer) {
  const chosen = new Set((answer || []).map(Number));
  const expected = new Set(item.answer);
  const same = chosen.size === expected.size && [...chosen].every((x) => expected.has(x));
  if (same) return result(true, "Benar, semua pilihanmu tepat!");
  const missing = [...expected].filter((x) => !chosen.has(x));
  const extra = [...chosen].filter((x) => !expected.has(x));
  const parts = [];
  if (missing.length) parts.push(`masih ada ${missing.length} jawaban benar yang belum dipilih`);
  if (extra.length) parts.push(`ada ${extra.length} pilihan yang seharusnya tidak dipilih`);
  const text = parts.join(" dan ");
  return result(false, "Hampir! " + text.charAt(0).toUpperCase() + text.slice(1) + ".", item.error_type || "konsep");
}

function checkNumeric(item, answer) {
  const given = parseNumber(String(answer ?? ""));
  const expected = parseNumber(item.answer);
  if (numbersEqual(expected, given, item.tolerance || 0)) return result(true, "Benar!");
  for (const ce of item.common_errors || []) {
    if (numbersEqual(parseNumber(ce.value), given, ce.tolerance || 0)) return result(false, ce.message, ce.type || "salah_hitung");
  }
  if (item.linear) {
    const d = diagnoseLinearValue(item.linear.a, item.linear.b, parseNumber(String(item.linear.x)), given);
    return result(false, d.message, d.error_type);
  }
  return result(false, "Belum tepat. Coba periksa lagi langkah hitungmu.", item.error_type || "salah_hitung");
}

function checkIsFunction(item, answer) {
  const d = item.diagram;
  const an = analyzeRelation(d.domain, d.codomain, d.pairs);
  if (typeof answer === "string") answer = ["true", "ya", "fungsi", "1"].includes(answer.toLowerCase());
  const given = !!answer;
  const highlight = an.problems.map((p) => p.element);
  if (given === an.is_function) {
    const fb = an.is_function
      ? "Benar! Setiap anggota daerah asal punya tepat satu pasangan, jadi ini fungsi."
      : "Benar, ini bukan fungsi. " + an.problems.map((p) => p.message).join(" ");
    return result(true, fb, null, { highlight });
  }
  const fb = an.is_function
    ? "Coba cek satu per satu dari kiri: setiap anggota punya tepat satu panah. Boleh saja dua anggota menunjuk ke pasangan yang sama — itu tetap fungsi."
    : "Perhatikan lagi: " + an.problems.map((p) => p.message).join(" ") + " Fungsi mensyaratkan setiap anggota punya tepat satu pasangan.";
  return result(false, fb, "fungsi_bukan_fungsi", { highlight });
}

function checkDnd(item, answer) {
  answer = answer || {};
  const expected = item.answer;
  const unplaced = Object.keys(expected).filter((c) => !(c in answer));
  if (unplaced.length) return result(false, "Masih ada kartu yang belum ditempatkan.", "format", { retry_free: true, wrong: unplaced });
  const wrong = Object.entries(expected).filter(([c, b]) => answer[c] !== b).map(([c]) => c);
  if (!wrong.length) return result(true, "Benar, semua kartu sudah di tempat yang tepat!");
  const fb = item.wrong_feedback || `Ada ${wrong.length} kartu yang belum tepat. Kartu itu ditandai merah.`;
  return result(false, fb, item.error_type || "domain_kodomain_range", { wrong });
}

function checkArrows(item, answer) {
  const key = (a, b) => `${a}|${b}`;
  const given = new Set((answer || []).map(([a, b]) => key(String(a), String(b))));
  const expected = new Set(item.answer_pairs.map(([a, b]) => key(String(a), String(b))));
  const extra = [...given].filter((k) => !expected.has(k)).sort();
  const missing = [...expected].filter((k) => !given.has(k));
  if (!extra.length && !missing.length) return result(true, "Benar, semua panahnya tepat!");
  const msgs = [];
  if (extra.length) msgs.push("Panah " + extra.map((k) => k.replace("|", " → ")).join(", ") + " belum sesuai aturan.");
  if (missing.length) msgs.push(`Masih ada ${missing.length} panah yang belum dibuat.`);
  if (item.must_be_function) {
    try {
      const an = analyzeRelation(item.diagram.domain, item.diagram.codomain, [...given].sort().map((k) => k.split("|")));
      if (!an.is_function) msgs.push("Ingat, setiap anggota harus punya tepat satu panah.");
    } catch { /* abaikan */ }
  }
  return result(false, msgs.join(" "), "pasangan_salah", { wrong: extra });
}

function linearAb(p) {
  const terms = polyTerms(p);
  if (terms.some(([, pw]) => pw > 1)) return null;
  const a = terms.find(([, pw]) => pw === 1)?.[0] || ZERO;
  const b = terms.find(([, pw]) => pw === 0)?.[0] || ZERO;
  return [a, b];
}

function checkExpression(item, answer) {
  const givenP = parseFunction(String(answer ?? ""));
  if (expressionsEqual(item.answer, String(answer))) return result(true, `Benar! ${item.name || "f"}(x) = ${pretty(givenP)}`);
  const expP = parseFunction(item.answer);
  const e = linearAb(expP);
  const g = linearAb(givenP);
  if (e && g) {
    const [ea, eb] = e;
    const [ga, gb] = g;
    if (ga.eq(eb) && gb.eq(ea)) return result(false, "Nilai a dan b tertukar. a adalah angka yang dikalikan x, b adalah angka tetap.", "a_b_tertukar");
    if (ga.eq(ea) && !gb.eq(eb)) return result(false, "Bagian yang dikali x (a) sudah benar. Cek lagi angka tetapnya (b): berapa nilai fungsi saat x = 0?", "rumus_salah");
    if (gb.eq(eb) && !ga.eq(ea)) return result(false, "Angka tetapnya (b) sudah benar. Cek lagi perubahannya (a): bertambah berapa setiap x naik 1?", "rumus_salah");
  }
  if (item.check_points) {
    const bad = item.check_points.filter((px) => !polyEval(givenP, Q.parseDecimal(String(px))).eq(polyEval(expP, Q.parseDecimal(String(px)))));
    if (bad.length) return result(false, `Coba masukkan x = ${fmt(Q.parseDecimal(String(bad[0])))} ke rumusmu. Apakah hasilnya sama dengan tabel?`, "rumus_salah");
  }
  return result(false, "Rumusnya belum tepat. Cari dulu nilai tetap (b), lalu perubahan per satu x (a).", "rumus_salah");
}
