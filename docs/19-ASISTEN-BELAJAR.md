# 19 — Asisten Belajar (chatbot RMT + Gemini/DeepSeek)

Halaman `#/asisten` (menu bawah **Asisten**). Asisten ini adalah chatbot pedagogis yang membimbing soal Mathematical Literacy selangkah demi selangkah menurut model **Rigorous Mathematical Thinking** (lihat [18-RINGKASAN-RMT.md](18-RINGKASAN-RMT.md)). Pengelolaan beban kognitifnya dijelaskan di bagian 3.

Balasan AI bisa memakai **Gemini** (Google, ada tingkat gratis) atau **DeepSeek**. Penyedianya dipilih dengan satu baris di file `.env` server (bagian 4). Cara kerja pedagogisnya sama untuk keduanya.

## 1. Arahan dosen dan cara memenuhinya

| Arahan | Penerapan |
|---|---|
| Membimbing masalah Mathematical Literacy secara bertahap | 4 soal lembar ML dipecah menjadi 32 langkah dalam 6 tahap RMT. Satu langkah ditampilkan setiap giliran. |
| Mengelola beban intrinsik, ekstrinsik, dan germane | Lihat bagian 3 |
| Petunjuk sesuai kesulitan, bukan jawaban akhir | Petunjuk 3 tingkat yang naik otomatis setiap kali salah atau saat siswa mengetuk **Aku bingung**. Ada 32 pola kesalahan khas siswa dengan umpan balik khusus. Penjaga jawaban membuang balasan AI yang membocorkan jawaban. |
| Menerapkan tahapan RMT | Penanda 6 tahap, fungsi kognitif dan alat berpikir di setiap langkah, mediasi MLE, refleksi, dan transendensi |
| Kunci API tidak boleh di frontend atau GitHub; gunakan `.env` di backend | Kunci hanya dibaca dari `.env` oleh server (`GEMINI_API_KEY` atau `DEEPSEEK_API_KEY`). `.env` tercantum di `.gitignore`. Tes otomatis memastikan kunci tidak pernah muncul di respons API. |
| Tetap memakai repository lama, dengan commit jelas | Dikerjakan di repository `RelaFun` yang sama |

## 2. Alur satu giliran

```
Siswa mengetik ─▶ server: check_step() ──▶ BENAR  → pujian + langkah berikutnya
                   (mesin, deterministik) └▶ BELUM  → tingkat bantuan naik (1→2→3)
                                                     + catatan kesalahan khas
        ┌──────────── bila kunci AI terisi di .env & kuota masih ada ──────────────────┐
        │ Gemini/DeepSeek menulis kalimat mediasi berdasarkan KONTEKS: tahap RMT,      │
        │ langkah, fungsi kognitif, hasil mesin, tingkat bantuan, dan bahan petunjuk.  │
        │ Kunci jawaban TIDAK dikirim ke AI.                                           │
        │ leaks(): bila balasan memuat jawaban langkah sekarang/berikutnya → dibuang   │
        └──────────────────────────────────────────────────────────────────────────────┘
        tanpa AI / AI gagal / kuota habis → petunjuk tertulis (hasil tetap sama)
```

- **Pertanyaan** (diakhiri `?`, atau diawali "apa itu…", "kenapa…") tidak dihitung sebagai percobaan. Istilah dijelaskan dari glosarium asisten, lalu siswa diajak kembali ke langkahnya.
- **"Aku bingung"** menaikkan tingkat bantuan tanpa menambah hitungan percobaan.
- **Lanjut** baru muncul setelah 3 kali mencoba, supaya siswa tidak terjebak.
- **Akhir sesi**: skala usaha berpikir 1–5 (skala usaha mental seperti Paas), lalu ringkasan berisi waktu, petunjuk, langkah dilewati, dan fungsi kognitif yang dilatih. Data ini muncul di Dashboard Guru.
- **Soal Bebas** (khusus versi server dengan AI): siswa menulis soal sendiri. Wen membimbing per tahap, dan siswa menekan **Tahap berikutnya** untuk maju.

## 3. Pengelolaan beban kognitif (CLT)

