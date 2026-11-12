// Jendela pilihan "Pasang RelaFun?" yang muncul setiap kali aplikasi dibuka di peramban.
// - Chrome/Edge (Android & laptop): tombol "Pasang sekarang" memanggil dialog instal asli.
// - iPhone/iPad: petunjuk "Bagikan → Tambahkan ke Layar Utama" (Safari tidak punya dialog instal).
// - Dibuka dari WhatsApp/Instagram dll.: petunjuk membuka di Chrome dulu.
// Tidak tampil bila aplikasi sudah terpasang/dibuka sebagai aplikasi, atau setelah "Nanti saja".

import { h, clear, toast } from "../dom.js";
import { icon } from "../icons.js";

const DISMISS_KEY = "rf_install_dismissed";
const ua = navigator.userAgent || "";
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);
const isInApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)/i.test(ua);

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function dismissed() {
  try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}
function dismiss() {
  try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* abaikan */ }
}

export function startInstallBanner() {
  if (isInstalled()) return;
  const box = h("div", { class: "install-banner", role: "dialog", "aria-label": "Pasang aplikasi RelaFun", hidden: true });
  document.body.append(box);

  function close() { dismiss(); box.hidden = true; }

  function show(kind) {
    if (dismissed() || isInstalled()) return;
    clear(box);
    const head = h("div", { class: "install-head" },
      h("img", { src: "icons/icon-192.png", alt: "", width: 48, height: 48 }),
      h("div", null, h("b", null, "Pasang RelaFun di perangkatmu?"),
        h("div", { class: "muted small" }, "Buka seperti aplikasi biasa, langsung dari layar utama — bisa juga tanpa internet.")));
    const later = h("button", { class: "btn secondary", type: "button", onclick: close }, "Nanti saja");
    let body;
    let actions;
    if (kind === "prompt") {
      const go = h("button", { class: "btn", type: "button" }, icon("install"), "Pasang sekarang");
      go.onclick = async () => {
        const ev = window.__installPrompt;
        if (!ev) return show("manual");
        ev.prompt();
        const choice = await ev.userChoice.catch(() => ({ outcome: "dismissed" }));
        window.__installPrompt = null;
        box.hidden = true;
        dismiss();
        if (choice.outcome === "accepted") toast("RelaFun sedang dipasang. Cek layar utama HP-mu.");
      };
      actions = [later, go];
    } else if (kind === "ios") {
      body = h("ol", { class: "install-steps" },
        h("li", null, "Ketuk tombol ", h("b", null, "Bagikan"), " (kotak dengan panah ke atas) di bawah layar."),
        h("li", null, "Pilih ", h("b", null, "Tambahkan ke Layar Utama"), ", lalu ketuk ", h("b", null, "Tambah"), "."));
      actions = [h("button", { class: "btn", type: "button", onclick: close }, "Mengerti")];
    } else if (kind === "inapp") {
      body = h("ol", { class: "install-steps" },
        h("li", null, "Ketuk menu ", h("b", null, "⋮"), " di pojok kanan atas."),
        h("li", null, "Pilih ", h("b", null, "Buka di Chrome"), " (atau buka di peramban)."),
        h("li", null, "Pilihan pasang akan muncul di sana."));
      actions = [h("button", { class: "btn", type: "button", onclick: close }, "Mengerti")];
    } else {
      body = h("ol", { class: "install-steps" },
        h("li", null, "Ketuk menu ", h("b", null, "⋮"), " di pojok kanan atas Chrome."),
        h("li", null, "Pilih ", h("b", null, "Instal aplikasi"), " atau ", h("b", null, "Tambahkan ke layar utama"), "."));
      actions = [h("button", { class: "btn", type: "button", onclick: close }, "Mengerti")];
    }
    box.append(head);
    if (body) box.append(body);
    box.append(h("div", { class: "install-actions" }, actions));
    box.hidden = false;
  }

  // Dialog instal asli tersedia → tampilkan tombol "Pasang sekarang".
  if (window.__installPrompt) show("prompt");
  document.addEventListener("installable", () => show("prompt"));
  window.addEventListener("appinstalled", () => { box.hidden = true; toast("RelaFun sudah terpasang. ✓"); });

  // Tanpa dialog asli: beri petunjuk sesuai perangkat.
  if (isIOS) setTimeout(() => show("ios"), 1200);
  else if (isInApp) setTimeout(() => show("inapp"), 1200);
  else if (isAndroid) setTimeout(() => { if (!window.__installPrompt) show("manual"); }, 3500);
}
