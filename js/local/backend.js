// "Server" di dalam peramban untuk mode tanpa server (GitHub Pages).
// Meniru endpoint FastAPI di apps/api/app/routers/*.py; data disimpan di localStorage perangkat.

import { ApiError } from "../errors.js";
import { check, correctAnswerText, ERROR_LABELS } from "./checker.js";
import { MathInputError, analyzeRelation, evaluateSteps } from "./mathfn.js";
import { normalizeSpec, solve, SpecError, verifySpec } from "./modeler.js";
import { AIUnavailable, extractModel, getKey, toSpec } from "./ai.js";

const DB_KEY = "rf_db_v1";
const POINTS_FIRST_TRY = 10;
const POINTS_RETRY = 5;
const DAILY_GOAL = 5;
const AI_DAILY_QUOTA = 10;
const SECRET_FIELDS = new Set(["answer", "answer_pairs", "common_errors", "linear", "explain", "option_feedback", "tolerance"]);

// ---------------------------------------------------------------------------
// Konten (JSON statis)
// ---------------------------------------------------------------------------
let contentPromise = null;
function loadContent() {
  if (!contentPromise) {
    contentPromise = (async () => {
      const get = async (p) => {
        const res = await fetch(p);
        if (!res.ok) throw new ApiError("Materi gagal dimuat. Periksa koneksi internet.", 503);
        return res.json();
      };
      const manifest = await get("content/manifest.json");
      const modules = await Promise.all(manifest.modules.map((f) => get(`content/modules/${f}`)));
      modules.sort((a, b) => a.order - b.order);
      const [glossary, presets] = await Promise.all([get("content/glossary.json"), get("content/modeler_presets.json")]);
      return { modules, byId: Object.fromEntries(modules.map((m) => [m.id, m])), glossary, presets };
    })().catch((e) => { contentPromise = null; throw e; });
  }
  return contentPromise;
}

const publicItem = (it) => Object.fromEntries(Object.entries(it).filter(([k]) => !SECRET_FIELDS.has(k)));
function moduleSummary(m) {
  const out = {};
  for (const k of ["id", "order", "group", "title", "subtitle", "icon", "minutes", "interview_codes", "objectives"]) out[k] = m[k] ?? null;
  out.item_count = (m.items || []).length;
  out.step_count = (m.steps || []).length;
  return out;
}

