// Footer di bagian bawah setiap halaman: hak cipta, versi, dan cara memakai.
import { h } from "../dom.js";
import { APP_VERSION } from "../version.js";

export function appFooter(extra = "") {
  return h("footer", { class: `app-footer ${extra}`.trim() },
    `© 2026 Iren Ihdina Zulfa · RelaFun v${APP_VERSION} · Bisa dipakai langsung di browser atau dipasang di HP.`);
}
