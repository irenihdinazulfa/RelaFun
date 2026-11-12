# 09 — Keamanan & Privasi

Pengguna utama adalah **anak usia 13–14 tahun**. Prinsip yang dipakai: data seminimal mungkin (UU No. 27/2022 tentang Pelindungan Data Pribadi, khususnya data anak).

## 1. Data yang disimpan

| Data | Alasan | Catatan |
|---|---|---|
| Nama panggilan | ditampilkan ke guru & teman | disarankan bukan nama lengkap |
| Nama pengguna & hash kata sandi | login | PBKDF2-SHA256, 200.000 iterasi, garam acak |
| Kelas | menghubungkan siswa–guru | lewat kode kelas |
| Jawaban & kemajuan | umpan balik & dashboard guru | maks. 500 karakter per jawaban |

**Tidak disimpan:** e-mail, nomor HP, tanggal lahir, foto, lokasi.

## 2. Pengendalian

- Kunci jawaban hanya di server; endpoint publik membuang kolom rahasia (diuji otomatis).
- Guru hanya dapat melihat kelas miliknya (diuji: akses kelas lain → 404).
- Papan peringkat hanya nama panggilan; dapat dimatikan guru.
- Token JWT (HS256) berlaku 7 hari; kunci rahasia dibuat acak saat pertama dijalankan (`apps/api/data/.secret_key`) atau diisi lewat `SECRET_KEY`.
- Masukan rumus diperiksa dengan **daftar karakter yang diizinkan** (`0-9 x + - * / ^ ( ) . ,`) dan pangkat ≤ 3 sebelum diproses SymPy, untuk mencegah eksekusi kode dan beban berlebih (diuji dengan masukan berbahaya).
- Batas panjang di semua masukan (Pydantic).

## 3. Fitur AI

- **Nonaktif bawaan.** Aktif hanya bila server punya `ANTHROPIC_API_KEY` **dan** guru menyalakannya untuk kelas.
- Yang dikirim ke Claude **hanya teks soal cerita** (maks. 1.500 karakter), tanpa identitas siswa.
- Kuota 10 analisis/siswa/hari untuk membatasi biaya.
- Hasil AI tidak pernah langsung dianggap benar: diverifikasi V1–V6 dan dihitung SymPy.
- Penolakan (*refusal*), galat jaringan, dan kuota habis ditampilkan sebagai pesan ramah; siswa diarahkan ke mode terpandu.

## 4. Penerapan (deploy) yang disarankan

- Wajib **HTTPS** bila dipakai di luar jaringan lokal (syarat PWA & keamanan token).
- Isi `SECRET_KEY` sendiri dan setel `SEED_DEMO=0` agar akun demo tidak dibuat.
- Cadangkan `apps/api/data/relafun.db` secara berkala.

## 5. Untuk penelitian

Transkrip wawancara memuat nama narasumber. Dalam dokumen proyek narasumber disebut **S01**. Simpan berkas asli di tempat terbatas dan minta persetujuan sekolah/orang tua sebelum uji coba aplikasi dengan siswa.
