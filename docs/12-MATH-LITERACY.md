# 12 — Literasi Matematika

## 1. Kerangka

Mengacu pada **PISA 2022** (penalaran matematis + siklus pemodelan) dan **AKM Numerasi**. Proses yang dilatih:

| Proses | Arti untuk siswa | Soal lembar | Modul |
|---|---|---|---|
| **Reasoning** (bernalar) | memberi alasan matematis untuk keputusan | Soal 1 — provider internet | l2 |
| **Formulate** (merumuskan) | mengubah situasi menjadi model f(x) = ax + b | Soal 2 — tarif taksi | l1 |
| **Employ** (menerapkan) | menghitung dengan prosedur yang benar | Soal 3 — suhu | l3 |
| **Interpret** (menafsirkan) | menjelaskan arti hasil dalam konteks | Soal 4 — keuntungan | l3 |

## 2. Siklus pemodelan di aplikasi (6 langkah)

1. **Baca** — angka penting ditandai.
2. **Variabel x** — memilih besaran yang berubah-ubah.
3. **Nilai a & b** — a = “per/setiap”, b = nilai tetap; umpan balik bila tertukar/salah tanda.
4. **Pertanyaan** — jenis tugas (hitung, bandingkan, cari x) dan nilai x (termasuk konversi waktu).
5. **Hitung** — langkah demi langkah oleh SymPy, plus grafik bila membandingkan.
6. **Tafsirkan** — memilih kesimpulan yang tepat dalam konteks.

## 3. Bank konteks

| Konteks | Bentuk | Contoh |
|---|---|---|
| Tarif (ojek, taksi) | evaluate + batas uang | f(x) = 4.500x + 8.000 |
| Paket data | compare | A(x) = 2.000x, B(x) = 1.000x + 30.000 |
| Suhu | evaluate (x desimal) | f(x) = −2x + 30 |
| Keuntungan | threshold, hasil negatif | h(x) = 50.000x − 150.000 |
| Lilin / tangki | solve_for_x | t(x) = −2x + 20 |

## 4. Tingkatan soal

| Level | Ciri | Contoh di aplikasi |
|---|---|---|
| L1 | Model sudah diberikan, tinggal menghitung | l2-1, l3-1 |
| L2 | Siswa menyusun model sendiri | l1-2, l1-6 |
| L3 | Mengambil keputusan / menafsirkan / menyimpulkan | l1-5, l2-5, l3-4 |

## 5. Kesalahan khas yang dideteksi

| Kesalahan | Contoh | Umpan balik |
|---|---|---|
| Konversi waktu | 15.30 → x = 3,3 atau 15,5 | “30 menit = 0,5 jam; x dihitung sejak 12.00” |
| Tidak dikalikan | 4.500 + 10 + 8.000 | “Rp4.500 dibayar setiap km, jadi dikali 10” |
| Salah tafsir negatif | “rumusnya salah karena −50.000” | “Negatif artinya rugi” |
| Impas dianggap untung | x = 3 | “h(3) = 0 artinya impas” |
| Pembulatan | 9,33 km | “jarak bulat dan tidak boleh melebihi uang” |
