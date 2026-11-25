// Pemanggil AI di backend Supabase. Kunci HANYA dari Secrets Supabase (Deno.env), tidak pernah ke peramban.
//  - Asisten Belajar: Gemini atau DeepSeek (format OpenAI /chat/completions) — sama dengan tutor.py.
//  - Pemodel soal cerita (Mode B): Claude, structured output — sama dengan apps/api/app/core/ai.py.
// AI tidak pernah menentukan benar/salah; pemeriksaan tetap oleh mesin (checker/tutor/modeler).
import Anthropic from "npm:@anthropic-ai/sdk@1.8.0";
import { TutorAIError } from "./_gen/tutor.js";
import { OUTPUT_SCHEMA, SYSTEM_PROMPT as MODELER_PROMPT } from "./_gen/ai.js";

export type Env = (name: string) => string | undefined;
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatFn = (messages: ChatMessage[]) => Promise<string>;

const get = (env: Env, name: string, fallback = "") => (env(name) ?? "").trim() || fallback;

export const PROVIDER_NAMES: Record<string, string> = { deepseek: "DeepSeek", gemini: "Gemini" };

/** "gemini" / "deepseek" bila kuncinya ada (urutan sama dengan config.tutor_provider()). */
export function tutorProvider(env: Env): "gemini" | "deepseek" | null {
  const keys = { deepseek: get(env, "DEEPSEEK_API_KEY"), gemini: get(env, "GEMINI_API_KEY") };
  const chosen = get(env, "TUTOR_AI_PROVIDER").toLowerCase();
  if (chosen === "gemini" || chosen === "deepseek") return keys[chosen] ? chosen : null;
  return keys.deepseek ? "deepseek" : keys.gemini ? "gemini" : null;
}

export function tutorModel(env: Env): string | null {
  const p = tutorProvider(env);
  if (p === "gemini") return get(env, "GEMINI_MODEL", "gemini-3.5-flash-lite");
  if (p === "deepseek") return get(env, "DEEPSEEK_MODEL", "deepseek-flash");
  return null;
}

async function chatCompletions(name: string, baseUrl: string, key: string, payload: unknown, timeoutS: number,
  reasons: Record<number, string>): Promise<string> {
  let res: Response;
  try {
    res = await fetch(baseUrl.replace(/\/+$/, "") + "/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutS * 1000),
    });
  } catch {
    throw new TutorAIError(`Layanan ${name} tidak bisa dihubungi.`);
  }
  if (res.status !== 200) {
    await res.body?.cancel();
    throw new TutorAIError(reasons[res.status] || `${name} menjawab dengan kode ${res.status}.`);
  }
  // deno-lint-ignore no-explicit-any
  let choice: any;
  try {
    choice = (await res.json()).choices[0];
  } catch {
    throw new TutorAIError(`Balasan ${name} tidak bisa dibaca.`);
  }
  const content = String(choice?.message?.content || "").trim();
  if (!content) throw new TutorAIError(`Balasan ${name} kosong (${choice?.finish_reason || "tanpa alasan"}).`);
  return content;
}

/** Gemini memakai satu instruksi sistem dan percakapan wajib diakhiri pesan pengguna. */
export function mergeSystem(messages: ChatMessage[]): ChatMessage[] {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const rest = messages.filter((m) => m.role !== "system");
  if (!rest.length || rest[rest.length - 1].role !== "user") rest.push({ role: "user", content: "(Lanjutkan.)" });
  return [...(system ? [{ role: "system" as const, content: system }] : []), ...rest];
}

