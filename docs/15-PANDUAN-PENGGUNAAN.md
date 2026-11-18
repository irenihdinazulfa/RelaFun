# 15 — Panduan Penggunaan

## 0. Cara tercepat: link online

**https://irenihdinazulfa.github.io/RelaFun/**

| Perangkat | Cara memasang |
|---|---|
| Android (Chrome) | menu ⋮ → **Instal aplikasi** / **Tambahkan ke layar utama** |
| iPhone/iPad (Safari) | tombol **Bagikan** → **Tambahkan ke Layar Utama** |
| Windows/Mac (Chrome/Edge) | ikon instal di ujung kanan bilah alamat |

Di halaman masuk ada tombol besar **⬇ Unduh Aplikasi RelaFun** (dan tombol **Unduh** di bilah atas setelah masuk). Saat link dibuka di HP, di paling atas halaman muncul bilah kecil **“Pasang RelaFun di HP?”** dengan tombol **Pasang** dan **✕**. Bilah ini tidak menutupi tombol apa pun. Tombol **Pasang** memanggil dialog instal Chrome; di iPhone, atau bila link dibuka dari dalam WhatsApp, tombol itu menampilkan petunjuk langkah yang sesuai. Tombol **✕** menyembunyikan tawaran selama 3 hari.

Bisa dibuka di Android, iPhone, iPad, dan laptop (Chrome, Safari, Firefox, Edge, Samsung Internet). Bila aplikasi gagal dimuat (misalnya sinyal putus atau cache lama), muncul tombol **Muat ulang** dan **Bersihkan & muat ulang**. Tombol kedua menghapus cache lama tanpa menghapus data belajar.

Di halaman masuk, klik **Masuk Akun Demo** / **Masuk sebagai Guru Demo**.

Catatan versi online (GitHub Pages):
- Berjalan sepenuhnya di peramban, sehingga tetap bisa dipakai tanpa internet setelah dibuka sekali.
- Data akun & latihan tersimpan **di masing-masing perangkat**. Dashboard guru hanya menampilkan akun di perangkat yang sama.
- **Mode AI** (deskripsi soal → model matematika):
  1. Buka *Pemodel Soal Cerita → Mode AI*.
  2. Pertama kali saja: tempel kunci API Claude (dari console.anthropic.com, berbayar ± Rp400/analisis), lalu ketuk **Aktifkan AI**. Bisa juga lewat *Pengaturan → Fitur AI*. Kunci hanya disimpan di perangkat itu.
  3. Tulis deskripsi soal di kotak **Deskripsi soal**, lalu ketuk **Modelkan dengan AI**.
  4. Muncul kartu **Model matematika** (variabel, rumus fungsi, pertanyaan), pemeriksaan model, dan penyelesaian langkah demi langkah.

Memperbarui versi online setelah kode diubah: `python scripts/deploy_pages.py`. Nomor versi tampil di footer setiap halaman (saat ini **versi 3.4**). HP yang masih menyimpan versi lama akan memakai versi baru paling lambat saat aplikasi dibuka berikutnya.

## A. Menjalankan versi server (komputer Windows)

1. Pastikan **Python 3.10 atau lebih baru** terpasang (komputer ini sudah punya Python 3.14).
2. Buka folder `iren_ihdina_zulfa`, lalu **klik dua kali `start.bat`**.
   - Pertama kali: skrip menyiapkan lingkungan Python dan memasang paket (butuh internet, ± 1–3 menit).
   - Berikutnya: langsung jalan.
   Bisa juga lewat shortcut **RelaFun** di Desktop.
3. Peramban terbuka ke **http://relafun.localhost**. Tidak ada izin atau sertifikat yang diminta.
4. **Jendela hitam harus tetap terbuka** selama aplikasi dipakai (boleh di-minimize). Bila ditutup, aplikasinya ikut mati. Tekan **Ctrl+C** di jendela itu untuk berhenti.
   - Browser menganggap alamat `*.localhost` aman: tidak ada label "Not secure", dan aplikasi bisa dipasang serta dipakai luring.
   - **Memasang sebagai aplikasi:**
     - di Edge: ikon *Aplikasi tersedia* di kolom alamat, atau menu ⋯ → *Aplikasi* → *Pasang RelaFun*;
     - di Chrome: ikon pasang di kolom alamat;
     - bisa juga dari tombol **Unduh Aplikasi RelaFun** di halaman masuk.
   - Mengetik sendiri di peramban: `relafun.localhost`. Alamat lama `http://relafun` otomatis dipindahkan.
   - Klik `start.bat` lagi saat server masih jalan sama dengan menyalakan ulang: server lama otomatis dihentikan.
   - HP di Wi-Fi yang sama membuka lewat alamat IP yang ditampilkan di jendela hitam (http).
   - Pilihan lanjutan: `scripts\start.ps1 -Https` untuk https://relafun dengan sertifikat lokal. Windows akan meminta izin Administrator dan peringatan sertifikat. Sertifikatnya bisa dihapus lewat `certmgr.msc` → *Trusted Root Certification Authorities* → *RelaFun Local CA*.

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
5. **Game Lompat Wen** (menu *Game*): jawab 10 soal acak untuk membantu Wen melompat dan mengumpulkan wortel. **Kalkulator f(x)** (menu *Lainnya*) untuk mengecek hitungan. **Pemodel Soal Cerita** untuk berlatih soal cerita langkah demi langkah.
6. **Asisten Belajar** (menu bawah *Asisten*):
   1. Pilih salah satu dari 4 soal Mathematical Literacy.
   2. Ikuti pertanyaan Wen satu per satu melalui 6 tahap (Orientasi → … → Bukti logis & refleksi). Penanda tahap ada di atas percakapan.
   3. Kalau bingung, ketuk **Aku bingung**: petunjuk naik bertahap, sampai contoh serupa dengan angka lain. Istilah di bawah langkah bisa diketuk.
   4. Setelah 3 kali mencoba, tombol **Lanjut** muncul. Di akhir, pilih seberapa berat usaha berpikirmu (1–5).
   5. Versi server dengan AI (Gemini atau DeepSeek) juga punya **Soal bebas**: tulis soalmu sendiri.
