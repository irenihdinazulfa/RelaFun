# 17 — Instrumen Penelitian (Validasi Ahli & Uji Coba)

Instrumen untuk tahap **Implementation** dan **Evaluation** (ADDIE). Semua file siap cetak ada di folder [`instrumen/`](../instrumen/).

| No | File | Untuk | Isi |
|---|---|---|---|
| 01 | `01_Lembar_Validasi_Ahli_Materi.docx` | Dosen/guru matematika | 20 butir (kelayakan isi 8, penyajian 7, bahasa 3, beban kognitif 2), skala 1–5, saran, kesimpulan |
| 02 | `02_Lembar_Validasi_Ahli_Media.docx` | Ahli media | 20 butir (tampilan 6, fungsi & navigasi 7, interaktivitas 4, kemanfaatan 3), skala 1–5 |
| 03 | `03_Angket_Beban_Kognitif_Siswa.docx` | Siswa | Skala Paas 1–9 + 10 butir beban intrinsik/ekstrinsik/germane (adaptasi Leppink dkk., 2013) + pertanyaan terbuka |
| 04 | `04_Angket_Kepraktisan_SUS_Siswa.docx` | Siswa | System Usability Scale (10 butir) + 10 butir respons terhadap fitur RelaFun |
| 05 | `05_Soal_Pretest_Posttest.docx` | Siswa | Paket A (pretest) dan Paket B (posttest) setara: 10 PG + 2 uraian literasi, 30 menit |
| 06 | `06_Kisi_Kunci_Rubrik_Pretest_Posttest.docx` | Peneliti/guru | Kisi-kisi (indikator, level kognitif, kode wawancara), kunci & pembahasan PG, kunci & rubrik uraian 0–4 |
| 07 | `07_Protokol_Uji_Coba_dan_Persetujuan.docx` | Peneliti | Tahapan uji coba, persiapan, jadwal 2 × 80 menit, lembar observasi uji perorangan (think-aloud), surat persetujuan orang tua/wali |
| 08 | `08_Analisis_Hasil_Uji_Coba.xlsx` | Peneliti | Lembar isian dengan rumus otomatis: persentase kelayakan, rata-rata IL/EL/GL, skor SUS, nilai tes, N-gain |

## Alur pemakaian

1. **Validasi ahli** → cetak 01 & 02, minta validator mencoba aplikasi lalu mengisi. Masukkan skor ke lembar *Validasi Materi*/*Validasi Media* di file 08. Layak diujicobakan bila P ≥ 61%.
2. **Revisi** aplikasi sesuai saran validator.
3. **Uji perorangan** (3 siswa) → lembar observasi di 07, angket 03 & 04.
4. **Uji kelompok kecil** (6–10 siswa) → jadwal di 07: pretest (05 Paket A) → belajar dengan RelaFun → posttest (05 Paket B) → angket 03 & 04. Nilai uraian dengan rubrik di 06.
5. Masukkan data ke file 08 (isi sel **kuning** saja) → hasil, kategori, dan N-gain terhitung otomatis.

## Teknik analisis

| Data | Rumus | Kategori |
|---|---|---|
| Validasi & respons | P = Σ skor ÷ Σ skor maksimal × 100% | > 80% sangat layak; > 60% layak; > 40% cukup; > 20% kurang; selebihnya tidak layak (adaptasi Riduwan, 2015) |
| Beban kognitif | IL = rata-rata B1–B3; EL = B4–B6; GL = B7–B10 (0–10); Paas 1–9 | EL diharapkan rendah, GL tinggi |
| Kepraktisan | SUS = (Σ(ganjil − 1) + Σ(5 − genap)) × 2,5 | ≥ 80,3 sangat baik; ≥ 68 baik; ≥ 51 cukup; < 51 kurang (Brooke, 1996; Sauro, 2011) |
| Hasil belajar | Nilai = skor ÷ 18 × 100; N-gain = (post − pre) ÷ (100 − pre) | ≥ 0,7 tinggi; ≥ 0,3 sedang; < 0,3 rendah (Hake, 1999) |

## Pemeriksaan yang sudah dilakukan

- Kunci 24 soal (Paket A & B) dihitung ulang dengan mesin hitung RelaFun: semua benar; soal rumus-dari-tabel hanya punya satu pilihan yang cocok.
- Tampilan dokumen diperiksa sebagai PDF hasil ekspor Microsoft Word (validasi materi, angket beban kognitif, soal).
- Rumus file 08 dihitung ulang dengan Microsoft Excel memakai data contoh dan dicocokkan dengan hitungan manual (persentase, IL/EL/GL, SUS, nilai, N-gain individu & kelas): **0 sel galat**, semua nilai sesuai.

## Rujukan

- Brooke, J. (1996). SUS: A “quick and dirty” usability scale. Dalam P. W. Jordan dkk. (Ed.), *Usability Evaluation in Industry* (hlm. 189–194). Taylor & Francis.
- Hake, R. R. (1999). *Analyzing change/gain scores*. AERA-D.
- Leppink, J., Paas, F., Van der Vleuten, C. P. M., Van Gog, T., & Van Merriënboer, J. J. G. (2013). Development of an instrument for measuring different types of cognitive load. *Behavior Research Methods, 45*(4), 1058–1072.
- Paas, F. G. W. C. (1992). Training strategies for attaining transfer of problem-solving skill in statistics: A cognitive-load approach. *Journal of Educational Psychology, 84*(4), 429–434.
- Riduwan. (2015). *Skala Pengukuran Variabel-Variabel Penelitian*. Alfabeta.
- Sauro, J. (2011). *A Practical Guide to the System Usability Scale*. Measuring Usability LLC.
