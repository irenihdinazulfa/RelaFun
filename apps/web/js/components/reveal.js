// Langkah bertahap (GL03): langkah dimunculkan satu per satu agar tidak membebani.
// Hanya langkah BARU yang dianimasikan; langkah sebelumnya tetap diam.

import { h, clear } from "../dom.js";
import { icon } from "../icons.js";

/**
 * steps: array of string | {title, math, note, lines}
 * opts: { answer, startAll, onDone }
 */
export function revealSteps(steps, opts = {}) {
  let shown = 0;
  const list = h("ol", { class: "reveal-list" });
  const footer = h("div", { class: "row" });
  const answerSlot = h("div");
  const root = h("div", { class: "stack", style: { gap: "10px" } }, list, answerSlot, footer);

  function stepEl(s) {
    if (typeof s === "string") return h("li", null, h("div", { class: "plain" }, s));
    const body = h("div");
    if (s.title) body.append(h("div", { class: "note" }, s.title));
    if (s.math) body.append(h("div", { class: "math" }, s.math));
    if (s.lines) for (const line of s.lines) body.append(h("div", { class: "plain" }, line));
    if (s.note) body.append(h("div", { class: "note" }, s.note));
    return h("li", null, body);
  }

  function showUpTo(n) {
    while (shown < Math.min(n, steps.length)) list.append(stepEl(steps[shown++]));
    clear(footer);
    if (shown < steps.length) {
      footer.append(
        h("button", { class: "btn small", type: "button", onclick: () => showUpTo(shown + 1) }, icon("next"), "Langkah berikutnya"),
        h("button", { class: "btn small ghost", type: "button", onclick: () => showUpTo(steps.length) }, "Tampilkan semua"),
      );
    } else if (!answerSlot.childNodes.length) {
      if (opts.answer) answerSlot.append(h("div", { class: "answer-box" }, opts.answer));
      opts.onDone?.();
    }
  }
  showUpTo(opts.startAll ? steps.length : 1);
  return root;
}
