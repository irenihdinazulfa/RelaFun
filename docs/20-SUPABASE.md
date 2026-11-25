# 20 — Backend dan Database di Supabase

RelaFun versi online (GitHub Pages) bisa memakai **Supabase** sebagai backend dan database:

| Bagian | Di Supabase | Isi |
|---|---|---|
| Database | PostgreSQL (`supabase/migrations/`) | akun (nama panggilan), kelas, percobaan soal, kemajuan, statistik harian, log Asisten |
| Backend | Edge Function `api` (`supabase/functions/api/`) | semua endpoint `/api/*`: login, materi, latihan, papan peringkat, alat, Asisten Belajar (Gemini), dashboard guru |
| Rahasia | Secrets Supabase | `SECRET_KEY`, `GEMINI_API_KEY`, (opsional) `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` |

Tanpa Supabase, versi GitHub Pages tetap berjalan seperti sebelumnya (data hanya di perangkat siswa).

## Cara kerjanya

```
Peramban (GitHub Pages)  ──HTTPS──▶  Supabase Edge Function "api" (TypeScript/Deno)
  window.RELAFUN_API_URL               ├─ mesin penilaian: salinan apps/web/js/local/*.js (sama dengan Python)
                                       ├─ Gemini/DeepSeek/Claude: kunci di Secrets, tidak ke peramban
                                       └─ PostgreSQL Supabase (RLS aktif, tertutup untuk Data API publik)
```

- **Mesin penilaian tetap satu sumber.** Fungsi memakai salinan `apps/web/js/local/{rational,mathfn,checker,modeler,tutor,ai}.js`
  dan `content/` yang dibuat oleh `python scripts/sync_supabase.py` ke `supabase/functions/api/_gen/`. Jangan mengubah
  berkas di `_gen/`; ubah sumbernya, lalu jalankan skrip itu. Tes `test_supabase.py` gagal bila salinan usang.
- **Kunci jawaban** hanya ada di sisi fungsi; peramban menerima soal tanpa kolom `SECRET_FIELDS`.
- **Login tanpa e-mail** (privasi anak): token JWT HS256 buatan RelaFun, sama dengan server Python. Karena itu fungsi
  dipasang dengan `verify_jwt = false` (`supabase/config.toml`); pemeriksaan token ada di `security.ts`.
- **Kata sandi** di-hash PBKDF2 dengan format yang sama dengan `apps/api/app/core/security.py`. Akun yang dibuat lewat
  server Python bisa login di Supabase, dan sebaliknya.
- **Keamanan data:** semua tabel memakai Row Level Security tanpa kebijakan, dan hak `anon`/`authenticated` dicabut.
  Artinya kunci *anon* Supabase **tidak** bisa membaca data siswa; hanya fungsi `api` yang bisa.

## Langkah memasang (sekali saja)

### 1. Buat proyek Supabase

1. Masuk ke https://supabase.com, lalu pilih **New project**.
2. **Region:** pilih *Southeast Asia (Singapore)*, yang paling dekat dengan Indonesia.
3. Simpan **Database Password** di tempat aman. Jangan menaruhnya di GitHub atau di chat.
4. Catat **Project ref**, yaitu bagian acak di alamat proyek (`https://<ref>.supabase.co`).

> Paket gratis: proyek **dijeda otomatis bila 7 hari tidak dipakai**. Buka dashboard Supabase lalu pilih *Restore*
> untuk menyalakannya lagi. Data tidak hilang.

### 2. Pasang Supabase CLI

Supabase CLI adalah satu program `.exe`. Pilih salah satu cara:

- Unduh `supabase_windows_amd64.tar.gz` dari https://github.com/supabase/cli/releases, ekstrak, lalu taruh
  `supabase.exe` di folder yang ada di PATH. Atau
- dengan Scoop: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` lalu `scoop install supabase`.

Periksa dengan `supabase --version`.

### 3. Hubungkan folder proyek dan buat tabel

Jalankan dari folder proyek (`iren_ihdina_zulfa`):

```powershell
supabase login                               # membuka browser untuk masuk
supabase link --project-ref <ref>            # minta Database Password dari langkah 1
supabase db push                             # membuat tabel + akun demo (supabase/migrations)
```

### 4. Isi Secrets (kunci hanya di Supabase)

```powershell
supabase secrets set SECRET_KEY=<isi SECRET_KEY dari file .env>
supabase secrets set TUTOR_AI_PROVIDER=gemini GEMINI_API_KEY=<kunci Gemini dari Google AI Studio>
supabase secrets set ALLOWED_ORIGINS=https://irenihdinazulfa.github.io,http://relafun.localhost
```

- Pakai `SECRET_KEY` yang **sama** dengan file `.env` supaya token login dari server lokal juga berlaku di Supabase.
  Kalau `.env` masih kosong, buat kunci acak yang panjang.
- Opsional: `ANTHROPIC_API_KEY` (Pemodel Soal Cerita, berbayar), `DEEPSEEK_API_KEY`, `TUTOR_DAILY_QUOTA` (bawaan 60),
  `AI_DAILY_QUOTA` (bawaan 10), `DAILY_GOAL` (bawaan 5), `RELAFUN_TIMEZONE` (bawaan `Asia/Jakarta`).
- `SUPABASE_DB_URL` **tidak perlu** diisi karena Supabase menyediakannya otomatis untuk fungsi.
- Periksa nama yang tersimpan dengan `supabase secrets list`. Isinya tidak ditampilkan.

### 5. Terbitkan fungsi `api`

```powershell
python scripts/sync_supabase.py              # salin mesin + konten terbaru ke supabase/functions/api/_gen
supabase functions deploy api --use-api      # tanpa Docker
```

Uji di peramban: `https://<ref>.supabase.co/functions/v1/api/health` harus menampilkan
`{"ok":true,"backend":"supabase",...,"tutor_ai_configured":true,...}`.

