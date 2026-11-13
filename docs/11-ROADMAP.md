# 11 — Roadmap (mengikuti ADDIE)

| Tahap ADDIE | Kegiatan | Status |
|---|---|---|
| **Analysis** | Wawancara siswa S01 (8 Nov 2026), pemetaan 14 kode beban kognitif, lembar soal literasi | ✅ Selesai (`01-RESEARCH-INSIGHTS.md`) |
| **Design** | PRD, user stories, desain pembelajaran CLT, spesifikasi konten, UI/UX, arsitektur, API, privasi | ✅ Selesai (`02`–`09`) |
| **Development** | Aplikasi PWA versi 1: 13 modul, 68 soal, kalkulator, pemodel, dashboard guru; tes otomatis & E2E | ✅ Selesai (12 Nov 2026) |
| **Implementation** | Deploy HTTPS ✅ (GitHub Pages), instrumen validasi & uji coba ✅ (`17-INSTRUMEN-PENELITIAN.md`); pelaksanaan validasi ahli, uji perorangan & kelompok kecil | ⏳ Berikutnya |
| **Evaluation** | Angket beban kognitif & kepraktisan, analisis jawaban lembar soal, revisi | ⏳ Berikutnya |

## Rencana berikutnya

| Minggu | Pekerjaan |
|---|---|
| 1 | Terima jawaban asli narasumber → isi `14-ANALISIS-JAWABAN-SISWA.md`; sesuaikan umpan balik bila ada kesalahan baru |
| 1 | Deploy ke layanan dengan HTTPS (mis. Render/Railway/VPS sekolah); uji pasang di Android & iPhone |
| 2 | Validasi ahli materi & media; revisi konten |
| 3 | Uji perorangan (3 siswa) & kelompok kecil |
| 4 | Analisis angket, revisi akhir, laporan |

## Pengembangan lanjutan (opsional)

- Tes diagnostik awal untuk menentukan modul mulai.
- Penyimpanan jawaban saat luring lalu sinkron otomatis.
- Guru membuat soal sendiri dari dashboard.
- Bentuk fungsi lain (kuadrat sederhana) bila kurikulum memerlukan.
- Paket APK lewat Capacitor bila sekolah memerlukan berkas instalasi.
