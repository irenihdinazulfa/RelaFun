// deno-lint-ignore-file no-explicit-any
// Backend RelaFun di Supabase Edge Functions: padanan apps/api/app/routers/*.py dengan data di PostgreSQL.
//
// Aturan proyek yang dijaga di sini (lihat CLAUDE.md):
//  1. Benar/salah ditentukan mesin deterministik (_gen/checker.js, mathfn.js, modeler.js, tutor.js), bukan AI.
//  2. Kunci jawaban tidak dikirim sebelum siswa menjawab (SECRET_FIELDS, sama dengan content.py).
//  6. Tidak ada data pribadi; papan peringkat hanya nama panggilan.
//  7/12. Kunci AI hanya di Secrets Supabase; AI hanya menerjemahkan/menemani, hasilnya diverifikasi.
import content from "./_gen/content.json" with { type: "json" };
import { check, correctAnswerText, ERROR_LABELS } from "./_gen/checker.js";
import { analyzeRelation, evaluateSteps, MathInputError } from "./_gen/mathfn.js";
import { normalizeSpec, solve, SpecError, verifySpec } from "./_gen/modeler.js";
import { toSpec } from "./_gen/ai.js";
import * as tutor from "./_gen/tutor.js";
import type { Db, Row } from "./db.ts";
import { createToken, hashPassword, readToken, verifyPassword } from "./security.ts";
import {
  AIUnavailable, type ChatFn, claudeExtractor, type Env, type ExtractFn, modelerConfigured, PROVIDER_NAMES,
  tutorChat, tutorModel, tutorProvider,
} from "./ai.ts";

export interface Deps {
  db: Db;
  env: Env;
  /** Untuk pengujian: ganti pemanggil AI (undefined = dari Secrets). */
  tutorAI?: ChatFn | null;
  extract?: ExtractFn;
  now?: () => Date;
}

const SECRET_FIELDS = new Set(["answer", "answer_pairs", "common_errors", "linear", "explain", "option_feedback", "tolerance"]);
const POINTS_FIRST_TRY = 10;
const POINTS_RETRY = 5;
const BAD_INPUT = "Isian belum lengkap atau formatnya belum sesuai.";
const DEFAULT_ORIGINS = "https://irenihdinazulfa.github.io,http://relafun.localhost,http://localhost:8000";

const modules: any[] = (content as any).modules;
const byId: Record<string, any> = Object.fromEntries(modules.map((m) => [m.id, m]));
const tutorData: any = (content as any).tutor;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Validasi isian (padanan model Pydantic di router Python)
// ---------------------------------------------------------------------------
type StrOpt = { min?: number; max: number; required?: boolean; def?: string };
function str(body: any, key: string, o: StrOpt): string {
  const v = body?.[key];
  if (v === undefined || v === null) {
    if (o.required) throw new HttpError(422, BAD_INPUT);
    return o.def ?? "";
  }
  if (typeof v !== "string" || v.length > o.max || v.length < (o.min ?? 0)) throw new HttpError(422, BAD_INPUT);
  return v;
}
function int(body: any, key: string, min: number, max: number, def: number): number {
  const v = body?.[key];
  if (v === undefined || v === null) return def;
  const n = typeof v === "string" && /^-?\d+$/.test(v.trim()) ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) throw new HttpError(422, BAD_INPUT);
  return n;
}
function bool(body: any, key: string, def: boolean | null): boolean | null {
  const v = body?.[key];
  if (v === undefined || v === null) return def;
  if (typeof v !== "boolean") throw new HttpError(422, BAD_INPUT);
  return v;
}

// ---------------------------------------------------------------------------
// Konten
// ---------------------------------------------------------------------------
const publicItem = (it: any) => Object.fromEntries(Object.entries(it).filter(([k]) => !SECRET_FIELDS.has(k)));
function moduleSummary(m: any) {
  const out: any = {};
  for (const k of ["id", "order", "group", "title", "subtitle", "icon", "minutes", "interview_codes", "objectives"]) out[k] = m[k] ?? null;
  out.item_count = (m.items || []).length;
  out.step_count = (m.steps || []).length;
  return out;
}

