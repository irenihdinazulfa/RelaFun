# 01 — Sintesis Hasil Wawancara (Analysis, ADDIE)

| Atribut | Keterangan |
|---|---|
| Sumber | `referensi/Hasil_Transkrip_Wawancara_Relasi_Fungsi.docx` |
| Narasumber | Siswa S01 (SMPIT Insantama Serang), sudah mempelajari Relasi dan Fungsi di kelas 8 |
| Tanggal wawancara | 8 November 2026 (daring) |
| Fokus | Beban kognitif saat mempelajari Relasi dan Fungsi |
| Pewawancara | Iren Ihdina Zulfa (NIM 2225250019), kelas 3E |

> Dalam dokumen proyek, narasumber disebut **S01** untuk melindungi data pribadi anak (lihat `09-SECURITY-PRIVACY.md`).

## 1. Ringkasan temuan per kode

| Kode | Indikator | Temuan (diringkas dari jawaban verbatim) | Jenis beban |
|---|---|---|---|
| K01 | Pengalaman pertama | Awalnya bingung memahami hubungan dua himpunan; lama-lama paham beda relasi dan fungsi. | Intrinsik |
| K02 | Cara guru menjelaskan | Guru memakai contoh soal, diagram panah, himpunan pasangan berurutan, dan contoh sehari-hari. | (praktik baik) |
| K03 | Ingatan saat ini | Masih mengenali diagram panah, tetapi ragu menentukan fungsi/bukan, **apalagi bila panahnya banyak**. | Intrinsik + Ekstrinsik |
| IL01 | Konsep tersulit | Membedakan fungsi dan bukan fungsi; menentukan **domain, kodomain, range** karena “hampir mirip”. | Intrinsik |
| IL02 | Kesulitan menghitung | Saat menghitung nilai fungsi, **salah memasukkan angka atau keliru menghitung**. | Intrinsik (prasyarat) |
| IL03 | Materi prasyarat | Aljabar dasar dan operasi hitung. | Intrinsik (prasyarat) |
| EL01 | Bahasa/instruksi | Paham konsep tetapi bingung **cara soal ditulis**, terutama soal cerita & istilah sulit. | Ekstrinsik |
| EL02 | Tampilan visual | **Pusing** bila diagram panah terlalu banyak dan **garisnya bersilangan**. | Ekstrinsik |
| EL03 | Istilah matematis | Istilah **pemetaan, daerah kawan, bayangan** membingungkan bila tidak dijelaskan dengan bahasa sederhana. | Ekstrinsik |
| GL01 | Strategi yang membantu | Contoh kehidupan sehari-hari, lalu latihan diagram panah. | Germane |
| GL02 | Mengecek jawaban | Mengecek apakah **setiap anggota x punya tepat satu pasangan y**. | Germane |
| GL03 | Bantuan efektif | **Contoh pengerjaan bertahap**, lalu mencoba sendiri. | Germane |
| DS01 | Kebutuhan fitur | **Animasi diagram panah** dan **kuis interaktif**; bisa menghubungkan dua himpunan sendiri dan langsung tahu benar/salah. | — |
| DS02 | Alur/pacing | Pelan-pelan pada: fungsi vs bukan fungsi, domain–kodomain–range, menghitung nilai fungsi; dengan contoh & pembahasan langkah demi langkah. | — |

## 2. Persona

**Nama persona:** Kirana, 13 tahun, kelas 8 SMP.

- **Tujuan:** bisa menentukan fungsi/bukan fungsi dan menghitung nilai fungsi tanpa ragu; nilai ulangan baik.
- **Kebiasaan:** belajar dari HP, sering di sela kegiatan; menyukai contoh dekat dengan kehidupan sehari-hari.
- **Hambatan:** cepat pusing melihat diagram ramai (EL02); sering salah tanda atau salah substitusi (IL02); istilah formal membuat ragu (EL03); soal cerita terasa panjang (EL01).
- **Yang membantu:** langkah bertahap (GL03), aturan cek sederhana “tepat satu pasangan” (GL02), umpan balik langsung (DS01).

