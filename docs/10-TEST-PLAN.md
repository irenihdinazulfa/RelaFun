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

**Hasil terakhir (12 November 2026): 263 lolos, 0 gagal.**

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

**Hasil terakhir: 25 langkah lolos, 0 galat konsol.**

## 3. Belum diuji

- Panggilan **Claude API sungguhan** (diuji dengan respons tiruan; butuh kunci API).
- Pemasangan PWA di perangkat iOS/Android fisik (butuh alamat HTTPS).
- Pembaca layar (NVDA/TalkBack) secara manual.

## 4. Rencana uji coba dengan siswa (tahap Implementation & Evaluation)

| Tahap | Kegiatan | Instrumen |
|---|---|---|
| Uji ahli | Validasi materi oleh guru matematika & ahli media | Lembar validasi (skala 1–5) |
| Uji perorangan | 3 siswa, diamati saat memakai aplikasi (think-aloud) | Catatan observasi |
| Uji kelompok kecil | 6–10 siswa | Angket beban kognitif (mis. Paas 9 poin), angket kepraktisan |
| Uji lapangan | 1 kelas | Lembar soal literasi (pra & pasca), data dashboard |
