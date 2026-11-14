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

**Wen** (orisinal, versi 2.2) adalah kelinci **putih** bergaya chibi. Ciri-cirinya:
- kepala bulat besar seperti mochi, dengan jumbai bulu di pipi dan jambul kecil;
- mata besar berkilau, pipi merona, dan mulut “ω”;
- **telinga panjang berbentuk daun**; ujung telinga kanan sedikit menekuk;
- **hoodie pink pastel** berlencana **bintang kuning**, **pita biru muda** di pangkal telinga, kaki berbantalan pink, dan ekor bulat.

Desainnya buatan sendiri, bukan tiruan karakter mana pun. Gambar dibuat langsung sebagai SVG di `apps/web/js/mascot.js` (tanpa berkas gambar), jadi tetap tajam di semua ukuran dan bisa berganti ekspresi.

| Ekspresi | Ciri | Muncul di |
|---|---|---|
| Senang (`happy`) | mata melengkung, mulut ω | beranda |
| Tenang (`calm`) | mata bulat berkilau | ekspresi dasar |
| Bersorak (`cheer`) | melompat, kedua tangan terangkat | jawaban benar di game, 2 bintang, sasaran harian tercapai, selesai materi/pemodel, latihan ≥ 80% |
| Menyapa (`wave`) | melambai | halaman masuk, galeri |
| Kedip (`wink`) | kedip + lidah | combo ≥ 3 di game |
| Sayang (`love`) | mata hati | combo 3–4 benar, latihan sempurna |
| Kagum (`starry`) | mata bintang | combo ≥ 5, 3 bintang, streak ≥ 3 hari (beranda) |
| Tertawa (`laugh`) | mata > <, air mata bahagia | saat diketuk |
| Malu-malu (`shy`) | kedua tangan di pipi, rona bergaris | diketuk 5× berturut-turut |
| Berpikir (`think`) | melirik ke atas, tangan di dagu, gelembung pikiran | menunggu jawaban Mode AI |
| Punya ide (`idea`) | telunjuk ke atas, bola lampu | kotak “Tips dari Wen” |
| Bingung (`confused`) | mata titik, mulut bergelombang, tanda tanya | istilah glosarium tidak ditemukan |
| Kaget (`surprised`) | mata bulat besar, tanda seru | waktu habis di Mode Kilat |
| Sedih (`sad`) | telinga terkulai, mata berkaca-kaca | jawaban salah di game, nyawa habis |
| Mengantuk (`sleepy`) | mata terpejam, “Zzz”, gelembung hidung | beranda pukul 21.00–04.00, dengan pesan “jangan lupa istirahat” |
| Semangat (`determined`) | ikat kepala berbintang, tangan mengepal | soal berikutnya setelah salah di game, latihan < 80% |
| Makan wortel (`carrot`) | memegang wortel, “nyam” | lobi game, akhir game 1 bintang |
| Keren (`cool`) | kacamata hati | rekor baru di game |

**Interaksi dan gerak**
- Wen di halaman masuk, beranda, lobi game, dan galeri bisa **diketuk**. Wen menampilkan ekspresi acak selama ±2 detik, lalu kembali. Kalau diketuk 5× berturut-turut, Wen jadi malu-malu.
- Gerak halus: berkedip, telinga bergoyang, dan badan naik-turun pelan. Semua gerak berhenti bila **Kurangi animasi** aktif atau perangkat meminta gerak dikurangi.
- Halaman **Kenalan dengan Wen** (`#/wen`, dibuka dari *Lainnya* atau *Pengaturan*) menampilkan ke-18 ekspresi.

Maskot hanya muncul di hero, tips, game, layar hasil, dan keadaan kosong, tidak di setiap layar soal, untuk menghindari beban ekstrinsik. Ekspresi sedih selalu disertai kalimat penyemangat, bukan menyalahkan.

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