7. **Pengaturan** → mode gelap, teks besar, gabung kelas, pasang aplikasi.

## D. Untuk guru

1. **Daftar guru** → otomatis mendapat kelas pertama dan **kode kelas**.
2. Bagikan kode kelas ke siswa.
3. **Dashboard Guru** menampilkan:
   - jumlah siswa, rata-rata akurasi, soal benar;
   - **kesalahan yang sering muncul** (bahan penjelasan ulang di kelas);
   - akurasi per materi, peta penguasaan tiap siswa, soal tersulit;
   - tombol **Unduh CSV** untuk Excel.
4. Sakelar **Papan peringkat** dan **Pemodel AI** per kelas.
5. Kartu **Asisten Belajar: usaha berpikir siswa**: banyak sesi, rata-rata petunjuk, langkah dilewati, dan rata-rata usaha berpikir (1–5) per soal.

## E. Mengaktifkan fitur AI (opsional, berbayar)

**Versi online:** Pengaturan → Fitur AI → tempel kunci → Simpan & aktifkan.

**Versi server:**

1. Buat kunci API di https://console.anthropic.com.
2. Buka file `.env` di folder proyek, isi `ANTHROPIC_API_KEY=...`, lalu jalankan ulang `start.bat`.
3. Masuk sebagai guru → nyalakan **Pemodel AI** untuk kelas.

**Asisten Belajar dengan AI (khusus versi server):**

1. Buat kunci:
   - **Gemini** (gratis): https://aistudio.google.com/apikey
   - **DeepSeek** (berbayar): https://platform.deepseek.com/api_keys
2. Buka file `.env` di folder proyek, lalu isi:
   - untuk Gemini: `TUTOR_AI_PROVIDER=gemini` dan `GEMINI_API_KEY=...`
   - untuk DeepSeek: `TUTOR_AI_PROVIDER=deepseek` dan `DEEPSEEK_API_KEY=...`
3. Jalankan ulang `start.bat`.
4. Buka **Asisten**: tanda di kanan atas berubah menjadi **AI Gemini aktif** atau **AI DeepSeek aktif**.

Kunci API **tidak boleh** ditulis di kode atau diunggah ke GitHub. Gemini gratis mensyaratkan pengguna berusia 18+ dan tidak untuk aplikasi yang dipakai anak di bawah 18 tahun, jadi gunakan untuk pengembangan dan demonstrasi (lihat dokumen 19, bagian 4). File `.env` sudah dikecualikan dari GitHub. Rincian: [19-ASISTEN-BELAJAR.md](19-ASISTEN-BELAJAR.md).

## F. Server online di Render: AI untuk semua pengguna tanpa kunci

Supaya Asisten di link GitHub Pages memakai AI Gemini tanpa siswa menempel kunci apa pun, servernya dipasang di Render (gratis). Kunci Gemini disimpan di pengaturan Render, tidak di GitHub.

1. Buka https://dashboard.render.com, lalu masuk dengan **GitHub** (akun pemilik repo RelaFun).
2. Klik **New +** → **Blueprint** → pilih repo **RelaFun**. Render membaca `render.yaml` dan menampilkan layanan **relafun** (paket *Free*).
3. Render meminta nilai **GEMINI_API_KEY**. Tempel kunci dari https://aistudio.google.com/apikey di kolom itu (bukan di GitHub, bukan di chat).
4. Klik **Deploy Blueprint / Apply** dan tunggu sekitar 5 menit sampai statusnya *Live*. Alamatnya tampil di bagian atas, misalnya `https://relafun.onrender.com`.
5. Tulis alamat itu di `scripts/ai_url.txt`, lalu jalankan `python scripts/deploy_pages.py`. Asisten di versi GitHub Pages sekarang memakai AI dari server tersebut.

Catatan paket gratis Render:
- Server tidur setelah 15 menit tanpa kunjungan dan butuh sekitar 1 menit untuk bangun. Selama itu Asisten menampilkan "AI sedang disiapkan…" dan tetap bisa dipakai dengan petunjuk tertulis.
- Data akun di server Render kembali ke data demo setiap kali server dinyalakan ulang. Versi GitHub Pages menyimpan data di perangkat masing-masing, jadi tidak terpengaruh.
- Kuota: 60 balasan AI per perangkat (IP) per hari, 1.500 per hari untuk semua pengguna.

Server Render juga bisa dibuka langsung (https), dan aplikasinya bisa dipasang di HP: **Instal aplikasi** (Android) atau **Bagikan → Tambahkan ke Layar Utama** (iPhone).

## G. Mengatasi masalah

| Masalah | Solusi |
|---|---|
| “Python belum terpasang” | Pasang dari python.org, centang *Add python.exe to PATH* |
| Port 8000 dipakai aplikasi lain | `powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -Port 8080` |
| Lupa kata sandi siswa demo | Hapus `apps\api\data\relafun.db` (semua data akan direset) |
| Tampilan lama setelah memperbarui | Muat ulang dengan Ctrl+Shift+R |
