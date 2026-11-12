# 06 — Panduan UI/UX

## 1. Struktur halaman (mengikuti gambaran mockup dashboard belajar)

**Desktop (≥ 861 px):** sidebar kiri (logo, menu, profil) + konten.
**HP (≤ 860 px):** bilah atas (logo, pengaturan) + navigasi bawah 5 ikon (Beranda, Materi, Kalkulator, Pemodel, Lainnya).

Beranda siswa:
```
┌──────────────────────────────────────────────┬──────────────────┐
│ HERO: sapaan + maskot Kuro + [Lanjut belajar]│ Sasaran harian   │
├──────────────────────────────────────────────┤ (cincin x/5)     │
│ Lanjutkan materi (kartu + progres)           │ streak · poin    │
├──────────────────────────────────────────────┼──────────────────┤
│ Bangun keahlian (7 kartu materi inti, %)     │ Peringkat kelas  │
├──────────────────────────────────────────────┤ (5 teratas)      │
│ Literasi & alat bantu (kartu topik)          │                  │
└──────────────────────────────────────────────┴──────────────────┘
```

## 2. Identitas visual

Warna dasar **soft pink**. Hero dan halaman masuk memakai gradasi pink muda (#ffc9da → #ffe9f0) dengan teks gelap (#4a1d33). Pink tua (#d6336c) dipakai untuk tombol supaya tulisan putih tetap terbaca.

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--bg` | #fff6f9 (soft pink) | #1a1216 | latar halaman |
| `--primary` | #d6336c (pink tua, kontras 4,6:1 dengan teks putih) | #ff8fb5 | tombol utama, menu aktif |
| `--primary-soft` | #ffe3ee | #4a2534 | latar menu aktif, chip |
| `--accent` | #f59e0b | #fbbf24 | panah baru, sasaran harian, tips |
| `--good` | #0a7d0a | #4cc94c | benar (selalu dengan ikon ✓ + teks) |
| `--bad` | #c62f2f | #f07272 | salah (selalu dengan ikon + teks) |
| `--series-1` | #2a78d6 | #3987e5 | panah diagram, garis grafik pertama |
| `--series-2` | #eb6834 | #d95926 | garis grafik kedua |
| `--seq-1…6` | biru muda → tua | sebaliknya | peta penguasaan di dashboard guru |

- Warna seri grafik mengikuti palet tervalidasi (urutan biru → oranye aman untuk buta warna).
- Status benar/salah **tidak pernah hanya warna**: selalu ada ikon dan kalimat.
- Fon sistem (Segoe UI/Roboto/SF), angka tabel memakai *tabular numbers*.

## 3. Maskot

**Kuro**, kelinci abu-abu gelap (“kuro” = hitam) bertelinga dalam pink, pipi merona, dan topi wisuda pink (orisinal). Ekspresi: `happy` (beranda), `cheer` (berhasil), `calm` (tips), `think`. Maskot hanya muncul di hero, tips, dan layar hasil, bukan di setiap layar (menghindari beban ekstrinsik).

## 4. Komponen kunci

| Komponen | Aturan |
|---|---|
| Diagram panah | Maks. 6 anggota/himpunan; panah baru berwarna amber; panah lain diredupkan saat satu anggota disorot; tombol Rapikan panah muncul hanya bila ada persilangan; dapat dipakai dengan papan ketik |
| Seret-taruh | Tiga cara: seret, ketuk-lalu-ketuk, papan ketik (Enter). Kartu salah ditandai merah setelah Periksa |
| Langkah bertahap | Satu langkah muncul per ketukan; “Tampilkan semua” tersedia |
| Grafik | Grid tipis, garis 2.5 px, titik ≥ 8 px berlabel (≤ 6 titik), sorotan nilai saat disentuh/digeser, legenda saat ada label |
| Umpan balik | Kotak hijau/merah/kuning + ikon + judul singkat + satu kalimat penjelasan + label jenis kesalahan |
| Tombol | Tinggi ≥ 44 px; satu tombol utama per layar |

## 5. Aksesibilitas

- Kontras teks ≥ 4.5:1 (mode terang & gelap).
- Semua elemen interaktif dapat dicapai dengan Tab; fokus terlihat (garis 3 px).
- `aria-live` untuk umpan balik dan keterangan diagram; `aria-label` pada diagram SVG berisi daftar pasangan.
- Pengaturan: **Teks besar** (≈ +19%), **Kurangi animasi**, **Mode gelap**; menghormati `prefers-reduced-motion`.
- Tidak ada batas waktu pada soal.

## 6. Bahasa

- Bahasa Indonesia baku tetapi ramah, kalimat ≤ 20 kata bila memungkinkan.
- Istilah formal selalu disertai padanan sederhana (domain = daerah asal) dan dapat diketuk.
- Sapaan “kamu” untuk siswa.
