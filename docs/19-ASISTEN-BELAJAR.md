# 19 — Asisten Belajar (chatbot RMT + DeepSeek)

Halaman `#/asisten` (menu bawah **Asisten**). Asisten ini adalah chatbot pedagogis yang membimbing soal Mathematical Literacy selangkah demi selangkah menurut model **Rigorous Mathematical Thinking** (lihat [18-RINGKASAN-RMT.md](18-RINGKASAN-RMT.md)). Pengelolaan beban kognitifnya dijelaskan di bagian 3.

## 1. Arahan dosen dan cara memenuhinya

| Arahan | Penerapan |
|---|---|
| Membimbing masalah Mathematical Literacy secara bertahap | 4 soal lembar ML dipecah menjadi 32 langkah dalam 6 tahap RMT. Satu langkah ditampilkan setiap giliran. |
| Mengelola beban intrinsik, ekstrinsik, dan germane | Lihat bagian 3 |
| Petunjuk sesuai kesulitan, bukan jawaban akhir | Petunjuk 3 tingkat yang naik otomatis setiap kali salah atau saat siswa mengetuk **Aku bingung**. Ada 32 pola kesalahan khas siswa dengan umpan balik khusus. Penjaga jawaban membuang balasan AI yang membocorkan jawaban. |
| Menerapkan tahapan RMT | Penanda 6 tahap, fungsi kognitif dan alat berpikir di setiap langkah, mediasi MLE, refleksi, dan transendensi |
| Kunci API DeepSeek tidak boleh di frontend atau GitHub; gunakan `.env` di backend | Kunci hanya dibaca dari `.env` oleh server (`config.DEEPSEEK_API_KEY`). `.env` tercantum di `.gitignore`. Tes otomatis memastikan kunci tidak pernah muncul di respons API. |
| Tetap memakai repository lama, dengan commit jelas | Dikerjakan di repository `RelaFun` yang sama |

## 2. Alur satu giliran

```
Siswa mengetik ─▶ server: check_step() ──▶ BENAR  → pujian + langkah berikutnya
                   (mesin, deterministik) └▶ BELUM  → tingkat bantuan naik (1→2→3)
                                                     + catatan kesalahan khas
        ┌─────────────── bila DEEPSEEK_API_KEY terisi & kuota masih ada ───────────────┐
        │ DeepSeek menulis kalimat mediasi berdasarkan KONTEKS: tahap RMT, langkah,    │
        │ fungsi kognitif, hasil mesin, tingkat bantuan, dan bahan petunjuk.           │
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

## 4. Mengaktifkan DeepSeek (versi server)

1. Buat kunci di https://platform.deepseek.com/api_keys dan isi saldo.
2. Buka file **`.env`** di folder proyek (dibuat otomatis oleh `start.bat` dari `.env.example`), lalu isi:
   ```
   DEEPSEEK_API_KEY=sk-...kunci-milikmu...
   ```
   Pengaturan lain sudah berisi nilai bawaan: `DEEPSEEK_MODEL=deepseek-flash`, `DEEPSEEK_THINKING=disabled` (balasan cepat), `TUTOR_DAILY_QUOTA=60` balasan AI per siswa per hari.
3. Jalankan ulang `start.bat`, lalu buka http://localhost:8000 → **Asisten**. Tanda di kanan atas berubah menjadi **AI DeepSeek aktif**.

> ⚠️ Jangan pernah menempel kunci di kode, di `.env.example`, di chat, atau di GitHub. Hanya di `.env`.

Versi GitHub Pages tidak punya backend, jadi asisten di sana berjalan dalam **mode terpandu** dengan petunjuk tertulis yang sama, tanpa AI. Pemeriksaannya identik dengan versi server: 1.698 kasus uji silang Python = JavaScript.

## 5. Format panggilan DeepSeek

`POST {DEEPSEEK_BASE_URL}/chat/completions` (format kompatibel OpenAI), header `Authorization: Bearer <kunci dari .env>`. Isinya:

```json
{"model": "deepseek-flash", "stream": false, "max_tokens": 400, "temperature": 0.5,
 "thinking": {"type": "disabled"},
 "messages": [{"role": "system", "content": "<aturan mediator RMT>"},
              {"role": "system", "content": "KONTEKS: tahap, langkah, hasil mesin, tingkat bantuan…"},
              "…6 pesan terakhir…", {"role": "user", "content": "<jawaban siswa>"}]}
```

Yang dikirim hanya teks soal dan percakapan, tanpa nama atau data pribadi siswa.

## 6. Berkas

| Berkas | Isi |
|---|---|
| `content/tutor/tutor.json` | 6 tahap, istilah, 4 soal × langkah (perintah, fungsi kognitif, alat, kunci pemeriksaan, 3 petunjuk, pola kesalahan khas, penjaga jawaban) |
| `apps/api/app/core/tutor.py` | Mesin asisten: pemeriksaan, petunjuk, penjaga jawaban, prompt RMT, panggilan DeepSeek |
| `apps/api/app/routers/tutor.py` | `GET /api/tutor/status`, `GET /api/tutor/problems`, `POST /api/tutor/turn`, `POST /api/tutor/finish`, `GET /api/tutor/summary` (guru) |
| `apps/web/js/local/tutor.js` | Mesin yang sama untuk versi GitHub Pages (tanpa AI) |
| `apps/web/js/views/tutor.js` | Halaman Asisten Belajar |
| `apps/api/tests/test_tutor.py` | 32 tes: konten (batas kata CLT, urutan tahap RMT), seluruh soal bisa diselesaikan, petunjuk tidak membocorkan jawaban, kesalahan khas, DeepSeek tiruan, kuota, API tidak membocorkan kunci |

## 7. Pengujian

- **pytest**: 298 tes lolos, 32 di antaranya untuk asisten.
- **Uji peramban di Chrome, WebKit/Safari, dan Firefox**:
  - siswa menyelesaikan Soal 2, termasuk kesalahan khas, "Aku bingung", ketuk istilah, skala usaha, dan ringkasan;
  - di Soal 3, tombol lanjut muncul setelah 3 kali mencoba;
  - Dashboard Guru menampilkan usaha berpikir 3/5.
- **Versi server dengan DeepSeek tiruan** (tanpa kunci asli dan tanpa biaya): 59 permintaan memakai format yang benar. Balasan berlabel "dibantu AI DeepSeek". Kunci API dan kunci jawaban tidak pernah sampai ke peramban, dan Soal Bebas berjalan.
- **Belum diuji**: DeepSeek sungguhan, karena butuh kunci berbayar milik pengembang.
