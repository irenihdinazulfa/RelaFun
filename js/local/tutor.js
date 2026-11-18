// Asisten Belajar RMT untuk versi GitHub Pages (tanpa server, TANPA AI).
// Logika SAMA dengan apps/api/app/core/tutor.py: pemeriksaan deterministik, petunjuk bertingkat,
// pola kesalahan khas, dan 6 tahap Rigorous Mathematical Thinking. DeepSeek hanya ada di versi server
// karena kuncinya wajib disimpan di file .env backend, bukan di peramban.

import { MathInputError, expressionsEqual } from "./mathfn.js";

export const FREE_ID = "bebas";
const MAX_HINT = 3;
const SKIP_AFTER = 3;
const LEADS = ["Hampir!", "Belum tepat, tidak apa-apa.", "Kita periksa lagi, ya."];
const EFFORT_PROMPT = "Sebelum selesai: seberapa berat usaha berpikirmu tadi? Pilih 1–5 di bawah.";

const CONFUSED = new RegExp(
  "^\\s*(aku\\s+|saya\\s+)?(masih\\s+)?(bingung|tidak\\s+tahu|tidak\\s+tau|gak\\s+tau|ga\\s+tau|gatau|gak\\s+tahu|" +
  "ga\\s+tahu|nggak\\s+tahu|nggak\\s+tau|ngga\\s+tau|enggak\\s+tahu|belum\\s+paham|tidak\\s+paham|gak\\s+paham|" +
  "ga\\s+paham|ga\\s+ngerti|gak\\s+ngerti|nggak\\s+ngerti|tidak\\s+mengerti)\\b", "i");
const QUESTION = new RegExp(
  "\\?\\s*$|^\\s*(apa\\s+itu|apa\\s+arti|apa\\s+maksud|apa\\s+sih|kenapa|mengapa|bagaimana|gimana|maksudnya|" +
  "artinya|boleh\\s+tanya)\\b", "i");
const NUM = /[-−–]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[-−–]?\d+(?:,\d+)?(?:\.\d+)?/g;
const THOUSANDS = /^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/;
const EXPR_RUN = /^\s*([0-9x.,+\-−–*×·:/^()\s]+)/;

const phaseNo = (data, id) => data.phases.findIndex((p) => p.id === id) + 1;
export const problem = (data, id) => data.problems.find((p) => p.id === id) || null;

export function publicStep(data, prob, index) {
  const steps = prob.steps;
  if (index >= steps.length) return null;
  const st = steps[index];
  const no = phaseNo(data, st.phase);
  return { index, total: steps.length, phase: st.phase, phase_no: no, phase_name: data.phases[no - 1].name,
    ask: st.ask, cognitive: st.cognitive || [], tool: st.tool || "", terms: st.terms || [] };
}

export function catalog(data) {
  return {
    intro: data.intro, phases: data.phases, terms: data.terms,
    problems: data.problems.map((p) => ({ id: p.id, title: p.title, process: p.process, story: p.story,
      steps: p.steps.length, phases: [...new Set(p.steps.map((s) => phaseNo(data, s.phase)))].sort((a, b) => a - b) })),
  };
}

// ---------------------------------------------------------------------------
// Pemeriksaan deterministik
// ---------------------------------------------------------------------------
export function extractNumbers(text) {
  const out = [];
  for (const m of String(text || "").matchAll(NUM)) {
    let s = m[0].replace(/[−–]/g, "-");
    s = THOUSANDS.test(s) ? s.split(".").join("").replace(",", ".") : s.replace(",", ".");
    out.push(parseFloat(s));
  }
  return out;
}

const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
const hasNumber = (nums, v, useAbs = false) =>
  nums.some((n) => (useAbs ? close(Math.abs(n), Math.abs(v)) : close(n, v)));

