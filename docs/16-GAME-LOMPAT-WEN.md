# 16 — Game “Lompat Wen”

Game latihan berbasis soal: siswa membantu **Wen** (maskot kelinci) melompati **10 batu**. Setiap batu berisi satu soal Relasi dan Fungsi.

## 1. Aturan main

| Unsur | Aturan |
|---|---|
| Ronde | 10 soal acak (jenis soal bergiliran) |
| Nyawa | 3 ❤️; jawaban salah mengurangi 1 nyawa; nyawa habis = permainan selesai |
| Skor | Benar +10 🥕; combo ≥ 3 jawaban benar berturut-turut +5; Mode Kilat: bonus sisa waktu |
| Bintang | Selesai dengan ≥ 9 benar ★★★, ≥ 7 benar ★★, selainnya ★ (nyawa habis = 0 ★) |
| Level | 1 Padang Wortel (mudah) → 2 Hutan Panah (sedang) → 3 Gunung Fungsi (sulit); level berikutnya terbuka dengan ≥ 1 ★ |
| Mode Kilat | Opsional, 15 detik per soal; waktu habis = salah |
| Suara | Bunyi pendek benar/salah/menang (Web Audio), bisa dimatikan |
| Penyimpanan | Rekor, bintang, dan total wortel per akun di perangkat (`localStorage`) |

## 2. Jenis soal (dibuat acak, `apps/web/js/game/generators.js`)

| Jenis | Level | Contoh | Kode wawancara |
|---|---|---|---|
| Fungsi atau bukan (diagram panah) | 1, 2 | diagram 3–4 anggota | IL01, GL02, EL02 |
| Fungsi atau bukan (pasangan berurutan) | 1, 2 | {(1, b), (2, a), (3, a)} | IL01, GL02 |
| Nilai fungsi | 1, 2, 3 | f(x) = 2x + 5, f(3)? (negatif & desimal di level atas) | IL02 |
| Pasangan sesuai nama relasi | 1 | “setengah dari” → (5, 10) | K01, DS01 |
| Istilah | 1, 2 | “Daerah kawan disebut juga …” | EL03 |
| Domain / range | 2, 3 | dari himpunan pasangan berurutan | IL01 |
| Rumus dari tabel | 3 | tabel x = 0–3 | IL02, GL03 |
| Mencari x | 3 | f(k) = 11, k? | IL02 |
| Soal cerita | 3 | tarif ojek/taksi/sewa sepeda | EL01 |

**Pengecoh disusun dari kesalahan khas** (salah tanda, lupa konstanta, x dijumlahkan, angka ditempel, a–b tertukar, pasangan terbalik, kodomain dikira range), sehingga jawaban salah memberi informasi.

## 3. Prinsip desain (CLT)

- Satu soal per layar, pilihan jawaban besar (≥ 58 px), bisa juga dengan tombol 1–4.
- Bawaan **tanpa batas waktu**; Mode Kilat hanya pilihan.
- Salah → jawaban benar ditandai + **penjelasan satu kalimat**, siswa menekan *Lanjut* sendiri (tidak terburu-buru).
- Animasi menghormati pengaturan *Kurangi animasi*.
- Wortel game **terpisah** dari poin latihan, sehingga papan peringkat kelas tidak bisa “dipancing” dengan bermain berulang.

## 4. Pengujian

- **5.400 soal acak** (600 per jenis) diperiksa mandiri di peramban: jawaban benar dihitung ulang dengan mesin hitung, tidak ada pilihan kembar, dan tidak ada dua pilihan yang sama-sama benar (rumus dari tabel & mencari x). Hasil: **0 gagal**.
- Alur bermain di Chrome (HP 390 px): lobi & kunci level, 9/10 benar → ★★★ dan level 2 terbuka, 3× salah → selesai, Mode Kilat “Waktu habis!”, pintasan papan ketik, tidak ada gulir horizontal — di versi online **dan** versi server.
