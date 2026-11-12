# 04 — Desain Pembelajaran (Cognitive Load Theory + ADDIE)

## 1. Kerangka

**Cognitive Load Theory (Sweller):** kapasitas memori kerja terbatas. Desain harus
- **menurunkan beban ekstrinsik** (tampilan/bahasa yang tidak perlu),
- **mengelola beban intrinsik** (memecah konsep sulit, prasyarat dulu),
- **mendorong beban germane** (aktivitas yang membangun skema: contoh bertahap, mengecek sendiri).

**ADDIE:** Analysis → Design → Development → Implementation → Evaluation. Status setiap tahap ada di `11-ROADMAP.md`.

## 2. Prinsip CLT → keputusan desain

| Prinsip CLT | Masalah dari wawancara | Keputusan di RelaFun |
|---|---|---|
| *Segmenting* | DS02: perlu pelan-pelan | Satu langkah per layar; ≤ 70 kata per layar (divalidasi otomatis) |
| *Pre-training* | IL03: aljabar & operasi hitung | Modul prasyarat p1–p3 sebelum materi inti |
| *Worked example effect* | GL03 | Contoh bertahap; langkah dimunculkan satu per satu; pembahasan bertahap setelah 2 percobaan |
| *Faded guidance* | GL03: “ikuti langkah, lalu coba sendiri” | Urutan modul: contoh → latihan berpetunjuk → latihan mandiri; petunjuk opsional |
| *Signaling* | EL02, EL01 | Panah baru berwarna amber; anggota bermasalah ditandai merah; angka penting di soal cerita ditandai |
| *Split-attention* dihindari | EL02 | Label pasangan muncul di keterangan tepat di bawah diagram, bukan di legenda terpisah |
| *Redundancy* dihindari | EL01 | Teks singkat; tidak mengulang isi diagram dalam paragraf panjang |
| *Element interactivity* dikurangi | K03, EL02 | ≤ 6 anggota per himpunan; tombol “Rapikan panah”; sorot satu anggota |
| *Self-explanation / checking* | GL02 | Mode “cek satu per satu” memodelkan strategi siswa sendiri |
| *Concreteness fading* | GL01 | Konteks sehari-hari (siswa–pelajaran, golongan darah) → bilangan → rumus |
| *Immediate feedback* | DS01 | Umpan balik instan + diagnosis jenis kesalahan |
| *Expertise reversal* | — | Pembahasan tidak dipaksakan; siswa yang sudah benar bisa langsung lanjut |

## 3. Alur belajar setiap modul

```
Penjelasan (2–6 layar)          Latihan (4–7 soal)                 Hasil
┌────────────┐  ┌───────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  ┌──────────────┐
│ Konsep +   │→│ Contoh     │→│ Soal 1  │→│ Umpan   │→│ Soal 2 │→ │ Ringkasan,   │
│ contoh     │  │ bertahap   │  │ (+petun-│  │ balik / │  │  …     │  │ saran ulang  │
│ sehari-hari│  │ (reveal)   │  │  juk)   │  │ pembahas│  │        │  │ atau lanjut  │
└────────────┘  └───────────┘  └─────────┘  └─────────┘  └────────┘  └──────────────┘
```

## 4. Urutan materi (Kurikulum Merdeka, Fase D)

| No | Modul | Kelompok | Fokus |
|---|---|---|---|
| 1 | Himpunan dan Anggotanya | Prasyarat | ∈, banyak anggota |
| 2 | Operasi Bilangan Bulat & Desimal | Prasyarat | tanda, urutan operasi, menit → jam |
| 3 | Substitusi Bentuk Aljabar | Prasyarat | 3x = 3 × x; kurung untuk nilai negatif |
| 4 | Mengenal Relasi | Inti | relasi sebagai hubungan sehari-hari |
| 5 | Tiga Cara Menyatakan Relasi | Inti | diagram panah, pasangan berurutan, Kartesius |
| 6 | Fungsi atau Bukan Fungsi? | Inti | aturan tepat satu pasangan |
| 7 | Domain, Kodomain, dan Range | Inti | daerah asal/kawan/hasil, bayangan |
| 8 | Notasi dan Nilai Fungsi | Inti | f(x), f : x → …, substitusi bertahap |
| 9 | Menentukan Rumus Fungsi | Inti | a dan b dari tabel/dua nilai |
| 10 | Tabel dan Grafik Fungsi | Inti | garis lurus, membaca grafik |
| 11 | Memodelkan Situasi | Literasi (Formulate) | soal taksi |
| 12 | Membandingkan Dua Pilihan | Literasi (Reasoning) | soal provider |
| 13 | Menghitung & Menafsirkan | Literasi (Employ, Interpret) | soal suhu & keuntungan |

## 5. Umpan balik

- **Bahasa sehari-hari**, kalimat pendek, tidak menyalahkan (“Belum tepat, coba lagi!”).
- **Spesifik**: menyebut anggota bermasalah (“2 punya 2 pasangan (b, c)”) atau jenis kesalahan (“tanda + / − tertukar”).
- **Bertingkat**: percobaan 1 → umpan balik + petunjuk opsional; percobaan 2 → pembahasan bertahap.
- **Masukan tidak lengkap** (format salah/kosong) tidak dihitung sebagai percobaan.

## 6. Gamifikasi ramah CLT

- Poin hanya sekali per soal (10 poin percobaan pertama, 5 poin setelahnya) → tidak mendorong menebak berulang.
- Sasaran harian kecil (5 soal benar) dan streak → kebiasaan rutin, bukan kecepatan.
- Papan peringkat per kelas memakai nama panggilan dan dapat dimatikan guru.
- Tidak ada pengatur waktu (*timer*) agar tidak menambah kecemasan.
