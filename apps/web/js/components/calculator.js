// Kalkulator fungsi langkah demi langkah (IL02, GL03). Hitungan dilakukan server (SymPy).

import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { revealSteps } from "./reveal.js";

export function keypad(input, keys) {
  return h("div", { class: "keypad", "aria-label": "Tombol bantu" }, keys.map(([label, ins]) =>
    h("button", {
      type: "button", "aria-label": `Ketik ${label}`,
      onclick: () => {
        const s = input.selectionStart ?? input.value.length;
        const e = input.selectionEnd ?? input.value.length;
        input.value = input.value.slice(0, s) + ins + input.value.slice(e);
        input.focus();
        input.setSelectionRange(s + ins.length, s + ins.length);
        input.dispatchEvent(new Event("input"));
      },
    }, label)));
}

export function calculatorWidget({ expr = "2x + 3", x = "4", name = "f" } = {}) {
  const exprIn = h("input", { class: "input", value: expr, "aria-label": "Rumus fungsi", autocomplete: "off", spellcheck: "false", inputmode: "text" });
  const xIn = h("input", { class: "input", value: x, "aria-label": "Nilai x", style: { maxWidth: "140px" }, inputmode: "decimal", autocomplete: "off" });
  const out = h("div", { "aria-live": "polite" });

  async function run() {
    clear(out);
    try {
      const r = await api.post("/api/tools/evaluate", { expr: exprIn.value, x: xIn.value, name });
      out.append(revealSteps(r.steps.map((s) => ({ title: s.title, math: s.math, note: s.note })), { answer: r.summary }));
    } catch (e) {
      out.append(h("div", { class: "alert warn" }, icon("alert"), h("div", null, e.message)));
    }
  }
  const go = (e) => { if (e.key === "Enter") run(); };
  exprIn.addEventListener("keydown", go);
  xIn.addEventListener("keydown", go);

  return h("div", { class: "stack", style: { gap: "12px" } },
    h("div", { class: "input-row" }, h("span", { class: "prefix" }, `${name}(x) =`), h("div", { style: { flex: "1", minWidth: "180px" } }, exprIn)),
    keypad(exprIn, [["x", "x"], ["+", " + "], ["−", " - "], ["×", " × "], ["x²", "x²"], ["(", "("], [")", ")"], [",", ","]]),
    h("div", { class: "input-row" }, h("span", { class: "prefix" }, "x ="), xIn,
      h("button", { class: "btn", type: "button", onclick: run }, icon("calc"), "Hitung")),
    h("p", { class: "muted small" }, "Pakai koma untuk desimal (3,5) dan titik untuk ribuan (4.500)."),
    out,
  );
}
