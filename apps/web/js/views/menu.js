import { h } from "../dom.js";
import { icon } from "../icons.js";
import { session } from "../store.js";

export function menuView(main, _p, ctx) {
  const link = (href, ic, label, desc, tone = "") => h("a", { class: "card topic-card", href },
    h("div", { class: `module-icon ${tone}` }, icon(ic)), h("div", null, h("b", null, label), h("div", { class: "muted small" }, desc)));
  main.append(h("h1", null, "Lainnya"), h("div", { class: "stack" },
    link("#/kalkulator", "calc", "Kalkulator f(x)", "Cek hitungan langkah demi langkah", "sky"),
    link("#/glosarium", "glossary", "Glosarium", "Arti istilah dengan bahasa sederhana", "butter"),
    ctx.user.role === "student" ? link("#/peringkat", "trophy", "Peringkat Kelas", "Poin teman sekelas", "peach") : null,
    link("#/pengaturan", "settings", "Pengaturan", "Tema, ukuran teks, kode kelas, pasang aplikasi"),
    h("button", { class: "btn secondary", type: "button", onclick: () => { session.clear(); location.hash = "#/masuk"; } }, icon("logout"), "Keluar")));
}
