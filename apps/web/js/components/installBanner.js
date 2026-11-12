// "Unduh aplikasi" (pasang PWA): jendela pilihan saat dibuka + tombol Unduh yang selalu terlihat.
// - Chrome/Edge (Android & laptop): tombol "Unduh sekarang" memanggil dialog instal asli.
// - iPhone/iPad: petunjuk "Bagikan → Tambahkan ke Layar Utama" (Safari tidak punya dialog instal).
// - Dibuka dari WhatsApp/Instagram dll.: petunjuk membuka di Chrome dulu.
// Tidak tampil bila aplikasi sudah terpasang/dibuka sebagai aplikasi.

import { h, clear, toast } from "../dom.js";
import { icon } from "../icons.js";

const DISMISS_KEY = "rf_install_dismissed";
const ua = navigator.userAgent || "";
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);
const isInApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)/i.test(ua);
const isMobile = isIOS || isAndroid || isInApp;

export function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function dismissed() {
  try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}
function dismiss() {
  try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* abaikan */ }
}
function kindNow() {
  if (window.__installPrompt) return "prompt";
  if (isIOS) return "ios";
  if (isInApp) return "inapp";
  return isAndroid ? "android" : "desktop";
}

let box = null;
let shownKind = null;

function steps(kind) {
  const li = (...c) => h("li", null, ...c);
  if (kind === "ios") {
    return [li("Ketuk tombol ", h("b", null, "Bagikan"), " (kotak dengan panah ke atas) di bawah layar Safari."),
      li("Gulir lalu pilih ", h("b", null, "Tambahkan ke Layar Utama"), ", lalu ketuk ", h("b", null, "Tambah"), ".")];
  }
  if (kind === "inapp") {
    return [li("Ketuk menu ", h("b", null, "⋮"), " di pojok kanan atas."),
      li("Pilih ", h("b", null, "Buka di Chrome"), " (atau buka di browser)."),
      li("Di Chrome, tombol ", h("b", null, "Unduh sekarang"), " akan muncul.")];
  }
  if (kind === "desktop") {
    return [li("Klik ikon pasang ", h("b", null, "⊕"), " di ujung kanan bilah alamat, atau"),
      li("Menu ", h("b", null, "⋮"), " → ", h("b", null, "Instal RelaFun"), " / ", h("b", null, "Simpan dan bagikan → Instal"), ".")];
  }
  return [li("Ketuk menu ", h("b", null, "⋮"), " di pojok kanan atas Chrome."),
    li("Pilih ", h("b", null, "Instal aplikasi"), " atau ", h("b", null, "Tambahkan ke layar utama"), "."),
    li("Ketuk ", h("b", null, "Instal"), ". Ikon RelaFun muncul di layar utama.")];
}

async function runPrompt() {
  const ev = window.__installPrompt;
  if (!ev) return false;
  ev.prompt();
  const choice = await ev.userChoice.catch(() => ({ outcome: "dismissed" }));
  window.__installPrompt = null;
  if (box) box.hidden = true;
  dismiss();
  if (choice.outcome === "accepted") toast("RelaFun sedang diunduh & dipasang. Cek layar utama HP-mu.");
  return true;
}

function show(kind, { force = false } = {}) {
  if (isInstalled() || (!force && dismissed())) return;
  if (!box) {
    box = h("div", { class: "install-banner", role: "dialog", "aria-label": "Unduh aplikasi RelaFun", hidden: true });
    document.body.append(box);
  }
  shownKind = kind;
  clear(box);
  const close = () => { dismiss(); box.hidden = true; };
  box.append(h("div", { class: "install-head" },
    h("img", { src: "icons/icon-192.png", alt: "", width: 48, height: 48 }),
    h("div", null, h("b", null, "Unduh aplikasi RelaFun?"),
      h("div", { class: "muted small" }, "Gratis. Ikonnya muncul di layar utama HP dan bisa dibuka tanpa internet."))));
  if (kind === "prompt") {
    box.append(h("div", { class: "install-actions" },
      h("button", { class: "btn secondary", type: "button", onclick: close }, "Nanti saja"),
      h("button", { class: "btn", type: "button", onclick: runPrompt }, icon("download"), "Unduh sekarang")));
  } else {
    box.append(h("p", { class: "small", style: { margin: "12px 0 0", fontWeight: 650 } }, "Caranya:"),
      h("ol", { class: "install-steps" }, steps(kind)),
      h("div", { class: "install-actions" },
        h("button", { class: "btn secondary", type: "button", onclick: close }, "Nanti saja"),
        h("button", { class: "btn", type: "button", onclick: close }, "Mengerti")));
  }
  box.hidden = false;
}

/** Dipanggil oleh tombol "Unduh Aplikasi" mana pun. */
export async function installApp() {
  if (isInstalled()) { toast("RelaFun sudah terpasang di perangkat ini. ✓"); return; }
  if (await runPrompt()) return;
  show(kindNow(), { force: true });
}

/** Tombol "Unduh Aplikasi" yang selalu terlihat (disembunyikan bila sudah terpasang). */
export function installButton({ label = "Unduh Aplikasi", cls = "btn", compact = false } = {}) {
  if (isInstalled()) return null;
  return h("button", { class: `${cls} install-btn`, type: "button", onclick: installApp, "aria-label": "Unduh aplikasi RelaFun" },
    icon("download"), compact ? h("span", { class: "install-btn-label" }, label) : label);
}

export function startInstallBanner() {
  if (isInstalled()) return;
  if (window.__installPrompt) show("prompt");
  // Bila Chrome menawarkan instal belakangan, tingkatkan jendela petunjuk menjadi tombol "Unduh sekarang".
  document.addEventListener("installable", () => {
    if (!box || box.hidden) show("prompt");
    else if (shownKind !== "prompt") show("prompt", { force: true });
  });
  window.addEventListener("appinstalled", () => {
    if (box) box.hidden = true;
    document.querySelectorAll(".install-btn").forEach((b) => b.remove());
    toast("RelaFun sudah terpasang. ✓");
  });
  // Di HP, jendela langsung muncul (dengan petunjuk bila belum ada tawaran dari Chrome).
  if (isMobile) setTimeout(() => { if (!box || box.hidden) show(kindNow()); }, 700);
}