**Persona pendukung — Guru (Pak/Bu guru matematika kelas 8):** ingin tahu bagian mana yang paling sering salah agar bisa diulang di kelas, tanpa harus memeriksa setiap lembar jawaban.

## 3. Matriks ADDIE dari laporan wawancara → fitur

| Temuan masalah (laporan wawancara) | Beban | Solusi di laporan | Implementasi di RelaFun |
|---|---|---|---|
| Pusing melihat garis diagram panah bersilangan | Ekstrinsik | Animasi interaktif, muncul satu per satu / disorot per garis | Komponen **diagram panah** mode *animate* (Berikutnya/Ulang), *static* (ketuk anggota → sorot panahnya saja), tombol **Rapikan panah** (mengurangi persilangan), maksimal 6 anggota per himpunan |
| Sulit membedakan domain/kodomain/range & fungsi vs bukan | Intrinsik | Kuis *drag-and-drop* dengan umpan balik instan berbahasa sehari-hari | Soal **seret-taruh** (juga bisa ketuk), mode **sorot Domain/Kodomain/Range**, mode **cek satu per satu**, umpan balik yang menyebut anggota bermasalah |
| Salah hitung aljabar saat substitusi x ke f(x) | Intrinsik (prasyarat) | Kalkulator fungsi *step-by-step* sebelum soal mandiri | **Kalkulator f(x) bertahap** (SymPy), diagnosis kesalahan (salah tanda, tidak dikalikan, lupa konstanta, angka ditempel), modul prasyarat substitusi |

## 4. Keterlacakan kode → kebutuhan (ringkas)

Setiap kode wawancara terhubung ke minimal satu kebutuhan fungsional di `02-PRD.md` dan minimal satu modul konten (diuji otomatis oleh `apps/api/tests/test_content.py::test_every_interview_code_is_covered`).

| Kode | Kebutuhan (FR) | Modul konten |
|---|---|---|
| K01 | FR-03, FR-05 | p1, r1 |
| K02 | FR-04, FR-06 | r1, r2, r7, l1 |
| K03 | FR-04, FR-08 | r2, r3 |
| IL01 | FR-07, FR-08, FR-09 | r3, r4 |
| IL02 | FR-10, FR-11, FR-12 | p2, p3, r5, r6, l3 |
| IL03 | FR-03 | p1, p2, p3 |
| EL01 | FR-13, FR-16 | l1, l2, l3 |
| EL02 | FR-04 | r1, r2, r3 |
| EL03 | FR-14 | r4, r5 |
| GL01 | FR-05, FR-16 | r1, l1, l2 |
| GL02 | FR-08 | r3, r7, l2, l3 |
| GL03 | FR-06, FR-11, FR-12 | p3, r5, r6, l3 |
| DS01 | FR-07, FR-09, FR-10 | r1, r3, r4 |
| DS02 | FR-02, FR-06 | r3, r4, r5, r6, r7 |

## 5. Data pendukung: lembar soal literasi

`referensi/Lembar_Soal_Siswa_Relasi_Fungsi.docx` berisi 4 soal *mathematical literacy* (PISA): Reasoning (provider internet), Formulate (tarif taksi), Employ (suhu), Interpret (keuntungan). Keempatnya dipakai sebagai:
- contoh di modul literasi l1–l3,
- *preset* di Pemodel Soal Cerita,
- tes otomatis mesin hitung (`tests/test_modeler.py`).

Kunci jawaban acuan: `docs/JAWABAN_ACUAN_SOAL_RELASI_FUNGSI.md`. Jawaban asli narasumber diterima 14 November 2026 dan sudah dianalisis di `14-ANALISIS-JAWABAN-SISWA.md`: skor 15/16; satu temuan baru (notasi f(x) dipakai untuk nilai) ditindaklanjuti di modul r5.

## 6. Keterbatasan

- Hanya satu narasumber, jadi temuan bersifat eksploratif. Uji coba dengan lebih banyak siswa direncanakan pada tahap Implementation/Evaluation (`11-ROADMAP.md`).
- Kurikulum acuan diasumsikan **Kurikulum Merdeka, Fase D**. Bila sekolah memakai K13, urutan materi tetap sesuai karena cakupan Relasi dan Fungsi kelas 8 sama.
