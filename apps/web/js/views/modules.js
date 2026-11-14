import { h } from "../dom.js";
import { friendButton } from "../friends.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { GROUP_LABEL, moduleIcon } from "./home.js";

const GROUPS = [
  ["prasyarat", "Prasyarat", "Bekal sebelum masuk materi inti (IL03)."],
  ["inti", "Relasi dan Fungsi", "Materi inti kelas 8, dari relasi sampai grafik fungsi."],
  ["literasi", "Literasi Matematika", "Memakai fungsi untuk soal cerita sehari-hari."],
];

export async function modulesView(main) {
  const mods = await api.get("/api/modules");
  main.append(h("div", { class: "page-head" },
    h("div", { class: "ph-title" }, friendButton("lulu", "friend ph-friend"), h("div", null, h("h1", null, "Materi"), h("p", null, "Kerjakan berurutan. Setiap materi berisi penjelasan singkat, contoh bertahap, lalu latihan.")))));

  for (const [g, title, desc] of GROUPS) {
    const list = mods.filter((m) => m.group === g);
    main.append(h("div", { class: "section-title" }, h("div", null, h("h2", null, title), h("p", { class: "muted small", style: { margin: 0 } }, desc))));
    main.append(h("div", { class: "module-list" }, list.map((m) =>
      h("article", { class: "card module-card" },
        h("div", { class: "head" }, moduleIcon(m),
          h("div", { style: { minWidth: 0 } },
            h("div", { class: "muted small" }, `${GROUP_LABEL[m.group]} · ${m.order} · ± ${m.minutes} menit`),
            h("h3", null, m.title))),
        h("p", { class: "muted", style: { margin: 0 } }, m.subtitle),
        h("div", null,
          h("div", { class: "row between small", style: { marginBottom: "4px" } },
            h("span", null, m.stats.lesson_done ? "✓ Penjelasan selesai" : `${m.step_count} langkah penjelasan`),
            h("span", null, `${m.stats.solved}/${m.stats.total} soal`)),
          h("div", { class: `progress${m.stats.mastery === 100 ? " good" : ""}` }, h("span", { style: { width: `${m.stats.mastery}%` } }))),
        h("div", { class: "actions" },
          h("a", { class: "btn secondary", href: `#/materi/${m.id}` }, icon("book"), "Pelajari"),
          h("a", { class: "btn", href: `#/materi/${m.id}/latihan` }, icon("pencil"), "Latihan"))))));
  }
}
