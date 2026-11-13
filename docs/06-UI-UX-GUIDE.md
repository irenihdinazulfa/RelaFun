# 06 — Panduan UI/UX

## 1. Struktur halaman (mengikuti gambaran mockup dashboard belajar)

**Desktop (≥ 861 px):** sidebar kiri (logo, menu, profil) + konten.
**HP (≤ 860 px):** bilah atas (logo, pengaturan) + navigasi bawah 5 ikon (Beranda, Materi, Kalkulator, Pemodel, Lainnya).

Beranda siswa:
```
┌──────────────────────────────────────────────┬──────────────────┐
│ HERO: sapaan + maskot Wen + [Lanjut belajar]│ Sasaran harian   │
├──────────────────────────────────────────────┤ (cincin x/5)     │
│ Lanjutkan materi (kartu + progres)           │ streak · poin    │
├──────────────────────────────────────────────┼──────────────────┤
│ Bangun keahlian (7 kartu materi inti, %)     │ Peringkat kelas  │
├──────────────────────────────────────────────┤ (5 teratas)      │
│ Literasi & alat bantu (kartu topik)          │                  │
└──────────────────────────────────────────────┴──────────────────┘
```

## 2. Identitas visual

Warna dasar **pink pastel** dengan aksen **biru muda, kuning mentega, dan peach** (versi 2.0). Hero dan halaman masuk memakai gradasi pastel (#ffd3e2 → #fff0d6 → #dcefff) dengan teks gelap (#4a1d33). Tombol berwarna pastel dengan **tulisan gelap** supaya tetap terbaca; pink tua hanya dipakai untuk teks tautan dan ikon.

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--bg` | #fff7fa (pink sangat muda) | #1a1216 | latar halaman |
| `--fill` / `--on-fill` | #ffa8c8 / #4a1d33 (kontras ±7:1) | #ff9ec1 / #1a1216 | tombol utama, avatar, langkah aktif |
| `--fill-strong` | #e85d93 | #ff8fb5 | bilah kemajuan, titik langkah, sakelar, pengatur waktu game |
| `--primary` | #d6336c (kontras 4,6:1 di latar putih) | #ff8fb5 | teks tautan, menu aktif, ikon |
| `--primary-soft` | #ffe3ee | #4a2534 | latar menu aktif, chip |
| `--sky` / `--butter` / `--peach` | #ddefff / #fff3c4 / #ffe4d4 | versi gelap redup | aksen pastel: ikon menu, kotak statistik, modul prasyarat |
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

**Wen** (orisinal), kelinci **putih** bergaya chibi yang memakai **tudung (hoodie) pink pastel bertelinga kelinci panjang**, dengan lencana **bintang kuning** di dahi, **pita biru muda** di sisi kepala, pipi merona, dan ekor bulat. Desainnya buatan sendiri, bukan tiruan karakter mana pun.

| Ekspresi | Tampilan | Dipakai di |
|---|---|---|
| `happy` | mata melengkung, mulut “ω” | beranda, akhir game 1 bintang |
| `cheer` | tangan terangkat, mulut terbuka, kilau | menjawab benar di game, 2 bintang, selesai materi/pemodel |
| `calm` | mata bulat berkilau | kotak “Tips dari Wen” |
| `think` | mata melirik, gelembung pikiran | cadangan (petunjuk) |
| `wink` | kedip nakal + lidah | halaman masuk, combo ≥ 3, hasil latihan |
| `surprised` | mata bulat besar + tanda seru | waktu habis di Mode Kilat |
| `sad` | mata sayu, satu telinga terkulai, tetes air | jawaban salah di game, nyawa habis |
| `love` | mata hati, tangan terangkat | combo ≥ 3 benar, 3 bintang, latihan sempurna |

Maskot hanya muncul di hero, tips, game, dan layar hasil, bukan di setiap layar (menghindari beban ekstrinsik). Ekspresi sedih selalu disertai kalimat penyemangat, bukan menyalahkan.

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
