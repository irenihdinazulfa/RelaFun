// Halaman "Wen & Teman-teman": kolase stiker, teman-teman Wen, dan semua ekspresi Wen.
import { h } from "../dom.js";
import { mascot, MOODS, MOOD_INFO } from "../mascot.js";
import { friendButton, FRIENDS, FRIEND_INFO, stickerSheet } from "../friends.js";

export function wenView(main) {
  const moodCards = MOODS.map((m) => {
    const [name, when] = MOOD_INFO[m];
    const card = h("button", { class: "card wen-card", type: "button", "aria-label": `Wen ${name.toLowerCase()}. ${when}`, dataset: { mood: m } },
      mascot(m), h("b", null, name), h("span", { class: "muted" }, when));
    card.addEventListener("click", () => card.querySelector("svg").replaceWith(mascot(m, "mascot wen-hop")));
    return card;
  });
  const friendCards = FRIENDS.map((id) => {
    const f = FRIEND_INFO[id];
    return h("article", { class: "card friend-card", dataset: { friend: id } }, friendButton(id),
      h("div", null, h("b", null, f.name), h("div", { class: "muted small" }, `${f.kind} · ada di ${f.page}`), h("p", null, f.desc)));
  });
  main.append(
    h("div", { class: "page-head" }, h("div", null,
      h("h1", null, "Wen & Teman-teman"),
      h("p", null, "Kenalan dengan maskot RelaFun dan sahabat-sahabatnya."))),
    h("section", { class: "card wen-intro" }, stickerSheet(),
      h("div", null,
        h("p", null, "Hai, aku ", h("b", null, "Wen"), "! Aku dan teman-temanku ikut senang saat jawabanmu benar, dan ikut menyemangatimu saat jawabanmu belum tepat."),
        h("p", { class: "muted small" }, "Ketuk kami! Kalau Wen diketuk terus, Wen jadi malu. 🙈"))),
    h("div", { class: "section-title" }, h("h2", null, "Teman-teman Wen")),
    h("div", { class: "friend-grid" }, friendCards),
    h("div", { class: "section-title" }, h("h2", null, `${MOODS.length} ekspresi Wen`)),
    h("div", { class: "wen-grid" }, moodCards));
}
