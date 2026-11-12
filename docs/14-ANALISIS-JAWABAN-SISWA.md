# 14 — Analisis Jawaban Lembar Soal (templat)

> **Status: menunggu jawaban asli narasumber.** Bagian bertanda ✎ diisi setelah lembar jawaban diterima.
> Kunci jawaban acuan (dibuat AI, **bukan** jawaban siswa) ada di `JAWABAN_ACUAN_SOAL_RELASI_FUNGSI.md`.

| Atribut | Isi |
|---|---|
| Narasumber | S01 |
| Tanggal pengerjaan | ✎ |
| Waktu pengerjaan | ✎ menit |

## 1. Rubrik penilaian per soal (skor 0–4)

| Skor | Kriteria |
|---|---|
| 4 | Model tepat, langkah lengkap dan benar, kesimpulan sesuai konteks dengan alasan |
| 3 | Model & hasil benar, tetapi alasan/kesimpulan kurang lengkap |
| 2 | Model benar, tetapi ada salah hitung atau salah tafsir |
| 1 | Ada usaha memodelkan, tetapi model salah |
| 0 | Tidak menjawab / tidak relevan |

## 2. Tabel analisis

| Soal | Proses PISA | Jawaban acuan | Jawaban siswa ✎ | Skor ✎ | Jenis kesalahan ✎ | Kode beban terkait |
|---|---|---|---|---|---|---|
| 1 | Reasoning | Provider A (Rp50.000 < Rp55.000); impas di 30 GB | | | | EL01, GL02 |
| 2 | Formulate | f(x) = 4.500x + 8.000; f(10) = Rp53.000 → tidak cukup, kurang Rp3.000 | | | | EL01, IL02 |
| 3 | Employ | x = 3,5; f(3,5) = 23 °C | | | | IL02 |
| 4 | Interpret | Tidak setuju; −50.000 = rugi; minimal 4 tas | | | | EL01, GL02 |

## 3. Daftar periksa kesalahan yang perlu dicari

- [ ] a dan b tertukar (mis. 8.000x + 4.500)
- [ ] x tidak dikalikan (4.500 + 10 + 8.000)
- [ ] lupa konstanta (hanya 4.500 × 10)
- [ ] konversi waktu salah (x = 3,3 atau 15,5)
- [ ] salah tanda (−2 × 3,5 = 7)
- [ ] menganggap nilai negatif berarti rumus salah
- [ ] menjawab 3 tas (impas dianggap untung)
- [ ] tidak menuliskan alasan/kesimpulan dalam konteks
- [ ] ✎ kesalahan lain: …

## 4. Tindak lanjut ke aplikasi ✎

| Temuan | Perubahan pada aplikasi |
|---|---|
| ✎ | mis. tambah `common_errors` baru pada soal l1-3 |