| Jenis beban | Strategi di Asisten | Temuan yang dijawab |
|---|---|---|
| **Intrinsik** (kerumitan materi) | Segmentasi: satu langkah per giliran. Petunjuk bertingkat. Contoh serupa dengan angka berbeda di tingkat 3. Model fungsi dibangun dulu sebelum menghitung. | IL01–IL03; Soal 1 S01 yang langsung menghitung tanpa bentuk umum |
| **Ekstrinsik** (cara penyajian) | Soal selalu tampil di atas percakapan sehingga tidak perlu bolak-balik. Kalimat pendek dengan satu pertanyaan, maksimal 40 kata per perintah dan 60 kata per petunjuk (diuji otomatis). Istilah bisa diketuk. | EL01, EL03 |
| **Germane** (membangun skema) | Fungsi kognitif dan alat berpikir disebut di setiap langkah. Bukti logis diminta. Refleksi dan pertanyaan transfer di akhir. Pemeriksaan kewajaran h(3) dan h(4). | GL02, GL03; Soal 4 S01 yang tidak memeriksa kewajaran |

## 4. Mengaktifkan AI (versi server)

Buka file **`.env`** di folder proyek (dibuat otomatis oleh `start.bat` dari `.env.example`), isi salah satu pilihan di bawah, lalu jalankan ulang `start.bat` dan buka http://relafun (atau http://localhost:8000) → **Asisten**. Tanda di kanan atas berubah menjadi **AI Gemini aktif** atau **AI DeepSeek aktif**.

**Pilihan A — Gemini (gratis, dipakai saat ini):**

1. Buat kunci di https://aistudio.google.com/apikey (masuk dengan akun Google).
2. Isi di `.env`:
   ```
   TUTOR_AI_PROVIDER=gemini
   GEMINI_API_KEY=...kunci-milikmu...
   ```
   Nilai bawaan lainnya: `GEMINI_MODEL=gemini-3.5-flash-lite` dan `GEMINI_REASONING=minimal`, supaya balasan cepat (sekitar 1 detik).

**Pilihan B — DeepSeek (berbayar):**

1. Buat kunci di https://platform.deepseek.com/api_keys dan isi saldo.
2. Isi di `.env`:
   ```
   TUTOR_AI_PROVIDER=deepseek
   DEEPSEEK_API_KEY=sk-...kunci-milikmu...
   ```
   Nilai bawaannya `DEEPSEEK_MODEL=deepseek-flash` dan `DEEPSEEK_THINKING=disabled`.

Jika `TUTOR_AI_PROVIDER` dikosongkan, server memakai DeepSeek bila kuncinya ada, lalu Gemini. `TUTOR_DAILY_QUOTA=60` membatasi balasan AI per siswa per hari. Setelah kuota habis, atau bila AI gagal dan menolak, asisten otomatis memakai petunjuk tertulis.

> ⚠️ Jangan pernah menempel kunci di kode, di `.env.example`, atau di GitHub. Hanya di `.env`.

Versi GitHub Pages tidak punya backend, jadi asisten di sana berjalan dalam **mode terpandu** dengan petunjuk tertulis yang sama, tanpa AI. Pemeriksaannya identik dengan versi server: 1.698 kasus uji silang Python = JavaScript.

### Catatan aturan layanan Gemini

