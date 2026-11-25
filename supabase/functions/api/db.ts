// Akses database untuk backend Supabase. Antarmuka kecil agar kode yang sama bisa diuji dengan
// PGlite (PostgreSQL di memori, lihat app_test.ts) dan berjalan dengan postgres.js di Supabase.
import postgres from "npm:postgres@3.4.5";

// deno-lint-ignore no-explicit-any
export type Row = Record<string, any>;

export interface Db {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Jalankan `fn` dalam satu transaksi (di dalam transaksi: langsung memakai transaksi yang sama). */
  begin<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
}

/** Koneksi ke database Supabase. SUPABASE_DB_URL disediakan otomatis untuk Edge Function. */
export function postgresDb(url: string): Db {
  // prepare: false — wajib untuk pooler Supabase (mode transaksi) dan aman untuk koneksi langsung.
  const sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 });
  // deno-lint-ignore no-explicit-any
  const wrap = (s: any, inTx: boolean): Db => ({
    query: async (text, params = []) => [...(await s.unsafe(text, params))],
    // deno-lint-ignore no-explicit-any
    begin: (fn) => (inTx ? fn(wrap(s, true)) : (sql.begin((tx: any) => fn(wrap(tx, true))) as Promise<any>)),
  });
  return wrap(sql, false);
}
