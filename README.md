# RelaFun — Belajar Relasi dan Fungsi Kelas 8

Aplikasi belajar matematika untuk siswa SMP kelas 8 materi **Relasi dan Fungsi**. Rancangannya berdasarkan wawancara tentang **beban kognitif** (Cognitive Load Theory, model ADDIE). Aplikasi dapat dibuka di peramban dan **dipasang tanpa Play Store/App Store** (PWA) di Android, iOS, Windows, dan macOS.

| | |
|---|---|
| Pengembang | Iren Ihdina Zulfa (NIM 2225250019), kelas 3E |
| Teknologi | Python (FastAPI, SymPy, SQLAlchemy) + JavaScript (PWA, tanpa build) |
| Status | Versi 1 — 264 tes otomatis, 1.209 kasus uji silang Python–JavaScript, 25 skenario uji peramban lolos |

## 📱 Coba langsung (tanpa instal apa pun)

### 👉 https://irenihdinazulfa.github.io/RelaFun/

- **Android:** buka di Chrome → menu ⋮ → **Instal aplikasi**.
- **iPhone/iPad:** buka di Safari → tombol Bagikan → **Tambahkan ke Layar Utama**.
- **Laptop:** buka di Chrome/Edge → ikon instal di bilah alamat.
- Di halaman masuk, klik **Masuk Akun Demo** atau **Masuk sebagai Guru Demo**.

Versi online ini berjalan sepenuhnya di peramban: setelah dibuka sekali, aplikasi tetap bisa dipakai tanpa internet, dan data latihan tersimpan di masing-masing perangkat. **Mode AI** aktif setelah kunci API Claude dimasukkan di *Pengaturan → Fitur AI* (kunci hanya disimpan di perangkat itu). Dashboard guru untuk satu kelas sungguhan tersedia di versi server.

## Menjalankan versi server (Windows)

**Klik dua kali `start.bat`**, lalu buka http://localhost:8000.

Cara lain:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start.ps1
```

Akun demo: `siswa` / `siswa123` · `guru` / `guru123` · kode kelas `RF8A26`.

Panduan lengkap (HP, guru, AI, deploy): [docs/15-PANDUAN-PENGGUNAAN.md](docs/15-PANDUAN-PENGGUNAAN.md)

## Fitur utama (dan temuan wawancara yang dijawab)

| Fitur | Menjawab |
|---|---|
| Diagram panah interaktif: panah muncul satu per satu, sorot per anggota, **Rapikan panah** | EL02, K03 — pusing karena panah banyak & bersilangan |
| Mode **cek satu per satu** “tepat satu pasangan” | GL02, IL01 |
| Mode sorot **Domain / Kodomain / Range** + kuis **seret-taruh** | IL01, DS01 |
| Soal **membuat panah sendiri** dengan umpan balik langsung | DS01 |
| **Kalkulator f(x) bertahap** + diagnosis salah tanda / tidak dikalikan / lupa konstanta | IL02, GL03 |
| Materi **satu langkah per layar**, contoh bertahap, pembahasan setelah 2 kali mencoba | DS02, GL03 |
| Istilah sulit dapat diketuk + **Glosarium** bahasa sederhana | EL03 |
| **Pemodel soal cerita** (terpandu 6 langkah; AI opsional, diverifikasi SymPy) | EL01, literasi |
| Modul prasyarat (himpunan, bilangan bulat, substitusi) | IL03 |
| 3 modul literasi dari 4 soal lembar PISA | Literasi matematika |
| Dashboard guru: kesalahan terbanyak, akurasi per materi, peta penguasaan, CSV | Pemantauan kelas |
| 🎮 **Game “Lompat Wen”**: 10 soal acak per ronde, 3 nyawa, combo, bintang, 3 level, Mode Kilat opsional | Latihan yang seru (DS01) |
| Poin, streak, sasaran harian, papan peringkat per kelas (bisa dimatikan) | Motivasi |
| Mode gelap, teks besar, kurangi animasi | Aksesibilitas |

## Struktur

```
start.bat                 jalankan di Windows
scripts/                  start.ps1 · start.sh
apps/api/                 backend Python + tes (pytest)
apps/web/                 aplikasi web PWA (JavaScript)
content/                  13 modul, glosarium, soal cerita (JSON)
docs/                     dokumen perencanaan 01–17 + kunci jawaban
instrumen/                lembar validasi, angket, soal pretest–posttest (.docx) + analisis (.xlsx)
referensi/                transkrip wawancara & lembar soal (.docx) — tidak diunggah ke GitHub (data pribadi narasumber)
RIWAYAT_BANTUAN.md        riwayat bantuan AI
```

## Dokumen

| No | Dokumen |
|---|---|
| 01 | [Sintesis hasil wawancara & persona](docs/01-RESEARCH-INSIGHTS.md) |
| 02 | [PRD](docs/02-PRD.md) |
| 03 | [User stories](docs/03-USER-STORIES.md) |
| 04 | [Desain pembelajaran (CLT + ADDIE)](docs/04-LEARNING-DESIGN.md) |
| 05 | [Spesifikasi konten](docs/05-CONTENT-SPEC.md) |
| 06 | [Panduan UI/UX](docs/06-UI-UX-GUIDE.md) |
| 07 | [Arsitektur & model data](docs/07-ARCHITECTURE.md) |
| 08 | [Spesifikasi API](docs/08-API-SPEC.md) |
| 09 | [Keamanan & privasi](docs/09-SECURITY-PRIVACY.md) |
| 10 | [Rencana & hasil pengujian](docs/10-TEST-PLAN.md) |
| 11 | [Roadmap ADDIE](docs/11-ROADMAP.md) |
| 12 | [Literasi matematika](docs/12-MATH-LITERACY.md) |
| 13 | [Pemodel soal cerita](docs/13-WORD-PROBLEM-MODELER.md) |
| 14 | [Templat analisis jawaban siswa](docs/14-ANALISIS-JAWABAN-SISWA.md) |
| 15 | [Panduan penggunaan](docs/15-PANDUAN-PENGGUNAAN.md) |
| 16 | [Game “Lompat Wen”](docs/16-GAME-LOMPAT-WEN.md) |
| 17 | [Instrumen penelitian (validasi ahli & uji coba)](docs/17-INSTRUMEN-PENELITIAN.md) — file siap cetak di [`instrumen/`](instrumen/) |
| — | [Kunci jawaban acuan lembar soal](docs/JAWABAN_ACUAN_SOAL_RELASI_FUNGSI.md) |

## Pengujian

```powershell
cd apps\api
.venv\Scripts\python -m pytest -q
```
