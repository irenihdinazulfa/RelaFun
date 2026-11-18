# CLAUDE.md — Panduan untuk asisten AI di proyek ini

## Ringkasan proyek
RelaFun: PWA belajar **Relasi dan Fungsi kelas 8 SMP**, dirancang dari wawancara beban kognitif (CLT, ADDIE).
Backend Python FastAPI (`apps/api`), frontend JavaScript ES modules tanpa build (`apps/web`), konten JSON (`content/`).
Bahasa antarmuka & konten: **Bahasa Indonesia** sederhana untuk siswa usia 13–14 tahun.

## Perintah
- Jalankan: `start.bat` atau `powershell -ExecutionPolicy Bypass -File scripts\start.ps1` → https://relafun (`app/serve.py`: HTTPS di port 443 dan port 80 yang mengalihkan http://relafun → https; IP untuk HP tetap http). Sekali saja: nama `relafun` di file hosts (izin Administrator) dan sertifikat lokal `app/tls.py` di Cert:\CurrentUser\Root (peringatan sertifikat Windows; CA dibatasi NameConstraints untuk relafun/localhost/127.0.0.1, kuncinya tidak pernah disimpan). Berkas sertifikat di `apps/api/data/tls/` (tidak ke GitHub). Cadangan: http://relafun atau http://localhost:8000 (`-Port 8000`, `-NoAlias`, `-NoHttps`)
- Tes: `cd apps\api && .venv\Scripts\python -m pytest -q` (harus 100% lolos sebelum selesai)
- Dokumentasi API: https://relafun/api/docs (atau http://localhost:8000/api/docs)

## Aturan wajib
1. **Penilaian selalu deterministik** di `app/core/checker.py` / `mathfn.py` (SymPy). AI tidak boleh menentukan benar/salah.
2. **Kunci jawaban tidak boleh dikirim ke peramban** sebelum siswa menjawab. Kolom rahasia didaftar di `content.SECRET_FIELDS`.
3. **Masukan rumus** harus lewat `parse_function()` (daftar karakter yang diizinkan + batas pangkat). Jangan memanggil `sympify`/`eval` langsung pada masukan pengguna.
4. **Aturan CLT konten** (divalidasi `tests/test_content.py`): ≤ 70 kata per layar, ≤ 6 anggota per himpunan diagram, ≤ 6 langkah per contoh, setiap soal punya `hint` + `explain`, kunci jawaban harus diterima pemeriksa.
5. Setiap modul mencantumkan `interview_codes`; ke-14 kode wawancara (K01–K03, IL01–IL03, EL01–EL03, GL01–GL03, DS01–DS02) harus tetap tercakup.
6. **Privasi anak**: jangan menambah data pribadi (e-mail, HP, tanggal lahir, nama lengkap). Papan peringkat hanya nama panggilan.
7. **Pemodel AI** (`app/core/ai.py`): model `claude-opus-5-5`, *structured output*, `fallbacks: "default"`; AI hanya menerjemahkan cerita → `ModelSpec`; hasil wajib lewat `verify_spec()` (V1–V6) lalu `solve()`. Hanya teks soal yang dikirim. Nonaktif bila `ANTHROPIC_API_KEY` kosong atau kelas belum mengizinkan; kuota harian `AI_DAILY_QUOTA`. Versi online (`js/local/ai.js`) memakai kunci yang dimasukkan pengguna di Pengaturan (localStorage perangkat) — jangan pernah menanam kunci API di kode.
8. Umpan balik: bahasa sehari-hari, kalimat pendek, menyebut letak kesalahan, tidak menyalahkan.
9. Format angka Indonesia: koma desimal, titik ribuan (`fmt()` di Python, `fmt()` di `dom.js`).
10. Status benar/salah tidak boleh hanya warna, selalu disertai ikon + teks.
    Palet "pastel kalem" (v3.2): mint-sage + biru langit, aksen aprikot, teks slate. Tanpa ungu, tanpa gradasi pelangi, pink hanya aksen kecil. Warna hanya lewat token di `:root` (`css/app.css`); rincian di docs/06.

11. **Dua mesin harus identik**: setiap perubahan di `apps/api/app/core/{mathfn,checker,modeler,tutor}.py` wajib diterapkan juga di `apps/web/js/local/{mathfn,checker,modeler,tutor}.js` (versi GitHub Pages), lalu uji silang. Terbitkan ulang versi online dengan `python scripts/deploy_pages.py`.

12. **Asisten Belajar RMT** (`app/core/tutor.py`, konten `content/tutor/tutor.json`): AI = **Gemini** (`gemini-3.5-flash-lite`) atau **DeepSeek** (`deepseek-flash`), keduanya format OpenAI `/chat/completions`, dipilih dengan `TUTOR_AI_PROVIDER`. Kunci `GEMINI_API_KEY`/`DEEPSEEK_API_KEY` HANYA dari `.env` server — tidak boleh di frontend, di kode, atau di GitHub (arahan dosen). Benar/salah tiap langkah diperiksa `check_step()`, bukan AI; kunci jawaban tidak dikirim ke AI; balasan AI yang membocorkan jawaban dibuang oleh `leaks()`. Asisten tidak boleh memberi jawaban akhir, satu langkah per giliran, ≤ 40 kata per perintah, ≤ 60 kata per petunjuk, 3 tingkat petunjuk. Gemini: satu pesan sistem dan percakapan wajib diakhiri pesan pengguna (`BUTTON_TRIGGERS`).

## Peta kode
- `apps/api/app/core/mathfn.py`: baca angka/rumus, kalkulator bertahap, analisis relasi, diagnosis kesalahan
- `apps/api/app/core/checker.py`: 7 jenis soal (mcq, multi, numeric, is_function, dnd, arrows, expression)
- `apps/api/app/core/modeler.py`: f(x) = ax + b (evaluate/compare/threshold/solve_for_x) + verifikasi
- `apps/web/js/components/arrowDiagram.js`: diagram panah (static/animate/check/sets/edit)
- `apps/web/js/mascot.js`: maskot Wen (SVG gaya doodle stiker, 18 ekspresi di `MOOD_INFO` + `SPEC`; `tapMascot()` = Wen yang bisa diketuk; `kit` = alat gambar bersama)
- `apps/web/js/friends.js`: 5 teman Wen (Oya, Momo, Ciko, Puyo, Kopi) + `stickerSheet()` kolase stiker. Semua karakter harus orisinal: jangan meniru karakter berlisensi (mis. Sanrio)
- `apps/api/app/core/tutor.py` + `apps/web/js/local/tutor.js`: Asisten Belajar RMT (6 tahap, petunjuk bertingkat, penjaga jawaban, Gemini/DeepSeek); halaman `js/views/tutor.js`
- `apps/web/js/version.js`: nomor versi (dipakai footer `components/footer.js`)
- `apps/web/js/views/*.js`: halaman; `apps/web/sw.js`: cache PWA (perbarui `VERSION` dan daftar `SHELL` bila menambah file)

## Penyederhanaan yang disengaja (versi 1)
- Frontend tanpa React/Vite karena Node.js belum terpasang; bisa dimigrasikan nanti.
- SQLite (ganti lewat `DATABASE_URL`). Token JWT di `localStorage`.
- Belum ada: tes diagnostik, sinkronisasi luring, soal buatan guru, APK.
