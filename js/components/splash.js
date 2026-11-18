// Layar pembuka: Wen & kelima temannya muncul satu per satu setiap kali aplikasi dibuka
// (sekali per pembukaan). Hilang sendiri setelah ±2,6 detik, atau langsung saat diketuk / tombol ditekan.
import { h } from "../dom.js";
import { stickerSheet } from "../friends.js";

const KEY = "rf_splash_shown";

export function showSplash({ duration = 2600 } = {}) {
  try {
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, "1");
  } catch { /* penyimpanan diblokir: tetap tampilkan */ }

  const sheet = stickerSheet({ tap: false, wenMood: "wave" });
  // Wen muncul dulu, lalu teman-teman satu per satu
  sheet.querySelector(".stk-wen").style.animationDelay = "0.05s";
  [...sheet.querySelectorAll(".stk:not(.stk-wen)")].forEach((el, i) => { el.style.animationDelay = `${0.3 + i * 0.13}s`; });

  const go = h("button", { class: "btn splash-go", type: "button" }, "Mulai");
  const el = h("div", { class: "splash", role: "dialog", "aria-modal": "true", "aria-label": "Selamat datang di RelaFun" },
    h("div", { class: "splash-inner" }, sheet,
      h("h1", null, "RelaFun"),
      h("p", null, "Belajar Relasi & Fungsi bareng Wen dan teman-teman!"),
      go,
      h("div", { class: "splash-hint" }, "Ketuk di mana saja untuk mulai")));

  let done = false;
  const onKey = (e) => { if (["Enter", " ", "Escape"].includes(e.key)) close(); };
  function close() {
    if (done) return;
    done = true;
    document.removeEventListener("keydown", onKey);
    el.classList.add("hide");
    setTimeout(() => el.remove(), 320);
  }
  el.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.append(el);
  go.focus({ preventScroll: true });
  setTimeout(close, duration);
}
