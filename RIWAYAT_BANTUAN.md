# Riwayat Bantuan AI — Pengembangan Aplikasi RelaFun

| Atribut | Keterangan |
|---|---|
| Pengguna | Iren Ihdina Zulfa (NIM 2225250019) |
| Kelas | 3E |
| Asisten | Claude Code (model Claude Opus 5.5, Anthropic) |
| Tanggal | 12 November 2026 (satu sesi, sembilan permintaan) |
| Folder proyek | `iren_ihdina_zulfa/` |
| Materi | Relasi dan Fungsi (kelas 8 SMP) |

> **Catatan:** Pesan pengguna ditulis **apa adanya**. Jawaban asisten ditulis sebagai **ringkasan** isi, keputusan, dan hasil kerjanya. Hasil kerja lengkap ada di file proyek yang dirujuk.

---

## Permintaan 1 — Mengubah identitas pada file riwayat

### 👤 Pengguna

> ubah namanya jadi Iren Ihdina Zulfa, kelas 3E dan materinya itu diganti jadi relasi dan fungsi kelas 8 SMP

*Konteks: file `RIWAYAT_BANTUAN.md` yang dibuka saat itu berisi riwayat bantuan AI milik mahasiswa lain (materi SPLDV).*

### 🤖 Asisten

- Mengganti nama, kelas, dan materi pada file tersebut. Materi SPLDV disesuaikan menjadi Relasi dan Fungsi.
- Mengingatkan bahwa isi riwayat harus sesuai percakapan yang benar-benar dilakukan pengguna. Angka hasil kerja di file itu (jumlah tes, modul, dan soal) berasal dari proyek lain.

---

## Permintaan 2 — Menyesuaikan dengan data wawancara sendiri

### 👤 Pengguna

> ini punya saya seperti ini tolong disesuaikan dan apa lagi yang diperlukan?...

*Lampiran:*
- `Hasil_Transkrip_Wawancara_Relasi_Fungsi.pdf`: narasumber siswa SMPIT Insantama Serang, 8 November 2026, kerangka ADDIE, 14 kode temuan K01–DS02.
- `Lembar_Soal_Siswa_Relasi_Fungsi.pdf`: 4 soal *mathematical literacy*.

### 🤖 Asisten

- Menyesuaikan file riwayat dengan data wawancara dan lembar soal pengguna. Asisten juga menambahkan tabel temuan wawancara beserta jenis beban kognitifnya, serta fitur yang diturunkan dari matriks ADDIE.
- Menghitung kunci jawaban keempat soal lembar literasi.
- Menyampaikan bahwa sesi-sesi pengembangan di file lama **belum pernah dijalani** pengguna, sehingga file itu tidak boleh dipakai sebagai riwayat. Asisten menyarankan pengerjaan proyek yang sesungguhnya.
- Daftar hal yang masih diperlukan: jawaban asli narasumber, dokumen perencanaan, aplikasinya, NIM, dan gambar acuan UI.

---

## Permintaan 3 — NIM dan jawaban acuan lembar soal

### 👤 Pengguna

> nim saya 2225250019, untuk jawabannyya sudah ada tapi narasumber belum mengerimkan jadi tolong jawab terlebih dahulu oleh kammu

### 🤖 Asisten

- Menambahkan NIM.
- Membuat `JAWABAN_ACUAN_SOAL_RELASI_FUNGSI.md`, yang kini juga ada di `docs/`. Isinya jawaban lengkap keempat soal beserta langkah penyelesaiannya:

  | Soal | Jawaban |
  |---|---|
  | 1 | Provider A (Rp50.000 < Rp55.000) |
  | 2 | Ongkos Rp53.000, uang tidak cukup (kurang Rp3.000) |
  | 3 | 23 °C |
  | 4 | Tidak setuju; −50.000 berarti rugi; minimal 4 tas |

- Jawaban tersebut diberi tanda jelas sebagai **kunci/acuan buatan AI, bukan jawaban narasumber**. Jawaban asli narasumber tetap dipakai sebagai data setelah dikirim.

---

## Permintaan 4 — Langkah selanjutnya

### 👤 Pengguna

> jadi yang saya butuhkan apalagi setelah ini

### 🤖 Asisten

Memberikan urutan pekerjaan:
1. Lengkapi data: jawaban asli narasumber, mockup UI, dan kurikulum acuan. Tentukan juga apakah fitur AI dipakai.
2. Susun dokumen perencanaan.
3. Rancang literasi matematika dan pemodel soal cerita.
4. Bangun aplikasi.
5. Rapikan riwayat sesuai kejadian sebenarnya.
6. *Deploy* ke HTTPS (opsional).

