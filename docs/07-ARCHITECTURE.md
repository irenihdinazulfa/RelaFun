# 07 — Arsitektur & Model Data

## 1. Gambaran

```
 Peramban / PWA (Android, iOS, Windows, macOS)
 ┌──────────────────────────────────────────┐
 │ apps/web  — JavaScript (ES modules)      │  tanpa proses build
 │  views/  components/  sw.js (cache)      │
 └───────────────┬──────────────────────────┘
                 │ HTTP/JSON  (Bearer JWT)
 ┌───────────────▼──────────────────────────┐
 │ apps/api — Python FastAPI                │
 │  routers/ auth · learn · tools · teacher │
 │  core/   mathfn (SymPy) · checker ·      │
 │          modeler · ai · progress ·       │
 │          content · security              │
 └──────┬───────────────┬───────────────────┘
        │               │ (opsional, bila kunci diisi)
   SQLite (SQLAlchemy)   Claude API (claude-opus-5-5)
        │
   content/*.json (materi, glosarium, preset)
```

Satu proses `uvicorn` menyajikan API (`/api/*`) **dan** aplikasi web (`/`). Cukup Python 3.10+.

## 1b. Dua mode jalan

| Mode | Cara | Penilaian & data | Untuk |
|---|---|---|---|
| **Server** | `start.bat` / Render | FastAPI + SymPy + SQLite di server | Satu kelas sungguhan, dashboard guru bersama, mode AI |
| **Tanpa server (GitHub Pages)** | `python scripts/deploy_pages.py` → https://irenihdinazulfa.github.io/RelaFun/ | `js/local/*` di peramban; data di `localStorage` perangkat | Demo, siswa mandiri, luring |

Frontend sama persis. `config.js` menentukan mode (`window.RELAFUN_STATIC`). Pada mode tanpa server, `api.js` meneruskan setiap panggilan `/api/*` ke `js/local/backend.js`, yang meniru endpoint FastAPI. Mesin hitung JavaScript (`js/local/mathfn.js`, `checker.js`, `modeler.js`, `rational.js` dengan pecahan BigInt) adalah padanan 1:1 dari versi Python. Keduanya diuji silang dengan 1.209 kasus dan hasilnya identik (`docs/10-TEST-PLAN.md`).

## 2. Keputusan arsitektur

| Keputusan | Alasan |
|---|---|
| Frontend JavaScript tanpa build (bukan React+Vite) | Komputer pengembang belum memiliki Node.js; tanpa build berarti siapa pun dapat menjalankan dengan Python saja. Struktur `views/` + `components/` tetap modular dan dapat dipindah ke React nanti. |
| PWA, bukan APK/IPA | Dapat dipasang dari peramban tanpa Play Store/App Store di semua platform. |
| SymPy untuk semua penilaian | Deterministik, dapat diuji; AI tidak pernah menentukan benar/salah. |
| SQLite | Cukup untuk satu sekolah, tanpa server basis data; dapat diganti lewat `DATABASE_URL`. |
| Konten JSON | Guru/pengembang konten dapat menambah soal tanpa mengubah kode. |
| Token JWT di `localStorage` | Sederhana untuk PWA; risiko dimitigasi dengan tidak menyimpan data sensitif dan masa berlaku 7 hari. |

## 3. Modul backend

| Modul | Tugas |
|---|---|
| `core/mathfn.py` | Baca angka & rumus format Indonesia (aman: daftar karakter yang diizinkan), kalkulator langkah demi langkah, analisis relasi, diagnosis kesalahan nilai fungsi |
| `core/checker.py` | Menilai 7 jenis soal dan membuat umpan balik |
| `core/modeler.py` | Model f(x) = ax + b: evaluate, compare, threshold, solve_for_x + verifikasi V1–V6 |
| `core/ai.py` | Memanggil Claude dengan *structured output*; hanya mengembalikan spesifikasi model |
| `core/progress.py` | Poin, streak, sasaran harian, kuota AI, statistik modul |
| `core/content.py` | Memuat JSON & menyembunyikan kunci jawaban |
| `core/security.py` | Hash PBKDF2-SHA256 (200.000 iterasi), JWT HS256 |

## 4. Model data

```
classrooms(id, name, code UNIQUE, teacher_id → users, leaderboard_enabled, ai_enabled, created_at)
users(id, username UNIQUE, password_hash, role[student|teacher], nickname, class_id → classrooms,
      points, streak, last_active_date, created_at)
attempts(id, user_id → users, module_id, item_id, correct, error_type, answer, points, created_at)
module_progress(id, user_id, module_id, step_index, lesson_done, updated_at)  UNIQUE(user_id, module_id)
daily_stats(id, user_id, date, correct_count, points, ai_calls)               UNIQUE(user_id, date)
```

- Tidak ada e-mail, nomor HP, tanggal lahir, atau nama lengkap.
- `attempts.error_type` dipakai dashboard guru (jenis kesalahan).

## 5. Alur penilaian satu soal

```
Siswa menekan Periksa
  → POST /api/practice/check {module_id, item_id, answer, attempt}
  → content.get_item()  (kunci jawaban hanya di server)
  → checker.check()     (SymPy / analyze_relation / pemetaan)
  → bila format salah: kembalikan pesan, TIDAK dicatat
  → progress.record_attempt()  (poin sekali per soal, streak, sasaran harian)
  → bila benar atau percobaan ke-2: sertakan pembahasan & jawaban
```

## 6. Alur pemodel AI

```
teks soal → (cek: kunci ada? kelas mengizinkan? kuota?) → Claude (structured output JSON)
  → to_spec() validasi Pydantic (V1) → verify_spec() V2–V6 → solve() SymPy → tampilkan
```

## 7. Struktur folder

```
iren_ihdina_zulfa/
├── start.bat                  # jalankan (Windows)
├── scripts/start.ps1 · start.sh
├── apps/api/                  # backend Python + tes
├── apps/web/                  # aplikasi web (PWA)
├── content/                   # materi JSON
├── docs/                      # dokumen perencanaan
├── referensi/                 # transkrip wawancara & lembar soal (.docx)
├── README.md · CLAUDE.md · RIWAYAT_BANTUAN.md · .env.example
```
