# 08 — Spesifikasi API

Basis: `http://<host>:8000`. Dokumentasi interaktif otomatis: **`/api/docs`** (Swagger).
Semua endpoint kecuali login/daftar/glosarium/health memerlukan header `Authorization: Bearer <token>`.
Galat dikembalikan sebagai `{"detail": "pesan berbahasa Indonesia"}`.

## Autentikasi

| Metode | Path | Body | Keterangan |
|---|---|---|---|
| POST | `/api/auth/login` | `{username, password}` | → `{token, user}` |
| POST | `/api/auth/register` | `{username, password, nickname, class_code?, role, class_name?}` | role `student`/`teacher`; guru otomatis mendapat kelas |
| GET | `/api/auth/me` | — | profil + kelas |
| POST | `/api/auth/join-class` | `{class_code}` | siswa bergabung/pindah kelas |

## Belajar

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/api/modules` | ringkasan 13 modul + statistik pengguna |
| GET | `/api/modules/{id}` | isi modul **tanpa kunci jawaban** |
| POST | `/api/modules/{id}/progress` | `{step_index, lesson_done}` |
| POST | `/api/practice/check` | `{module_id, item_id, answer, attempt}` → `{correct, feedback, error_type, error_label, highlight?, wrong?, solution?, progress{points_awarded, total_points, streak, daily}}` |
| GET | `/api/me/summary` | poin, streak, sasaran harian, materi untuk dilanjutkan, semua modul |
| GET | `/api/leaderboard` | `{enabled, class_name, rows[{rank, nickname, points, me}]}` |
| GET | `/api/glossary` | daftar istilah |

Format `answer` per jenis soal: `mcq` → indeks; `multi` → [indeks]; `numeric`/`expression` → teks; `is_function` → boolean; `dnd` → `{chipId: binId}`; `arrows` → `[[kiri, kanan], …]`.

## Alat

| Metode | Path | Body | Keterangan |
|---|---|---|---|
| POST | `/api/tools/evaluate` | `{expr, x, name}` | langkah kalkulator; 422 bila rumus tidak valid |
| POST | `/api/tools/relation` | `{domain[], codomain[], pairs[][]}` | fungsi/bukan + domain/kodomain/range |
| GET | `/api/tools/modeler/presets` | — | 6 soal cerita |
| POST | `/api/tools/modeler/solve` | `ModelSpec` | mode terpandu |
| GET | `/api/tools/modeler/ai-status` | — | `{configured, class_enabled, available, daily_quota}` |
| POST | `/api/tools/modeler/ai` | `{text}` | 503 kunci belum diisi · 403 kelas belum mengizinkan · 429 kuota habis · 502 galat layanan AI |

`ModelSpec`:
```json
{
  "variable_meaning": "jarak perjalanan", "variable_unit": "km", "output_unit": "rupiah",
  "models": [{"name": "f", "label": "Ongkos taksi", "a": 4500, "b": 8000}],
  "task": {"type": "evaluate|compare|threshold|solve_for_x", "x": 10, "op": "<=", "target": 50000, "integer_x": false}
}
```

## Guru

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/api/teacher/classes` | kelas milik guru |
| POST | `/api/teacher/classes` | `{name}` buat kelas |
| PATCH | `/api/teacher/classes/{id}` | `{leaderboard_enabled?, ai_enabled?, name?}` |
| GET | `/api/teacher/classes/{id}/overview` | siswa, akurasi per modul, jenis kesalahan, soal tersulit |
| GET | `/api/teacher/classes/{id}/export.csv` | CSV (pemisah `;`, UTF-8 BOM) |

## Lain-lain

| GET | `/api/health` | `{ok, ai_configured}` |
|---|---|---|