export function expressionCandidates(text) {
  const s = String(text || "").toLowerCase().split("rp").join("");
  const parts = s.split("=");
  const pieces = parts.length > 1 ? parts.slice(1) : parts;
  const out = [];
  for (const piece of pieces) {
    const m = EXPR_RUN.exec(piece);
    if (!m) continue;
    const seg = m[1].trim().replace(/[ ,.+\-−–*×·:/^(]+$/, "").trim();
    if (seg && !out.includes(seg)) out.push(seg);
  }
  return out;
}

function exprEqual(expected, given) {
  try { return expressionsEqual(expected, given); } catch (e) { if (e instanceof MathInputError) return false; throw e; }
}
const parses = (seg) => { try { expressionsEqual("x", seg); return true; } catch (e) { if (e instanceof MathInputError) return false; throw e; } };

function commonNote(step, text, nums, segs) {
  for (const c of step.common || []) {
    if ("value" in c && hasNumber(nums, Number(c.value))) return c.msg;
    if ("pattern" in c && new RegExp(c.pattern, "i").test(text)) return c.msg;
    if ("expr" in c && segs.some((s) => exprEqual(c.expr, s))) return c.msg;
  }
  return null;
}

export function checkStep(step, rawText) {
  const spec = step.check;
  const text = String(rawText || "").trim();
  const nums = extractNumbers(text);
  const segs = spec.type === "expression" || (step.common || []).some((c) => "expr" in c) ? expressionCandidates(text) : [];
  let ok = false;
  let note = null;
  if (spec.type === "numbers") {
    const values = spec.values;
    const need = Math.min(spec.min ?? values.length, values.length);
    const found = values.filter((v) => hasNumber(nums, Number(v), !!spec.abs)).length;
    ok = found >= need;
    if (!ok) note = `Aku menemukan ${found} dari ${need} angka penting yang dibutuhkan langkah ini.`;
  } else if (spec.type === "expression") {
    const withX = segs.filter((s) => s.includes("x"));
    ok = withX.some((s) => exprEqual(spec.answer, s));
    if (!ok) {
      if (!withX.length) {
        note = nums.length
          ? "Kamu menulis angka, bukan rumus. Rumus fungsi memakai x supaya berlaku untuk berapa pun nilainya."
          : "Tulis rumusnya memakai x, misalnya 2.000x + 500.";
      } else if (!withX.some(parses)) {
        note = "Rumusnya belum bisa kubaca. Contoh penulisan: 2.000x + 500.";
      }
    }
  } else if (spec.type === "keywords") {
    ok = spec.any.some((p) => new RegExp(p, "i").test(text));
  } else if (spec.type === "groups") {
    const need = Math.min(spec.min ?? spec.groups.length, spec.groups.length);
    const found = spec.groups.filter((g) => new RegExp(g, "i").test(text)).length;
    ok = found >= need;
    if (!ok && found) note = `Jawabanmu sudah memuat ${found} dari ${need} bagian penting.`;
  } else if (spec.type === "free") {
    ok = (text.match(/[\p{L}\p{N}_]+/gu) || []).length >= (spec.min_words ?? 1);
    if (!ok) note = "Ceritakan sedikit lebih panjang, ya.";
  } else {
    throw new Error(`Jenis pemeriksaan tidak dikenal: ${spec.type}`);
  }
  if (!ok) note = commonNote(step, text, nums, segs) || note;
  return { ok, note };
}

// Penjaga jawaban (dipakai versi server untuk balasan AI; di sini untuk uji silang).
const normalize = (t) => String(t || "").toLowerCase().replace(/[−–]/g, "-").split("rp").join("")
  .replace(/\s+/g, "").split(".").join("").split("×x").join("x").split("*x").join("x").split("·x").join("x");
export function leaks(reply, prob, fromIndex) {
  const nums = extractNumbers(reply);
  const norm = normalize(reply);
  return prob.steps.slice(fromIndex).some((st) => {
    const rev = st.reveal || {};
    return (rev.numbers || []).some((v) => hasNumber(nums, Number(v))) || (rev.text || []).some((t) => norm.includes(normalize(t)));
  });
}

// ---------------------------------------------------------------------------
// Satu giliran percakapan (tanpa AI)
// ---------------------------------------------------------------------------
function transition(data, prob, index, prevPhase) {
  const steps = prob.steps;
  if (index >= steps.length) return `${prob.closing}\n\n${EFFORT_PROMPT}`;
  const st = steps[index];
  if (st.phase !== prevPhase) {
    const no = phaseNo(data, st.phase);
    return `**Tahap ${no} · ${data.phases[no - 1].name}.** ${st.ask}`;
  }
  return st.ask;
}

function matchTerm(data, message) {
  const low = String(message || "").toLowerCase();
  return [...data.terms].sort((a, b) => b.term.length - a.term.length).find((t) => low.includes(t.term.toLowerCase())) || null;
}
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export class TutorInputError extends Error {}

export function turn(data, req) {
  const prob = problem(data, req.problem_id || "");
  if (!prob) throw new TutorInputError("Soal tidak ditemukan.");
  const steps = prob.steps;
  const n = steps.length;
  const step = Math.max(0, Math.min(parseInt(req.step || 0, 10), n));
  let attempts = Math.max(0, parseInt(req.attempts || 0, 10));
  let hint = Math.max(0, Math.min(parseInt(req.hint || 0, 10), MAX_HINT));
  let action = req.action || "answer";
  const message = String(req.message || "").trim().slice(0, 600);
  const out = { ok: null, skipped: false, source: "script" };
  const finish = (reply, newStep, newAttempts, newHint) => Object.assign(out, {
    reply, step: newStep, attempts: newAttempts, hint: newHint,
    can_skip: newStep < n && newAttempts >= SKIP_AFTER, done: newStep >= n, current: publicStep(data, prob, newStep),
  });

  if (action === "start") return finish(`${data.intro}\n\n${transition(data, prob, 0, null)}`, 0, 0, 0);
  if (step >= n) return finish(`${prob.closing}\n\n${EFFORT_PROMPT}`, n, 0, 0);

  const cur = steps[step];
  if (action === "next") {
    if (attempts < SKIP_AFTER) throw new TutorInputError("Coba dulu minimal 3 kali sebelum melanjutkan, ya.");
    out.skipped = true;
    return finish("Tidak apa-apa, kita lanjut dulu. Nanti kamu bisa mencoba bagian ini lagi.\n\n" +
      transition(data, prob, step + 1, cur.phase), step + 1, 0, 0);
  }
  if (action === "hint" || (action === "answer" && CONFUSED.test(message))) {
    hint = Math.min(hint + 1, MAX_HINT);
    return finish(cur.hints[hint - 1], step, attempts, hint);
  }
  if (action === "answer") {
    if (!message) throw new TutorInputError("Tulis jawabanmu dulu, ya.");
    const res = checkStep(cur, message);
    if (res.ok) {
      out.ok = true;
      return finish(`${cur.ok}\n\n${transition(data, prob, step + 1, cur.phase)}`, step + 1, 0, 0);
    }
    if (!QUESTION.test(message)) {
      out.ok = false;
      attempts += 1;
      hint = Math.max(hint, Math.min(attempts, MAX_HINT));
      const reply = `${LEADS[(attempts - 1) % LEADS.length]} ${res.note ? `${res.note} ` : ""}${cur.hints[hint - 1]}`;
      return finish(reply, step, attempts, hint);
    }
    action = "ask";
  }
  if (action === "ask") {
    if (!message) throw new TutorInputError("Tulis pertanyaanmu dulu, ya.");
    const term = matchTerm(data, message);
    const answer = term
      ? `**${capitalize(term.term)}**: ${term.simple} Contoh: ${term.example}.`
      : `Pertanyaan bagus! ${cur.hints[Math.max(hint, 1) - 1]}`;
    return finish(`${answer}\n\nKembali ke langkah kita: ${cur.ask}`, step, attempts, hint);
  }
  throw new TutorInputError("Aksi tidak dikenal.");
}