Ketentuan Gemini API (https://ai.google.dev/gemini-api/terms) menyebut:

- pengguna API harus **berusia 18 tahun ke atas**;
- API tidak boleh dipakai di aplikasi yang **ditujukan untuk, atau kemungkinan besar dipakai oleh, orang di bawah 18 tahun**;
- pada layanan **gratis**, isi permintaan dan balasan dapat dipakai Google untuk mengembangkan produknya dan dibaca peninjau manusia.

RelaFun ditujukan untuk siswa SMP. Karena itu, Gemini gratis sebaiknya hanya dipakai pengembang (dewasa) untuk pengembangan dan demonstrasi kepada dosen. Sebelum dipakai siswa sungguhan, pertimbangkan pilihan B atau mode terpandu tanpa AI, dan diskusikan dengan dosen.

Aplikasi tidak pernah mengirim nama atau data pribadi siswa ke AI (bagian 5).

## 4a. AI di versi online tanpa kunci (GitHub Pages + server Vercel)

Siswa yang membuka https://irenihdinazulfa.github.io/RelaFun/ langsung mendapat balasan AI, tanpa menempel kunci apa pun:

```
Peramban (GitHub Pages) ──POST /api/public/tutor/turn──▶ Server ringan di Vercel ──▶ Gemini
  mesin tutor.js (cadangan)       (CORS: hanya origin GitHub Pages)   kunci GEMINI_API_KEY di env Vercel
```

- **Kunci hanya di server** (Environment Variables Vercel), tidak di GitHub dan tidak di peramban. Ini sesuai arahan dosen.
- **Server ringan** `server.py` + `app/public_app.py`:
  - isinya hanya Asisten publik: `GET /api/public/tutor/status`, `POST /api/public/tutor/turn` (`app/routers/public_tutor.py`), dan `/api/health`;
  - tanpa database dan tanpa akun, sehingga cocok untuk layanan serverless gratis;
  - pemeriksaan jawaban tetap oleh mesin.
- **Batas kuota:**
  - 60 balasan AI per alamat IP per hari, dan 1.500 per hari untuk semua pengguna (`PUBLIC_TUTOR_PER_IP`, `PUBLIC_TUTOR_DAILY_TOTAL`);
  - penghitungnya disimpan di memori server, jadi di serverless angkanya perkiraan;
  - setelah kuota habis, Wen memakai petunjuk tertulis.
- **Server lambat bangun atau gagal:**
  - halaman menampilkan "AI sedang disiapkan…", dan siswa tetap bisa mulai dengan petunjuk tertulis;
  - peramban memeriksa lagi paling cepat tiap 10 detik;
  - bila server gagal di tengah sesi, mesin JavaScript di peramban melanjutkan langkah yang sama. Hasilnya identik, karena mesin Python dan JavaScript diuji silang pada 1.698 kasus.
- **Model:** `gemini-3.5-flash-lite`, sekitar 1 detik per balasan. Hasil uji model lain pada 18 November 2026 dengan kunci gratis:
  - `gemini-3.8-flash` ditolak dengan kode 503 (sedang sangat sibuk);
  - `gemini-3.5-flash` dan `gemini-3.6-flash` butuh lebih dari 40 detik.

  Model bisa diganti lewat variabel `GEMINI_MODEL` di Vercel.

**Server yang aktif:** https://rela-fun-ivory.vercel.app (proyek Vercel `rela-fun`, dipasang 18 November 2026; alamatnya tercatat di `scripts/ai_url.txt`).

**Langkah memasang server di Vercel** (sekali saja, gratis tanpa kartu):

1. Buka https://vercel.com/signup, pilih **Hobby** (gratis, tanpa kartu), lalu **Continue with GitHub** dengan akun pemilik repo RelaFun.
2. Di dasbor Vercel, klik **Add New… → Project**. Pada daftar repo GitHub, klik **Import** di **RelaFun**. Bila repo tidak muncul, klik *Adjust GitHub App Permissions* dan beri akses ke repo RelaFun.
3. Di halaman *Configure Project*:
   - biarkan *Root Directory* `./`;
   - buka **Environment Variables**;
   - isi *Key* `GEMINI_API_KEY` dan *Value* dengan kunci dari https://aistudio.google.com/apikey (bukan di GitHub, bukan di chat);
   - klik **Add**.
4. Klik **Deploy** dan tunggu 1–2 menit. Alamat server tampil di halaman proyek (*Domains*), misalnya `https://relafun.vercel.app`.
5. Tulis alamat itu di `scripts/ai_url.txt`, lalu jalankan `python scripts/deploy_pages.py`. Asisten di versi GitHub Pages sekarang memakai AI dari server tersebut.

**Pilihan lain: Render** (`render.yaml`). Render menjalankan server lengkap (akun, dashboard guru, AI), tetapi meminta kartu kredit untuk verifikasi identitas (otorisasi sementara $1) dan tidur setelah 15 menit tanpa kunjungan.

## 5. Format panggilan AI

Kedua penyedia dipanggil dengan format **kompatibel OpenAI**: `POST {base}/chat/completions`, header `Authorization: Bearer <kunci dari .env>`.

| | Gemini | DeepSeek |
|---|---|---|
| Alamat dasar | `https://generativelanguage.googleapis.com/v1beta/openai` | `https://api.deepseek.com` |
| Model bawaan | `gemini-3.5-flash-lite` | `deepseek-flash` |
| Pengatur berpikir | `"reasoning_effort": "minimal"` | `"thinking": {"type": "disabled"}`, `temperature` 0,5 |
| `max_tokens` | 1024 (token berpikir ikut dihitung) | 400 |
| Pesan sistem | aturan mediator dan KONTEKS digabung menjadi **satu** pesan sistem | dua pesan sistem |

Isinya:

```json
{"model": "gemini-3.5-flash-lite", "stream": false, "max_tokens": 1024, "reasoning_effort": "minimal",
 "messages": [{"role": "system", "content": "<aturan mediator RMT>\n\nKONTEKS: tahap, langkah, hasil mesin, tingkat bantuan…"},
              "…6 pesan terakhir…", {"role": "user", "content": "<jawaban siswa>"}]}
```

- Percakapan **selalu diakhiri pesan siswa**. Bila siswa hanya menekan tombol (misalnya *Aku bingung* atau *Tahap berikutnya*), nama tombolnya dikirim sebagai pesan. Gemini menolak permintaan tanpa pesan pengguna atau yang diakhiri balasan asisten (kode 400); hal ini ditemukan saat uji dengan Gemini sungguhan.
- Yang dikirim hanya teks soal dan percakapan, tanpa nama atau data pribadi siswa.

## 6. Berkas

| Berkas | Isi |
|---|---|
| `content/tutor/tutor.json` | 6 tahap, istilah, 4 soal × langkah (perintah, fungsi kognitif, alat, kunci pemeriksaan, 3 petunjuk, pola kesalahan khas, penjaga jawaban) |
| `apps/api/app/core/tutor.py` | Mesin asisten: pemeriksaan, petunjuk, penjaga jawaban, prompt RMT, `gemini_chat()`, `deepseek_chat()`, `ai_chat()` (memilih penyedia) |
| `apps/api/app/config.py` | `TUTOR_AI_PROVIDER`, `GEMINI_*`, `DEEPSEEK_*`, `tutor_provider()` |
| `apps/api/app/routers/tutor.py` | `GET /api/tutor/status`, `GET /api/tutor/problems`, `POST /api/tutor/turn`, `POST /api/tutor/finish`, `GET /api/tutor/summary` (guru) |
| `apps/api/app/routers/public_tutor.py` | Asisten publik untuk GitHub Pages: `GET /api/public/tutor/status`, `POST /api/public/tutor/turn` (tanpa akun, batas per IP & total, CORS) |
| `render.yaml` | Blueprint Render: server online + `PUBLIC_TUTOR=1`; kunci `GEMINI_API_KEY` diisi di dasbor Render |
| `scripts/ai_url.txt` | Alamat server AI publik untuk build GitHub Pages (`window.RELAFUN_AI_URL`) |
| `apps/web/js/local/tutor.js` | Mesin yang sama untuk versi GitHub Pages (cadangan bila server AI tidur/gagal) |
| `apps/web/js/views/tutor.js` | Halaman Asisten Belajar. Nama penyedia AI diambil dari server. |
| `apps/api/tests/test_tutor.py` | 51 tes: konten (batas kata CLT, urutan tahap RMT), seluruh soal bisa diselesaikan, petunjuk tidak membocorkan jawaban, kesalahan khas, format Gemini dan DeepSeek, pemilihan penyedia, kode galat, kuota, API tidak membocorkan kunci |

## 7. Pengujian

- **pytest**: 332 tes lolos, 51 di antaranya untuk asisten dan 8 untuk Asisten publik:
  - nonaktif secara bawaan;
  - tanpa kunci tetap terpandu;
  - balasan AI tanpa akun dan tanpa membocorkan kunci maupun kunci jawaban;
  - batas per IP dan total;
  - IP dari ujung X-Forwarded-For;
  - CORS hanya untuk origin yang diizinkan.
- **Versi online + server AI (Gemini sungguhan)** dalam tiga skenario, tanpa galat dan tanpa kunci di permintaan peramban:
  - server menyala: "AI Gemini aktif", balasan "dibantu AI Gemini", Soal Bebas aktif;
  - server dimatikan di tengah sesi: Wen lanjut dengan petunjuk tertulis;
  - server mati saat halaman dibuka: "AI sedang disiapkan…", lalu AI dipakai setelah server menyala.
- **Uji peramban di Chrome, WebKit/Safari, dan Firefox**:
  - siswa menyelesaikan Soal 2, termasuk kesalahan khas, "Aku bingung", ketuk istilah, skala usaha, dan ringkasan;
  - di Soal 3, tombol lanjut muncul setelah 3 kali mencoba;
  - Dashboard Guru menampilkan usaha berpikir 3/5.
- **Versi server dengan Gemini tiruan dan DeepSeek tiruan** (tanpa kunci asli), di ketiga peramban:
  - balasan berlabel "dibantu AI Gemini" atau "dibantu AI DeepSeek";
  - semua permintaan memakai format yang benar;
  - kunci API dan kunci jawaban tidak pernah sampai ke peramban;
  - Soal Bebas berjalan;
  - setelah kuota harian habis, muncul pesan kuota dan asisten beralih ke petunjuk tertulis.
- **Gemini sungguhan** (`gemini-3.5-flash-lite`, 18 November 2026):
  - satu sesi Soal 2 lengkap, ditambah Soal Bebas;
  - semua 15 panggilan AI berhasil, sekitar 1 detik per balasan;
  - tidak ada jawaban yang bocor, termasuk saat "siswa" mengaku guru dan meminta jawabannya langsung;
  - kunci tidak muncul di respons server.
- **Belum diuji**: DeepSeek sungguhan, karena butuh kunci berbayar.
