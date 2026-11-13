// Latihan: satu soal per layar, umpan balik instan berbahasa sehari-hari (DS01, IL01),
// petunjuk opsional, dan pembahasan bertahap setelah 2 kali mencoba (GL03).

import { h, clear, fmt } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { mascot } from "../mascot.js";
import { arrowDiagram } from "../components/arrowDiagram.js";
import { dndBoard } from "../components/dnd.js";
import { functionGraph } from "../components/graph.js";
import { revealSteps } from "../components/reveal.js";
import { keypad } from "../components/calculator.js";
import { linkTerms } from "../components/terms.js";
import { valueTable } from "./lesson.js";

/** Membuat tampilan satu soal. Return {el, getAnswer(), showResult(res), lock()} */
function renderItem(item, onEnter) {
  const el = h("div", { class: "stack", style: { gap: "14px" } });
  let api_ = {};

  if (item.table) el.append(valueTable(item.table));
  if (item.graph) el.append(functionGraph(item.graph));
  let diagram = null;
  if (item.diagram && item.type !== "arrows") {
    diagram = arrowDiagram(item.diagram, { mode: "static" });
    el.append(diagram.el);
  }

  switch (item.type) {
    case "mcq":
    case "multi": {
      const multi = item.type === "multi";
      const picked = new Set();
      const btns = item.options.map((opt, idx) => {
        const b = h("button", { class: `option${multi ? " multi" : ""}`, type: "button", role: multi ? "checkbox" : "radio", "aria-checked": "false" },
          h("span", { class: "mark" }, multi ? "" : "ABCDEFG"[idx]), h("span", null, opt));
        b.addEventListener("click", () => {
          if (b.disabled) return;
          if (multi) { picked.has(idx) ? picked.delete(idx) : picked.add(idx); } else { picked.clear(); picked.add(idx); }
          btns.forEach((x, k) => { x.classList.toggle("picked", picked.has(k)); x.setAttribute("aria-checked", String(picked.has(k))); });
        });
        return b;
      });
      if (multi) el.append(h("p", { class: "muted small", style: { margin: 0 } }, "Boleh pilih lebih dari satu."));
      el.append(h("div", { class: "options", role: multi ? "group" : "radiogroup" }, btns));
      api_ = {
        getAnswer: () => (multi ? [...picked] : picked.size ? [...picked][0] : null),
        lock: () => btns.forEach((b) => { b.disabled = true; }),
        showResult: (res) => {
          if (!multi && res.correct) btns[[...picked][0]]?.classList.add("right");
          if (!multi && !res.correct && !res.retry_free) btns[[...picked][0]]?.classList.add("wrong");
        },
      };
      break;
    }
    case "is_function": {
      let choice = null;
      const yes = h("button", { class: "option", type: "button" }, icon("check"), "Fungsi");
      const no = h("button", { class: "option", type: "button" }, icon("x"), "Bukan fungsi");
      const pick = (v) => { choice = v; yes.classList.toggle("picked", v === true); no.classList.toggle("picked", v === false); };
      yes.onclick = () => pick(true);
      no.onclick = () => pick(false);
      el.append(h("div", { class: "yesno" }, yes, no));
      api_ = {
        getAnswer: () => choice,
        lock: () => { yes.disabled = true; no.disabled = true; },
        showResult: (res) => { if (res.highlight?.length) diagram?.setHighlight(res.highlight); },
      };
      break;
    }
    case "numeric": {
      const input = h("input", { class: "input big", inputmode: "decimal", autocomplete: "off", "aria-label": "Jawaban" });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") onEnter(); });
      el.append(h("div", { class: "input-row" }, h("span", { class: "prefix" }, "Jawaban:"), input, item.unit ? h("span", { class: "muted" }, item.unit) : null),
        keypad(input, [["−", "-"], [",", ","], ["⌫", ""]].slice(0, 2)));
      api_ = { getAnswer: () => input.value.trim(), lock: () => { input.disabled = true; }, focus: () => input.focus() };
      break;
    }
    case "expression": {
      const input = h("input", { class: "input", autocomplete: "off", spellcheck: "false", "aria-label": "Rumus fungsi", style: { fontSize: "1.2rem", fontWeight: 650 } });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") onEnter(); });
      el.append(h("div", { class: "input-row" }, h("span", { class: "prefix" }, `${item.name || "f"}(x) =`), h("div", { style: { flex: 1, minWidth: "180px" } }, input)),
        keypad(input, [["x", "x"], ["+", " + "], ["−", " - "], ["(", "("], [")", ")"], [",", ","]]));
      api_ = { getAnswer: () => input.value.trim(), lock: () => { input.disabled = true; }, focus: () => input.focus() };
      break;
    }
    case "dnd": {
      const board = dndBoard({ chips: item.chips, bins: item.bins });
      el.append(board.el);
      api_ = {
        getAnswer: () => board.getMapping(),
        lock: () => board.lock(),
        showResult: (res) => board.mark(res.wrong || [], res.correct ? item.chips.map((c) => c.id) : []),
      };
      break;
    }
    case "arrows": {
      const d = arrowDiagram({ ...item.diagram, pairs: [] }, { mode: "edit" });
      el.append(d.el);
      api_ = {
        getAnswer: () => d.getPairs(),
        lock: () => d.lock(),
        showResult: (res) => d.setWrong(res.wrong || []),
      };
      break;
    }
    default:
      el.append(h("p", null, "Jenis soal belum didukung."));
  }
  return { el, ...api_ };
}

