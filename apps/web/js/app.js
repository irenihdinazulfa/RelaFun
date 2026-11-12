// Titik masuk aplikasi web RelaFun: router berbasis hash + tata letak.

import { h, clear } from "./dom.js";
import { icon } from "./icons.js";
import { session, settings } from "./store.js";
import { api } from "./api.js";
import { loginView } from "./views/login.js";
import { homeView } from "./views/home.js";
import { modulesView } from "./views/modules.js";
import { lessonView } from "./views/lesson.js";
import { practiceView } from "./views/practice.js";
import { calculatorView } from "./views/calculatorPage.js";
import { modelerView } from "./views/modeler.js";
import { glossaryView } from "./views/glossary.js";
import { leaderboardView } from "./views/leaderboard.js";
import { settingsView } from "./views/settings.js";
import { teacherView } from "./views/teacher.js";
import { menuView } from "./views/menu.js";
import { startInstallBanner, installButton } from "./components/installBanner.js";

export const APP_VERSION = "1.3";

settings.apply();

const ROUTES = [
  { re: /^\/masuk$/, view: loginView, public: true, bare: true },
  { re: /^\/$/, view: (m, p, ctx) => (ctx.user.role === "teacher" ? teacherView(m, p, ctx) : homeView(m, p, ctx)), nav: "home" },
  { re: /^\/materi$/, view: modulesView, nav: "materi" },
  { re: /^\/materi\/([\w-]+)$/, view: lessonView, nav: "materi" },
  { re: /^\/materi\/([\w-]+)\/latihan$/, view: practiceView, nav: "materi" },
  { re: /^\/kalkulator$/, view: calculatorView, nav: "kalkulator" },
  { re: /^\/pemodel$/, view: modelerView, nav: "pemodel" },
  { re: /^\/glosarium$/, view: glossaryView, nav: "glosarium" },
  { re: /^\/peringkat$/, view: leaderboardView, nav: "peringkat" },
  { re: /^\/pengaturan$/, view: settingsView, nav: "pengaturan" },
  { re: /^\/guru$/, view: teacherView, nav: "home" },
  { re: /^\/menu$/, view: menuView, nav: "menu" },
];

function navItems(user) {
  const home = user.role === "teacher"
    ? { key: "home", href: "#/", label: "Dashboard Guru", ic: "teacher" }
    : { key: "home", href: "#/", label: "Beranda", ic: "home" };
  return [
    home,
    { key: "materi", href: "#/materi", label: "Materi", ic: "book" },
    { key: "kalkulator", href: "#/kalkulator", label: "Kalkulator f(x)", ic: "calc" },
    { key: "pemodel", href: "#/pemodel", label: "Pemodel Soal Cerita", ic: "model" },
    { key: "glosarium", href: "#/glosarium", label: "Glosarium", ic: "glossary" },
    { key: "peringkat", href: "#/peringkat", label: "Peringkat Kelas", ic: "trophy" },
    { key: "pengaturan", href: "#/pengaturan", label: "Pengaturan", ic: "settings" },
  ];
}

function brand() {
  return h("a", { class: "brand", href: "#/" }, h("img", { src: "icons/icon.svg", alt: "" }),
    h("span", null, h("b", null, "RelaFun"), h("small", null, "Relasi & Fungsi")));
}

function layout(user, active) {
  const items = navItems(user);
  const sidebar = h("nav", { class: "sidebar", "aria-label": "Menu utama" },
    brand(),
    items.map((it) => h("a", { class: `nav-link${it.key === active ? " active" : ""}`, href: it.href,
      "aria-current": it.key === active ? "page" : null }, icon(it.ic), it.label)),
    h("div", { class: "spacer" }),
    h("div", { class: "side-user" },
      h("div", { class: "avatar", "aria-hidden": "true" }, (user.nickname || "?").slice(0, 1).toUpperCase()),
      h("div", { style: { minWidth: 0, flex: 1 } },
        h("div", { style: { fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, user.nickname),
        h("div", { class: "muted small" }, user.role === "teacher" ? "Guru" : (user.class?.name || "Belum ada kelas"))),
      h("button", { class: "btn ghost icon-btn", type: "button", title: "Keluar", "aria-label": "Keluar", onclick: logout }, icon("logout"))),
  );
  const mobileItems = [items[0], items[1], items[2], items[3], { key: "menu", href: "#/menu", label: "Lainnya", ic: "menu" }];
  const bottom = h("nav", { class: "bottom-nav", "aria-label": "Menu bawah" },
    mobileItems.map((it) => h("a", { href: it.href, class: it.key === active || (it.key === "menu" && ["glosarium", "peringkat", "pengaturan"].includes(active)) ? "active" : "" },
      icon(it.ic), it.key === "kalkulator" ? "Kalkulator" : it.key === "pemodel" ? "Pemodel" : it.key === "home" && user.role === "teacher" ? "Guru" : it.label)));
  const topbar = h("header", { class: "topbar" }, brand(),
    h("div", { class: "row", style: { gap: "4px", flexWrap: "nowrap" } },
      installButton({ label: "Unduh", cls: "btn small", compact: true }),
      h("a", { class: "btn ghost icon-btn", href: "#/pengaturan", "aria-label": "Pengaturan" }, icon("settings"))));
  const main = h("main", { class: "main", id: "main", tabindex: "-1" });
  const shell = h("div", { class: "layout" }, sidebar, h("div", { style: { minWidth: 0 } }, topbar, main), bottom);
  return { shell, main };
}

function logout() {
  session.clear();
  location.hash = "#/masuk";
}

let renderToken = 0;
async function render() {
  const token = ++renderToken;
  const path = (location.hash || "#/").slice(1) || "/";
  const route = ROUTES.find((r) => r.re.test(path)) || ROUTES[1];
  const params = path.match(route.re)?.slice(1) || [];
  const app = document.getElementById("app");
  const user = session.user;

  if (!route.public && !(session.token && user)) { location.hash = "#/masuk"; return; }
  if (route.public && session.token && user) { location.hash = "#/"; return; }

  const ctx = {
    user,
    async refreshUser() {
      const u = await api.get("/api/auth/me");
      session.setUser(u);
      ctx.user = u;
      return u;
    },
  };

  if (route.bare) {
    clear(app);
    await route.view(app, params, ctx);
    return;
  }
  const { shell, main } = layout(user, route.nav);
  clear(app).append(shell);
  try {
    await route.view(main, params, ctx);
  } catch (e) {
    if (token !== renderToken) return;
    clear(main).append(h("div", { class: "alert bad" }, icon("alert"),
      h("div", null, h("div", { class: "alert-title" }, "Halaman gagal dimuat"), h("p", null, e.message || String(e)),
        h("button", { class: "btn small secondary", onclick: render }, "Coba lagi"))));
  }
  if (token === renderToken) {
    window.scrollTo(0, 0);
    document.title = `${document.querySelector("main h1")?.textContent || "RelaFun"} — RelaFun`;
  }
}

window.addEventListener("hashchange", render);
render();

// --- PWA: service worker & tombol pasang ---
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  // Bila versi baru terpasang di latar belakang, muat ulang sekali agar langsung terpakai.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => reg.update()).catch(() => {});
  });
}
startInstallBanner();
