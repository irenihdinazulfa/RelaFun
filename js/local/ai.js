// Mode AI untuk versi tanpa server (GitHub Pages) — padanan apps/api/app/core/ai.py.
// Kunci API Claude dimasukkan pengguna di Pengaturan dan HANYA disimpan di perangkat ini.
// AI hanya menerjemahkan cerita → spesifikasi model; perhitungan & pemeriksaan dilakukan mesin hitung.

const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.8.0/+esm";
const KEY_STORAGE = "rf_anthropic_key";
export const AI_MODEL = "claude-opus-5-5";

export class AIUnavailable extends Error {}

export function getKey() {
  try { return localStorage.getItem(KEY_STORAGE) || ""; } catch { return ""; }
}
export function setKey(k) {
  try { localStorage.setItem(KEY_STORAGE, String(k).trim()); } catch { /* abaikan */ }
}
export function clearKey() {
  try { localStorage.removeItem(KEY_STORAGE); } catch { /* abaikan */ }
}

let Anthropic = null;
async function sdk() {
  if (!Anthropic) {
    try {
      Anthropic = (await import(SDK_URL)).default;
    } catch {
      throw new AIUnavailable("Komponen AI gagal dimuat. Periksa koneksi internet.");
    }
  }
  return Anthropic;
}

async function client(key = getKey()) {
  if (!key) throw new AIUnavailable("Fitur AI belum aktif di perangkat ini. Masukkan kunci API Claude di Pengaturan → Fitur AI.");
  const A = await sdk();
  return { A, c: new A({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 2, timeout: 60000 }) };
}

function friendly(A, e) {
  if (e instanceof AIUnavailable) return e;
  if (A && e instanceof A.AuthenticationError) return new AIUnavailable("Kunci API tidak valid. Periksa lagi kunci di Pengaturan → Fitur AI.");
  if (A && e instanceof A.PermissionDeniedError) return new AIUnavailable("Kunci API tidak punya izin untuk model ini.");
  if (A && e instanceof A.RateLimitError) return new AIUnavailable("Layanan AI sedang sibuk atau saldo kunci API habis. Coba lagi nanti.");
  if (A && e instanceof A.APIConnectionError) return new AIUnavailable("Tidak bisa terhubung ke layanan AI. Periksa koneksi internet.");
  if (A && e instanceof A.APIError) return new AIUnavailable(`Layanan AI mengembalikan galat (${e.status ?? "?"}).`);
  return new AIUnavailable("Terjadi kesalahan saat menghubungi AI. Coba lagi.");
}

/** Cek apakah kunci valid (permintaan ringan ke Models API, tanpa biaya token). */
export async function testKey(key) {
  let A = null;
  try {
    const r = await client(key);
    A = r.A;
    await r.c.models.retrieve(AI_MODEL);
    return true;
  } catch (e) {
    throw friendly(A, e);
  }
}

export const SYSTEM_PROMPT = `Kamu membantu aplikasi belajar matematika SMP kelas 8 (materi Relasi dan Fungsi).
Tugasmu HANYA menerjemahkan soal cerita berbahasa Indonesia menjadi spesifikasi model fungsi linear
f(x) = ax + b. Jangan menghitung jawaban akhir; aplikasi akan menghitungnya sendiri.

Petunjuk:
- x adalah besaran yang berubah (misalnya banyak GB, jarak km, waktu jam, banyak barang).
- b adalah nilai tetap/awal (biaya berlangganan, tarif buka pintu, suhu awal, modal sebagai nilai negatif).
- a adalah perubahan per satu satuan x (harga per GB, tarif per km, perubahan suhu per jam).
- Tulis angka sebagai bilangan biasa tanpa pemisah ribuan (2000, bukan 2.000).
- Jika waktu harus dikonversi (misalnya pukul 15.30 dihitung dari pukul 12.00), isi x dengan hasil konversi
  (3.5) dan jelaskan di x_explanation.
- Jenis tugas:
  * "evaluate": hitung nilai fungsi untuk x tertentu; jika ada batas (misalnya uang yang dimiliki),
    isi target dan op (biasanya "<=").
  * "compare": bandingkan dua fungsi pada x yang sama (isi dua model, beri label masing-masing).
  * "threshold": cari x agar f(x) memenuhi pertidaksamaan (isi op dan target); integer_x true jika x
    harus bilangan bulat (banyak barang/orang).
  * "solve_for_x": cari x agar f(x) = target.
- Jika soal bukan tentang fungsi linear satu variabel, isi supported = false dan jelaskan alasannya
  dengan bahasa sederhana di reason; isi bagian lain dengan nilai sembarang yang valid.
- Gunakan bahasa Indonesia yang sederhana untuk siswa SMP pada semua teks penjelasan.`;

const NUM_OR_NULL = { anyOf: [{ type: "number" }, { type: "null" }] };
export const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    supported: { type: "boolean" },
    reason: { type: "string" },
    variable_meaning: { type: "string" },
    variable_unit: { type: "string" },
    output_unit: { type: "string" },
    models: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", enum: ["f", "g", "h", "A", "B"] },
          label: { type: "string" },
          a: { type: "number" },
          b: { type: "number" },
          meaning_a: { type: "string" },
          meaning_b: { type: "string" },
        },
        required: ["name", "label", "a", "b", "meaning_a", "meaning_b"],
        additionalProperties: false,
      },
    },
    task: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["evaluate", "compare", "threshold", "solve_for_x"] },
        x: NUM_OR_NULL,
        x_explanation: { type: "string" },
        op: { anyOf: [{ type: "string", enum: [">", ">=", "<", "<="] }, { type: "null" }] },
        target: NUM_OR_NULL,
        integer_x: { type: "boolean" },
      },
      required: ["type", "x", "x_explanation", "op", "target", "integer_x"],
      additionalProperties: false,
    },
    question_restated: { type: "string" },
  },
  required: ["supported", "reason", "variable_meaning", "variable_unit", "output_unit", "models", "task", "question_restated"],
  additionalProperties: false,
};

/** Kirim teks soal ke Claude; kembalikan objek sesuai OUTPUT_SCHEMA. */
export async function extractModel(story) {
  let A = null;
  let response;
  try {
    const r = await client();
    A = r.A;
    response = await r.c.beta.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: { effort: "medium", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: `Soal cerita:\n<soal>\n${story}\n</soal>` }],
    });
  } catch (e) {
    throw friendly(A, e);
  }
  if (response.stop_reason === "refusal") throw new AIUnavailable("AI tidak dapat memproses soal ini. Coba gunakan mode terpandu.");
  if (response.stop_reason === "max_tokens") throw new AIUnavailable("Jawaban AI terpotong. Coba persingkat soalnya.");
  const text = (response.content || []).find((b) => b.type === "text")?.text || "";
  try {
    return JSON.parse(text);
  } catch {
    throw new AIUnavailable("Format jawaban AI tidak dikenali. Coba lagi.");
  }
}

/** Ubah keluaran AI menjadi spesifikasi model (padanan to_spec di ai.py). */
export function toSpec(data) {
  const t = data.task;
  return {
    variable_meaning: String(data.variable_meaning ?? "x").slice(0, 80),
    variable_unit: String(data.variable_unit ?? "").slice(0, 20),
    output_unit: String(data.output_unit ?? "").slice(0, 20),
    models: (data.models || []).slice(0, 2).map((m) => ({
      name: String(m.name).slice(0, 1), label: String(m.label ?? "").slice(0, 60), a: m.a, b: m.b })),
    task: { type: t.type, x: t.x ?? null, op: t.op ?? null, target: t.target ?? null, integer_x: !!t.integer_x },
  };
}
