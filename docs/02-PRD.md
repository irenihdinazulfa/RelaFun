# 02 — Product Requirements Document (PRD)

**Produk:** RelaFun — aplikasi belajar Relasi dan Fungsi kelas 8 SMP
**Pemilik produk:** Iren Ihdina Zulfa (NIM 2225250019), kelas 3E
**Versi dokumen:** 1.0 — 12 November 2026
**Status:** Versi pertama dibangun dan lolos pengujian internal

## 1. Latar belakang

Wawancara dengan siswa S01 (lihat `01-RESEARCH-INSIGHTS.md`) menunjukkan tiga sumber beban kognitif utama pada materi Relasi dan Fungsi:
1. **Ekstrinsik:** diagram panah yang ramai/bersilangan, istilah formal, dan bahasa soal cerita.
2. **Intrinsik:** membedakan fungsi/bukan fungsi serta domain–kodomain–range.
3. **Prasyarat:** salah substitusi dan salah hitung saat menentukan nilai fungsi.

## 2. Tujuan

| ID | Tujuan | Ukuran keberhasilan |
|---|---|---|
| G1 | Mengurangi beban ekstrinsik pada diagram panah | ≥ 80% siswa uji coba menyatakan diagram “mudah dibaca” (angket) |
| G2 | Siswa mampu membedakan fungsi/bukan fungsi | Akurasi percobaan pertama modul r3 ≥ 75% setelah belajar |
| G3 | Siswa mampu menentukan domain, kodomain, range | Akurasi percobaan pertama modul r4 ≥ 75% |
| G4 | Mengurangi salah hitung nilai fungsi | Proporsi kesalahan “salah tanda/tidak dikalikan/lupa konstanta” turun antara latihan awal dan akhir |
| G5 | Menumbuhkan literasi matematika | Siswa menyelesaikan ≥ 3 dari 4 soal lembar literasi dengan langkah lengkap |
| G6 | Guru dapat memantau kesulitan kelas | Guru dapat melihat jenis kesalahan terbanyak dalam ≤ 3 klik |
| G7 | Dapat dipakai di Android, iOS, Windows, macOS tanpa toko aplikasi | Lolos syarat instal PWA di Chrome |

## 3. Ruang lingkup

**Termasuk (versi 1):** 13 modul (3 prasyarat, 7 inti, 3 literasi), 68 soal latihan dari 7 jenis, kalkulator fungsi bertahap, pemodel soal cerita (terpandu + AI opsional), glosarium, akun siswa/guru dengan kode kelas, poin, streak, sasaran harian, papan peringkat per kelas (bisa dimatikan), dashboard guru + ekspor CSV, mode gelap, teks besar, PWA.

**Tidak termasuk (versi 1):** tes diagnostik awal, sinkronisasi jawaban saat luring, bank soal buatan guru, aplikasi toko (APK/IPA), integrasi LMS.

## 4. Kebutuhan fungsional

| ID | Kebutuhan | Prioritas | Kode wawancara |
|---|---|---|---|
| FR-01 | Akun siswa (nama panggilan, tanpa nama lengkap) & guru; bergabung kelas dengan kode | Wajib | — |
| FR-02 | Materi disajikan **satu langkah per layar** dengan penanda kemajuan dan simpan otomatis | Wajib | DS02 |
| FR-03 | Modul prasyarat: himpunan, bilangan bulat & desimal waktu, substitusi | Wajib | IL03, K01 |
| FR-04 | Diagram panah interaktif: panah muncul satu per satu, sorot per anggota, rapikan persilangan, ≤ 6 anggota per himpunan | Wajib | EL02, K03, K02 |
| FR-05 | Contoh dari kehidupan sehari-hari pada setiap konsep baru | Wajib | GL01, K01 |
| FR-06 | Contoh bertahap: langkah dimunculkan satu per satu | Wajib | GL03, DS02 |
| FR-07 | Soal seret-taruh (dengan alternatif ketuk & papan ketik) | Wajib | DS01, IL01 |
| FR-08 | Mode “cek satu per satu” aturan tepat satu pasangan | Wajib | GL02, IL01 |
| FR-09 | Mode sorot Domain / Kodomain / Range | Wajib | IL01 |
| FR-10 | Soal membuat panah sendiri (menghubungkan dua himpunan) | Wajib | DS01 |
| FR-11 | Kalkulator nilai fungsi bertahap (SymPy) | Wajib | IL02, GL03 |
| FR-12 | Diagnosis jenis kesalahan hitung + umpan balik spesifik | Wajib | IL02 |
| FR-13 | Angka penting pada soal cerita ditandai | Sebaiknya | EL01 |
| FR-14 | Istilah sulit dapat diketuk untuk melihat arti sederhana; halaman glosarium | Wajib | EL03 |
| FR-15 | Umpan balik instan berbahasa sehari-hari; petunjuk opsional; pembahasan bertahap setelah 2 kali mencoba | Wajib | DS01, GL03 |
| FR-16 | Pemodel soal cerita mode terpandu (6 langkah: baca → x → a & b → pertanyaan → hitung → tafsirkan) | Wajib | EL01, GL01 |
| FR-17 | Pemodel mode AI (opsional): AI hanya menerjemahkan cerita; SymPy memverifikasi & menghitung | Sebaiknya | EL01 |
| FR-18 | Poin (sekali per soal), streak, sasaran harian 5 soal benar | Sebaiknya | — |
| FR-19 | Papan peringkat per kelas, nama panggilan saja, dapat dimatikan guru | Sebaiknya | — |
| FR-20 | Dashboard guru: kemajuan, akurasi per materi, jenis kesalahan, soal tersulit, ekspor CSV | Wajib | — |
| FR-21 | Mode gelap, teks besar, kurangi animasi | Wajib | EL02 |
| FR-22 | Dapat dipasang sebagai PWA tanpa toko aplikasi | Wajib | — |

## 5. Kebutuhan non-fungsional

| ID | Kebutuhan |
|---|---|
| NFR-01 | Tampilan responsif 360 px – 1920 px tanpa gulir horizontal |
| NFR-02 | Target sentuh ≥ 44 px; kontras teks ≥ 4.5:1; navigasi papan ketik |
| NFR-03 | Kunci jawaban tidak dikirim ke peramban sebelum siswa menjawab |
| NFR-04 | Semua perhitungan penilaian dilakukan deterministik (SymPy), bukan oleh AI |
| NFR-05 | Data pribadi minimal: nama panggilan, tanpa e-mail/nomor HP; kata sandi di-hash PBKDF2 |
| NFR-06 | Halaman utama tampil < 2 detik di jaringan 4G; aset aplikasi di-cache service worker |
| NFR-07 | Berjalan cukup dengan Python 3.10+ (tanpa Node.js / proses build) |

## 6. Asumsi & keputusan

- Kurikulum Merdeka Fase D (relasi & fungsi di kelas 8).
- Fitur AI **nonaktif bawaan**; aktif hanya bila `ANTHROPIC_API_KEY` diisi **dan** guru mengaktifkannya per kelas; kuota 10 analisis/siswa/hari.
- Basis data SQLite (cukup untuk satu sekolah); dapat diganti PostgreSQL lewat `DATABASE_URL`.

## 7. Pertanyaan terbuka

1. Siapa yang menanggung biaya Claude API bila mode AI dipakai di kelas?
2. Apakah perlu persetujuan orang tua untuk akun siswa di sekolah uji coba?
3. Di mana aplikasi akan di-*deploy* (HTTPS) agar bisa dipasang dari HP siswa di luar jaringan Wi-Fi yang sama?
