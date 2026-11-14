# 05 — Spesifikasi Konten

Konten disimpan sebagai JSON di `content/` sehingga bisa diubah tanpa mengubah kode.

```
content/
├── modules/01-p1-himpunan.json … 13-l3-menafsirkan.json
├── glossary.json            # 22 istilah, bahasa sederhana
└── modeler_presets.json     # 4 soal lembar literasi + 2 latihan tambahan
```

## 1. Struktur modul

```json
{
  "id": "r3-fungsi", "order": 6, "group": "prasyarat | inti | literasi",
  "title": "...", "subtitle": "...", "icon": "check", "minutes": 12,
  "interview_codes": ["IL01", "GL02"],
  "objectives": ["..."],
  "steps": [ ... langkah penjelasan ... ],
  "items": [ ... soal latihan ... ]
}
```

### Jenis langkah (`steps[].type`)

| type | Kolom | Tampilan |
|---|---|---|
| `text` | title, body | Teks; `**tebal**` dan baris baru didukung |
| `tip` | body | Kotak tips bersama maskot Wen |
| `example` | title, problem, steps[], answer | Contoh bertahap (langkah dimunculkan satu per satu) |
| `diagram` | title, body, diagram{left_label, right_label, domain[], codomain[], pairs[][]}, mode | Diagram panah; mode `animate` / `check` / `sets` / `static` |
| `graph` | title, body, points[][], lines[{a,b,label}], x_min, x_max | Diagram Kartesius / grafik garis |
| `table` | title, headers[], rows[][] | Tabel nilai fungsi |
| `calculator` | title, body, expr, x | Kalkulator bertahap tersemat |

### Jenis soal (`items[].type`)

| type | Kolom wajib | Kolom rahasia (tidak dikirim ke peramban) | Penilaian |
|---|---|---|---|
| `mcq` | prompt, options[] | answer (indeks), option_feedback{} | indeks sama |
| `multi` | prompt, options[] | answer[] | himpunan indeks sama |
| `numeric` | prompt, unit? | answer, tolerance?, common_errors[], linear{a,b,x} | angka sama (format Indonesia); diagnosis |
| `is_function` | prompt, diagram{…pairs} | answer (bool) | dihitung ulang mesin `analyze_relation` |
| `dnd` | prompt, chips[], bins[] | answer{chip: bin} | pemetaan sama |
| `arrows` | prompt, diagram{domain, codomain} | answer_pairs[][] | himpunan pasangan sama |
| `expression` | prompt, name, table? | answer, check_points[] | ekuivalen secara simbolik (SymPy) |

Semua soal wajib punya `hint` (petunjuk) dan `explain[]` (pembahasan bertahap).
Kolom opsional tampilan: `diagram`, `graph`, `table`, `unit`.

## 2. Aturan CLT yang divalidasi otomatis (`tests/test_content.py`)

| Aturan | Batas |
|---|---|
| Kata per layar penjelasan | ≤ 70 |
| Kata per pertanyaan | ≤ 60 |
| Langkah per contoh bertahap | ≤ 6 |
| Anggota per himpunan pada diagram | ≤ 6 |
| Soal per modul | 3–8 |
| Petunjuk & pembahasan | wajib ada |
| Kunci jawaban | harus dinilai **benar** oleh pemeriksa |
| `common_errors` | harus dinilai **salah** dengan pesan yang sesuai |
| Soal `is_function` | jawaban harus cocok dengan mesin |
| Keterlacakan | 14 kode wawancara tercakup minimal satu modul |

## 3. Ringkasan isi

| Modul | Langkah | Soal | Jenis soal |
|---|---|---|---|
| p1 Himpunan | 4 | 4 | mcq, multi, numeric |
| p2 Bilangan bulat & desimal | 5 | 5 | numeric |
| p3 Substitusi | 5 | 5 | numeric (diagnosis), mcq |
| r1 Mengenal relasi | 5 | 4 | mcq, arrows |
| r2 Tiga cara menyatakan | 5 | 4 | mcq, arrows, multi |
| r3 Fungsi/bukan | 5 | 6 | is_function, dnd, mcq |
| r4 Domain–kodomain–range | 5 | 6 | dnd, multi, mcq, numeric |
| r5 Nilai fungsi | 7 | 8 | numeric (diagnosis), mcq (notasi) |
| r6 Rumus fungsi | 5 | 6 | expression, mcq |
| r7 Grafik | 5 | 5 | numeric, mcq, multi |
| l1 Memodelkan | 4 | 6 | mcq, expression, numeric |
| l2 Membandingkan | 4 | 5 | numeric, mcq |
| l3 Menafsirkan | 4 | 5 | numeric, mcq, multi |
| **Total** | **63** | **69** | 7 jenis |

## 4. Format angka

Konvensi Indonesia: **koma = desimal** (3,5), **titik + 3 digit = ribuan** (4.500). Pemeriksa juga menerima “3.5” sebagai desimal dan “Rp53.000”.

## 5. Cara menambah soal

1. Buka file modul di `content/modules/`.
2. Tambahkan objek ke `items` dengan `id` unik, `hint`, dan `explain`.
3. Jalankan tes: `apps\api\.venv\Scripts\python -m pytest apps/api/tests/test_content.py`.
4. Mulai ulang server (konten dimuat saat server berjalan).
