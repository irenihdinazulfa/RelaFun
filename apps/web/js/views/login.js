import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { session } from "../store.js";
import { stickerSheet } from "../friends.js";
import { appFooter } from "../components/footer.js";
import { icon } from "../icons.js";
import { installButton } from "../components/installBanner.js";

export function loginView(root) {
  let tab = "masuk";
  const card = h("div", { class: "card auth-card" });

  const page = h("div", { class: "auth-wrap" },
    h("section", { class: "auth-side" }, stickerSheet(),
      h("h1", { style: { color: "#1f2a3d" } }, "RelaFun"),
      h("p", null, "Relasi & Fungsi jadi seru! Belajar bersama Wen dan teman-teman: satu panah, satu pasangan, pelan-pelan sampai paham."),
      installButton({ label: "Unduh Aplikasi RelaFun", cls: "btn install-hero" })),
    h("main", { class: "auth-main" }, card, appFooter("auth-footer")),
  );
  root.append(page);

  function field(label, input) {
    return h("div", { class: "field" }, h("label", { for: input.id }, label), input);
  }

  // Kolom kata sandi + tombol lihat + peringatan Caps Lock (mencegah salah ketik).
  function passwordField(label, input) {
    const caps = h("div", { class: "small", style: { color: "var(--warn)", display: "none" } }, "⚠ Caps Lock menyala. Kata sandi membedakan huruf besar dan kecil.");
    const toggle = h("button", { type: "button", class: "btn ghost small", "aria-label": "Tampilkan kata sandi", style: { flex: "none" } }, icon("eye"), "Lihat");
    toggle.onclick = () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.lastChild.textContent = show ? "Sembunyikan" : "Lihat";
      input.focus();
    };
    input.addEventListener("keyup", (e) => { caps.style.display = e.getModifierState?.("CapsLock") ? "" : "none"; });
    return h("div", { class: "field" }, h("label", { for: input.id }, label),
      h("div", { class: "row", style: { flexWrap: "nowrap", gap: "6px" } }, input, toggle), caps);
  }

  async function demoLogin(username, password) {
    try {
      const r = await api.post("/api/auth/login", { username, password });
      session.set(r.token, r.user);
      location.hash = "#/";
    } catch (ex) {
      alert(ex.message);
    }
  }

  let demoAvailable = true;
  api.get("/api/health").then((hres) => { demoAvailable = hres.demo !== false; if (!demoAvailable) render(); }).catch(() => {});

  function render() {
    clear(card);
    const tabs = h("div", { class: "tabs", role: "tablist" },
      [["masuk", "Masuk"], ["daftar", "Daftar siswa"], ["guru", "Daftar guru"]].map(([k, l]) =>
        h("button", { type: "button", role: "tab", "aria-selected": String(tab === k), class: tab === k ? "active" : "", onclick: () => { tab = k; render(); } }, l)));
    const err = h("div", { "aria-live": "assertive" });
    const form = h("form", { novalidate: true });
    const inp = (id, type = "text", extra = {}) => h("input", { id, name: id, type, class: "input", required: true, ...extra });

    if (tab === "masuk") {
      const u = inp("username", "text", { autocomplete: "username", autocapitalize: "none", spellcheck: "false" });
      const p = inp("password", "password", { autocomplete: "current-password", autocapitalize: "none" });
      form.append(field("Nama pengguna", u), passwordField("Kata sandi", p),
        h("button", { class: "btn block", type: "submit" }, "Masuk"));
      form.onsubmit = (e) => submit(e, () => api.post("/api/auth/login", { username: u.value.trim(), password: p.value }));
    } else {
      const nick = inp("nickname", "text", { maxlength: 30, autocomplete: "nickname" });
      const u = inp("username", "text", { autocomplete: "username", autocapitalize: "none", maxlength: 40 });
      const p = inp("password", "password", { autocomplete: "new-password", minlength: 6 });
      if (tab === "daftar") {
        const code = inp("class_code", "text", { maxlength: 12, autocapitalize: "characters", required: false });
        form.append(field("Nama panggilan (tampil di kelas)", nick), field("Nama pengguna (huruf kecil/angka)", u),
          field("Kata sandi (min. 6 karakter)", p), field("Kode kelas dari guru (boleh dikosongkan)", code),
          h("p", { class: "muted small" }, "Gunakan nama panggilan saja. Tidak perlu nama lengkap."),
          h("button", { class: "btn block", type: "submit" }, "Daftar"));
        form.onsubmit = (e) => submit(e, () => api.post("/api/auth/register", {
          username: u.value, password: p.value, nickname: nick.value, class_code: code.value, role: "student" }));
      } else {
        const cname = inp("class_name", "text", { maxlength: 60, placeholder: "mis. 8A", required: false });
        form.append(field("Nama tampilan guru", nick), field("Nama pengguna", u), field("Kata sandi (min. 6 karakter)", p),
          field("Nama kelas pertama", cname),
          h("button", { class: "btn block", type: "submit" }, "Daftar sebagai guru"));
        form.onsubmit = (e) => submit(e, () => api.post("/api/auth/register", {
          username: u.value, password: p.value, nickname: nick.value, class_name: cname.value, role: "teacher" }));
      }
    }

    async function submit(e, call) {
      e.preventDefault();
      clear(err);
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        const r = await call();
        session.set(r.token, r.user);
        location.hash = "#/";
      } catch (ex) {
        err.append(h("div", { class: "alert bad", style: { marginBottom: "12px" } }, icon("alert"), h("div", null, ex.message)));
      } finally {
        btn.disabled = false;
      }
    }

    card.append(tabs, err, form,
      demoAvailable ? h("div", { class: "demo-box", style: { marginTop: "16px" } },
        h("b", null, "Coba langsung tanpa mengetik:"),
        h("div", { class: "row", style: { margin: "8px 0" } },
          h("button", { class: "btn secondary small", type: "button", onclick: () => demoLogin("siswa", "siswa123") }, "Masuk Akun Demo"),
          h("button", { class: "btn secondary small", type: "button", onclick: () => demoLogin("guru", "guru123") }, "Masuk sebagai Guru Demo")),
        h("div", { class: "muted small" },
          "Atau ketik manual (semua huruf kecil): siswa → ", h("code", null, "siswa"), " / ", h("code", null, "siswa123"),
          " · guru → ", h("code", null, "guru"), " / ", h("code", null, "guru123"), " · kode kelas ", h("code", null, "RF8A26"))) : null);
  }
  render();
}
