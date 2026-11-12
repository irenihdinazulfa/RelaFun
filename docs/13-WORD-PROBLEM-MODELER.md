# 13 — Pemodel Soal Cerita

## 1. Tiga mode

| Mode | Siapa yang memodelkan | Kebutuhan |
|---|---|---|
| **Terpandu** | Siswa, langkah demi langkah, dicek tiap langkah | Tidak butuh AI |
| **Soal sendiri** | Siswa mengisi model bebas, mesin menghitung | Tidak butuh AI |
| **AI** | Claude menerjemahkan cerita → model; mesin memverifikasi & menghitung | Versi server: `ANTHROPIC_API_KEY` + izin guru. Versi online: kunci API dimasukkan di Pengaturan → Fitur AI (disimpan di perangkat) |

## 2. Model yang didukung

Fungsi linear **f(x) = ax + b** (1 atau 2 fungsi) dengan tugas:

| type | Arti | Contoh |
|---|---|---|
| `evaluate` | hitung f(x); opsional bandingkan dengan batas (`op`, `target`) | Ongkos taksi 10 km ≤ Rp50.000? |
| `compare` | bandingkan dua fungsi pada x yang sama + titik sama besar | Provider A vs B |
| `threshold` | cari x agar f(x) `op` target; opsional bilangan bulat | h(x) > 0 → minimal 4 tas |
| `solve_for_x` | cari x agar f(x) = target | lilin habis setelah 10 jam |

## 3. Aturan wajib mode AI

1. AI **hanya** mengisi spesifikasi model (JSON, *structured output*), tidak menghitung jawaban.
2. Model: `claude-opus-5-5`, effort `medium`, *server-side fallback* `default` aktif untuk penolakan.
3. Semua keluaran diverifikasi sebelum ditampilkan:

| Kode | Pemeriksaan | Jika gagal |
|---|---|---|
| V1 | Format lengkap & valid (Pydantic) | galat → mode terpandu |
| V2 | Jumlah model sesuai jenis tugas | diblokir |
| V3 | Angka a dan b tertulis di soal | peringatan |
| V4 | Nilai x / target / tanda tersedia | diblokir |
| V5 | x hasil olahan (mis. konversi waktu) | peringatan untuk dicek |
| V6 | Dapat diselesaikan SymPy | diblokir |

4. Hanya teks soal yang dikirim (tanpa identitas); kuota 10/siswa/hari.
5. Penolakan/galat → pesan ramah + saran mode terpandu.

## 3b. Mode AI di versi online (GitHub Pages)

- `apps/web/js/local/ai.js` memanggil Claude langsung dari peramban memakai SDK resmi `@anthropic-ai/sdk@1.8.0` (`dangerouslyAllowBrowser: true`), dengan model, prompt sistem, skema *structured output*, `effort: medium`, dan `fallbacks: "default"` yang sama dengan versi server.
- Kunci dicek dulu lewat Models API (tanpa biaya token) sebelum disimpan di `localStorage` perangkat.
- Hasil AI diverifikasi `verifySpec()` (V1–V6, identik dengan versi Python pada 19 kasus uji) lalu dihitung `solve()`.
- Kuota 10 analisis/hari per akun di perangkat itu.

## 4. Biaya (perkiraan)

Satu analisis ± 1.500 token masuk + ± 1.000 token keluar (termasuk *thinking*). Dengan tarif Claude Opus 5.5 ($4 / $20 per juta token), biayanya ± $0,026 (± Rp420) per analisis. Untuk 30 siswa × 3 analisis × 20 hari, totalnya ± $47 per bulan. Batas kuota harian mencegah lonjakan biaya.

## 5. Set evaluasi yang disarankan

Sebelum dipakai di kelas, uji mode AI dengan:
- 4 soal lembar literasi + 2 preset (harus menghasilkan model sama dengan `expected` di `modeler_presets.json`),
- ± 20 variasi soal cerita (angka & konteks diganti),
- 5 soal di luar cakupan (mis. kuadrat, dua variabel) → harus `supported: false`.

Catat persentase model yang lolos V1–V6 dan sama dengan model acuan.