export function createApp(deps: Deps): (req: Request) => Promise<Response> {
  const { db, env } = deps;
  const conf = (name: string, fallback = "") => (env(name) ?? "").trim() || fallback;
  const num = (name: string, fallback: number) => {
    const n = Number(conf(name));
    return Number.isFinite(n) && conf(name) !== "" ? n : fallback;
  };
  const DAILY_GOAL = num("DAILY_GOAL", 5);
  const AI_DAILY_QUOTA = num("AI_DAILY_QUOTA", 10);
  const TUTOR_DAILY_QUOTA = num("TUTOR_DAILY_QUOTA", 60);
  const TOKEN_DAYS = num("TOKEN_DAYS", 7);
  const TZ = conf("RELAFUN_TIMEZONE", "Asia/Jakarta");
  const origins = new Set(conf("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean));
  const tutorAI: ChatFn | null = deps.tutorAI !== undefined ? deps.tutorAI : tutorChat(env);
  const extract: ExtractFn = deps.extract || claudeExtractor(env);
  const now = deps.now || (() => new Date());

  const fmtDate = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const today = () => fmtDate.format(now());
  const yesterday = () => fmtDate.format(new Date(now().getTime() - 86_400_000));

  function secret(): string {
    const s = conf("SECRET_KEY");
    if (!s) throw new HttpError(500, "Server belum siap: SECRET_KEY belum diisi di Secrets Supabase.");
    return s;
  }

  // -------------------------------------------------------------------------
  // Pengguna & kelas
  // -------------------------------------------------------------------------
  async function classOf(u: Row): Promise<Row | null> {
    if (!u.class_id) return null;
    return (await db.query("select * from classrooms where id = $1", [u.class_id]))[0] || null;
  }
  const classOut = (c: Row) => ({ id: c.id, name: c.name, code: c.code, leaderboard_enabled: c.leaderboard_enabled, ai_enabled: c.ai_enabled });
  async function userOut(u: Row) {
    const c = await classOf(u);
    return { id: u.id, username: u.username, nickname: u.nickname, role: u.role, class: c ? classOut(c) : null };
  }

  async function currentUser(req: Request): Promise<Row> {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") || "");
    if (!m) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const id = await readToken(m[1].trim(), secret());
    if (id === null) throw new HttpError(401, "Sesi berakhir. Silakan masuk lagi.");
    const u = (await db.query("select * from users where id = $1", [id]))[0];
    if (!u) throw new HttpError(401, "Akun tidak ditemukan.");
    return u;
  }
  async function requireTeacher(req: Request): Promise<Row> {
    const u = await currentUser(req);
    if (u.role !== "teacher") throw new HttpError(403, "Halaman ini khusus guru.");
    return u;
  }
  async function newClassCode(): Promise<string> {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (;;) {
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      const code = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
      if (!(await db.query("select 1 from classrooms where code = $1", [code])).length) return code;
    }
  }
  async function ownClass(teacher: Row, id: string): Promise<Row> {
    const c = (await db.query("select * from classrooms where id = $1::int", [Number(id)]))[0];
    if (!c || c.teacher_id !== teacher.id) throw new HttpError(404, "Kelas tidak ditemukan.");
    return c;
  }
  const authOut = async (u: Row) => ({ token: await createToken({ id: u.id, role: u.role }, secret(), TOKEN_DAYS), user: await userOut(u) });

  // -------------------------------------------------------------------------
  // Kemajuan (padanan core/progress.py)
  // -------------------------------------------------------------------------
  function currentStreak(u: Row): number {
    if (!u.last_active_date) return 0;
    return [today(), yesterday()].includes(u.last_active_date) ? u.streak : 0;
  }

  async function recordAttempt(u0: Row, moduleId: string, itemId: string, correct: boolean, errorType: string | null, answer: string) {
    return await db.begin(async (tx) => {
      const u = (await tx.query("select * from users where id = $1 for update", [u0.id]))[0];
      const prior = await tx.query("select correct from attempts where user_id = $1 and item_id = $2", [u.id, itemId]);
      const alreadySolved = prior.some((a) => a.correct);
      let points = 0;
      if (correct && !alreadySolved) points = prior.length ? POINTS_RETRY : POINTS_FIRST_TRY;
      await tx.query(
        "insert into attempts (user_id, module_id, item_id, correct, error_type, answer, points) values ($1, $2, $3, $4::boolean, $5, $6, $7::int)",
        [u.id, moduleId, itemId, correct, errorType, answer.slice(0, 500), points]);
      const day = today();
      await tx.query("insert into daily_stats (user_id, date) values ($1, $2) on conflict (user_id, date) do nothing", [u.id, day]);
      let st: Row;
      if (correct && !alreadySolved) {
        st = (await tx.query(
          "update daily_stats set correct_count = correct_count + 1, points = points + $3::int where user_id = $1 and date = $2 returning correct_count",
          [u.id, day, points]))[0];
        u.points += points;
        if (u.last_active_date !== day) {
          u.streak = u.last_active_date === yesterday() ? u.streak + 1 : 1;
          u.last_active_date = day;
        }
        await tx.query("update users set points = $2::int, streak = $3::int, last_active_date = $4 where id = $1",
          [u.id, u.points, u.streak, u.last_active_date]);
      } else {
        st = (await tx.query("select correct_count from daily_stats where user_id = $1 and date = $2", [u.id, day]))[0];
      }
      return {
        points_awarded: points, already_solved: alreadySolved, total_points: u.points, streak: currentStreak(u),
        daily: { correct: st.correct_count, goal: DAILY_GOAL }, first_try: prior.length === 0,
      };
    });
  }

  /** Statistik per modul dari daftar percobaan (urut id) dan baris module_progress satu siswa. */
  function statsFrom(attempts: Row[], progress: Row[]) {
    const prog = Object.fromEntries(progress.map((p) => [p.module_id, p]));
    const out: Record<string, any> = {};
    for (const m of modules) {
      const items = new Set((m.items || []).map((it: any) => it.id));
      const solved = new Set<string>();
      const first = new Set<string>();
      let firstOk = 0;
      for (const a of attempts) {
        if (a.module_id !== m.id) continue;
        if (!first.has(a.item_id)) {
          first.add(a.item_id);
          firstOk += a.correct ? 1 : 0;
        }
        if (a.correct) solved.add(a.item_id);
      }
      const p = prog[m.id];
      const nSolved = [...solved].filter((x) => items.has(x)).length;
      const total = items.size;
      out[m.id] = {
        solved: nSolved, total, accuracy: first.size ? Math.round((100 * firstOk) / first.size) : null,
        lesson_done: Boolean(p && p.lesson_done), step_index: p ? p.step_index : 0,
        mastery: total ? Math.round((100 * nSolved) / total) : 0,
        updated_at: p && p.updated_at ? new Date(p.updated_at).toISOString() : null,
      };
    }
    return out;
  }
  async function moduleStats(userId: number) {
    const attempts = await db.query("select module_id, item_id, correct from attempts where user_id = $1 order by id", [userId]);
    const progress = await db.query("select module_id, step_index, lesson_done, updated_at from module_progress where user_id = $1", [userId]);
    return statsFrom(attempts, progress);
  }

  async function errorCounts(classId: number) {
    const rows = await db.query(
      `select error_type, count(*)::int as n from attempts
       where user_id in (select id from users where class_id = $1 and role = 'student')
         and correct = false and error_type is not null and error_type <> 'format'
       group by error_type order by count(*) desc`, [classId]);
    return rows.map((r) => ({ type: r.error_type, label: (ERROR_LABELS as any)[r.error_type] || r.error_type, count: r.n }));
  }

  async function overview(cls: Row) {
    const students = await db.query("select * from users where class_id = $1 and role = 'student'", [cls.id]);
    const attempts = await db.query(
      `select user_id, module_id, item_id, correct from attempts
       where user_id in (select id from users where class_id = $1 and role = 'student') order by id`, [cls.id]);
    const progress = await db.query(
      `select user_id, module_id, step_index, lesson_done, updated_at from module_progress
       where user_id in (select id from users where class_id = $1 and role = 'student')`, [cls.id]);
    const accByModule: Record<string, number[]> = Object.fromEntries(modules.map((m) => [m.id, []]));
    const rows = students.map((s) => {
      const mine = attempts.filter((a) => a.user_id === s.id);
      const st = statsFrom(mine, progress.filter((p) => p.user_id === s.id));
      const correct = mine.filter((a) => a.correct).length;
      for (const [mid, v] of Object.entries(st)) if (v.accuracy !== null) accByModule[mid].push(v.accuracy);
      return {
        id: s.id, nickname: s.nickname, username: s.username, points: s.points, streak: currentStreak(s),
        last_active: s.last_active_date, solved: Object.values(st).reduce((t: number, v: any) => t + v.solved, 0),
        attempts: mine.length, accuracy: mine.length ? Math.round((100 * correct) / mine.length) : null,
        modules: Object.fromEntries(Object.entries(st).map(([mid, v]) => [mid, v.mastery])),
      };
    });
    const firstByItem: Record<string, boolean[]> = {};
    const seen = new Set<string>();
    for (const a of attempts) {
      const key = `${a.user_id}|${a.item_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      (firstByItem[a.item_id] ||= []).push(a.correct);
    }
    const titles: Record<string, [string, string]> = {};
    for (const m of modules) for (const it of m.items || []) titles[it.id] = [m.title, String(it.prompt || "").slice(0, 90)];
    const hardest = Object.entries(firstByItem).map(([k, v]) => ({
      item_id: k, module: (titles[k] || ["", ""])[0], prompt: (titles[k] || ["", ""])[1], students: v.length,
      first_try_accuracy: Math.round((100 * v.filter(Boolean).length) / v.length),
    })).sort((x, y) => x.first_try_accuracy - y.first_try_accuracy || y.students - x.students).slice(0, 8);
    return {
      class: classOut(cls),
      modules: modules.map((m) => ({
        id: m.id, title: m.title, group: m.group,
        avg_accuracy: accByModule[m.id].length ? Math.round(accByModule[m.id].reduce((t, v) => t + v, 0) / accByModule[m.id].length) : null,
      })),
      students: rows.sort((x, y) => (x.nickname.toLowerCase() < y.nickname.toLowerCase() ? -1 : x.nickname.toLowerCase() > y.nickname.toLowerCase() ? 1 : 0)),
      errors: await errorCounts(cls.id),
      hardest_items: hardest,
    };
  }

  async function tutorUsage(u: Row): Promise<number> {
    const day = today();
    await db.query("insert into tutor_usage (user_id, date) values ($1, $2) on conflict (user_id, date) do nothing", [u.id, day]);
    return (await db.query("select calls from tutor_usage where user_id = $1 and date = $2", [u.id, day]))[0].calls;
  }

  // -------------------------------------------------------------------------
  // Router
  // -------------------------------------------------------------------------
  async function route(req: Request, path: string, body: any): Promise<any> {
    const method = req.method;
    let m: RegExpExecArray | null;

    // --- umum ---
    if (method === "GET" && path === "/api/health") {
      return { ok: true, backend: "supabase", ai_configured: modelerConfigured(env),
        tutor_ai_configured: tutorProvider(env) !== null, public_tutor: false, demo: true };
    }
    if (method === "GET" && path === "/api/glossary") return (content as any).glossary;

    // --- auth ---
    if (method === "POST" && path === "/api/auth/login") {
      const username = str(body, "username", { max: 40, required: true }).trim().toLowerCase();
      const password = str(body, "password", { max: 100, required: true });
      const u = (await db.query("select * from users where username = $1", [username]))[0];
      const ok = u && ((await verifyPassword(password, u.password_hash)) || (await verifyPassword(password.trim(), u.password_hash)));
      if (!ok) {
        throw new HttpError(401, "Nama pengguna atau kata sandi salah. Periksa huruf besar/kecil (kata sandi demo semuanya huruf kecil).");
      }
      return await authOut(u);
    }
    if (method === "POST" && path === "/api/auth/register") {
      const username = str(body, "username", { min: 3, max: 40, required: true }).trim().toLowerCase();
      const password = str(body, "password", { min: 6, max: 100, required: true }).trim();
      const nickname = str(body, "nickname", { min: 2, max: 30, required: true }).trim();
      const classCode = str(body, "class_code", { max: 12 }).trim().toUpperCase();
      const role = str(body, "role", { max: 10, def: "student" });
      const className = str(body, "class_name", { max: 60 }).trim();
      if (role !== "student" && role !== "teacher") throw new HttpError(422, BAD_INPUT);
      if (!/^[a-z0-9_.]{3,40}$/.test(username)) {
        throw new HttpError(422, "Nama pengguna hanya boleh huruf kecil, angka, titik, dan garis bawah.");
      }
      if (!nickname) throw new HttpError(422, BAD_INPUT);
      if ((await db.query("select 1 from users where username = $1", [username])).length) {
        throw new HttpError(409, "Nama pengguna sudah dipakai. Coba nama lain.");
      }
      const hash = await hashPassword(password);
      let cls: Row | null = null;
      if (role === "student" && classCode) {
        cls = (await db.query("select * from classrooms where code = $1", [classCode]))[0] || null;
        if (!cls) throw new HttpError(404, "Kode kelas tidak ditemukan. Tanyakan kode kelas ke gurumu.");
      }
      const code = role === "teacher" ? await newClassCode() : null;
      try {
        const u = await db.begin(async (tx) => {
          const user = (await tx.query(
            "insert into users (username, password_hash, role, nickname, class_id) values ($1, $2, $3, $4, $5) returning *",
            [username, hash, role, nickname, cls ? cls.id : null]))[0];
          if (role === "teacher") {
            const c = (await tx.query("insert into classrooms (name, code, teacher_id) values ($1, $2, $3) returning id",
              [className || "Kelas 8", code, user.id]))[0];
            user.class_id = c.id;
            await tx.query("update users set class_id = $2 where id = $1", [user.id, c.id]);
          }
          return user;
        });
        return await authOut(u);
      } catch (e: any) {
        if (e?.code === "23505") throw new HttpError(409, "Nama pengguna sudah dipakai. Coba nama lain.");
        throw e;
      }
    }
    if (method === "GET" && path === "/api/auth/me") return await userOut(await currentUser(req));
    if (method === "POST" && path === "/api/auth/join-class") {
      const u = await currentUser(req);
      const code = str(body, "class_code", { max: 12, required: true }).trim().toUpperCase();
      const cls = (await db.query("select * from classrooms where code = $1", [code]))[0];
      if (!cls) throw new HttpError(404, "Kode kelas tidak ditemukan.");
      await db.query("update users set class_id = $2 where id = $1", [u.id, cls.id]);
      return await userOut({ ...u, class_id: cls.id });
    }

    // --- belajar ---
    if (method === "GET" && path === "/api/modules") {
      const u = await currentUser(req);
      const st = await moduleStats(u.id);
      return modules.map((mod) => ({ ...moduleSummary(mod), stats: st[mod.id] }));
    }
    if ((m = /^\/api\/modules\/([^/]+)$/.exec(path)) && method === "GET") {
      const u = await currentUser(req);
      const mod = byId[decodeURIComponent(m[1])];
      if (!mod) throw new HttpError(404, "Materi tidak ditemukan.");
      return { ...structuredClone(mod), items: (mod.items || []).map(publicItem), stats: (await moduleStats(u.id))[mod.id] };
    }
    if ((m = /^\/api\/modules\/([^/]+)\/progress$/.exec(path)) && method === "POST") {
      const u = await currentUser(req);
      const moduleId = decodeURIComponent(m[1]);
      if (!byId[moduleId]) throw new HttpError(404, "Materi tidak ditemukan.");
      const stepIndex = int(body, "step_index", 0, 200, 0);
      const done = bool(body, "lesson_done", false) as boolean;
      const p = (await db.query(
        `insert into module_progress (user_id, module_id, step_index, lesson_done) values ($1, $2, $3::int, $4::boolean)
         on conflict (user_id, module_id) do update set
           step_index = case when $4::boolean then $3::int else greatest(module_progress.step_index, $3::int) end,
           lesson_done = module_progress.lesson_done or $4::boolean, updated_at = now()
         returning step_index, lesson_done`, [u.id, moduleId, stepIndex, done]))[0];
      return { ok: true, step_index: p.step_index, lesson_done: p.lesson_done };
    }
    if (method === "POST" && path === "/api/practice/check") {
      const u = await currentUser(req);
      const moduleId = str(body, "module_id", { max: 200, required: true });
      const itemId = str(body, "item_id", { max: 200, required: true });
      const attempt = int(body, "attempt", 1, 50, 1);
      const item = (byId[moduleId]?.items || []).find((it: any) => it.id === itemId);
      if (!item) throw new HttpError(404, "Soal tidak ditemukan.");
      const res = check(item, body.answer ?? null);
      const out: any = { ...res };
      if (res.retry_free) return out; // masukan belum lengkap / format salah: tidak dihitung percobaan
      out.progress = await recordAttempt(u, moduleId, itemId, res.correct, res.error_type ?? null, JSON.stringify(body.answer ?? null));
      if (res.correct || attempt >= 2) out.solution = { answer: correctAnswerText(item), explain: item.explain || [] };
      out.error_label = (ERROR_LABELS as any)[res.error_type || ""] || null;
      return out;
    }
    if (method === "GET" && path === "/api/me/summary") {
      const u = await currentUser(req);
      const st = await moduleStats(u.id);
      const touched = modules.filter((mod) => st[mod.id].updated_at && st[mod.id].mastery < 100);
      let cont = touched.length ? touched.reduce((a, b) => (st[b.id].updated_at > st[a.id].updated_at ? b : a)) : null;
      if (!cont) cont = modules.find((mod) => st[mod.id].mastery < 100) || modules[0] || null;
      const d = (await db.query("select correct_count from daily_stats where user_id = $1 and date = $2", [u.id, today()]))[0];
      const vals = Object.values(st);
      return {
        nickname: u.nickname, points: u.points, streak: currentStreak(u), daily: { correct: d ? d.correct_count : 0, goal: DAILY_GOAL },
        continue: cont ? { ...moduleSummary(cont), stats: st[cont.id] } : null,
        modules: modules.map((mod) => ({ ...moduleSummary(mod), stats: st[mod.id] })),
        overall: { solved: vals.reduce((t, v) => t + v.solved, 0), total: vals.reduce((t, v) => t + v.total, 0) },
      };
    }
    if (method === "GET" && path === "/api/leaderboard") {
      const u = await currentUser(req);
      const cls = await classOf(u);
      if (!cls) return { enabled: false, reason: "Kamu belum bergabung ke kelas." };
      if (!cls.leaderboard_enabled) return { enabled: false, reason: "Papan peringkat dimatikan oleh gurumu." };
      const rows = await db.query("select id, nickname, points from users where class_id = $1 and role = 'student' order by points desc, nickname", [cls.id]);
      return { enabled: true, class_name: cls.name, rows: rows.map((s, i) => ({ rank: i + 1, nickname: s.nickname, points: s.points, me: s.id === u.id })) };
    }

    // --- alat ---
    if (method === "POST" && path === "/api/tools/evaluate") {
      await currentUser(req);
      return evaluateSteps(str(body, "expr", { max: 80, required: true }), str(body, "x", { max: 20, required: true }),
        str(body, "name", { max: 1, def: "f" }) || "f");
    }
    if (method === "POST" && path === "/api/tools/relation") {
      await currentUser(req);
      const list = (k: string, max: number, required: boolean) => {
        const v = body?.[k];
        if (v === undefined || v === null) {
          if (required) throw new HttpError(422, BAD_INPUT);
          return [];
        }
        if (!Array.isArray(v) || v.length > max) throw new HttpError(422, BAD_INPUT);
        return v;
      };
      return analyzeRelation(list("domain", 8, true), list("codomain", 8, true), list("pairs", 64, false));
    }
    if (method === "GET" && path === "/api/tools/modeler/presets") {
      await currentUser(req);
      return (content as any).presets;
    }
    if (method === "POST" && path === "/api/tools/modeler/solve") {
      await currentUser(req);
      return solve(body);
    }
    if (method === "GET" && path === "/api/tools/modeler/ai-status") {
      const u = await currentUser(req);
      const cls = await classOf(u);
      const classOn = Boolean(cls && cls.ai_enabled) || u.role === "teacher";
      return { configured: modelerConfigured(env), class_enabled: classOn, available: modelerConfigured(env) && classOn, daily_quota: AI_DAILY_QUOTA };
    }
    if (method === "POST" && path === "/api/tools/modeler/ai") {
      const u = await currentUser(req);
      const text = str(body, "text", { min: 20, max: 1500, required: true });
      const cls = await classOf(u);
      if (!modelerConfigured(env)) throw new HttpError(503, "Fitur AI belum aktif di server ini. Gunakan mode terpandu.");
      if (!(Boolean(cls && cls.ai_enabled) || u.role === "teacher")) {
        throw new HttpError(403, "Fitur AI belum diaktifkan oleh gurumu. Gunakan mode terpandu.");
      }
      const day = today();
      await db.query("insert into daily_stats (user_id, date) values ($1, $2) on conflict (user_id, date) do nothing", [u.id, day]);
      const used = (await db.query(
        "update daily_stats set ai_calls = ai_calls + 1 where user_id = $1 and date = $2 and ai_calls < $3::int returning ai_calls",
        [u.id, day, AI_DAILY_QUOTA]))[0];
      if (!used) throw new HttpError(429, `Kuota analisis AI hari ini sudah habis (${AI_DAILY_QUOTA} kali). Coba mode terpandu, ya.`);
      const remaining = AI_DAILY_QUOTA - used.ai_calls;
      let data: any;
      try {
        data = await extract(text);
      } catch (e) {
        if (e instanceof AIUnavailable) throw new HttpError(502, e.message);
        throw e;
      }
      if (data.supported === false) return { supported: false, reason: data.reason || "Soal ini belum didukung.", remaining };
      let spec: any;
      try {
        spec = normalizeSpec(toSpec(data));
      } catch {
        throw new HttpError(502, "Model dari AI tidak lengkap. Coba lagi atau pakai mode terpandu.");
      }
      const verification = verifySpec(text, spec);
      const out: any = {
        supported: true, spec,
        explanations: {
          models: (data.models || []).map((mm: any) => ({ name: mm.name, meaning_a: mm.meaning_a || "", meaning_b: mm.meaning_b || "" })),
          x: data.task?.x_explanation || "", question: data.question_restated || "",
        },
        verification, remaining,
      };
      if (verification.ok) out.solution = solve(spec);
      return out;
    }

    // --- Asisten Belajar RMT ---
    if (method === "GET" && path === "/api/tutor/status") {
      const u = await currentUser(req);
      const used = await tutorUsage(u);
      const provider = tutorProvider(env);
      return { ai: provider !== null, provider: PROVIDER_NAMES[provider || ""] ?? null, model: tutorModel(env),
        daily_quota: TUTOR_DAILY_QUOTA, remaining: Math.max(0, TUTOR_DAILY_QUOTA - used), free_mode: provider !== null, static: false };
    }
    if (method === "GET" && path === "/api/tutor/problems") {
      await currentUser(req);
      return tutor.catalog(tutorData);
    }
    if (method === "POST" && path === "/api/tutor/turn") {
      const u = await currentUser(req);
      const actions = ["start", "answer", "hint", "ask", "next"];
      const historyIn = body?.history ?? [];
      if (!Array.isArray(historyIn) || historyIn.length > 12) throw new HttpError(422, BAD_INPUT);
      const history = historyIn.map((h: any) => {
        if (!h || (h.role !== "user" && h.role !== "assistant")) throw new HttpError(422, BAD_INPUT);
        return { role: h.role, text: str(h, "text", { max: 1200 }) };
      });
      const turnReq = {
        problem_id: str(body, "problem_id", { max: 40, required: true }),
        action: str(body, "action", { max: 10, def: "answer" }),
        message: str(body, "message", { max: 600 }),
        step: int(body, "step", 0, 50, 0), attempts: int(body, "attempts", 0, 99, 0), hint: int(body, "hint", 0, 3, 0),
        phase: int(body, "phase", 0, 5, 0), problem_text: str(body, "problem_text", { max: 1200 }), history,
      };
      if (!actions.includes(turnReq.action)) throw new HttpError(422, BAD_INPUT);
      const used = await tutorUsage(u);
      const ai = tutorAI && TUTOR_DAILY_QUOTA - used > 0 ? tutorAI : null;
      let out: any;
      try {
        if (turnReq.problem_id === tutor.FREE_ID) {
          if (!tutorAI) throw new HttpError(503, "Mode Soal Bebas memakai AI. Isi GEMINI_API_KEY atau DEEPSEEK_API_KEY di Secrets Supabase.");
          if (!ai) throw new HttpError(429, "Kuota balasan AI hari ini sudah habis. Coba soal bawaan, ya.");
          out = await tutor.turnFree(tutorData, turnReq, ai);
        } else {
          out = await tutor.turn(tutorData, turnReq, ai);
        }
      } catch (e) {
        if (e instanceof tutor.TutorInputError) throw new HttpError(e.message === "Soal tidak ditemukan." ? 404 : 422, e.message);
        throw e;
      }
      const calls = out.ai_calls || 0;
      delete out.ai_calls;
      if (out.ai_error) console.warn("Asisten: AI tidak dipakai (%s)", out.ai_error);
      delete out.ai_error; // detail galat hanya di log server
      const total = calls
        ? (await db.query("update tutor_usage set calls = calls + $3::int where user_id = $1 and date = $2 returning calls", [u.id, today(), calls]))[0].calls
        : used;
      out.quota_left = Math.max(0, TUTOR_DAILY_QUOTA - total);
      out.ai_available = Boolean(tutorAI) && out.quota_left > 0;
      return out;
    }
    if (method === "POST" && path === "/api/tutor/finish") {
      const u = await currentUser(req);
      const problemId = str(body, "problem_id", { max: 40, required: true });
      const row = {
        steps_done: int(body, "steps_done", 0, 50, 0), steps_total: int(body, "steps_total", 0, 50, 0),
        hints_used: int(body, "hints_used", 0, 500, 0), skipped: int(body, "skipped", 0, 50, 0),
        attempts: int(body, "attempts", 0, 999, 0), effort: int(body, "effort", 1, 5, 0) || null,
        seconds: int(body, "seconds", 0, 36000, 0), ai_used: bool(body, "ai_used", false) as boolean,
      };
      if (problemId !== tutor.FREE_ID && !tutor.problem(tutorData, problemId)) throw new HttpError(404, "Soal tidak ditemukan.");
      await db.query(
        `insert into tutor_logs (user_id, problem_id, steps_done, steps_total, hints_used, skipped, attempts, effort, seconds, ai_used)
         values ($1, $2, $3::int, $4::int, $5::int, $6::int, $7::int, $8::int, $9::int, $10::boolean)`,
        [u.id, problemId, row.steps_done, row.steps_total, row.hints_used, row.skipped, row.attempts, row.effort, row.seconds, row.ai_used]);
      return { saved: true };
    }
    if (method === "GET" && path === "/api/tutor/summary") {
      const t = await requireTeacher(req);
      const logs = await db.query(
        `select problem_id, hints_used, skipped, effort from tutor_logs where user_id in (
           select id from users where role = 'student' and class_id in (select id from classrooms where teacher_id = $1))`, [t.id]);
      const titles: [string, string][] = tutor.catalog(tutorData).problems.map((p: any) => [p.id, p.title]);
      titles.push([tutor.FREE_ID, "Soal bebas"]);
      const r1 = (v: number) => Math.round(v * 10) / 10;
      return titles.map(([pid, title]) => {
        const ls = logs.filter((l) => l.problem_id === pid);
        const eff = ls.map((l) => l.effort).filter(Boolean);
        return {
          problem_id: pid, title, sessions: ls.length,
          avg_hints: ls.length ? r1(ls.reduce((a, l) => a + l.hints_used, 0) / ls.length) : null,
          skipped: ls.reduce((a, l) => a + l.skipped, 0),
          avg_effort: eff.length ? r1(eff.reduce((a, v) => a + v, 0) / eff.length) : null,
        };
      });
    }

    // --- guru ---
    if (method === "GET" && path === "/api/teacher/classes") {
      const t = await requireTeacher(req);
      const rows = await db.query(
        `select c.*, (select count(*)::int from users s where s.class_id = c.id and s.role = 'student') as student_count
         from classrooms c where c.teacher_id = $1 order by c.id`, [t.id]);
      return rows.map((c) => ({ ...classOut(c), student_count: c.student_count }));
    }
    if (method === "POST" && path === "/api/teacher/classes") {
      const t = await requireTeacher(req);
      const name = str(body, "name", { min: 1, max: 60, required: true }).trim();
      if (!name) throw new HttpError(422, BAD_INPUT);
      const c = (await db.query("insert into classrooms (name, code, teacher_id) values ($1, $2, $3) returning id, name, code",
        [name, await newClassCode(), t.id]))[0];
      return { id: c.id, name: c.name, code: c.code };
    }
    if ((m = /^\/api\/teacher\/classes\/(\d+)$/.exec(path)) && method === "PATCH") {
      const cls = await ownClass(await requireTeacher(req), m[1]);
      const lb = bool(body, "leaderboard_enabled", null);
      const ai = bool(body, "ai_enabled", null);
      const name = body?.name === null || body?.name === undefined ? "" : str(body, "name", { max: 60 }).trim();
      const c = (await db.query(
        `update classrooms set leaderboard_enabled = coalesce($2::boolean, leaderboard_enabled),
           ai_enabled = coalesce($3::boolean, ai_enabled), name = coalesce(nullif($4, ''), name)
         where id = $1 returning *`, [cls.id, lb, ai, name]))[0];
      return { id: c.id, name: c.name, leaderboard_enabled: c.leaderboard_enabled, ai_enabled: c.ai_enabled };
    }
    if ((m = /^\/api\/teacher\/classes\/(\d+)\/overview$/.exec(path)) && method === "GET") {
      return await overview(await ownClass(await requireTeacher(req), m[1]));
    }
    if ((m = /^\/api\/teacher\/classes\/(\d+)\/export\.csv$/.exec(path)) && method === "GET") {
      const data = await overview(await ownClass(await requireTeacher(req), m[1]));
      const q = (v: unknown) => {
        const s = String(v ?? "");
        return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines: unknown[][] = [["Nama panggilan", "Username", "Poin", "Soal benar", "Percobaan", "Akurasi (%)", "Terakhir aktif",
        ...data.modules.map((mm) => `Penguasaan ${mm.title} (%)`)]];
      for (const s of data.students) {
        lines.push([s.nickname, s.username, s.points, s.solved, s.attempts, s.accuracy ?? "", s.last_active || "",
          ...data.modules.map((mm) => s.modules[mm.id] || 0)]);
      }
      lines.push([], ["Jenis kesalahan", "Jumlah"], ...data.errors.map((e) => [(ERROR_LABELS as any)[e.type] || e.type, e.count]));
      const csv = "﻿" + lines.map((row) => row.map(q).join(";")).join("\r\n") + "\r\n";
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relafun_${data.class.code}.csv"` } });
    }

    throw new HttpError(404, "Endpoint tidak ditemukan.");
  }

  // -------------------------------------------------------------------------
  // HTTP: CORS, JSON, galat
  // -------------------------------------------------------------------------
  return async (req: Request): Promise<Response> => {
    const origin = (req.headers.get("origin") || "").replace(/\/+$/, "");
    const cors: Record<string, string> = { Vary: "Origin" };
    if (origin && origins.has(origin)) {
      cors["Access-Control-Allow-Origin"] = origin;
      cors["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS";
      cors["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept";
      cors["Access-Control-Expose-Headers"] = "Content-Disposition";
      cors["Access-Control-Max-Age"] = "86400";
    }
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const pathname = new URL(req.url).pathname.replace(/\/+$/, "");
    const at = pathname.indexOf("/api/");
    const path = at >= 0 ? pathname.slice(at) : pathname;
    const send = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
    try {
      let body: any = {};
      if (req.method === "POST" || req.method === "PATCH") {
        const text = await req.text();
        if (text.trim()) {
          try {
            body = JSON.parse(text);
          } catch {
            throw new HttpError(422, BAD_INPUT);
          }
        }
        if (body === null || typeof body !== "object" || Array.isArray(body)) throw new HttpError(422, BAD_INPUT);
      }
      const out = await route(req, path, body);
      if (out instanceof Response) {
        for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
        return out;
      }
      return send(out);
    } catch (e) {
      if (e instanceof HttpError) return send({ detail: e.message }, e.status);
      if (e instanceof MathInputError || e instanceof SpecError) return send({ detail: (e as Error).message }, 422);
      console.error("RelaFun API galat:", e);
      return send({ detail: "Terjadi kesalahan di server. Coba lagi sebentar." }, 500);
    }
  };
}
