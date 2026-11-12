// Pemodel soal cerita.
// Mode A (terpandu): siswa sendiri yang memodelkan, langkah demi langkah (tanpa AI).
// Mode B (AI): Claude menerjemahkan cerita -> model, diverifikasi & dihitung SymPy di server.

import { h, clear, escapeHtml, shuffle, fmt } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { mascot } from "../mascot.js";
import { revealSteps } from "../components/reveal.js";
import { functionGraph } from "../components/graph.js";

const STEP_NAMES = ["Baca", "Variabel x", "Nilai a & b", "Pertanyaan", "Hitung", "Tafsirkan"];
const TASK_TEXT = {
  evaluate: "Menghitung nilai fungsi untuk x tertentu",
  compare: "Membandingkan dua fungsi",
  threshold: "Mencari x agar memenuhi syarat (pertidaksamaan)",
  solve_for_x: "Mencari x agar f(x) sama dengan nilai tertentu",
};
const OP_TEXT = { ">": ">", ">=": "≥", "<": "<", "<=": "≤" };

function parseNum(s) {
  if (s === null || s === undefined) return NaN;
  let t = String(s).trim().replace(/−/g, "-").replace(/rp/i, "").replace(/\s/g, "");
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(",", ".");
  return t === "" ? NaN : Number(t);
}

function formula(m) {
  const a = Number(m.a);
  const b = Number(m.b);
  const ax = a === 0 ? "" : `${a === 1 ? "" : a === -1 ? "−" : fmt(a)}x`;
  let out = ax;
  if (b !== 0 || !ax) out += ax ? (b < 0 ? ` − ${fmt(-b)}` : ` + ${fmt(b)}`) : fmt(b);
  return `${m.name}(x) = ${out.replace(/^-/, "−")}`;
}

function highlightNumbers(text) {
  const div = h("div", { class: "story" });
  div.innerHTML = escapeHtml(text).replace(/(Rp\s?)?\d+(?:[.,]\d+)*(\s?(?:GB|km|jam|cm|tas|°C))?/g, (m) => `<mark>${m}</mark>`);
  return div;
}

function solutionView(sol) {
  const box = h("div", { class: "stack", style: { gap: "12px" } },
    h("div", { class: "row" }, sol.models.map((f) => h("span", { class: "model-box" }, f))),
    revealSteps(sol.steps.map((s) => ({ title: s.title, lines: s.lines })), { answer: `Kesimpulan: ${sol.conclusion}` }));
  return box;
}

