// Istilah sulit diberi garis titik-titik; ketuk untuk melihat arti sederhananya (EL03).

import { api } from "../api.js";
import { h } from "../dom.js";

let glossary = null;
const KEYS = ["himpunan pasangan berurutan", "diagram kartesius", "diagram panah", "daerah asal", "daerah kawan",
  "daerah hasil", "nama relasi", "kodomain", "domain", "range", "bayangan", "pemetaan", "konstanta", "koefisien",
  "substitusi", "impas", "variabel"];

export async function loadGlossary() {
  if (!glossary) {
    try { glossary = await api.get("/api/glossary"); } catch { glossary = []; }
  }
  return glossary;
}

function lookup(key) {
  const k = key.toLowerCase();
  return glossary.find((g) => g.term.toLowerCase().startsWith(k) || (g.aka || "").toLowerCase().split(",").map((s) => s.trim()).includes(k));
}

let pop = null;
function closePop() { pop?.remove(); pop = null; }
document.addEventListener("click", (e) => { if (pop && !e.target.closest(".term, .term-pop")) closePop(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(); });

function showPop(btn, entry) {
  closePop();
  pop = h("div", { class: "term-pop", role: "dialog", "aria-label": entry.term },
    h("b", null, entry.term + (entry.aka ? ` (${entry.aka})` : "")), entry.simple,
    entry.example ? h("div", { style: { marginTop: "6px", opacity: ".85" } }, "Contoh: ", entry.example) : null);
  document.body.append(pop);
  const r = btn.getBoundingClientRect();
  const pr = pop.getBoundingClientRect();
  const left = Math.min(Math.max(8, r.left), window.innerWidth - pr.width - 8);
  const top = r.bottom + pr.height + 10 > window.innerHeight ? r.top - pr.height - 8 : r.bottom + 8;
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

/** Bungkus istilah (kemunculan pertama saja per blok) dengan tombol penjelasan. */
export async function linkTerms(root) {
  await loadGlossary();
  if (!glossary.length) return root;
  const used = new Set();
  const re = new RegExp(`\\b(${KEYS.join("|")})\\b`, "i");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest("button, .term, .math, svg, input, textarea")) continue;
    let text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let changed = false;
    let m;
    while ((m = re.exec(text))) {
      const key = m[1].toLowerCase();
      const entry = lookup(key);
      if (!entry || used.has(entry.term)) {
        frag.append(text.slice(0, m.index + m[0].length));
        text = text.slice(m.index + m[0].length);
        continue;
      }
      used.add(entry.term);
      frag.append(text.slice(0, m.index));
      const b = h("button", { class: "term", type: "button", "aria-label": `Arti ${m[1]}` }, m[1]);
      b.addEventListener("click", (e) => { e.stopPropagation(); showPop(b, entry); });
      frag.append(b);
      text = text.slice(m.index + m[0].length);
      changed = true;
    }
    if (changed) {
      frag.append(text);
      node.replaceWith(frag);
    }
  }
  return root;
}
