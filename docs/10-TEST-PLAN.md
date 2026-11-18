# 10 — Rencana & Hasil Pengujian

## 1. Pengujian otomatis backend (pytest)

Jalankan:
```powershell
cd apps\api
.venv\Scripts\python -m pytest -q
```

| Berkas | Isi | Jumlah kasus |
|---|---|---|
| `test_mathfn.py` | baca angka Indonesia, format, rumus setara, penolakan masukan berbahaya, kalkulator bertahap, 500 fungsi linear acak, semua 16 relasi kecil (exhaustive), diagnosis kesalahan | ± 50 |
| `test_modeler.py` | 4 soal lembar literasi + lilin, pertidaksamaan dengan a negatif, verifikasi V1–V6 | ± 15 |
| `test_content.py` | aturan CLT, keterlacakan 14 kode, **setiap kunci jawaban dinilai benar**, setiap `common_errors` dinilai salah dengan pesan yang tepat, kunci tidak bocor | ± 180 |
| `test_api.py` | web & SPA, login/daftar, poin sekali per soal, format salah tidak dihitung, ringkasan, progres, papan peringkat, dashboard guru, CSV, isolasi guru, alat, AI (tanpa kunci, dengan respons tiruan, kuota) | ± 20 |

**Hasil terakhir (14 November 2026): 266 lolos, 0 gagal.**

## 1b. Uji silang Python ↔ JavaScript (versi online)

Mesin JavaScript untuk versi GitHub Pages dibandingkan dengan versi Python pada **1.209 kasus**:

| Kategori | Kasus |
|---|---|
| Kalkulator bertahap (termasuk 250 fungsi acak & 11 masukan salah) | 365 |
| Membaca angka format Indonesia | 22 |
| Format angka | 14 |
| Pemeriksa: setiap soal × jawaban benar, `common_errors`, jawaban salah & aneh | 668 |
| Pemodel soal cerita (6 preset + 14 variasi) | 20 |
| Relasi acak (fungsi/bukan) | 120 |

**Hasil: 1.209 / 1.209 identik.** Uji ini sekaligus menemukan satu bug di versi Python (`0x + 165` gagal dibaca), yang sudah diperbaiki dan diberi tes.

## 2. Pengujian ujung-ke-ujung (Chrome, Playwright)

Skenario yang dijalankan dengan Chrome sungguhan (desktop 1366 px dan HP 390 px):

1. Halaman masuk & daftar siswa dengan kode kelas
2. Beranda (hero, sasaran harian, peringkat)
3. 13 kartu materi
4. Diagram panah muncul satu per satu + Rapikan panah
5. Contoh bertahap (langkah berikutnya / tampilkan semua)
6. Mode cek tepat satu pasangan → “FUNGSI”
7. Sorot Range → {2, 3, 4, 5}
8. Istilah dapat diketuk
9. Soal fungsi/bukan: salah → benar; 2 kali salah → pembahasan + anggota bermasalah ditandai
10. Seret-taruh dengan ketukan dan dengan tetikus
11. Membuat panah sendiri
12. Soal angka + diagnosis
13. Kalkulator: f(3,5) = 23
14. Pemodel terpandu soal provider sampai tafsir
15. Pemodel mendeteksi salah konversi waktu (x = 3,3)
16. Mode AI tanpa kunci menampilkan alasan
17. Glosarium + pencarian; papan peringkat
18. Mode gelap
19. Dashboard guru + unduh CSV
20. Tampilan HP tidak melebar (beranda, latihan, pemodel)
21. Service worker terdaftar (syarat PWA)

**Hasil terakhir: 25 langkah lolos, 0 galat konsol**, pada tiga lingkungan: versi server, versi statis lokal, dan link online https://irenihdinazulfa.github.io/RelaFun/.

Tambahan untuk versi online: syarat instal PWA Chrome terpenuhi (tanpa galat), dan aplikasi tetap terbuka serta menilai latihan saat internet diputus.

## 2b. Game “Lompat Wen”

5.400 soal acak diverifikasi mandiri (0 gagal) dan alur bermain lolos di versi online maupun server. Rincian: `16-GAME-LOMPAT-WEN.md` bagian 4.

## 2c. Maskot Wen, teman-teman & ketahanan memuat (versi 2.2–2.3)

