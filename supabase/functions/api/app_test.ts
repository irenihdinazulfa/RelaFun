// deno-lint-ignore-file no-explicit-any
// Uji backend Supabase dengan PGlite (PostgreSQL asli di memori) + migrasi sungguhan dari supabase/migrations.
// Jalankan dari folder proyek:  deno test -A supabase/functions/api/app_test.ts
import { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { assert, assertEquals, assertMatch } from "jsr:@std/assert@1";
import { createApp } from "./app.ts";
import type { Db } from "./db.ts";
import { hashPassword, verifyPassword } from "./security.ts";
import content from "./_gen/content.json" with { type: "json" };

const MIGRATIONS = new URL("../../migrations/", import.meta.url);

function pgliteDb(pg: PGlite): Db {
  const wrap = (q: any, inTx: boolean): Db => ({
    query: async (text, params = []) => (await q.query(text, params)).rows as any[],
    begin: (fn) => (inTx ? fn(wrap(q, true)) : pg.transaction((tx) => fn(wrap(tx, true)))),
  });
  return wrap(pg, false);
}

async function setup(opts: { tutorAI?: any; now?: () => Date } = {}) {
  const pg = new PGlite();
  const files = [...Deno.readDirSync(MIGRATIONS)].map((f) => f.name).filter((n) => n.endsWith(".sql")).sort();
  for (const f of files) await pg.exec(await Deno.readTextFile(new URL(f, MIGRATIONS)));
  const env: Record<string, string> = { SECRET_KEY: "rahasia-uji", ALLOWED_ORIGINS: "https://contoh.github.io" };
  const handle = createApp({ db: pgliteDb(pg), env: (k) => env[k], tutorAI: opts.tutorAI ?? null, now: opts.now });
  const call = async (method: string, path: string, body?: unknown, token?: string, headers: Record<string, string> = {}) => {
    const h: Record<string, string> = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    if (body !== undefined) h["Content-Type"] = "application/json";
    const res = await handle(new Request(`http://x/functions/v1${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }));
    const type = res.headers.get("content-type") || "";
    return { status: res.status, data: type.includes("json") ? await res.json() : await res.text(), headers: res.headers };
  };
  const login = async (username: string, password: string) => (await call("POST", "/api/auth/login", { username, password })).data.token;
  return { pg, call, login };
}

Deno.test("hash kata sandi sama dengan format Python", async () => {
  const h = await hashPassword("rahasia123");
  assertMatch(h, /^pbkdf2\$200000\$/);
  assert(await verifyPassword("rahasia123", h));
  assert(!(await verifyPassword("salah", h)));
});

Deno.test("RLS aktif di semua tabel", async () => {
  const { pg } = await setup();
  const r = await pg.query<any>("select relname, relrowsecurity from pg_class where relname = any($1)",
    [["classrooms", "users", "attempts", "daily_stats", "module_progress", "tutor_logs", "tutor_usage"]]);
  assertEquals(r.rows.length, 7);
  assert(r.rows.every((x) => x.relrowsecurity));
});

Deno.test("login akun demo (hash dari Python), /me, dan token salah", async () => {
  const { call, login } = await setup();
  assertEquals((await call("GET", "/api/health")).data.backend, "supabase");
  const token = await login("siswa", "siswa123 ");
  const me = await call("GET", "/api/auth/me", undefined, token);
  assertEquals(me.data.nickname, "Sobat");
  assertEquals(me.data.class.code, "RF8A26");
  assertEquals((await call("POST", "/api/auth/login", { username: "siswa", password: "x" })).status, 401);
  assertEquals((await call("GET", "/api/auth/me", undefined, token + "x")).status, 401);
  assertEquals((await call("GET", "/api/auth/me")).status, 401);
});

Deno.test("daftar siswa & guru, kode kelas, nama dipakai", async () => {
  const { call } = await setup();
  const t = await call("POST", "/api/auth/register", { username: "bu.rina", password: "rahasia1", nickname: "Bu Rina", role: "teacher", class_name: "8B" });
  assertEquals(t.status, 200);
  const code = t.data.user.class.code;
  assertMatch(code, /^[A-Z2-9]{6}$/);
  const s = await call("POST", "/api/auth/register", { username: "andi_8", password: "rahasia1", nickname: "Andi", class_code: code.toLowerCase() });
  assertEquals(s.data.user.class.name, "8B");
  assertEquals((await call("POST", "/api/auth/register", { username: "andi_8", password: "rahasia1", nickname: "Andi" })).status, 409);
  assertEquals((await call("POST", "/api/auth/register", { username: "Andi Baru", password: "rahasia1", nickname: "Andi" })).status, 422);
  assertEquals((await call("POST", "/api/auth/register", { username: "budi", password: "rahasia1", nickname: "Budi", class_code: "ZZZZZZ" })).status, 404);
});

Deno.test("materi tanpa kunci jawaban; latihan memberi poin sekali", async () => {
  const { call, login } = await setup();
  const token = await login("siswa", "siswa123");
  const list = await call("GET", "/api/modules", undefined, token);
  assertEquals(list.data.length, (content as any).modules.length);
  const mod = (content as any).modules.find((m: any) => (m.items || []).some((it: any) => it.type === "mcq"));
  const item = mod.items.find((it: any) => it.type === "mcq");
  const detail = await call("GET", `/api/modules/${mod.id}`, undefined, token);
  for (const it of detail.data.items) assert(!("answer" in it) && !("explain" in it), "kunci jawaban bocor");

  const ok = await call("POST", "/api/practice/check", { module_id: mod.id, item_id: item.id, answer: item.answer }, token);
  assertEquals(ok.data.correct, true);
  assertEquals(ok.data.progress.points_awarded, 10);
  assertEquals(ok.data.progress.streak, 1);
  assert(ok.data.solution);
  const again = await call("POST", "/api/practice/check", { module_id: mod.id, item_id: item.id, answer: item.answer }, token);
  assertEquals(again.data.progress.points_awarded, 0);
  assertEquals(again.data.progress.already_solved, true);

  const p = await call("POST", `/api/modules/${mod.id}/progress`, { step_index: 3 }, token);
  assertEquals(p.data, { ok: true, step_index: 3, lesson_done: false });
  const p2 = await call("POST", `/api/modules/${mod.id}/progress`, { step_index: 1 }, token);
  assertEquals(p2.data.step_index, 3);
  assertEquals((await call("POST", `/api/modules/${mod.id}/progress`, { step_index: 999 }, token)).status, 422);

  const sum = await call("GET", "/api/me/summary", undefined, token);
  assertEquals(sum.data.points, 10);
  assertEquals(sum.data.daily.correct, 1);
  const lb = await call("GET", "/api/leaderboard", undefined, token);
  assert(lb.data.rows.some((r: any) => r.me && r.nickname === "Sobat" && r.points === 10));
  assert(lb.data.rows.every((r: any) => Object.keys(r).sort().join() === "me,nickname,points,rank"));
});

Deno.test("alat: kalkulator fungsi dan galat masukan", async () => {
  const { call, login } = await setup();
  const token = await login("siswa", "siswa123");
  const r = await call("POST", "/api/tools/evaluate", { expr: "2x + 3", x: "4" }, token);
  assertEquals(r.status, 200);
  assertEquals((await call("POST", "/api/tools/evaluate", { expr: "2x + )", x: "4" }, token)).status, 422);
});

Deno.test("Asisten: AI dijaga penjaga jawaban, kuota dihitung", async () => {
  const tutorData = (content as any).tutor;
  const prob = tutorData.problems.find((p: any) => p.steps.some((s: any) => (s.reveal?.numbers || []).length));
  const leakNum = prob.steps.find((s: any) => (s.reveal?.numbers || []).length).reveal.numbers[0];
  let reply = `Jawabannya ${leakNum}.`;
  const { call, login } = await setup({ tutorAI: async () => reply });
  const token = await login("siswa", "siswa123");
  const start = await call("POST", "/api/tutor/turn", { problem_id: prob.id, action: "start" }, token);
  assertEquals(start.status, 200);
  const hint1 = await call("POST", "/api/tutor/turn", { problem_id: prob.id, action: "hint", step: 0 }, token);
  assertEquals(hint1.data.source, "script"); // balasan AI membocorkan angka → dibuang
  reply = "Coba baca lagi soalnya pelan-pelan, ya.";
  const hint2 = await call("POST", "/api/tutor/turn", { problem_id: prob.id, action: "hint", step: 0, hint: 1 }, token);
  assertEquals(hint2.data.source, "ai");
  assertEquals(hint2.data.quota_left, 58);
  assert(!("ai_calls" in hint2.data) && !("ai_error" in hint2.data));
  const status = await call("GET", "/api/tutor/status", undefined, token);
  assertEquals(status.data.remaining, 58);
  const fin = await call("POST", "/api/tutor/finish", { problem_id: prob.id, steps_done: 1, steps_total: prob.steps.length, effort: 3 }, token);
  assertEquals(fin.data, { saved: true });
  assertEquals((await call("POST", "/api/tutor/turn", { problem_id: prob.id, action: "terbang" }, token)).status, 422);
});

Deno.test("Asisten tanpa AI: soal bebas ditolak 503", async () => {
  const { call, login } = await setup();
  const token = await login("siswa", "siswa123");
  const r = await call("POST", "/api/tutor/turn", { problem_id: "bebas", action: "start", problem_text: "Harga 1 buku 3.000, berapa 5 buku?" }, token);
  assertEquals(r.status, 503);
});

Deno.test("guru: kelas, ringkasan, CSV; siswa tidak boleh", async () => {
  const { call, login } = await setup();
  const guru = await login("guru", "guru123");
  const siswa = await login("siswa", "siswa123");
  assertEquals((await call("GET", "/api/teacher/classes", undefined, siswa)).status, 403);
  const classes = await call("GET", "/api/teacher/classes", undefined, guru);
  assertEquals(classes.data[0].student_count, 5);
  const id = classes.data[0].id;
  const patched = await call("PATCH", `/api/teacher/classes/${id}`, { leaderboard_enabled: false }, guru);
  assertEquals(patched.data.leaderboard_enabled, false);
  assertEquals((await call("GET", "/api/leaderboard", undefined, siswa)).data.enabled, false);
  const ov = await call("GET", `/api/teacher/classes/${id}/overview`, undefined, guru);
  assertEquals(ov.data.students.length, 5);
  const csv = await call("GET", `/api/teacher/classes/${id}/export.csv`, undefined, guru);
  assert(String(csv.data).startsWith("﻿Nama panggilan;"));
  assertMatch(csv.headers.get("content-disposition") || "", /relafun_RF8A26\.csv/);
  const other = await call("POST", "/api/auth/register", { username: "guru2", password: "rahasia1", nickname: "Pak Dedi", role: "teacher" });
  assertEquals((await call("GET", `/api/teacher/classes/${id}/overview`, undefined, other.data.token)).status, 404);
  assertEquals((await call("GET", "/api/tutor/summary", undefined, guru)).status, 200);
});

Deno.test("CORS hanya untuk origin yang diizinkan", async () => {
  const { call } = await setup();
  const ok = await call("OPTIONS", "/api/auth/login", undefined, undefined, { Origin: "https://contoh.github.io" });
  assertEquals(ok.status, 204);
  assertEquals(ok.headers.get("access-control-allow-origin"), "https://contoh.github.io");
  const bad = await call("GET", "/api/health", undefined, undefined, { Origin: "https://jahat.example" });
  assertEquals(bad.headers.get("access-control-allow-origin"), null);
});

Deno.test("streak: hari berikutnya bertambah, lewat sehari kembali ke 1", async () => {
  let t = new Date("2026-11-25T03:00:00Z");
  const { call, login } = await setup({ now: () => t });
  const token = await login("siswa", "siswa123");
  const items = (content as any).modules.flatMap((m: any) => (m.items || []).filter((it: any) => it.type === "mcq").map((it: any) => [m.id, it]));
  const solve = async (i: number) =>
    (await call("POST", "/api/practice/check", { module_id: items[i][0], item_id: items[i][1].id, answer: items[i][1].answer }, token)).data.progress;
  assertEquals((await solve(0)).streak, 1);
  t = new Date("2026-11-26T03:00:00Z");
  assertEquals((await solve(1)).streak, 2);
  t = new Date("2026-11-28T03:00:00Z");
  assertEquals((await solve(2)).streak, 1);
});
