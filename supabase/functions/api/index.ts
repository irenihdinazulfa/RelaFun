// Titik masuk Supabase Edge Function `api` (https://<ref>.supabase.co/functions/v1/api/...).
// Semua endpoint /api/* RelaFun ada di app.ts. Database: PostgreSQL Supabase (SUPABASE_DB_URL otomatis).
// Secrets (diisi dengan `supabase secrets set`, tidak pernah di GitHub): SECRET_KEY, GEMINI_API_KEY, dll.
// Lihat docs/20-SUPABASE.md.
import { createApp } from "./app.ts";
import { postgresDb } from "./db.ts";

const dbUrl = Deno.env.get("RELAFUN_DB_URL") || Deno.env.get("SUPABASE_DB_URL") || "";
if (!dbUrl) console.error("SUPABASE_DB_URL tidak tersedia: fungsi tidak bisa membuka database.");

const handler = createApp({ db: postgresDb(dbUrl), env: (name) => Deno.env.get(name) });

Deno.serve(handler);
