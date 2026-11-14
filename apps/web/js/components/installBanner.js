// "Pasang/Unduh aplikasi" (PWA) yang TIDAK menghalangi:
// - Tawaran otomatis berupa bilah kecil di paling atas halaman (ikut alur halaman, tidak menutupi tombol apa pun).
// - Tombol "Pasang" / "Unduh": Chrome/Edge memanggil dialog instal asli; iPhone/iPad, Android tanpa tawaran,
//   dan aplikasi chat (WhatsApp/Instagram) menampilkan petunjuk, hanya bila diminta.
// - "✕" menyembunyikan tawaran selama 3 hari. Tidak tampil bila aplikasi sudah terpasang.

import { h, toast } from "../dom.js";
import { icon } from "../icons.js";

const LATER_KEY = "rf_install_later";
const LATER_MS = 3 * 24 * 60 * 60 * 1000;
const ua = navigator.userAgent || "";
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);
const isInApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)/i.test(ua);
const isMobile = isIOS || isAndroid || isInApp;

export function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function snoozed() {
  try { return Number(localStorage.getItem(LATER_KEY) || 0) > Date.now(); } catch (e) { return false; }
}
function snooze() {
  try { localStorage.setItem(LATER_KEY, String(Date.now() + LATER_MS)); } catch (e) { /* abaikan */ }
}
function kindNow() {
  if (window.__installPrompt) return "prompt";
  if (isIOS) return "ios";
  if (isInApp) return "inapp";
  return isAndroid ? "android" : "desktop";
}

function steps(kind) {
  const li = (...c) => h("li", null, ...c);
  if (kind === "ios") {
    return [li("Ketuk tombol ", h("b", null, "Bagikan"), " (kotak dengan panah ke atas) di Safari."),
      li("Gulir lalu pilih ", h("b", null, "Tambahkan ke Layar Utama"), ", lalu ketuk ", h("b", null, "Tambah"), ".")];
  }
  if (kind === "inapp") {
    return [li("Ketuk menu ", h("b", null, "⋮"), " di pojok kanan atas."),
      li("Pilih ", h("b", null, "Buka di Chrome"), " (atau buka di browser)."),
      li("Di Chrome, ketuk lagi tombol ", h("b", null, "Pasang"), ".")];
  }
  if (kind === "desktop") {
    return [li("Klik ikon pasang ", h("b", null, "⊕"), " di ujung kanan bilah alamat, atau"),
      li("Menu ", h("b", null, "⋮"), " → ", h("b", null, "Instal RelaFun"), " / ", h("b", null, "Simpan dan bagikan → Instal"), ".")];
  }
  return [li("Ketuk menu ", h("b", null, "⋮"), " di pojok kanan atas Chrome."),
    li("Pilih ", h("b", null, "Instal aplikasi"), " atau ", h("b", null, "Tambahkan ke layar utama"), "."),
    li("Ketuk ", h("b", null, "Instal"), ". Ikon RelaFun muncul di layar utama.")];
}

// ---------------------------------------------------------------- bilah tawaran (atas halaman)
let bar = null;
function hideBar() {
  if (bar) bar.remove();
  bar = null;
}
function showBar() {
  if (bar || isInstalled() || snoozed()) return;
  bar = h("div", { class: "install-bar", role: "region", "aria-label": "Pasang aplikasi RelaFun" },
    h("img", { src: "icons/icon-192.png", alt: "", width: 36, height: 36 }),
    h("div", { class: "install-bar-text" }, h("b", null, "Pasang RelaFun di HP?"),
      h("span", null, "Gratis dan bisa dibuka tanpa internet.")),
    h("button", { class: "btn small", type: "button", onclick: installApp }, "Pasang"),
    h("button", { class: "install-bar-x", type: "button", "aria-label": "Tutup, nanti saja", title: "Nanti saja",
      onclick: () => { snooze(); hideBar(); } }, "✕"));
  document.body.insertBefore(bar, document.body.firstChild);
}

// ---------------------------------------------------------------- petunjuk (hanya bila diminta)
let dialog = null;
function closeSteps() {
  if (dialog) dialog.remove();
  dialog = null;
}
function showSteps(kind) {
  closeSteps();
  const ok = h("button", { class: "btn", type: "button", onclick: closeSteps }, "Mengerti");
  dialog = h("div", { class: "install-dialog-wrap" },
    h("div", { class: "card install-dialog", role: "dialog", "aria-modal": "true", "aria-label": "Cara memasang RelaFun" },
      h("div", { class: "install-head" },
        h("img", { src: "icons/icon-192.png", alt: "", width: 48, height: 48 }),
        h("div", null, h("b", null, "Cara memasang RelaFun"),
          h("div", { class: "muted small" }, "Gratis. Ikonnya muncul di layar utama dan bisa dibuka tanpa internet."))),
      h("ol", { class: "install-steps" }, steps(kind)),
      h("div", { class: "install-actions" }, ok)));
  dialog.addEventListener("click", (e) => { if (e.target === dialog) closeSteps(); });
  document.body.appendChild(dialog);
  ok.focus();
}

async function runPrompt() {
  const ev = window.__installPrompt;
  if (!ev) return false;
  ev.prompt();
  const choice = await ev.userChoice.catch(() => ({ outcome: "dismissed" }));
  window.__installPrompt = null;
  hideBar();
  if (choice.outcome === "accepted") toast("RelaFun sedang dipasang. Cek layar utama HP-mu.");
  else snooze();
  return true;
}

/** Dipanggil oleh tombol "Pasang"/"Unduh Aplikasi" mana pun. */
export async function installApp() {
  if (isInstalled()) { toast("RelaFun sudah terpasang di perangkat ini. ✓"); return; }
  if (await runPrompt()) return;
  showSteps(kindNow());
}

/** Tombol "Unduh Aplikasi" yang selalu terlihat (disembunyikan bila sudah terpasang). */
export function installButton({ label = "Unduh Aplikasi", cls = "btn", compact = false } = {}) {
  if (isInstalled()) return null;
  return h("button", { class: `${cls} install-btn`, type: "button", onclick: installApp, "aria-label": "Unduh aplikasi RelaFun" },
    icon("download"), compact ? h("span", { class: "install-btn-label" }, label) : label);
}

export function startInstallBanner() {
  if (isInstalled()) return;
  document.addEventListener("installable", () => showBar());
  window.addEventListener("appinstalled", () => {
    hideBar();
    closeSteps();
    document.querySelectorAll(".install-btn").forEach((b) => b.remove());
    toast("RelaFun sudah terpasang. ✓");
  });
  if (window.__installPrompt || isMobile) setTimeout(showBar, 1200);
}
