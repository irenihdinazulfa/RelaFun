"""Mode B pemodel soal cerita: Claude menerjemahkan cerita -> spesifikasi model.

Aturan (lihat CLAUDE.md):
  * AI TIDAK menghitung jawaban. AI hanya mengisi ModelSpec.
  * Setiap hasil AI diverifikasi (verify_spec) lalu dihitung oleh SymPy (solve).
  * Tidak ada data pribadi siswa yang dikirim; hanya teks soal.
"""
from __future__ import annotations

import json

import anthropic

from .. import config
from .modeler import ModelSpec

SYSTEM_PROMPT = """Kamu membantu aplikasi belajar matematika SMP kelas 8 (materi Relasi dan Fungsi).
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
- Gunakan bahasa Indonesia yang sederhana untuk siswa SMP pada semua teks penjelasan."""

_NUM_OR_NULL = {"anyOf": [{"type": "number"}, {"type": "null"}]}

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "supported": {"type": "boolean"},
        "reason": {"type": "string"},
        "variable_meaning": {"type": "string"},
        "variable_unit": {"type": "string"},
        "output_unit": {"type": "string"},
        "models": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "enum": ["f", "g", "h", "A", "B"]},
                    "label": {"type": "string"},
                    "a": {"type": "number"},
                    "b": {"type": "number"},
                    "meaning_a": {"type": "string"},
                    "meaning_b": {"type": "string"},
                },
                "required": ["name", "label", "a", "b", "meaning_a", "meaning_b"],
                "additionalProperties": False,
            },
        },
        "task": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["evaluate", "compare", "threshold", "solve_for_x"]},
                "x": _NUM_OR_NULL,
                "x_explanation": {"type": "string"},
                "op": {"anyOf": [{"type": "string", "enum": [">", ">=", "<", "<="]}, {"type": "null"}]},
                "target": _NUM_OR_NULL,
                "integer_x": {"type": "boolean"},
            },
            "required": ["type", "x", "x_explanation", "op", "target", "integer_x"],
            "additionalProperties": False,
        },
        "question_restated": {"type": "string"},
    },
    "required": ["supported", "reason", "variable_meaning", "variable_unit", "output_unit",
                 "models", "task", "question_restated"],
    "additionalProperties": False,
}


class AIUnavailable(RuntimeError):
    """AI tidak bisa dipakai (kunci belum diisi, jaringan, kuota API, atau ditolak)."""


def _client() -> anthropic.Anthropic:
    if not config.ai_configured():
        raise AIUnavailable("Fitur AI belum diaktifkan: ANTHROPIC_API_KEY belum diisi di file .env.")
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY, timeout=60, max_retries=2)


def extract_model(story: str) -> dict:
    """Kirim teks soal ke Claude dan kembalikan dict sesuai OUTPUT_SCHEMA."""
    client = _client()
    try:
        response = client.beta.messages.create(
            model=config.AI_MODEL,
            max_tokens=16000,
            system=SYSTEM_PROMPT,
            output_config={
                "effort": config.AI_EFFORT,
                "format": {"type": "json_schema", "schema": OUTPUT_SCHEMA},
            },
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": f"Soal cerita:\n<soal>\n{story}\n</soal>"}],
        )
    except anthropic.AuthenticationError as exc:
        raise AIUnavailable("Kunci API tidak valid. Periksa ANTHROPIC_API_KEY.") from exc
    except anthropic.RateLimitError as exc:
        raise AIUnavailable("Layanan AI sedang sibuk. Coba lagi sebentar lagi.") from exc
    except anthropic.APIStatusError as exc:
        raise AIUnavailable(f"Layanan AI mengembalikan galat ({exc.status_code}).") from exc
    except anthropic.APIConnectionError as exc:
        raise AIUnavailable("Tidak bisa terhubung ke layanan AI. Periksa koneksi internet.") from exc

    if response.stop_reason == "refusal":
        raise AIUnavailable("AI tidak dapat memproses soal ini. Coba gunakan mode terpandu.")
    if response.stop_reason == "max_tokens":
        raise AIUnavailable("Jawaban AI terpotong. Coba persingkat soalnya.")
    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIUnavailable("Format jawaban AI tidak dikenali. Coba lagi.") from exc


def to_spec(data: dict) -> ModelSpec:
    """Ubah keluaran AI menjadi ModelSpec (validasi Pydantic = pemeriksaan V1)."""
    task = data["task"]
    return ModelSpec(
        variable_meaning=data.get("variable_meaning", "x")[:80],
        variable_unit=data.get("variable_unit", "")[:20],
        output_unit=data.get("output_unit", "")[:20],
        models=[
            {"name": m["name"][:1], "label": m.get("label", "")[:60], "a": m["a"], "b": m["b"]}
            for m in data["models"][:2]
        ],
        task={
            "type": task["type"],
            "x": task.get("x"),
            "op": task.get("op"),
            "target": task.get("target"),
            "integer_x": bool(task.get("integer_x")),
        },
    )