---

## Permintaan 5 — Mengerjakan semuanya sampai siap dijalankan

### 👤 Pengguna

> tolong perbaiki semuanya dan lengkapka saya terima jadi dan nanti saya jalankan

### 🤖 Asisten — keputusan yang diambil

| Hal | Keputusan | Alasan |
|---|---|---|
| Teknologi | Python (FastAPI, SymPy, SQLAlchemy/SQLite) + JavaScript tanpa proses build, berbentuk PWA | Node.js tidak terpasang di komputer pengguna; cukup Python untuk menjalankan |
| Kurikulum | Kurikulum Merdeka, Fase D | Belum ditentukan pengguna; cakupan sama dengan K13 |
| Tampilan | Mengikuti pola dashboard belajar: sidebar, hero bermaskot, Lanjutkan Materi, Bangun Keahlian, sasaran harian, peringkat | Gambar acuan UI belum diberikan |
| Maskot | “Kiko” si burung hantu, dibuat orisinal | — |
| Fitur AI | Opsional, nonaktif bawaan; aktif bila kunci API diisi dan guru mengizinkan | Biaya API belum diputuskan |
| Data narasumber | Ditulis sebagai “S01” di dokumen | Melindungi data anak |

### 🤖 Asisten — hasil

**Aplikasi (`apps/`)**
- **Backend Python:**
  - mesin hitung SymPy (format angka Indonesia, masukan rumus aman);
  - kalkulator nilai fungsi bertahap;
  - analisis fungsi/bukan fungsi;
  - diagnosis jenis kesalahan: salah tanda, tidak dikalikan, lupa konstanta, angka ditempel;
  - pemeriksa 7 jenis soal;
  - pemodel soal cerita (hitung, bandingkan, pertidaksamaan, cari x) dengan verifikasi V1–V6;
  - pemodel AI dengan Claude (*structured output*), yang hanya menerjemahkan cerita;
  - poin, streak, sasaran harian, papan peringkat, dan dashboard guru dengan ekspor CSV.
- **Frontend JavaScript (PWA):**
  - **diagram panah** interaktif: panah muncul satu per satu, sorot per anggota, rapikan persilangan, cek tepat satu pasangan, sorot domain/kodomain/range, buat panah sendiri;
  - kuis seret-taruh (bisa juga dengan ketukan);
  - contoh dan pembahasan bertahap;
  - istilah yang dapat diketuk;
  - pemodel terpandu 6 langkah;
  - grafik fungsi;
  - mode gelap dan teks besar;
  - tampilan HP dengan navigasi bawah.

**Konten (`content/`):** 13 modul (3 prasyarat, 7 inti, 3 literasi), 62 layar penjelasan, 68 soal, glosarium 22 istilah, dan 6 soal cerita (4 di antaranya dari lembar soal pengguna). Setiap modul dikaitkan ke kode wawancara.

**Dokumen (`docs/01`–`15`):**
- sintesis wawancara dan persona;
- PRD (FR-01–FR-22) dan user stories (US-01–US-28);
- desain pembelajaran CLT + ADDIE dan spesifikasi konten;
- UI/UX, arsitektur dan model data, API;
- keamanan dan privasi;
- rencana dan hasil pengujian, roadmap ADDIE;
- literasi matematika dan pemodel soal cerita;
- templat analisis jawaban siswa dan panduan penggunaan;
- `README.md` dan `CLAUDE.md`.

**Pengujian:**
- 262 tes otomatis backend lolos. Tes ini mencakup: setiap kunci jawaban dinilai benar, aturan CLT konten, keterlacakan 14 kode wawancara, 4 soal lembar literasi, dan penolakan masukan berbahaya.
- 25 skenario uji di Chrome (desktop dan HP) lolos tanpa galat. Tangkapan layar diperiksa. Tiga masalah tampilan ditemukan dan diperbaiki: ikon tombol diagram membesar, kartu tidak sejajar, dan diagram terlalu kecil di HP.

**Belum diuji / keterbatasan:**
- Panggilan Claude API sungguhan (diuji dengan respons tiruan).
- Pemasangan PWA di HP fisik, karena membutuhkan alamat HTTPS.
- Analisis jawaban asli narasumber, karena belum diterima.

**Cara menjalankan:** klik dua kali `start.bat`, lalu buka http://localhost:8000. Akun demo `siswa`/`siswa123` dan `guru`/`guru123`, kode kelas `RF8A26`.

