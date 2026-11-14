// Pelajaran: SATU langkah per layar (segmenting, CLT). Kemajuan disimpan otomatis.

import { h, clear, md } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { mascot } from "../mascot.js";
import { arrowDiagram } from "../components/arrowDiagram.js";
import { functionGraph } from "../components/graph.js";
import { revealSteps } from "../components/reveal.js";
import { calculatorWidget } from "../components/calculator.js";
import { linkTerms } from "../components/terms.js";
import { GROUP_LABEL } from "./home.js";

export function valueTable(t) {
  return h("div", { class: "table-wrap" }, h("table", { class: "value-table" },
    h("tr", null, t.headers.map((c) => h("th", null, c))),
    t.rows.map((r) => h("tr", null, r.map((c) => h("td", null, c))))));
}

export function renderStep(step) {
  const parts = [];
  if (step.title && step.type !== "tip") parts.push(h("h2", null, step.title));
  switch (step.type) {
    case "text":
      parts.push(h("div", { class: "body" }, md(step.body)));
      break;
    case "tip":
      parts.push(h("div", { class: "tip" }, mascot("idea"), h("div", { class: "body" }, h("b", null, "Tips dari Wen"), md(step.body))));
      break;
    case "example":
      parts.push(h("div", { class: "example-problem" }, step.problem));
      parts.push(revealSteps(step.steps, { answer: step.answer }));
      break;
    case "diagram":
      if (step.body) parts.push(h("div", { class: "body" }, md(step.body)));
      parts.push(arrowDiagram(step.diagram, { mode: step.mode || "static" }).el);
      break;
    case "graph":
      if (step.body) parts.push(h("div", { class: "body" }, md(step.body)));
      parts.push(functionGraph(step));
      break;
    case "table":
      if (step.body) parts.push(h("div", { class: "body" }, md(step.body)));
      parts.push(valueTable(step));
      break;
    case "calculator":
      if (step.body) parts.push(h("div", { class: "body" }, md(step.body)));
      parts.push(calculatorWidget({ expr: step.expr, x: step.x }));
      break;
    default:
      parts.push(md(step.body || ""));
  }
  return parts;
}

export async function lessonView(main, [id]) {
  const m = await api.get(`/api/modules/${id}`);
  const steps = m.steps;
  let i = Math.min(m.stats.step_index || 0, steps.length);
  if (m.stats.lesson_done) i = 0;

  const dots = h("div", { class: "step-dots", "aria-hidden": "true" });
  const card = h("section", { class: "card lesson-card" });
  const nav = h("div", { class: "lesson-nav" });
  const counter = h("span", { class: "muted small" });

  main.append(h("div", { class: "lesson" },
    h("div", { class: "crumbs" }, h("a", { href: "#/materi" }, "Materi"), " / ", GROUP_LABEL[m.group]),
    h("div", { class: "row between" }, h("h1", { style: { margin: 0 } }, m.title), counter),
    dots, card, nav));

  function save(done = false) {
    api.post(`/api/modules/${id}/progress`, { step_index: i, lesson_done: done }).catch(() => {});
  }

  function render() {
    clear(dots);
    for (let k = 0; k <= steps.length; k++) dots.append(h("span", { class: k < i ? "done" : k === i ? "now" : "" }));
    clear(card);
    clear(nav);
    if (i < steps.length) {
      counter.textContent = `Langkah ${i + 1} dari ${steps.length}`;
      card.append(...renderStep(steps[i]));
      linkTerms(card);
      nav.append(
        h("button", { class: "btn secondary", type: "button", disabled: i === 0, onclick: () => { i -= 1; render(); } }, icon("arrowLeft"), "Kembali"),
        h("button", { class: "btn", type: "button", onclick: () => { i += 1; save(i >= steps.length); render(); } },
          i === steps.length - 1 ? "Selesai" : "Lanjut", icon("arrowRight")));
    } else {
      counter.textContent = "Selesai";
      card.append(h("div", { class: "result-hero" }, mascot("cheer"),
        h("h2", null, "Penjelasan selesai!"),
        h("p", { class: "muted" }, "Sekarang coba latihan. Kalau ragu, pakai tombol Petunjuk. Setelah 2 kali mencoba, pembahasan bertahap akan muncul."),
        h("h3", null, "Yang sudah kamu pelajari"),
        h("ul", { style: { textAlign: "left", display: "inline-block" } }, m.objectives.map((o) => h("li", null, o)))));
      nav.append(
        h("button", { class: "btn secondary", type: "button", onclick: () => { i = 0; render(); } }, icon("restart"), "Ulangi penjelasan"),
        h("a", { class: "btn", href: `#/materi/${id}/latihan` }, icon("pencil"), "Mulai latihan"));
    }
    card.focus?.();
  }
  render();
}