- Layar pembuka menampilkan 6 karakter, hilang sendiri atau saat diketuk, dan tidak muncul lagi saat halaman dimuat ulang pada pembukaan yang sama.
- Halaman masuk menampilkan kolase 6 karakter (Wen + 5 teman) dan footer.
- Galeri menampilkan kolase, 5 kartu teman, dan 18 ekspresi.
- Stiker teman muncul di kepala halaman Materi, Kalkulator, Pemodel, Glosarium, dan Peringkat.
- Footer tampil di setiap halaman, dan di HP tidak tertutup menu bawah.
- Tidak ada halaman yang melebar di layar HP 390 px.
- Wen yang diketuk berganti ekspresi; diketuk 5× → malu-malu, lalu kembali ke ekspresi awal.
- Ekspresi di halaman masuk, tips, glosarium, dan game (benar, salah, soal sesudah salah) sesuai tabel di `06-UI-UX-GUIDE.md`.
- Tidak ada galat konsol, baik di HP maupun desktop.
- Bila salah satu berkas aplikasi gagal dimuat (diuji dengan memblokir satu berkas), muncul pesan dan tombol **Muat ulang**, bukan layar kosong. Setelah dimuat ulang, aplikasi terbuka normal.

## 2d. Kompatibilitas perangkat (versi 2.6)

**Alur dasar di 5 perangkat tiruan** (Playwright), tanpa menyingkirkan elemen apa pun: buka → masuk → jawab soal → game → galeri.
- Chrome Android (Pixel 7)
- Safari iPhone 13
- Safari iPad
- Firefox desktop
- Safari Mac

Hasilnya: semua lolos.

**Uji 25 langkah** dijalankan juga di mesin **WebKit (Safari)** dan **Firefox**: 25/25 lolos, 0 galat.

**Tawaran pasang aplikasi:**
- Bilahnya tidak menutupi kolom nama pengguna, tombol Masuk, Masuk Akun Demo, maupun tombol Periksa (posisi kotak diperiksa).
- Tombol Pasang memanggil dialog Chrome atau menampilkan petunjuk untuk iPhone/WhatsApp.
- Tombol ✕ menyembunyikan tawaran 3 hari.

**Kode untuk peramban lama:**
- Tidak memakai `||=` dan `replaceChildren`.
- CSS `inset` dan `aspect-ratio` diganti cara lama.
- `color-mix` diberi warna cadangan.

**Penjaga pemuatan:** bila satu berkas rusak atau tidak didukung, muncul pesan, keterangan galat, dan tombol **Bersihkan & muat ulang**. Tombol itu memulihkan aplikasi.

## 2e. Mode AI: deskripsi soal → model matematika (versi 2.7)

Diuji dengan layanan Anthropic **tiruan**: tanpa kunci asli, tanpa biaya. 10 skenario lolos:
- tanpa kunci: pesan jelas, kolom kunci di Mode AI, tombol nonaktif;
- kunci salah ditolak, kunci benar langsung mengaktifkan AI;
- deskripsi terlalu pendek tidak dikirim;
- soal taksi: f(x) = 4.500x + 8.000, f(10) ≤ 50.000, hasil Rp53.000;
- soal provider: A(x) = 2.000x vs B(x) = 1.000x + 30.000;
- soal tas: h(x) = 50.000x − 150.000, h(x) > 0, x bilangan bulat;
- soal kuadrat: dijelaskan belum didukung;
- Pengaturan ikut aktif;
- kuota 10 per hari.

Permintaan memakai `claude-opus-5-5`, *structured output* `json_schema`, `effort: medium`, `fallbacks: "default"`, dan hanya teks soal yang dikirim.

## 2f. Asisten Belajar RMT + DeepSeek (versi 3.0)

- **pytest** `tests/test_tutor.py` (32 tes):
  - konten memenuhi batas CLT (≤ 40 kata per perintah, ≤ 60 kata per petunjuk, 3 petunjuk per langkah, keenam tahap RMT berurutan);
  - semua soal bisa diselesaikan;
  - petunjuk tidak memuat jawaban;
  - 10 kesalahan khas dikenali, termasuk dua temuan jawaban S01;
  - petunjuk naik 1→2→3 dan tombol lanjut muncul setelah 3 kali mencoba;
  - balasan AI yang membocorkan jawaban diganti petunjuk tertulis;
  - format permintaan DeepSeek benar;
  - API tidak mengirim kunci jawaban maupun kunci API;
  - kuota harian dan ringkasan guru berjalan.
- **Uji silang** Python = JavaScript: 1.698 kasus pemeriksaan langkah, ekstraksi angka, dan penjaga jawaban.
- **Uji peramban** (Chrome, WebKit/Safari, Firefox), versi online: Soal 2 dari awal sampai ringkasan; Soal 3 dengan lanjut setelah 3 kali mencoba; dashboard guru menampilkan usaha 3/5.
- **Versi server dengan DeepSeek tiruan** (tanpa kunci asli): balasan berlabel "dibantu AI DeepSeek"; 59 permintaan memakai format benar; kunci dan kunci jawaban tidak sampai ke peramban; Soal Bebas berjalan.