export async function modelerView(main, _p, ctx) {
  const [presets, status] = await Promise.all([
    api.get("/api/tools/modeler/presets"),
    api.get("/api/tools/modeler/ai-status").catch(() => ({ available: false, configured: false })),
  ]);
  let mode = "guided";
  let preset = presets[0];

  const tabs = h("div", { class: "tabs", role: "tablist" });
  const body = h("div");
  main.append(h("div", { class: "page-head" }, h("div", null, h("h1", null, "Pemodel Soal Cerita"),
    h("p", null, "Ubah cerita menjadi model fungsi f(x) = ax + b, lalu selesaikan."))), tabs, body);

  function renderTabs() {
    clear(tabs);
    for (const [k, label, ic] of [["guided", "Mode terpandu", "pencil"], ["custom", "Soal sendiri", "model"], ["ai", "Mode AI", "sparkle"]]) {
      tabs.append(h("button", { type: "button", role: "tab", class: mode === k ? "active" : "", "aria-selected": String(mode === k),
        onclick: () => { mode = k; renderTabs(); renderBody(); } }, label));
    }
  }

  function presetPicker(onPick) {
    return h("div", { class: "preset-grid" }, presets.map((p) =>
      h("button", { type: "button", class: `preset${p === preset ? " active" : ""}`, onclick: () => { preset = p; onPick(); } },
        h("span", { class: "chip primary" }, p.process), h("b", null, p.title), h("span", { class: "muted small" }, p.source))));
  }

  function renderBody() {
    clear(body);
    if (mode === "guided") guided();
    else if (mode === "custom") custom();
    else aiMode();
  }

  // ---------------------------------------------------------------- Mode A
  function guided() {
    let step = 0;
    const exp = preset.expected;
    const state = { models: exp.models.map((m) => ({ ...m, a: "", b: "" })), x: "" };
    const pick = h("div", { class: "card" }, h("h3", null, "Pilih soal"), presetPicker(() => renderBody()));
    const wiz = h("section", { class: "card" });
    body.append(pick, h("div", { style: { height: "16px" } }), wiz);

    function nav(canNext, onNext, nextLabel = "Lanjut") {
      return h("div", { class: "lesson-nav" },
        h("button", { class: "btn secondary", type: "button", disabled: step === 0, onclick: () => { step -= 1; draw(); } }, icon("arrowLeft"), "Kembali"),
        canNext ? h("button", { class: "btn", type: "button", onclick: onNext }, nextLabel, icon("arrowRight")) : h("span"));
    }
    const fb = (kind, text) => h("div", { class: `alert ${kind} feedback` }, icon(kind === "good" ? "check" : kind === "bad" ? "alert" : "info"), h("div", null, text));

    function draw() {
      clear(wiz);
      wiz.append(h("div", { class: "wizard-steps" }, STEP_NAMES.map((n, i) => h("span", { class: i < step ? "done" : i === step ? "now" : "" }, `${i + 1}. ${n}`))));
      const out = h("div", { "aria-live": "polite" });

      if (step === 0) {
        wiz.append(h("h2", null, "Baca ceritanya pelan-pelan"), highlightNumbers(preset.story),
          h("p", { class: "muted small", style: { marginTop: "10px" } }, "Angka-angka penting sudah ditandai. Pikirkan: apa yang berubah-ubah? Apa yang tetap?"),
          nav(true, () => { step = 1; draw(); }, "Saya sudah paham ceritanya"));
      } else if (step === 1) {
        const opts = shuffle(preset.x_choices.map((c, i) => [c, i === 0]), preset.id.length + 3);
        wiz.append(h("h2", null, "Apa yang menjadi x (yang berubah-ubah)?"), highlightNumbers(preset.story),
          h("div", { class: "options", style: { marginTop: "12px" } }, opts.map(([label, ok]) =>
            h("button", { class: "option", type: "button", onclick: (e) => {
              wiz.querySelectorAll(".option").forEach((b) => b.classList.remove("right", "wrong"));
              e.currentTarget.classList.add(ok ? "right" : "wrong");
              clear(out).append(ok ? fb("good", `Tepat! x = ${label}.`) : fb("bad", "Belum tepat. x adalah besaran yang nilainya bisa berubah-ubah dan memengaruhi hasil."));
              if (ok) out.append(nav(true, () => { step = 2; draw(); }));
            } }, h("span", { class: "mark" }), label))), out);
        if (!out.childNodes.length) out.append(nav(false));
      } else if (step === 2) {
        const inputs = state.models.map((m, i) => {
          const aIn = h("input", { class: "input", inputmode: "decimal", value: m.a, "aria-label": `Nilai a untuk ${m.label}` });
          const bIn = h("input", { class: "input", inputmode: "decimal", value: m.b, "aria-label": `Nilai b untuk ${m.label}` });
          aIn.oninput = () => { state.models[i].a = aIn.value; };
          bIn.oninput = () => { state.models[i].b = bIn.value; };
          return h("div", { class: "card", style: { boxShadow: "none" } }, h("h3", null, `${m.label}: ${m.name}(x) = a·x + b`),
            h("div", { class: "field" }, h("label", null, "b = nilai tetap / awal (tidak bergantung x)"), bIn),
            h("div", { class: "field" }, h("label", null, "a = perubahan untuk setiap 1 satuan x"), aIn));
        });
        wiz.append(h("h2", null, "Cari nilai a dan b"), highlightNumbers(preset.story),
          h("p", { class: "muted small", style: { marginTop: "8px" } }, "Kata “per” atau “setiap” → a. Biaya awal / tarif buka pintu / nilai tetap → b. Jika tidak ada nilai tetap, b = 0. Boleh menulis 4.500 atau 4500."),
          h("div", { class: "ab-grid" }, inputs), out,
          h("div", { class: "row", style: { marginTop: "12px" } }, h("button", { class: "btn", type: "button", onclick: check }, icon("check"), "Periksa model")));
        function check() {
          const msgs = [];
          let allOk = true;
          state.models.forEach((m, i) => {
            const e = exp.models[i];
            const a = parseNum(m.a);
            const b = parseNum(m.b);
            if (a === e.a && b === e.b) msgs.push(`${m.label}: tepat ✓`);
            else {
              allOk = false;
              if (a === e.b && b === e.a) msgs.push(`${m.label}: a dan b tertukar. a adalah angka “per/setiap”, b adalah nilai tetap.`);
              else if (a === e.a) msgs.push(`${m.label}: a sudah benar, cek lagi b (nilai saat x = 0).`);
              else if (b === e.b) msgs.push(`${m.label}: b sudah benar, cek lagi a (perubahan setiap x naik 1).`);
              else if (Math.abs(a) === Math.abs(e.a) || Math.abs(b) === Math.abs(e.b)) msgs.push(`${m.label}: perhatikan tanda negatifnya.`);
              else msgs.push(`${m.label}: belum tepat. Baca lagi bagian yang ditandai.`);
            }
          });
          clear(out).append(fb(allOk ? "good" : "bad", msgs.join(" ")));
          if (allOk) {
            out.append(h("div", { class: "row", style: { marginTop: "10px" } }, exp.models.map((m) => h("span", { class: "model-box" }, formula(m)))),
              nav(true, () => { step = 3; draw(); }));
          }
        }
      } else if (step === 3) {
        const t = exp.task;
        wiz.append(h("h2", null, "Apa yang ditanyakan?"), h("p", null, h("b", null, TASK_TEXT[t.type])),
          h("div", { class: "row" }, exp.models.map((m) => h("span", { class: "model-box" }, formula(m)))));
        if (t.x !== null && t.x !== undefined) {
          const xIn = h("input", { class: "input big", inputmode: "decimal", value: state.x, "aria-label": "Nilai x" });
          wiz.append(h("p", { style: { marginTop: "12px" } }, "Berapa nilai x yang dipakai?"),
            h("div", { class: "input-row" }, h("span", { class: "prefix" }, "x ="), xIn,
              h("button", { class: "btn", type: "button", onclick: () => {
                state.x = xIn.value;
                const v = parseNum(xIn.value);
                if (Math.abs(v - t.x) < 1e-9) {
                  clear(out).append(fb("good", `Tepat! ${preset.x_note}`), nav(true, () => { step = 4; draw(); }));
                } else {
                  const timeHint = preset.id === "suhu" && (Math.abs(v - 3.3) < 1e-9 || Math.abs(v - 15.5) < 1e-9 || v === 3)
                    ? " Ingat: x dihitung sejak pukul 12.00, dan 30 menit = 0,5 jam." : "";
                  clear(out).append(fb("bad", "Belum tepat. Baca lagi pertanyaannya." + timeHint));
                }
              } }, icon("check"), "Periksa")), out);
        } else {
          const cond = t.type === "threshold" ? `${exp.models[0].name}(x) ${OP_TEXT[t.op]} ${fmt(t.target)}` : `${exp.models[0].name}(x) = ${fmt(t.target)}`;
          wiz.append(h("p", { style: { marginTop: "12px" } }, "Syarat yang harus dipenuhi: ", h("span", { class: "model-box" }, cond)),
            h("p", { class: "muted" }, preset.x_note), nav(true, () => { step = 4; draw(); }));
        }
      } else if (step === 4) {
        wiz.append(h("h2", null, "Hitung langkah demi langkah"), out);
        out.append(h("p", { class: "muted" }, "Menghitung…"));
        api.post("/api/tools/modeler/solve", exp).then((sol) => {
          clear(out).append(solutionView(sol));
          if (exp.models.length === 2 || exp.task.type === "compare") {
            out.append(functionGraph({ lines: exp.models.map((m) => ({ a: m.a, b: m.b, label: formula(m), name: m.name })), x_min: 0, x_max: Math.max(10, (exp.task.x || 10) * 2), x_label: exp.variable_unit || "x" }));
          }
          out.append(nav(true, () => { step = 5; draw(); }, "Tafsirkan hasilnya"));
        }).catch((e) => clear(out).append(fb("bad", e.message)));
      } else if (step === 5) {
        const q = preset.interpret;
        wiz.append(h("h2", null, "Tafsirkan hasilnya"), h("p", { class: "q-prompt" }, q.question),
          h("div", { class: "options" }, q.options.map((o, i) => h("button", { class: "option", type: "button", onclick: (e) => {
            wiz.querySelectorAll(".option").forEach((b) => b.classList.remove("right", "wrong"));
            e.currentTarget.classList.add(i === q.answer ? "right" : "wrong");
            clear(out).append(i === q.answer
              ? h("div", { class: "result-hero" }, mascot("cheer"), h("h3", null, "Hebat! Kamu sudah memodelkan soal cerita sampai selesai."),
                h("p", { class: "muted" }, "Tulis jawabanmu di lembar soal lengkap dengan langkah-langkahnya, ya."))
              : fb("bad", "Belum tepat. Lihat lagi kesimpulan di langkah sebelumnya."));
          } }, h("span", { class: "mark" }, "ABC"[i]), o))), out,
          nav(false));
      }
    }
    draw();
  }

  // ---------------------------------------------------------------- Soal sendiri
  function custom() {
    const card = h("section", { class: "card" });
    body.append(card);
    const two = h("input", { type: "checkbox" });
    const meaning = h("input", { class: "input", placeholder: "mis. jarak perjalanan", value: "" });
    const unit = h("input", { class: "input", placeholder: "mis. km", style: { maxWidth: "140px" } });
    const outUnit = h("input", { class: "input", placeholder: "mis. rupiah", style: { maxWidth: "160px" } });
    const mk = (name) => ({ name, label: h("input", { class: "input", placeholder: `Nama, mis. Pilihan ${name}` }),
      a: h("input", { class: "input", inputmode: "decimal", placeholder: "a" }), b: h("input", { class: "input", inputmode: "decimal", placeholder: "b" }) });
    const mods = [mk("f"), mk("g")];
    const taskSel = h("select", { class: "input" }, Object.entries(TASK_TEXT).map(([k, v]) => h("option", { value: k }, v)));
    const xIn = h("input", { class: "input", inputmode: "decimal", placeholder: "nilai x" });
    const opSel = h("select", { class: "input", style: { maxWidth: "100px" } }, Object.entries(OP_TEXT).map(([k, v]) => h("option", { value: k }, v)));
    const target = h("input", { class: "input", inputmode: "decimal", placeholder: "nilai batas/target" });
    const intX = h("input", { type: "checkbox" });
    const out = h("div", { "aria-live": "polite" });
    const m2wrap = h("div");

    const modelFields = (m) => h("div", { class: "card", style: { boxShadow: "none" } },
      h("div", { class: "field" }, h("label", null, `Nama model ${m.name}`), m.label),
      h("div", { class: "grid grid-2" }, h("div", { class: "field" }, h("label", null, "a (per satuan x)"), m.a), h("div", { class: "field" }, h("label", null, "b (nilai tetap)"), m.b)));
    const sync = () => {
      clear(m2wrap);
      if (two.checked) m2wrap.append(modelFields(mods[1]));
      const tt = taskSel.value;
      xIn.parentElement.style.display = ["evaluate", "compare"].includes(tt) ? "" : "none";
      opSel.parentElement.style.display = tt === "threshold" ? "" : "none";
      target.parentElement.style.display = tt === "evaluate" ? "" : tt === "compare" ? "none" : "";
      intX.parentElement.style.display = tt === "threshold" ? "" : "none";
    };
    two.onchange = sync;
    taskSel.onchange = () => { if (taskSel.value === "compare") two.checked = true; sync(); };

    card.append(h("h2", null, "Modelkan soalmu sendiri"),
      h("p", { class: "muted" }, "Isi model yang kamu temukan dari cerita. Mesin akan menghitung langkah-langkahnya."),
      h("div", { class: "field" }, h("label", null, "x adalah …"), meaning),
      h("div", { class: "row" }, h("div", { class: "field" }, h("label", null, "Satuan x"), unit), h("div", { class: "field" }, h("label", null, "Satuan hasil"), outUnit)),
      modelFields(mods[0]),
      h("label", { class: "row", style: { margin: "12px 0" } }, two, "Ada dua pilihan yang dibandingkan"), m2wrap,
      h("div", { class: "field" }, h("label", null, "Yang ditanyakan"), taskSel),
      h("div", { class: "row", style: { alignItems: "flex-end" } },
        h("div", { class: "field" }, h("label", null, "x ="), xIn),
        h("div", { class: "field" }, h("label", null, "Tanda"), opSel),
        h("div", { class: "field" }, h("label", null, "Batas / target (opsional)"), target),
        h("label", { class: "row field" }, intX, "x harus bilangan bulat")),
      h("button", { class: "btn", type: "button", onclick: run }, icon("calc"), "Selesaikan"), out);
    sync();

    async function run() {
      const tt = taskSel.value;
      const useTwo = two.checked || tt === "compare";
      const spec = {
        variable_meaning: meaning.value || "x", variable_unit: unit.value, output_unit: outUnit.value,
        models: (useTwo ? mods : mods.slice(0, 1)).map((m) => ({ name: m.name, label: m.label.value, a: parseNum(m.a.value), b: parseNum(m.b.value || "0") })),
        task: { type: tt, x: ["evaluate", "compare"].includes(tt) ? parseNum(xIn.value) : null,
          op: tt === "threshold" ? opSel.value : tt === "evaluate" && target.value ? "<=" : null,
          target: target.value && tt !== "compare" ? parseNum(target.value) : null, integer_x: intX.checked },
      };
      if (spec.models.some((m) => Number.isNaN(m.a) || Number.isNaN(m.b)) || Number.isNaN(spec.task.x) || Number.isNaN(spec.task.target)) {
        clear(out).append(h("div", { class: "alert warn" }, icon("info"), h("div", null, "Periksa lagi: semua nilai harus berupa angka.")));
        return;
      }
      try {
        const sol = await api.post("/api/tools/modeler/solve", spec);
        clear(out).append(h("div", { style: { marginTop: "16px" } }, solutionView(sol)));
      } catch (e) {
        clear(out).append(h("div", { class: "alert bad" }, icon("alert"), h("div", null, e.message)));
      }
    }
  }

  // ---------------------------------------------------------------- Mode B (AI)
  function aiMode() {
    const card = h("section", { class: "card" });
    body.append(card);
    if (!status.available) {
      const why = status.static
        ? "Mode AI butuh kunci API Claude. Masukkan kuncinya sekali di Pengaturan → Fitur AI, lalu mode ini langsung aktif."
        : !status.configured
        ? "Fitur AI belum aktif di server ini (ANTHROPIC_API_KEY belum diisi). Gunakan mode terpandu."
        : ctx.user.role === "teacher" ? "Aktifkan fitur AI untuk kelas di Dashboard Guru." : "Fitur AI belum diaktifkan oleh gurumu. Gunakan mode terpandu.";
      card.append(h("div", { class: "alert info" }, icon("info"), h("div", null, h("div", { class: "alert-title" }, "Mode AI belum tersedia"), h("p", null, why),
        status.static ? h("a", { class: "btn small", href: "#/pengaturan" }, icon("settings"), "Buka Pengaturan → Fitur AI") : null)));
    }
    const ta = h("textarea", { class: "input", maxlength: 1500, placeholder: "Tempel atau tulis soal cerita di sini…", "aria-label": "Soal cerita" }, preset.story);
    const out = h("div", { "aria-live": "polite" });
    const go = h("button", { class: "btn", type: "button", disabled: !status.available }, icon("sparkle"), "Analisis dengan AI");
    card.append(h("h2", null, "Biarkan AI membantu memodelkan"),
      h("p", { class: "muted" }, "AI hanya menerjemahkan cerita menjadi model. Semua hitungan dilakukan dan diperiksa oleh mesin matematika. Tetap coba mode terpandu dulu, ya!"),
      h("div", { class: "field" }, h("label", null, "Ambil contoh dari lembar soal:"), presetPicker(() => { ta.value = preset.story; card.querySelectorAll(".preset").forEach((b) => b.classList.toggle("active", b.textContent.includes(preset.title))); })),
      h("div", { class: "field" }, ta), h("div", { class: "row" }, go, status.available ? h("span", { class: "muted small" }, `Kuota: ${status.daily_quota} analisis per hari`) : null), out);

    go.onclick = async () => {
      go.disabled = true;
      clear(out).append(h("p", { class: "muted" }, "AI sedang membaca soal…"));
      try {
        const r = await api.post("/api/tools/modeler/ai", { text: ta.value });
        clear(out);
        if (!r.supported) {
          out.append(h("div", { class: "alert warn" }, icon("info"), h("div", null, h("div", { class: "alert-title" }, "Soal belum didukung"), h("p", null, r.reason))));
          return;
        }
        const s = r.spec;
        out.append(h("h3", { style: { marginTop: "16px" } }, "Cara AI memahami soal"),
          h("ul", null,
            h("li", null, `x = ${s.variable_meaning}${s.variable_unit ? ` (${s.variable_unit})` : ""}`),
            r.explanations.models.map((m) => h("li", null, `${m.name}: a = ${m.meaning_a}; b = ${m.meaning_b}`)),
            r.explanations.x ? h("li", null, `Nilai x: ${r.explanations.x}`) : null,
            r.explanations.question ? h("li", null, `Pertanyaan: ${r.explanations.question}`) : null),
          h("h3", null, "Pemeriksaan model"),
          h("ul", { class: "check-list" }, r.verification.checks.map((c) => h("li", { class: c.level },
            icon(c.level === "ok" ? "check" : c.level === "warning" ? "alert" : "x"), h("span", null, `${c.code}: ${c.message}`)))));
        if (r.solution) {
          out.append(h("h3", { style: { marginTop: "12px" } }, "Penyelesaian (dihitung mesin matematika, bukan AI)"), solutionView(r.solution));
        } else {
          out.append(h("div", { class: "alert bad" }, icon("alert"), h("div", null, "Model dari AI belum lolos pemeriksaan. Coba mode terpandu.")));
        }
        out.append(h("p", { class: "muted small", style: { marginTop: "10px" } }, `Sisa kuota hari ini: ${r.remaining}`));
      } catch (e) {
        clear(out).append(h("div", { class: "alert bad" }, icon("alert"), h("div", null, e.message)));
      } finally {
        go.disabled = !status.available;
      }
    };
  }

  renderTabs();
  renderBody();
}
