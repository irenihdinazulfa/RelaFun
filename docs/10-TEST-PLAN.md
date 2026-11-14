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