// ---------------------------------------------------------------------------
// Penyimpanan
// ---------------------------------------------------------------------------
async function hash(username, password) {
  const text = `relafun:${username}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `fnv${(h >>> 0).toString(16)}`;
}

let db = null;
function saveDb() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* penyimpanan penuh/privat */ } }

async function loadDb() {
  if (db) return db;
  try { db = JSON.parse(localStorage.getItem(DB_KEY) || "null"); } catch { db = null; }
  if (!db || !Array.isArray(db.users)) {
    db = { seq: 1, users: [], classes: [], attempts: [], progress: {}, daily: {} };
    // Data demo (sama dengan apps/api/app/seed.py)
    const guru = await newUser("guru", "guru123", "teacher", "Bu Guru Demo", null);
    const cls = { id: nextId(), name: "8A (Demo)", code: "RF8A26", teacher_id: guru.id, leaderboard_enabled: true, ai_enabled: false };
    db.classes.push(cls);
    guru.class_id = cls.id;
    await newUser("siswa", "siswa123", "student", "Sobat", cls.id);
    const mates = [["Bintang", 120], ["Cahya", 90], ["Damar", 60], ["Elok", 30]];
    for (let i = 0; i < mates.length; i++) {
      const u = await newUser(`demo${i + 1}`, `demo${i + 1}pass`, "student", mates[i][0], cls.id);
      u.points = mates[i][1];
    }
    saveDb();
  }
  // Migrasi: nama panggilan demo lama "Siswa Demo" → "Sobat"
  const demo = db.users.find((u) => u.username === "siswa" && u.nickname === "Siswa Demo");
  if (demo) { demo.nickname = "Sobat"; saveDb(); }
  return db;
}

function nextId() { return db.seq++; }
async function newUser(username, password, role, nickname, classId) {
  const u = { id: nextId(), username, password_hash: await hash(username, password), role, nickname,
    class_id: classId, points: 0, streak: 0, last_active_date: null, created_at: new Date().toISOString() };
  db.users.push(u);
  return u;
}

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoDate(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return isoDate(d); };

const classOf = (u) => db.classes.find((c) => c.id === u.class_id) || null;
function userOut(u) {
  const c = classOf(u);
  return { id: u.id, username: u.username, nickname: u.nickname, role: u.role,
    class: c ? { id: c.id, name: c.name, code: c.code, leaderboard_enabled: c.leaderboard_enabled, ai_enabled: c.ai_enabled } : null };
}

function currentUser(token) {
  const m = /^local:(\d+)$/.exec(token || "");
  const u = m && db.users.find((x) => x.id === Number(m[1]));
  if (!u) throw new ApiError(token ? "Sesi berakhir. Silakan masuk lagi." : "Silakan masuk terlebih dahulu.", 401);
  return u;
}
function requireTeacher(token) {
  const u = currentUser(token);
  if (u.role !== "teacher") throw new ApiError("Halaman ini khusus guru.", 403);
  return u;
}

function daily(u) {
  const key = `${u.id}|${today()}`;
  if (!db.daily[key]) db.daily[key] = { correct_count: 0, points: 0, ai_calls: 0 };
  return db.daily[key];
}
function currentStreak(u) {
  if (!u.last_active_date) return 0;
  return [today(), yesterday()].includes(u.last_active_date) ? u.streak : 0;
}

function recordAttempt(u, moduleId, itemId, correct, errorType, answer) {
  const prior = db.attempts.filter((a) => a.user_id === u.id && a.item_id === itemId);
  const alreadySolved = prior.some((a) => a.correct);
  let points = 0;
  if (correct && !alreadySolved) points = prior.length ? POINTS_RETRY : POINTS_FIRST_TRY;
  db.attempts.push({ id: nextId(), user_id: u.id, module_id: moduleId, item_id: itemId, correct, error_type: errorType,
    answer: String(answer).slice(0, 500), points, created_at: new Date().toISOString() });
  const st = daily(u);
  if (correct && !alreadySolved) {
    st.correct_count += 1;
    st.points += points;
    u.points += points;
    if (u.last_active_date !== today()) {
      u.streak = u.last_active_date === yesterday() ? u.streak + 1 : 1;
      u.last_active_date = today();
    }
  }
  saveDb();
  return { points_awarded: points, already_solved: alreadySolved, total_points: u.points, streak: currentStreak(u),
    daily: { correct: st.correct_count, goal: DAILY_GOAL }, first_try: prior.length === 0 };
}

function moduleStats(c, userId) {
  const attempts = db.attempts.filter((a) => a.user_id === userId).sort((a, b) => a.id - b.id);
  const out = {};
  for (const m of c.modules) {
    const items = new Set((m.items || []).map((it) => it.id));
    const solved = new Set();
    const first = new Set();
    let firstOk = 0;
    for (const a of attempts) {
      if (a.module_id !== m.id) continue;
      if (!first.has(a.item_id)) { first.add(a.item_id); firstOk += a.correct ? 1 : 0; }
      if (a.correct) solved.add(a.item_id);
    }
    const p = db.progress[`${userId}|${m.id}`];
    const nSolved = [...solved].filter((x) => items.has(x)).length;
    const total = items.size;
    out[m.id] = {
      solved: nSolved, total, accuracy: first.size ? Math.round((100 * firstOk) / first.size) : null,
      lesson_done: !!(p && p.lesson_done), step_index: p ? p.step_index : 0,
      mastery: total ? Math.round((100 * nSolved) / total) : 0, updated_at: p ? p.updated_at : null,
    };
  }
  return out;
}

function errorCounts(userIds) {
  const counts = {};
  for (const a of db.attempts) {
    if (!userIds.includes(a.user_id) || a.correct || !a.error_type || a.error_type === "format") continue;
    counts[a.error_type] = (counts[a.error_type] || 0) + 1;
  }
  return Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([t, n]) => ({ type: t, label: ERROR_LABELS[t] || t, count: n }));
}

function newClassCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    let code = "";
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!db.classes.some((c) => c.code === code)) return code;
  }
}

function overview(c, cls) {
  const students = db.users.filter((u) => u.class_id === cls.id && u.role === "student");
  const ids = students.map((s) => s.id);
  const accByModule = Object.fromEntries(c.modules.map((m) => [m.id, []]));
  const rows = students.map((s) => {
    const st = moduleStats(c, s.id);
    const attempts = db.attempts.filter((a) => a.user_id === s.id);
    const correct = attempts.filter((a) => a.correct).length;
    for (const [mid, v] of Object.entries(st)) if (v.accuracy !== null) accByModule[mid].push(v.accuracy);
    return { id: s.id, nickname: s.nickname, username: s.username, points: s.points, streak: currentStreak(s),
      last_active: s.last_active_date, solved: Object.values(st).reduce((t, v) => t + v.solved, 0), attempts: attempts.length,
      accuracy: attempts.length ? Math.round((100 * correct) / attempts.length) : null,
      modules: Object.fromEntries(Object.entries(st).map(([mid, v]) => [mid, v.mastery])) };
  });
  const firstByItem = {};
  const seen = new Set();
  for (const a of db.attempts.filter((x) => ids.includes(x.user_id)).sort((x, y) => x.id - y.id)) {
    const key = `${a.user_id}|${a.item_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    (firstByItem[a.item_id] = firstByItem[a.item_id] || []).push(a.correct);
  }
  const titles = {};
  for (const m of c.modules) for (const it of m.items || []) titles[it.id] = [m.title, (it.prompt || "").slice(0, 90)];
  const hardest = Object.entries(firstByItem).map(([k, v]) => ({
    item_id: k, module: (titles[k] || ["", ""])[0], prompt: (titles[k] || ["", ""])[1], students: v.length,
    first_try_accuracy: Math.round((100 * v.filter(Boolean).length) / v.length),
  })).sort((x, y) => x.first_try_accuracy - y.first_try_accuracy || y.students - x.students).slice(0, 8);
  return {
    class: { id: cls.id, name: cls.name, code: cls.code, leaderboard_enabled: cls.leaderboard_enabled, ai_enabled: cls.ai_enabled },
    modules: c.modules.map((m) => ({ id: m.id, title: m.title, group: m.group,
      avg_accuracy: accByModule[m.id].length ? Math.round(accByModule[m.id].reduce((t, v) => t + v, 0) / accByModule[m.id].length) : null })),
    students: rows.sort((x, y) => x.nickname.toLowerCase().localeCompare(y.nickname.toLowerCase())),
    errors: errorCounts(ids), hardest_items: hardest,
  };
}

