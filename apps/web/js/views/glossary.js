import { h, clear } from "../dom.js";
import { loadGlossary } from "../components/terms.js";

export async function glossaryView(main) {
  const items = await loadGlossary();
  const search = h("input", { class: "input", type: "search", placeholder: "Cari istilah, mis. range", "aria-label": "Cari istilah", style: { maxWidth: "360px" } });
  const grid = h("div", { class: "gloss-grid" });
  main.append(h("div", { class: "page-head" },
    h("div", null, h("h1", null, "Glosarium"), h("p", null, "Istilah matematika dengan bahasa yang lebih sederhana.")), search), grid);

  function render() {
    const q = search.value.trim().toLowerCase();
    clear(grid);
    const list = items.filter((g) => !q || `${g.term} ${g.aka} ${g.simple}`.toLowerCase().includes(q));
    if (!list.length) grid.append(h("p", { class: "muted" }, "Istilah tidak ditemukan."));
    for (const g of list) {
      grid.append(h("article", { class: "card gloss-card" },
        h("h3", null, g.term), g.aka ? h("div", { class: "muted small", style: { marginBottom: "8px" } }, `disebut juga: ${g.aka}`) : null,
        h("p", null, g.simple), g.example ? h("span", { class: "ex" }, g.example) : null));
    }
  }
  search.addEventListener("input", render);
  render();
}
