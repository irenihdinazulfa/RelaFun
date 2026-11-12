# 03 — User Stories & Kriteria Penerimaan

Format: *Sebagai …, saya ingin …, agar …* · ✅ = sudah diimplementasikan & diuji (tes otomatis atau E2E).

## Siswa

| ID | Cerita | Kriteria penerimaan | FR | Status |
|---|---|---|---|---|
| US-01 | Sebagai siswa, saya ingin mendaftar dengan nama panggilan dan kode kelas | Kode salah → pesan “Kode kelas tidak ditemukan”; nama pengguna ganda ditolak | FR-01 | ✅ |
| US-02 | … melihat materi satu langkah per layar | Ada tombol Kembali/Lanjut, penanda “Langkah n dari m”, kemajuan tersimpan | FR-02 | ✅ |
| US-03 | … melihat panah muncul satu per satu | Awalnya 0 panah; setiap “Berikutnya” menambah 1 panah; keterangan “Ani → Matematika” | FR-04 | ✅ |
| US-04 | … merapikan diagram yang panahnya bersilangan | Tombol “Rapikan panah” muncul hanya jika ada persilangan | FR-04 | ✅ |
| US-05 | … mengecek fungsi atau bukan satu per satu | Setiap anggota kiri disorot dengan jumlah panahnya; kesimpulan FUNGSI/BUKAN | FR-08 | ✅ |
| US-06 | … menyorot domain/kodomain/range | Tombol Range menyorot hanya anggota kanan yang kena panah | FR-09 | ✅ |
| US-07 | … membuat panah sendiri | Ketuk kiri lalu kanan membuat panah; ketuk panah menghapusnya | FR-10 | ✅ |
| US-08 | … menyeret kartu ke kotak yang tepat | Bisa dengan seret (tetikus/sentuh), ketuk-ketuk, atau papan ketik | FR-07 | ✅ |
| US-09 | … mendapat umpan balik langsung | Benar → hijau + poin; salah → merah + penjelasan; anggota bermasalah ditandai | FR-15 | ✅ |
| US-10 | … diberi tahu jenis kesalahan hitung saya | Untuk f(x)=5x−4, x=3, jawaban 15 → “lupa konstanta” | FR-12 | ✅ |
| US-11 | … melihat pembahasan bertahap setelah 2 kali salah | Pembahasan muncul langkah demi langkah + jawaban | FR-15 | ✅ |
| US-12 | … membuka petunjuk tanpa penalti | Petunjuk tidak mengurangi poin | FR-15 | ✅ |
| US-13 | … menghitung f(x) dengan kalkulator bertahap | f(x) = −2x + 30, x = 3,5 → 4 langkah, hasil 23 | FR-11 | ✅ |
| US-14 | … mengetuk istilah sulit | Muncul arti sederhana + contoh | FR-14 | ✅ |
| US-15 | … memodelkan soal cerita dengan panduan | 6 langkah; a & b dicek; x salah (3,3) diberi petunjuk konversi waktu | FR-16 | ✅ |
| US-16 | … meminta AI memodelkan soal cerita | Hasil AI ditampilkan + daftar pemeriksaan V1–V6 + hitungan SymPy | FR-17 | ✅ (diuji dengan respons tiruan) |
| US-17 | … melihat sasaran harian & streak | Cincin x/5, jumlah hari berturut-turut | FR-18 | ✅ |
| US-18 | … melihat peringkat kelas dengan nama panggilan | Tidak menampilkan username; bisa dimatikan guru | FR-19 | ✅ |
| US-19 | … memakai mode gelap & teks besar | Pengaturan tersimpan di perangkat | FR-21 | ✅ |
| US-20 | … memasang aplikasi di HP | Tombol/petunjuk pasang di Pengaturan; service worker terdaftar | FR-22 | ✅ |

## Guru

| ID | Cerita | Kriteria penerimaan | FR | Status |
|---|---|---|---|---|
| US-21 | Sebagai guru, saya ingin membuat kelas dan membagikan kode | Kode 6 karakter tanpa huruf mirip (O/0, I/1) | FR-01 | ✅ |
| US-22 | … melihat kemajuan tiap siswa | Tabel poin, soal benar, akurasi, terakhir aktif, peta penguasaan 13 materi | FR-20 | ✅ |
| US-23 | … melihat kesalahan yang paling sering | Grafik batang jenis kesalahan | FR-20 | ✅ |
| US-24 | … melihat soal tersulit | Daftar akurasi percobaan pertama terendah | FR-20 | ✅ |
| US-25 | … mematikan papan peringkat | Siswa melihat pesan “dimatikan oleh gurumu” | FR-19 | ✅ |
| US-26 | … mengaktifkan/mematikan pemodel AI | Sakelar nonaktif bila server belum punya kunci API | FR-17 | ✅ |
| US-27 | … mengunduh data kelas | CSV (pemisah ;) terbuka di Excel | FR-20 | ✅ |
| US-28 | … tidak bisa melihat kelas guru lain | Akses kelas lain → 404 | NFR-05 | ✅ |