function ownClass(teacher, id) {
  const cls = db.classes.find((c) => c.id === Number(id));
  if (!cls || cls.teacher_id !== teacher.id) throw new ApiError("Kelas tidak ditemukan.", 404);
  return cls;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const bad422 = () => new ApiError("Isian belum lengkap atau formatnya belum sesuai.", 422);

export async function handle(method, rawPath, body = {}, token = null) {
  await loadDb();
  const path = rawPath.split("?")[0];
  let m;
  try {
    // --- umum ---
    if (method === "GET" && path === "/api/health") return { ok: true, ai_configured: false, demo: true, static: true };
    if (method === "GET" && path === "/api/glossary") return (await loadContent()).glossary;

    // --- auth ---
    if (method === "POST" && path === "/api/auth/login") {
      const username = String(body.username || "").trim().toLowerCase();
      const u = db.users.find((x) => x.username === username);
      const pw = String(body.password || "");
      const ok = u && (u.password_hash === await hash(username, pw) || u.password_hash === await hash(username, pw.trim()));
      if (!ok) throw new ApiError("Nama pengguna atau kata sandi salah. Periksa huruf besar/kecil (kata sandi demo semuanya huruf kecil).", 401);
      return { token: `local:${u.id}`, user: userOut(u) };
    }
    if (method === "POST" && path === "/api/auth/register") {
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      const nickname = String(body.nickname || "").trim();
      const role = body.role === "teacher" ? "teacher" : "student";
      if (username.length < 3 || password.length < 6 || nickname.length < 2 || nickname.length > 30) throw bad422();
      if (!/^[a-z0-9_.]{3,40}$/.test(username)) throw new ApiError("Nama pengguna hanya boleh huruf kecil, angka, titik, dan garis bawah.", 422);
      if (db.users.some((x) => x.username === username)) throw new ApiError("Nama pengguna sudah dipakai. Coba nama lain.", 409);
      let u;
      if (role === "student") {
        const code = String(body.class_code || "").trim().toUpperCase();
        const cls = code ? db.classes.find((c) => c.code === code) : null;
        if (code && !cls) throw new ApiError("Kode kelas tidak ditemukan. Tanyakan kode kelas ke gurumu.", 404);
        u = await newUser(username, password, "student", nickname, cls ? cls.id : null);
      } else {
        u = await newUser(username, password, "teacher", nickname, null);
        const cls = { id: nextId(), name: String(body.class_name || "").trim() || "Kelas 8", code: newClassCode(), teacher_id: u.id,
          leaderboard_enabled: true, ai_enabled: false };
        db.classes.push(cls);
        u.class_id = cls.id;
      }
      saveDb();
      return { token: `local:${u.id}`, user: userOut(u) };
    }
    if (method === "GET" && path === "/api/auth/me") return userOut(currentUser(token));
    if (method === "POST" && path === "/api/auth/join-class") {
      const u = currentUser(token);
      const cls = db.classes.find((c) => c.code === String(body.class_code || "").trim().toUpperCase());
      if (!cls) throw new ApiError("Kode kelas tidak ditemukan.", 404);
      u.class_id = cls.id;
      saveDb();
      return userOut(u);
    }

    // --- belajar ---
    if (method === "GET" && path === "/api/modules") {
      const u = currentUser(token);
      const c = await loadContent();
      const st = moduleStats(c, u.id);
      return c.modules.map((mod) => ({ ...moduleSummary(mod), stats: st[mod.id] }));
    }
    if ((m = /^\/api\/modules\/([\w-]+)$/.exec(path)) && method === "GET") {
      const u = currentUser(token);
      const c = await loadContent();
      const mod = c.byId[m[1]];
      if (!mod) throw new ApiError("Materi tidak ditemukan.", 404);
      return { ...JSON.parse(JSON.stringify(mod)), items: mod.items.map(publicItem), stats: moduleStats(c, u.id)[mod.id] };
    }
    if ((m = /^\/api\/modules\/([\w-]+)\/progress$/.exec(path)) && method === "POST") {
      const u = currentUser(token);
      const c = await loadContent();
      if (!c.byId[m[1]]) throw new ApiError("Materi tidak ditemukan.", 404);
      const key = `${u.id}|${m[1]}`;
      const p = db.progress[key] || { step_index: 0, lesson_done: false };
      const stepIndex = Math.max(0, Math.min(200, Number(body.step_index) || 0));
      p.step_index = body.lesson_done ? stepIndex : Math.max(p.step_index, stepIndex);
      p.lesson_done = p.lesson_done || !!body.lesson_done;
      p.updated_at = new Date().toISOString();
      db.progress[key] = p;
      saveDb();
      return { ok: true, step_index: p.step_index, lesson_done: p.lesson_done };
    }
    if (method === "POST" && path === "/api/practice/check") {
      const u = currentUser(token);
      const c = await loadContent();
      const item = (c.byId[body.module_id]?.items || []).find((it) => it.id === body.item_id);
      if (!item) throw new ApiError("Soal tidak ditemukan.", 404);
      const res = check(item, body.answer);
      const out = { ...res };
      if (res.retry_free) return out;
      out.progress = recordAttempt(u, body.module_id, body.item_id, res.correct, res.error_type, JSON.stringify(body.answer ?? null));
      if (res.correct || (Number(body.attempt) || 1) >= 2) out.solution = { answer: correctAnswerText(item), explain: item.explain || [] };
      out.error_label = ERROR_LABELS[res.error_type || ""] || null;
      return out;
    }
    if (method === "GET" && path === "/api/me/summary") {
      const u = currentUser(token);
      const c = await loadContent();
      const st = moduleStats(c, u.id);
      const touched = c.modules.filter((mod) => st[mod.id].updated_at && st[mod.id].mastery < 100);
      let cont = touched.length ? touched.reduce((a, b) => (st[b.id].updated_at > st[a.id].updated_at ? b : a)) : null;
      if (!cont) cont = c.modules.find((mod) => st[mod.id].mastery < 100) || c.modules[0] || null;
      const d = daily(u);
      saveDb();
      return {
        nickname: u.nickname, points: u.points, streak: currentStreak(u), daily: { correct: d.correct_count, goal: DAILY_GOAL },
        continue: cont ? { ...moduleSummary(cont), stats: st[cont.id] } : null,
        modules: c.modules.map((mod) => ({ ...moduleSummary(mod), stats: st[mod.id] })),
        overall: { solved: Object.values(st).reduce((t, v) => t + v.solved, 0), total: Object.values(st).reduce((t, v) => t + v.total, 0) },
      };
    }
    if (method === "GET" && path === "/api/leaderboard") {
      const u = currentUser(token);
      const cls = classOf(u);
      if (!cls) return { enabled: false, reason: "Kamu belum bergabung ke kelas." };
      if (!cls.leaderboard_enabled) return { enabled: false, reason: "Papan peringkat dimatikan oleh gurumu." };
      const rows = db.users.filter((s) => s.class_id === cls.id && s.role === "student")
        .sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname))
        .map((s, i) => ({ rank: i + 1, nickname: s.nickname, points: s.points, me: s.id === u.id }));
      return { enabled: true, class_name: cls.name, rows };
    }

    // --- alat ---
    if (method === "POST" && path === "/api/tools/evaluate") {
      currentUser(token);
      return evaluateSteps(String(body.expr ?? ""), String(body.x ?? ""), body.name || "f");
    }
    if (method === "POST" && path === "/api/tools/relation") {
      currentUser(token);
      return analyzeRelation(body.domain || [], body.codomain || [], body.pairs || []);
    }
    if (method === "GET" && path === "/api/tools/modeler/presets") { currentUser(token); return (await loadContent()).presets; }
    if (method === "POST" && path === "/api/tools/modeler/solve") { currentUser(token); return solve(body); }
    if (method === "GET" && path === "/api/tools/modeler/ai-status") {
      currentUser(token);
      const configured = !!getKey();
      return { configured, class_enabled: true, available: configured, daily_quota: AI_DAILY_QUOTA, static: true };
    }
    if (method === "POST" && path === "/api/tools/modeler/ai") {
      const u = currentUser(token);
      if (!getKey()) {
        throw new ApiError("Fitur AI belum aktif di perangkat ini. Masukkan kunci API Claude di Pengaturan → Fitur AI.", 503);
      }
      const text = String(body.text || "");
      if (text.trim().length < 20 || text.length > 1500) throw new ApiError("Soal cerita minimal 20 dan maksimal 1.500 karakter.", 422);
      const st = daily(u);
      if (st.ai_calls >= AI_DAILY_QUOTA) {
        throw new ApiError(`Kuota analisis AI hari ini sudah habis (${AI_DAILY_QUOTA} kali). Coba mode terpandu, ya.`, 429);
      }
      st.ai_calls += 1;
      saveDb();
      const remaining = AI_DAILY_QUOTA - st.ai_calls;
      let data;
      try {
        data = await extractModel(text);
      } catch (e) {
        if (e instanceof AIUnavailable) throw new ApiError(e.message, 502);
        throw e;
      }
      if (data.supported === false) return { supported: false, reason: data.reason || "Soal ini belum didukung.", remaining };
      let spec;
      try {
        spec = normalizeSpec(toSpec(data));
      } catch {
        throw new ApiError("Model dari AI tidak lengkap. Coba lagi atau pakai mode terpandu.", 502);
      }
      const verification = verifySpec(text, spec);
      const out = {
        supported: true, spec,
        explanations: {
          models: (data.models || []).map((mm) => ({ name: mm.name, meaning_a: mm.meaning_a || "", meaning_b: mm.meaning_b || "" })),
          x: data.task?.x_explanation || "", question: data.question_restated || "",
        },
        verification, remaining,
      };
      if (verification.ok) out.solution = solve(spec);
      return out;
    }

    // --- guru ---
    if (method === "GET" && path === "/api/teacher/classes") {
      const t = requireTeacher(token);
      return db.classes.filter((c) => c.teacher_id === t.id).sort((a, b) => a.id - b.id).map((c) => ({
        id: c.id, name: c.name, code: c.code, leaderboard_enabled: c.leaderboard_enabled, ai_enabled: c.ai_enabled,
        student_count: db.users.filter((u) => u.class_id === c.id && u.role === "student").length }));
    }
    if (method === "POST" && path === "/api/teacher/classes") {
      const t = requireTeacher(token);
      const name = String(body.name || "").trim();
      if (!name || name.length > 60) throw bad422();
      const cls = { id: nextId(), name, code: newClassCode(), teacher_id: t.id, leaderboard_enabled: true, ai_enabled: false };
      db.classes.push(cls);
      saveDb();
      return { id: cls.id, name: cls.name, code: cls.code };
    }
    if ((m = /^\/api\/teacher\/classes\/(\d+)$/.exec(path)) && method === "PATCH") {
      const cls = ownClass(requireTeacher(token), m[1]);
      if (typeof body.leaderboard_enabled === "boolean") cls.leaderboard_enabled = body.leaderboard_enabled;
      if (typeof body.ai_enabled === "boolean") cls.ai_enabled = body.ai_enabled;
      if (body.name) cls.name = String(body.name).trim().slice(0, 60);
      saveDb();
      return { id: cls.id, name: cls.name, leaderboard_enabled: cls.leaderboard_enabled, ai_enabled: cls.ai_enabled };
    }
    if ((m = /^\/api\/teacher\/classes\/(\d+)\/overview$/.exec(path)) && method === "GET") {
      const cls = ownClass(requireTeacher(token), m[1]);
      return overview(await loadContent(), cls);
    }
    if ((m = /^\/api\/teacher\/classes\/(\d+)\/export\.csv$/.exec(path)) && method === "GET") {
      const cls = ownClass(requireTeacher(token), m[1]);
      const data = overview(await loadContent(), cls);
      const q = (v) => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const lines = [["Nama panggilan", "Username", "Poin", "Soal benar", "Percobaan", "Akurasi (%)", "Terakhir aktif",
        ...data.modules.map((mm) => `Penguasaan ${mm.title} (%)`)]];
      for (const s of data.students) {
        lines.push([s.nickname, s.username, s.points, s.solved, s.attempts, s.accuracy ?? "", s.last_active || "",
          ...data.modules.map((mm) => s.modules[mm.id] || 0)]);
      }
      lines.push([], ["Jenis kesalahan", "Jumlah"], ...data.errors.map((e) => [ERROR_LABELS[e.type] || e.type, e.count]));
      return "﻿" + lines.map((row) => row.map(q).join(";")).join("\r\n") + "\r\n";
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof MathInputError) throw new ApiError(e.message, 422);
    if (e instanceof SpecError) throw new ApiError(e.message, 422);
    throw e;
  }
  throw new ApiError("Endpoint tidak ditemukan.", 404);
}