*Pada tahap ini aplikasi masih bernama “LangkahKu”; namanya diganti pada Permintaan 7.*

---

## Permintaan 6 — Cara menjalankan

### 👤 Pengguna

> jadi cara ngejalaninnya gimana, menggunakan github?

### 🤖 Asisten

- Menjelaskan bahwa GitHub **tidak diperlukan** untuk menjalankan di laptop. Caranya: klik dua kali `start.bat`, biarkan jendela hitam (server) tetap terbuka, lalu buka http://localhost:8000.
- Menjelaskan cara membuka dari HP yang memakai Wi-Fi yang sama.
- Menjelaskan bahwa GitHub dan layanan hosting (mis. Render) baru diperlukan bila aplikasi ingin dionlinekan dengan alamat HTTPS, agar dapat dipasang di HP mana pun.

---

## Permintaan 7 — Link tidak bisa dibuka & ganti nama aplikasi

### 👤 Pengguna

> gabisa dibuka link nya dan namanya jangan langkahku buatkan namanya yang berebda dan menarik

### 🤖 Asisten

- **Pemeriksaan link:**
  - Saat diperiksa, tidak ada server yang berjalan di port 8000, sehingga http://localhost:8000 memang tidak bisa dibuka.
  - Asisten lalu menjalankan `start.bat` dan memastikan server menyala serta merespons dengan baik.
  - Kesimpulan: link hanya bisa dibuka **selama jendela hitam `start.bat` masih terbuka**.
- **Nama baru: PanahPintar.** Nama ini diambil dari diagram panah, ciri khas materi Relasi dan Fungsi sekaligus fitur utama aplikasi. Nama diganti di aplikasi, manifest PWA, skrip, kode, dokumen, dan nama database (`panahpintar.db`).
- **Ikon baru:** dua himpunan dengan dua panah menuju satu pasangan (menggambarkan fungsi) dan kilau kuning (“pintar”), menggantikan ikon tangga.
- Seluruh tes otomatis dan uji peramban dijalankan ulang setelah penggantian nama.
- Asisten menawarkan nama alternatif: Pasangin, RelaFun, FungsiKita.

---

## Permintaan 8 — Nama RelaFun & link siap pakai

### 👤 Pengguna

> mau namanya RelaFun tolong kasi link nya agar saya bisa pake  langsung

### 🤖 Asisten

- Mengganti nama aplikasi dari PanahPintar menjadi **RelaFun** (Relasi + Fungsi). Penggantian mencakup tampilan, manifest PWA, skrip, kode, dokumen, dan database (`relafun.db`). Kalimat sambutan menjadi “Relasi & Fungsi jadi seru!”. Ikon dua himpunan dengan panah tetap dipakai.
- Menjalankan server RelaFun di laptop pengguna dan memeriksa bahwa link **http://localhost:8000** dapat dibuka, termasuk login akun demo.
- Menjelaskan bahwa link lokal hanya berfungsi selama server (jendela `start.bat`) menyala. Link permanen yang bisa dibuka dari mana saja memerlukan *deploy* ke hosting berbasis HTTPS dengan akun GitHub dan Render milik pengguna.
- Menambahkan `render.yaml` agar *deploy* ke Render bisa dilakukan lewat menu Blueprint.
- 262 tes otomatis lolos setelah penggantian nama.

---

## Permintaan 9 — Tidak bisa masuk dengan akun demo

### 👤 Pengguna

> kok nama pengguna kata sandi salah terus harusnya apa nama pengguna dan sandinya

### 🤖 Asisten

- **Pemeriksaan:** akun demo ada di database dan login `siswa`/`siswa123` serta `guru`/`guru123` berhasil saat diuji. Log server hanya mencatat satu percobaan gagal. Kemungkinan penyebabnya salah ketik yang tidak terlihat: huruf kapital, spasi tambahan, atau isian otomatis peramban.
- **Perbaikan halaman masuk:**
  - Tombol sekali klik **“Masuk sebagai Siswa Demo”** dan **“Masuk sebagai Guru Demo”**.
  - Tombol **Lihat** kata sandi dan peringatan saat Caps Lock menyala.
  - Spasi di awal/akhir nama pengguna dan kata sandi diabaikan.
  - Pesan galat kini mengingatkan soal huruf besar/kecil.
- Menambah tes otomatis (total 263 lolos) dan menguji halaman masuk di Chrome (desktop & HP), termasuk masuk dengan “ Siswa” dan “siswa123 ”.