### 6. Sambungkan GitHub Pages ke Supabase

1. Buat berkas `scripts/supabase_url.txt` berisi satu baris:
   `https://<ref>.supabase.co/functions/v1`
2. Terbitkan ulang: `python scripts/deploy_pages.py`.
3. Buka https://irenihdinazulfa.github.io/RelaFun/ lalu masuk dengan akun demo `siswa` / `siswa123`. Kemajuan sekarang
   tersimpan di Supabase, jadi tetap ada walaupun pindah HP atau browser.

Untuk kembali ke mode tanpa server, kosongkan atau hapus `scripts/supabase_url.txt`, lalu terbitkan ulang.

## (Opsional) Frontend di Netlify

Frontend yang sama juga bisa ditayangkan di Netlify. Netlify menjalankan `python3 scripts/build_static.py dist`
(lihat `netlify.toml`) setiap kali ada push ke `main`, dan hasilnya otomatis memakai backend Supabase.

1. Masuk ke https://app.netlify.com dengan akun GitHub.
2. Pilih **Add new project → Import an existing project → GitHub**, lalu pilih repo **RelaFun**.
   Pengaturan build terbaca dari `netlify.toml`, jadi tidak perlu diubah. Klik **Deploy**.
3. (Opsional) Ganti nama situs di **Project configuration → Change project name**, misalnya `relafun`, sehingga
   alamatnya menjadi `https://relafun.netlify.app`.
4. **Izinkan alamat Netlify di backend.** Di dashboard Supabase, buka **Edge Functions → Secrets**, ubah
   `ALLOWED_ORIGINS`, lalu tambahkan alamat Netlify di belakangnya (dipisah koma, tanpa `/` di akhir):
   `https://irenihdinazulfa.github.io,http://relafun.localhost,http://localhost:8000,https://relafun.netlify.app`
   Tanpa langkah ini, login di situs Netlify gagal dengan pesan *"Tidak dapat terhubung ke server"*.

## (Opsional) Server lokal memakai database yang sama

`start.bat` bisa menyimpan data ke Supabase juga. Caranya:

1. Di Supabase, buka **Connect**, pilih **Session pooler** (port 5432), lalu salin alamatnya.
2. Di file `.env`, isi:
   `DATABASE_URL=postgresql://postgres.<ref>:<kata-sandi>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
   Karakter khusus di kata sandi harus diubah: `@`→`%40`, `#`→`%23`, `/`→`%2F`, `?`→`%3F`.
3. Jalankan `start.bat` seperti biasa. Server Python dan Supabase kini melihat akun dan kemajuan yang sama.

## Menghapus akun demo (untuk pemakaian sungguhan)

Di Supabase, buka **SQL Editor** lalu jalankan:

```sql
delete from attempts where user_id in (select id from users where username in ('siswa','demo1','demo2','demo3','demo4'));
delete from daily_stats where user_id in (select id from users where username in ('siswa','demo1','demo2','demo3','demo4'));
delete from module_progress where user_id in (select id from users where username in ('siswa','demo1','demo2','demo3','demo4'));
delete from tutor_usage where user_id in (select id from users where username in ('siswa','demo1','demo2','demo3','demo4'));
delete from tutor_logs where user_id in (select id from users where username in ('siswa','demo1','demo2','demo3','demo4'));
delete from users where username in ('siswa','demo1','demo2','demo3','demo4');
```

Akun `guru` dan kelas `RF8A26` bisa dibiarkan, atau kata sandinya diganti lewat pendaftaran guru baru.
Kalau server lokal juga memakai database ini, isi `SEED_DEMO=0` di `.env` agar akun demo tidak dibuat lagi.

## Menguji backend Supabase

- `cd apps\api && .venv\Scripts\python -m pytest -q` memeriksa salinan mesin, kecocokan skema dengan model SQLAlchemy,
  RLS, dan tidak adanya kunci API di folder `supabase/`.
- Uji endpoint (butuh [Deno](https://deno.com)): `deno test -A supabase/functions/api/app_test.ts`. Tes ini menjalankan
  migrasi sungguhan di PGlite (PostgreSQL di memori), lalu menguji login, latihan, poin, streak, Asisten (penjaga
  jawaban dan kuota), dashboard guru, CSV, dan CORS.

## Setiap kali mesin atau konten berubah

1. Ubah sumbernya (`apps/api/app/core/*.py` **dan** `apps/web/js/local/*.js`, sesuai aturan 11, atau `content/`).
2. `python scripts/sync_supabase.py`
3. `supabase functions deploy api --use-api`
4. Bila ada perubahan tampilan: `python scripts/deploy_pages.py`