## 2g. Penyedia AI Gemini (versi 3.1)

- **pytest**: 19 tes tambahan (total 51 tes asisten, 317 tes seluruhnya), meliputi:
  - format permintaan Gemini: alamat, model, `reasoning_effort`, satu pesan sistem, tanpa parameter khas DeepSeek;
  - kode galat 400/403/404/429 dan balasan kosong yang beralih ke petunjuk tertulis;
  - pemilihan penyedia lewat `TUTOR_AI_PROVIDER` (7 kombinasi);
  - percakapan selalu diakhiri pesan pengguna;
  - status API menyebut penyedia tanpa membocorkan kunci.
- **Uji peramban dengan Gemini tiruan** (Chrome, WebKit/Safari, Firefox): semua langkah lolos; label "AI Gemini aktif" dan "dibantu AI Gemini" tampil; kunci tidak sampai ke peramban. Pesan kuota habis juga tampil benar setelah 60 balasan.
- **Gemini sungguhan** (`gemini-3.5-flash-lite`):
  - uji pertama menemukan 2 balasan ditolak (kode 400) saat siswa hanya menekan tombol, karena Gemini mewajibkan pesan pengguna di akhir percakapan;
  - masalah itu diperbaiki, lalu uji ulang: 15 dari 15 panggilan AI berhasil (sekitar 1 detik per balasan) dan tidak ada jawaban yang bocor.

## 2h. Palet pastel kalem dan alamat http://relafun (versi 3.2)

- Uji e2e 25 langkah, Asisten (termasuk uji silang 1.698 kasus), maskot dan footer v3.2, pasang aplikasi, luring, dan 5 perangkat tiruan: semua lolos dengan palet baru.
- Tangkapan layar halaman masuk, beranda, Asisten (desktop, HP, mode gelap), materi, dan game diperiksa secara visual.
- Server di port 80, dibuka sebagai `http://relafun` (nama dipetakan di Chrome):
  - aplikasi berjalan tanpa galat dan footer v3.2;
  - Asisten menampilkan "AI Gemini aktif" dan Gemini membalas;
  - service worker memang tidak tersedia, karena bukan konteks aman, dan aplikasi tetap berjalan.
- `start.ps1`: bila izin Administrator tidak diberikan, aplikasi otomatis memakai http://localhost:8000 (diuji).

## 2i. HTTPS lokal https://relafun

- **pytest** `tests/test_tls.py` (5 tes), meliputi:
  - sertifikat untuk `relafun` ditandatangani CA lokal yang dibatasi (NameConstraints kritis; path length 0);
  - kunci CA tidak pernah ditulis ke disk;
  - sertifikat dipakai ulang bila masih berlaku dan dibuat baru menjelang habis;
  - http://relafun dialihkan (308) ke https, sedangkan alamat IP (HP) tetap dilayani http.
- **Uji server** `python -m app.serve`:
  - https://relafun lolos verifikasi penuh dengan CA lokal;
  - tanpa CA, koneksi ditolak;
  - http://relafun → 308 → https; http://127.0.0.1 → 200.
- **Uji Chrome** (sertifikat dipercaya lewat flag uji, tanpa mengubah Windows): http://relafun berpindah ke https://relafun, konteks aman, service worker aktif, syarat pasang aplikasi terpenuhi, manifest terbaca, Asisten "AI Gemini aktif", tanpa galat.
- Pemasangan sertifikat ke Windows dilakukan pengguna sendiri lewat `start.bat` (jendela peringatan sertifikat Windows).

## 3. Belum diuji

- Panggilan **Claude API sungguhan** (diuji dengan respons tiruan; butuh kunci API).
- Pemasangan PWA di perangkat iOS/Android fisik (syarat instal sudah lolos di Chrome; belum dicoba di HP sungguhan).
- Pembaca layar (NVDA/TalkBack) secara manual.

## 4. Rencana uji coba dengan siswa (tahap Implementation & Evaluation)

| Tahap | Kegiatan | Instrumen |
|---|---|---|
| Uji ahli | Validasi materi oleh guru matematika & ahli media | Lembar validasi (skala 1–5) |
| Uji perorangan | 3 siswa, diamati saat memakai aplikasi (think-aloud) | Catatan observasi |
| Uji kelompok kecil | 6–10 siswa | Angket beban kognitif (mis. Paas 9 poin), angket kepraktisan |
| Uji lapangan | 1 kelas | Lembar soal literasi (pra & pasca), data dashboard |