/** Fungsi pemanggil AI Asisten sesuai Secrets, atau null bila belum ada kunci. */
export function tutorChat(env: Env): ChatFn | null {
  const provider = tutorProvider(env);
  if (provider === "gemini") {
    return (messages) => {
      // deno-lint-ignore no-explicit-any
      const payload: any = { model: tutorModel(env), messages: mergeSystem(messages), stream: false, max_tokens: 1024 };
      const reasoning = get(env, "GEMINI_REASONING", "minimal").toLowerCase();
      if (["none", "minimal", "low", "medium", "high"].includes(reasoning)) payload.reasoning_effort = reasoning;
      return chatCompletions("Gemini", get(env, "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai"),
        get(env, "GEMINI_API_KEY"), payload, Number(get(env, "GEMINI_TIMEOUT", "30")),
        { 400: "Permintaan ditolak Gemini (periksa kunci dan nama model).", 401: "Kunci Gemini ditolak.",
          403: "Kunci Gemini ditolak.", 404: "Model Gemini tidak ditemukan.",
          429: "Kuota gratis Gemini habis atau terlalu banyak permintaan." });
    };
  }
  if (provider === "deepseek") {
    return (messages) => {
      // deno-lint-ignore no-explicit-any
      const payload: any = { model: tutorModel(env), messages, stream: false, max_tokens: 400 };
      const thinking = get(env, "DEEPSEEK_THINKING", "disabled").toLowerCase();
      if (thinking === "enabled" || thinking === "disabled") payload.thinking = { type: thinking };
      if (thinking === "enabled") payload.max_tokens = 2000;
      else payload.temperature = 0.5;
      return chatCompletions("DeepSeek", get(env, "DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        get(env, "DEEPSEEK_API_KEY"), payload, Number(get(env, "DEEPSEEK_TIMEOUT", "30")),
        { 401: "Kunci DeepSeek ditolak.", 402: "Saldo DeepSeek habis.", 429: "Terlalu banyak permintaan ke DeepSeek." });
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pemodel soal cerita (Claude). Hanya teks soal yang dikirim; tidak ada data siswa.
// ---------------------------------------------------------------------------
export class AIUnavailable extends Error {}
export type ExtractFn = (story: string) => Promise<Record<string, unknown>>;

export function modelerConfigured(env: Env): boolean {
  return Boolean(get(env, "ANTHROPIC_API_KEY"));
}

export function claudeExtractor(env: Env): ExtractFn {
  return async (story) => {
    const apiKey = get(env, "ANTHROPIC_API_KEY");
    if (!apiKey) throw new AIUnavailable("Fitur AI belum diaktifkan: ANTHROPIC_API_KEY belum diisi di Secrets Supabase.");
    const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 2 });
    let response;
    try {
      response = await client.beta.messages.create({
        model: get(env, "AI_MODEL", "claude-opus-5-5"),
        max_tokens: 16000,
        system: MODELER_PROMPT,
        output_config: { effort: get(env, "AI_EFFORT", "medium"), format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        messages: [{ role: "user", content: `Soal cerita:\n<soal>\n${story}\n</soal>` }],
      // deno-lint-ignore no-explicit-any
      } as any);
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new AIUnavailable("Kunci API tidak valid. Periksa ANTHROPIC_API_KEY.");
      if (e instanceof Anthropic.RateLimitError) throw new AIUnavailable("Layanan AI sedang sibuk. Coba lagi sebentar lagi.");
      if (e instanceof Anthropic.APIConnectionError) {
        throw new AIUnavailable("Tidak bisa terhubung ke layanan AI. Periksa koneksi internet.");
      }
      if (e instanceof Anthropic.APIError) throw new AIUnavailable(`Layanan AI mengembalikan galat (${e.status ?? "?"}).`);
      throw e;
    }
    if (response.stop_reason === "refusal") throw new AIUnavailable("AI tidak dapat memproses soal ini. Coba gunakan mode terpandu.");
    if (response.stop_reason === "max_tokens") throw new AIUnavailable("Jawaban AI terpotong. Coba persingkat soalnya.");
    // deno-lint-ignore no-explicit-any
    const text = (response.content as any[]).find((b) => b.type === "text")?.text || "";
    try {
      return JSON.parse(text);
    } catch {
      throw new AIUnavailable("Format jawaban AI tidak dikenali. Coba lagi.");
    }
  };
}
