// Asisten Belajar: chatbot pembimbing soal Mathematical Literacy dengan model RMT
// (Rigorous Mathematical Thinking). Versi server memakai Gemini atau DeepSeek (kunci di .env backend);
// versi GitHub Pages memakai mode terpandu tanpa AI. Penilaian tiap langkah selalu oleh mesin.
//
// Pengelolaan beban kognitif di halaman ini:
//  - ekstrinsik: soal selalu terlihat di atas percakapan (tanpa bolak-balik), satu pertanyaan per giliran;
//  - intrinsik: soal dipecah per langkah dan per tahap RMT, petunjuk bertingkat 1–3, istilah bisa diketuk;
//  - germane: fungsi kognitif & alat berpikir disebut di setiap langkah, refleksi dan skala usaha di akhir.

import { h, clear, md, toast } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { mascot } from "../mascot.js";

const FREE_ID = "bebas";
const EFFORT = [
  [1, "Sangat ringan", "😌"], [2, "Ringan", "🙂"], [3, "Sedang", "🤔"], [4, "Berat", "😓"], [5, "Sangat berat", "🥵"],
];

export async function tutorView(main, _params, ctx) {
  const [status, cat] = await Promise.all([api.get("/api/tutor/status"), api.get("/api/tutor/problems")]);
  const wenSlot = h("div", { class: "tutor-wen" }, mascot("wave", "wen-sticker"));
  const setMood = (mood) => { wenSlot.textContent = ""; wenSlot.append(mascot(mood, "wen-sticker")); };
  const modeChip = status.ai
    ? h("span", { class: "chip primary tutor-mode" }, icon("sparkle"), `AI ${status.provider} aktif`)
    : h("span", { class: "chip tutor-mode" }, icon("info"), "Mode terpandu (tanpa AI)");
  main.append(h("div", { class: "page-head" },
    h("div", { class: "ph-title" }, wenSlot,
      h("div", null, h("h1", null, "Asisten Belajar"),
        h("p", null, "Wen membimbingmu berpikir selangkah demi selangkah. Jawabannya tetap kamu yang temukan."))),
    modeChip));
  const body = h("div", { class: "stack" });
  main.append(body);
  showPicker();

  // ------------------------------------------------------------------ pilih soal
  function showPicker() {
    clear(body);
    setMood("wave");
    const phases = h("ol", { class: "rmt-phases" }, cat.phases.map((p, i) =>
      h("li", null, h("b", null, `${i + 1}`), h("span", null, p.name))));
    body.append(h("section", { class: "card" },
      h("h2", null, "6 tahap berpikir (RMT)"),
      h("p", { class: "muted small" }, "Setiap soal dikerjakan lewat tahap yang sama. Satu langkah setiap giliran, petunjuk muncul bertahap kalau kamu bingung."),
      phases));
    if (!status.ai) {
      body.append(h("div", { class: "alert info" }, icon("info"), h("div", null,
        h("div", { class: "alert-title" }, status.static ? "Versi online: mode terpandu" : "AI belum aktif di server ini"),
        h("p", { class: "small", style: { margin: 0 } }, status.static
          ? "Di versi ini Wen memakai petunjuk tertulis. Balasan AI (Gemini atau DeepSeek) aktif di versi server, karena kunci API wajib disimpan di file .env server."
          : "Isi GEMINI_API_KEY atau DEEPSEEK_API_KEY di file .env server untuk mengaktifkan balasan AI. Sementara itu Wen memakai petunjuk tertulis."))));
    }
    body.append(h("h2", { class: "section-title" }, "Pilih soal"),
      h("div", { class: "tutor-grid" }, cat.problems.map((p) =>
        h("button", { class: "card tutor-pick", type: "button", onclick: () => startSession(p) },
          h("div", { class: "muted small" }, p.process),
          h("b", null, p.title),
          h("p", { class: "muted small tutor-story-preview" }, p.story),
          h("span", { class: "chip" }, `${p.steps} langkah · 6 tahap`)))));
    body.append(freeCard());
  }

  function freeCard() {
    const ta = h("textarea", { class: "input", id: "tutor-free", rows: 3, maxlength: 1200, "aria-label": "Soal bebas",
      placeholder: "Contoh: Harga 3 pensil Rp6.000. Berapa harga 7 pensil?", disabled: !status.free_mode });
    const go = h("button", { class: "btn", type: "button", disabled: !status.free_mode }, icon("sparkle"), "Mulai dengan soalku");
    go.onclick = () => {
      const text = ta.value.trim();
      if (text.length < 15) { toast("Tulis soalmu dulu (minimal 15 karakter)."); ta.focus(); return; }
      startFree(text);
    };
    return h("section", { class: "card" },
      h("h2", null, "Soal bebas"),
      h("p", { class: "muted small" }, status.free_mode
        ? `Tulis soal matematikamu sendiri. Wen (AI ${status.provider}) membimbing lewat 6 tahap RMT tanpa memberi jawabannya.`
        : "Mode ini memakai AI dan hanya aktif di versi server dengan kunci API di file .env."),
      h("label", { class: "sr-only", for: "tutor-free" }, "Soal bebas"), ta, h("div", { class: "row" }, go));
  }

  // ------------------------------------------------------------------ sesi
  let s = null;

  function sessionShell(title, story) {
    clear(body);
    const back = h("button", { class: "btn ghost", type: "button", onclick: () => { s = null; showPicker(); } }, "← Pilih soal lain");
    const stepper = h("ol", { class: "rmt-stepper", "aria-label": "Tahap RMT" });
    const meta = h("div", { class: "tutor-meta", "aria-live": "polite" });
    const log = h("div", { class: "chat-log", role: "log", "aria-live": "polite", "aria-label": "Percakapan dengan Wen" });
    const input = h("textarea", { class: "input chat-input", id: "tutor-input", rows: 2, maxlength: 600, "aria-label": "Jawabanmu",
      placeholder: "Tulis jawaban atau pertanyaanmu…" });
    const send = h("button", { class: "btn", type: "button" }, icon("check"), "Kirim");
    const confused = h("button", { class: "btn secondary", type: "button" }, icon("bulb"), "Aku bingung");
    const skip = h("button", { class: "btn ghost hidden", type: "button" }, "Lanjut ke langkah berikutnya", icon("next"));
    const nextPhase = h("button", { class: "btn secondary hidden", type: "button" }, "Tahap berikutnya", icon("next"));
    const finishFree = h("button", { class: "btn ghost hidden", type: "button" }, icon("check"), "Selesai");
    const helpMeter = h("span", { class: "help-meter muted small" });
    const end = h("div", { class: "tutor-end" });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send.click(); } });
    const composer = h("div", { class: "chat-composer" }, input,
      h("div", { class: "row wrap" }, send, confused, nextPhase, finishFree, skip, helpMeter));
    body.append(
      h("div", { class: "row between wrap" }, back, h("span", { class: "chip" }, title)),
      h("details", { class: "card tutor-problem", open: true }, h("summary", null, "Soal"), h("p", null, story)),
      stepper, meta, h("section", { class: "card chat-card" }, log, composer), end);
    return { stepper, meta, log, input, send, confused, skip, nextPhase, finishFree, helpMeter, composer, end };
  }

  function renderStepper(ui, phaseNo, doneAll = false) {
    clear(ui.stepper);
    cat.phases.forEach((p, i) => {
      const n = i + 1;
      const state = doneAll || n < phaseNo ? "done" : n === phaseNo ? "current" : "todo";
      ui.stepper.append(h("li", { class: state, "aria-current": state === "current" ? "step" : null },
        h("span", { class: "dot" }, state === "done" ? "✓" : String(n)), h("span", { class: "nm" }, p.name)));
    });
  }

  function renderMeta(ui, cur) {
    clear(ui.meta);
    if (!cur) return;
    ui.meta.append(
      h("div", { class: "small" }, h("b", null, `Langkah ${cur.index + 1}/${cur.total}`), ` · Tahap ${cur.phase_no}: ${cur.phase_name}`),
      h("div", { class: "small muted" }, `Fungsi kognitif: ${cur.cognitive.join(", ")} · Alat berpikir: ${cur.tool}`),
      cur.terms.length ? h("div", { class: "row wrap term-row" }, h("span", { class: "small muted" }, "Istilah:"),
        cur.terms.map((t) => h("button", { class: "chip term-chip", type: "button", onclick: () => submit("ask", `Apa arti ${t}?`) }, t))) : null);
  }

  function bubble(ui, role, text, source) {
    const b = h("div", { class: `bubble ${role}` }, md(text));
    if (role === "wen" && source === "ai") b.append(h("div", { class: "bubble-src" }, `dibantu AI ${status.provider}`));
    ui.log.append(b);
    ui.log.scrollTop = ui.log.scrollHeight;
    return b;
  }

  function busy(ui, on) {
    for (const b of [ui.send, ui.confused, ui.skip, ui.nextPhase, ui.finishFree]) b.disabled = on;
    ui.input.disabled = on;
    if (on) {
      ui.typing = h("div", { class: "bubble wen typing" }, "Wen sedang berpikir…");
      ui.log.append(ui.typing);
      ui.log.scrollTop = ui.log.scrollHeight;
      setMood("think");
    } else {
      ui.typing?.remove();
      ui.input.focus();
    }
  }

  function remember(role, text) {
    s.history.push({ role, text: text.slice(0, 1200) });
    s.history = s.history.slice(-12);
  }

  async function startSession(prob) {
    const ui = sessionShell(prob.title, prob.story);
    s = { free: false, prob, ui, step: 0, attempts: 0, hint: 0, history: [], hintsUsed: 0, skipped: 0,
      attemptsTotal: 0, aiUsed: false, cognitive: new Set(), started: Date.now(), done: false };
    ui.send.onclick = () => submit("answer", ui.input.value);
    ui.confused.onclick = () => submit("hint", "");
    ui.skip.onclick = () => submit("next", "");
    renderStepper(ui, 1);
    await submit("start", "");
  }

  async function submit(action, raw) {
    if (!s || s.free) return freeSubmit(action, raw);
    const ui = s.ui;
    const message = String(raw || "").trim();
    if (action === "answer" && !message) { toast("Tulis jawabanmu dulu, ya."); ui.input.focus(); return; }
    if (message) { bubble(ui, "me", message); remember("user", message); ui.input.value = ""; }
    else if (action === "hint") bubble(ui, "me", "Aku bingung 😕");
    else if (action === "next") bubble(ui, "me", "Lanjut ke langkah berikutnya");
    const prevHint = s.hint;
    busy(ui, true);
    let res;
    try {
      res = await api.post("/api/tutor/turn", { problem_id: s.prob.id, action, message, step: s.step,
        attempts: s.attempts, hint: s.hint, history: s.history.slice(-6) });
    } catch (e) {
      busy(ui, false);
      setMood("confused");
      bubble(ui, "wen error", e.message || "Wen belum bisa menjawab. Coba lagi, ya.");
      return;
    }
    busy(ui, false);
    if (res.ok === false) s.attemptsTotal += 1;
    if (res.ok === true) s.attemptsTotal += 1;
    if (res.hint > prevHint) s.hintsUsed += res.hint - prevHint;
    if (res.skipped) s.skipped += 1;
    if (res.source === "ai") s.aiUsed = true;
    Object.assign(s, { step: res.step, attempts: res.attempts, hint: res.hint, done: res.done });
    bubble(ui, "wen", res.reply, res.source);
    remember("assistant", res.reply);
    setMood(res.done ? "starry" : res.ok === true ? "cheer" : res.ok === false ? "determined" : action === "hint" ? "idea" : "happy");
    if (res.current) res.current.cognitive.forEach((c) => s.cognitive.add(c));
    renderStepper(ui, res.current ? res.current.phase_no : 6, res.done);
    renderMeta(ui, res.current);
    ui.skip.classList.toggle("hidden", !res.can_skip);
    ui.helpMeter.textContent = res.done ? "" : `Bantuan: ${"●".repeat(res.hint)}${"○".repeat(3 - res.hint)}`;
    if (res.done) {
      ui.composer.classList.add("hidden");
      showEffort(ui, { problem_id: s.prob.id, steps_total: s.prob.steps });
    }
  }

  // ------------------------------------------------------------------ soal bebas (AI)
  async function startFree(text) {
    const ui = sessionShell("Soal bebas", text);
    s = { free: true, ui, text, phase: 0, history: [], started: Date.now(), aiUsed: false, hintsUsed: 0 };
    ui.send.onclick = () => freeSubmit("answer", ui.input.value);
    ui.confused.onclick = () => freeSubmit("answer", "Aku bingung, beri aku petunjuk untuk tahap ini.");
    ui.nextPhase.classList.remove("hidden");
    ui.nextPhase.onclick = () => freeSubmit("next", "");
    ui.finishFree.onclick = () => { ui.composer.classList.add("hidden"); renderStepper(ui, 6, true); showEffort(ui, { problem_id: FREE_ID, steps_total: 6 }); };
    renderStepper(ui, 1);
    await freeSubmit("start", "");
  }

  async function freeSubmit(action, raw) {
    const ui = s.ui;
    const message = String(raw || "").trim();
    if (action === "answer" && !message) { toast("Tulis pesanmu dulu, ya."); ui.input.focus(); return; }
    if (message) { bubble(ui, "me", message); remember("user", message); ui.input.value = ""; }
    if (/bingung/i.test(message)) s.hintsUsed += 1;
    busy(ui, true);
    let res;
    try {
      res = await api.post("/api/tutor/turn", { problem_id: FREE_ID, action, message, phase: s.phase,
        problem_text: s.text, history: s.history.slice(-6) });
    } catch (e) {
      busy(ui, false);
      setMood("confused");
      bubble(ui, "wen error", e.message || "Wen belum bisa menjawab. Coba lagi, ya.");
      return;
    }
    busy(ui, false);
    s.phase = res.phase;
    if (res.source === "ai") s.aiUsed = true;
    bubble(ui, "wen", res.reply, res.source);
    remember("assistant", res.reply);
    setMood(action === "next" ? "cheer" : "happy");
    renderStepper(ui, res.phase_no);
    clear(ui.meta).append(h("div", { class: "small" }, h("b", null, `Tahap ${res.phase_no}: ${res.phase_name}`),
      ` · ${cat.phases[res.phase].goal}`));
    ui.nextPhase.classList.toggle("hidden", res.phase >= 5);
    ui.finishFree.classList.toggle("hidden", res.phase < 5);
  }

  // ------------------------------------------------------------------ akhir sesi
  function showEffort(ui, base) {
    clear(ui.end);
    const panel = h("section", { class: "card effort-card" },
      h("h2", null, "Seberapa berat usaha berpikirmu tadi?"),
      h("p", { class: "muted small" }, "Jawab jujur, tidak ada jawaban salah. Ini membantu gurumu menyesuaikan tingkat kesulitan."),
      h("div", { class: "effort-row", role: "group", "aria-label": "Skala usaha berpikir 1 sampai 5" },
        EFFORT.map(([v, label, emo]) => h("button", { class: "effort-btn", type: "button", onclick: () => save(v) },
          h("span", { class: "emo", "aria-hidden": "true" }, emo), h("b", null, String(v)), h("span", null, label)))));
    ui.end.append(panel);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    async function save(effort) {
      const seconds = Math.round((Date.now() - s.started) / 1000);
      const payload = { ...base, effort, seconds, ai_used: s.aiUsed, hints_used: s.hintsUsed || 0,
        steps_done: s.free ? s.phase + 1 : s.step, skipped: s.skipped || 0, attempts: s.attemptsTotal || 0 };
      try { await api.post("/api/tutor/finish", payload); } catch { /* ringkasan tetap ditampilkan */ }
      clear(ui.end).append(summaryCard(effort, seconds));
      setMood("love");
    }
  }

  function summaryCard(effort, seconds) {
    const minutes = Math.max(1, Math.round(seconds / 60));
    const items = [
      ["Waktu", `± ${minutes} menit`],
      ["Petunjuk dipakai", String(s.hintsUsed || 0)],
      ...(s.free ? [] : [["Langkah dilewati", String(s.skipped || 0)]]),
      ["Usaha berpikir", `${effort}/5 (${EFFORT[effort - 1][1].toLowerCase()})`],
    ];
    return h("section", { class: "card tutor-summary" },
      h("h2", null, "Ringkasan belajarmu"),
      h("dl", { class: "summary-list" }, items.map(([k, v]) => [h("dt", null, k), h("dd", null, v)])),
      s.cognitive && s.cognitive.size ? h("div", null, h("b", { class: "small" }, "Fungsi kognitif yang kamu latih:"),
        h("div", { class: "row wrap" }, [...s.cognitive].map((c) => h("span", { class: "chip primary" }, c)))) : null,
      h("p", { class: "small muted" }, (s.hintsUsed || 0) === 0
        ? "Kamu menyelesaikannya tanpa petunjuk. Hebat! Coba soal lain untuk tantangan berikutnya."
        : "Memakai petunjuk itu bagian dari belajar. Coba kerjakan soal lain dengan lebih sedikit petunjuk."),
      h("div", { class: "row wrap" },
        h("button", { class: "btn", type: "button", onclick: () => { s = null; showPicker(); } }, "Kerjakan soal lain"),
        h("a", { class: "btn ghost", href: "#/" }, "Kembali ke beranda")));
  }

  void ctx;
}
