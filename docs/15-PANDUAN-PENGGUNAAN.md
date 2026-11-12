# 15 — Panduan Penggunaan

## 0. Cara tercepat: link online

**https://irenihdinazulfa.github.io/RelaFun/**

| Perangkat | Cara memasang |
|---|---|
| Android (Chrome) | menu ⋮ → **Instal aplikasi** / **Tambahkan ke layar utama** |
| iPhone/iPad (Safari) | tombol **Bagikan** → **Tambahkan ke Layar Utama** |
| Windows/Mac (Chrome/Edge) | ikon instal di ujung kanan bilah alamat |

Di halaman masuk ada tombol besar **⬇ Unduh Aplikasi RelaFun** (dan tombol **Unduh** di bilah atas setelah masuk). Saat link dibuka di HP juga muncul jendela **“Unduh aplikasi RelaFun?”** dengan pilihan **Unduh sekarang** atau **Nanti saja**. Di iPhone dan bila link dibuka dari dalam WhatsApp, jendela itu berisi petunjuk langkah yang sesuai.

Di halaman masuk, klik **Masuk sebagai Siswa Demo** / **Masuk sebagai Guru Demo**.

Catatan versi online (GitHub Pages):
- Berjalan sepenuhnya di peramban, sehingga tetap bisa dipakai tanpa internet setelah dibuka sekali.
- Data akun & latihan tersimpan **di masing-masing perangkat**. Dashboard guru hanya menampilkan akun di perangkat yang sama.
- Mode AI tidak tersedia (perlu versi server).

Memperbarui versi online setelah kode diubah: `python scripts/deploy_pages.py`. Nomor versi tampil di bawah halaman masuk (saat ini **versi 1.3**). HP yang masih menyimpan versi lama akan memakai versi baru paling lambat saat aplikasi dibuka berikutnya.

## A. Menjalankan versi server (komputer Windows)

1. Pastikan **Python 3.10 atau lebih baru** terpasang (komputer ini sudah punya Python 3.14).
2. Buka folder `iren_ihdina_zulfa`, lalu **klik dua kali `start.bat`**.
   - Pertama kali: skrip menyiapkan lingkungan Python dan memasang paket (butuh internet, ± 1–3 menit).
   - Berikutnya: langsung jalan.
3. Peramban terbuka ke **http://localhost:8000**. Jendela hitam harus tetap terbuka selama aplikasi dipakai. Tekan **Ctrl+C** di jendela itu untuk berhenti.

Alternatif lewat PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start.ps1
```
macOS/Linux: `bash scripts/start.sh`

### Akun demo

| Peran | Nama pengguna | Kata sandi |
|---|---|---|
| Siswa | `siswa` | `siswa123` |
| Guru | `guru` | `guru123` |
| Kode kelas demo | `RF8A26` | |

## B. Membuka dari HP (satu jaringan Wi-Fi)

1. Sambungkan HP dan laptop ke Wi-Fi yang sama.
2. Lihat alamat yang dicetak skrip, misalnya `http://192.168.1.5:8000`, lalu buka di Chrome HP.
3. Jika tidak terbuka, izinkan Python di **Windows Defender Firewall** (jaringan pribadi).

> Tombol **Pasang** (instal aplikasi) di HP hanya muncul bila aplikasi dibuka lewat **HTTPS**, bukan lewat alamat 192.168.x.x. Untuk itu aplikasi perlu di-*deploy* ke internet (lihat bagian E).

## C. Untuk siswa

1. **Daftar siswa** → isi nama panggilan, nama pengguna, kata sandi, dan kode kelas dari guru.
2. **Materi** → kerjakan berurutan: Prasyarat → Relasi & Fungsi → Literasi.
3. Setiap materi: baca penjelasan satu layar demi satu layar, lalu tekan **Mulai latihan**.
4. Saat latihan:
   - **Petunjuk** bisa dibuka kapan saja (tidak mengurangi poin).
   - Setelah 2 kali mencoba, **pembahasan bertahap** muncul.
   - Kata bergaris titik-titik bisa diketuk untuk melihat artinya.
5. **Kalkulator f(x)** untuk mengecek hitungan. **Pemodel Soal Cerita** untuk berlatih soal cerita langkah demi langkah.
6. **Pengaturan** → mode gelap, teks besar, gabung kelas, pasang aplikasi.

## D. Untuk guru

1. **Daftar guru** → otomatis mendapat kelas pertama dan **kode kelas**.
2. Bagikan kode kelas ke siswa.
3. **Dashboard Guru** menampilkan:
   - jumlah siswa, rata-rata akurasi, soal benar;
   - **kesalahan yang sering muncul** (bahan penjelasan ulang di kelas);
   - akurasi per materi, peta penguasaan tiap siswa, soal tersulit;
   - tombol **Unduh CSV** untuk Excel.
4. Sakelar **Papan peringkat** dan **Pemodel AI** per kelas.

## E. Mengaktifkan fitur AI (opsional, berbayar)

1. Buat kunci API di https://console.anthropic.com.
2. Buka file `.env` di folder proyek, isi `ANTHROPIC_API_KEY=...`, lalu jalankan ulang `start.bat`.
3. Masuk sebagai guru → nyalakan **Pemodel AI** untuk kelas.

## F. Deploy ke internet (agar bisa dipasang di HP mana pun)

Unggah folder proyek ke layanan hosting Python yang menyediakan HTTPS (mis. Render, Railway, atau server sekolah) dengan perintah jalan:
```
cd apps/api && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
Atur variabel `SECRET_KEY` (acak), `SEED_DEMO=0`, dan bila perlu `ANTHROPIC_API_KEY`. Setelah itu buka alamat HTTPS di HP, lalu pilih **Instal aplikasi** (Android) atau **Bagikan → Tambahkan ke Layar Utama** (iPhone).

## G. Mengatasi masalah

| Masalah | Solusi |
|---|---|
| “Python belum terpasang” | Pasang dari python.org, centang *Add python.exe to PATH* |
| Port 8000 dipakai aplikasi lain | `powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -Port 8080` |
| Lupa kata sandi siswa demo | Hapus `apps\api\data\relafun.db` (semua data akan direset) |
| Tampilan lama setelah memperbarui | Muat ulang dengan Ctrl+Shift+R |