export async function practiceView(main, [id]) {
  const m = await api.get(`/api/modules/${id}`);
  const items = m.items;
  let idx = 0;
  const firstTry = {};
  let earned = 0;

  const wrap = h("div", { class: "practice" });
  main.append(wrap);

  function header() {
    return h("div", null,
      h("div", { class: "crumbs" }, h("a", { href: "#/materi" }, "Materi"), " / ", h("a", { href: `#/materi/${id}` }, m.title)),
      h("div", { class: "row between" }, h("h1", { style: { margin: 0 } }, `Latihan: ${m.title}`),
        h("span", { class: "muted small" }, idx < items.length ? `Soal ${idx + 1} dari ${items.length}` : "Selesai")),
      h("div", { class: "progress", style: { margin: "10px 0 18px" } }, h("span", { style: { width: `${(idx / items.length) * 100}%` } })));
  }

  function showItem() {
    clear(wrap);
    if (idx >= items.length) return finish();
    const item = items[idx];
    let attempt = 0;
    let done = false;
    const card = h("section", { class: "card q-card" });
    const fbSlot = h("div", { "aria-live": "polite" });
    const hintSlot = h("div");
    const checkBtn = h("button", { class: "btn", type: "button" }, icon("check"), "Periksa");
    const hintBtn = h("button", { class: "btn ghost", type: "button" }, icon("bulb"), "Petunjuk");
    const nextBtn = h("button", { class: "btn", type: "button", style: { display: "none" } }, idx === items.length - 1 ? "Lihat hasil" : "Soal berikutnya", icon("arrowRight"));
    const view = renderItem(item, () => (done ? nextBtn.click() : checkBtn.click()));

    card.append(h("div", { class: "q-prompt" }, item.prompt), view.el, hintSlot, fbSlot,
      h("div", { class: "q-actions" }, h("div", { class: "left" }, item.hint ? hintBtn : null), h("div", { class: "right" }, checkBtn, nextBtn)));
    wrap.append(header(), card);
    linkTerms(card.querySelector(".q-prompt"));
    view.focus?.();

    hintBtn.onclick = () => {
      clear(hintSlot).append(h("div", { class: "hint-box" }, h("b", null, "Petunjuk: "), item.hint));
      hintBtn.style.display = "none";
    };

    checkBtn.onclick = async () => {
      const answer = view.getAnswer();
      if (answer === null || answer === "" || (Array.isArray(answer) && !answer.length)) {
        clear(fbSlot).append(h("div", { class: "alert warn" }, icon("info"), h("div", null, "Isi atau pilih jawabanmu dulu, ya.")));
        return;
      }
      checkBtn.disabled = true;
      try {
        const res = await api.post("/api/practice/check", { module_id: id, item_id: item.id, answer, attempt: attempt + 1 });
        if (!res.retry_free) attempt += 1;
        if (!(item.id in firstTry) && !res.retry_free) firstTry[item.id] = res.correct;
        view.showResult?.(res);
        clear(fbSlot);
        if (res.correct) {
          earned += res.progress?.points_awarded || 0;
          done = true;
          view.lock?.();
          fbSlot.append(h("div", { class: "alert good feedback" }, icon("check"),
            h("div", null, h("div", { class: "alert-title" }, "Benar!", res.progress?.points_awarded ? ` +${res.progress.points_awarded} poin` : ""),
              h("p", null, res.feedback))));
        } else if (res.retry_free) {
          fbSlot.append(h("div", { class: "alert warn feedback" }, icon("info"), h("div", null, res.feedback)));
        } else {
          fbSlot.append(h("div", { class: "alert bad feedback" }, icon("alert"),
            h("div", null, h("div", { class: "alert-title" }, attempt >= 2 ? "Belum tepat. Yuk, lihat pembahasannya." : "Belum tepat, coba lagi!"),
              h("p", null, res.feedback), res.error_label ? h("span", { class: "chip" }, res.error_label) : null)));
          if (attempt >= 2) { done = true; view.lock?.(); }
        }
        if (res.solution && (res.correct || attempt >= 2)) {
          fbSlot.append(h("div", { class: "card", style: { marginTop: "12px", boxShadow: "none" } },
            h("h3", null, res.correct ? "Pembahasan" : "Pembahasan bertahap"),
            revealSteps(res.solution.explain, { answer: `Jawaban: ${res.solution.answer}`, startAll: res.correct })));
        }
        if (done) {
          checkBtn.style.display = "none";
          hintBtn.style.display = "none";
          nextBtn.style.display = "";
          nextBtn.focus();
        }
      } catch (e) {
        clear(fbSlot).append(h("div", { class: "alert bad" }, icon("alert"), h("div", null, e.message)));
      } finally {
        checkBtn.disabled = false;
      }
    };
    nextBtn.onclick = () => { idx += 1; showItem(); };
  }

  function finish() {
    const total = items.length;
    const ok = Object.values(firstTry).filter(Boolean).length;
    const great = ok / total >= 0.8;
    wrap.append(header(), h("section", { class: "card result-hero" },
      mascot(ok === total ? "love" : great ? "cheer" : "wink"),
      h("h2", null, great ? "Luar biasa!" : "Kerja bagus, terus berlatih!"),
      h("p", { class: "muted" }, "Benar pada percobaan pertama"),
      h("div", { class: "big-num" }, `${ok}/${total}`),
      h("p", { style: { marginTop: "10px" } }, `Poin yang didapat: +${fmt(earned)}`),
      h("p", { class: "muted small" }, great ? "Kamu siap lanjut ke materi berikutnya." : "Ulangi penjelasan atau latihan agar makin lancar. Tidak apa-apa salah, itu bagian dari belajar."),
      h("div", { class: "row", style: { justifyContent: "center", marginTop: "12px" } },
        h("a", { class: "btn secondary", href: `#/materi/${id}` }, icon("book"), "Ulangi penjelasan"),
        h("button", { class: "btn secondary", type: "button", onclick: () => { idx = 0; showItem(); } }, icon("restart"), "Latihan lagi"),
        h("a", { class: "btn", href: "#/materi" }, "Materi lain", icon("arrowRight")))));
  }

  showItem();
}
