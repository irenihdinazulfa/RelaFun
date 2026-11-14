// Halaman "Kenalan dengan Wen": semua ekspresi maskot. Ketuk kartu untuk membuat Wen melompat.
import { h } from "../dom.js";
import { mascot, tapMascot, MOODS, MOOD_INFO } from "../mascot.js";

export function wenView(main) {
  const cards = MOODS.map((m) => {
    const [name, when] = MOOD_INFO[m];
    const card = h("button", { class: "card wen-card", type: "button", "aria-label": `Wen ${name.toLowerCase()}. ${when}`, dataset: { mood: m } },
      mascot(m), h("b", null, name), h("span", { class: "muted" }, when));
    card.addEventListener("click", () => card.querySelector("svg").replaceWith(mascot(m, "mascot wen-hop")));
    return card;
  });
  main.append(
    h("div", { class: "page-head" }, h("div", null,
      h("h1", null, "Kenalan dengan Wen"),
      h("p", null, "Kelinci putih berhoodie pink yang menemanimu belajar."))),
    h("section", { class: "card wen-intro" }, tapMascot("wave"),
      h("div", null,
        h("p", null, "Hai, aku ", h("b", null, "Wen"), "! Aku ikut senang saat jawabanmu benar, dan ikut menyemangatimu saat jawabanmu belum tepat."),
        h("p", { class: "muted small" }, "Ketuk aku untuk melihat ekspresi acak. Kalau diketuk terus, aku jadi malu! 🙈"))),
    h("div", { class: "section-title" }, h("h2", null, `${MOODS.length} ekspresi Wen`)),
    h("div", { class: "wen-grid" }, cards));
}
