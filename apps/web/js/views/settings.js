import { h, clear, toast } from "../dom.js";
import { api, STATIC } from "../api.js";
import { icon } from "../icons.js";
import { session, settings } from "../store.js";
import { installButton } from "../components/installBanner.js";

function toggle(checked, onChange, label) {
  const input = h("input", { type: "checkbox", role: "switch", "aria-label": label });
  input.checked = checked;
  input.onchange = () => onChange(input.checked);
  return h("label", { class: "toggle" }, input, h("span"));
}

export function settingsView(main, _p, ctx) {
  const s = settings.get();
  const themeSel = h("select", { class: "input", style: { maxWidth: "220px" }, "aria-label": "Tema" },
    [["system", "Ikuti perangkat"], ["light", "Terang"], ["dark", "Gelap"]].map(([v, l]) => h("option", { value: v, selected: s.theme === v }, l)));
  themeSel.onchange = () => settings.set({ theme: themeSel.value });

  const installSlot = h("div");
  function renderInstall() {
    clear(installSlot);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (standalone) {
      installSlot.append(h("p", { class: "muted" }, "Aplikasi sudah terpasang di perangkat ini. ✓"));
    } else {
      installSlot.append(installButton({ label: "Unduh Aplikasi RelaFun" }),
        h("p", { class: "muted small", style: { margin: "12px 0 6px" } }, "Atau secara manual:"),
        h("ul", { class: "small", style: { paddingLeft: "18px", margin: 0 } },
        h("li", null, h("b", null, "Android (Chrome): "), "menu ⋮ → Instal aplikasi / Tambahkan ke layar utama."),
        h("li", null, h("b", null, "iPhone/iPad (Safari): "), "tombol Bagikan → Tambahkan ke Layar Utama."),
        h("li", null, h("b", null, "Windows/Mac (Chrome/Edge): "), "ikon pasang di ujung kanan bilah alamat.")));
    }
  }
  document.addEventListener("installable", renderInstall);
  renderInstall();

  const user = ctx.user;
  const codeIn = h("input", { class: "input", placeholder: "Kode kelas", maxlength: 12, style: { maxWidth: "200px", textTransform: "uppercase" } });
  const classBox = h("div");
  function renderClass() {
    clear(classBox);
    if (user.role === "teacher") {
      classBox.append(h("p", { class: "muted" }, "Kelola kelas dari Dashboard Guru."));
      return;
    }
    classBox.append(
      h("p", null, ctx.user.class ? ["Kelas saat ini: ", h("b", null, ctx.user.class.name)] : "Kamu belum bergabung ke kelas."),
      h("div", { class: "row" }, codeIn, h("button", { class: "btn secondary", type: "button", onclick: async () => {
        try {
          const u = await api.post("/api/auth/join-class", { class_code: codeIn.value });
          session.setUser(u);
          ctx.user = u;
          toast(`Bergabung ke kelas ${u.class.name}`);
          renderClass();
        } catch (e) { toast(e.message); }
      } }, ctx.user.class ? "Pindah kelas" : "Gabung")));
  }
  renderClass();

  // --- Fitur AI (kunci API Claude) ---
  const aiBox = h("div");
  async function renderAi() {
    clear(aiBox);
    if (!STATIC) {
      aiBox.append(h("p", { class: "muted small" }, "Pada versi server, fitur AI diatur oleh pengelola server (ANTHROPIC_API_KEY di file .env) dan diaktifkan guru per kelas."));
      return;
    }
    const ai = await import("../local/ai.js");
    const has = !!ai.getKey();
    const status = h("div", { "aria-live": "polite" });
    if (has) {
      aiBox.append(h("div", { class: "alert info" }, icon("sparkle"), h("div", null, h("b", null, "Fitur AI aktif di perangkat ini."),
        h("div", { class: "small" }, "Buka Pemodel Soal Cerita → Mode AI."))),
        h("div", { class: "row", style: { marginTop: "12px" } },
          h("button", { class: "btn secondary", type: "button", onclick: async () => {
            clear(status).append(h("p", { class: "muted small" }, "Menguji kunci…"));
            try { await ai.testKey(ai.getKey()); clear(status).append(h("p", { class: "small" }, "✓ Kunci berfungsi.")); }
            catch (e) { clear(status).append(h("p", { class: "small", style: { color: "var(--bad)" } }, e.message)); }
          } }, "Uji kunci"),
          h("button", { class: "btn ghost", type: "button", onclick: () => { ai.clearKey(); toast("Kunci API dihapus dari perangkat ini."); renderAi(); } }, icon("x"), "Hapus kunci")),
        status);
      return;
    }
    const input = h("input", { class: "input", type: "password", placeholder: "sk-ant-…", autocomplete: "off", spellcheck: "false", "aria-label": "Kunci API Claude" });
    const save = h("button", { class: "btn", type: "button" }, icon("sparkle"), "Simpan & aktifkan");
    save.onclick = async () => {
      const k = input.value.trim();
      if (!k) { clear(status).append(h("p", { class: "small", style: { color: "var(--bad)" } }, "Tempel kunci API terlebih dahulu.")); return; }
      save.disabled = true;
      clear(status).append(h("p", { class: "muted small" }, "Memeriksa kunci…"));
      try {
        await ai.testKey(k);
        ai.setKey(k);
        toast("Fitur AI aktif! ✓");
        renderAi();
      } catch (e) {
        clear(status).append(h("p", { class: "small", style: { color: "var(--bad)" } }, e.message));
      } finally { save.disabled = false; }
    };
    aiBox.append(
      h("p", { class: "small" }, "Mode AI membantu memodelkan soal cerita secara otomatis. Fitur ini memakai Claude API dan membutuhkan ", h("b", null, "kunci API"), " (berbayar, ± Rp400 per analisis)."),
      h("ol", { class: "small", style: { paddingLeft: "18px" } },
        h("li", null, "Buat kunci di ", h("a", { href: "https://console.anthropic.com/settings/keys", target: "_blank", rel: "noopener" }, "console.anthropic.com"), " (isi saldo terlebih dahulu)."),
        h("li", null, "Tempel kuncinya di bawah ini, lalu ketuk Simpan.")),
      h("div", { class: "field" }, input),
      save, status,
      h("p", { class: "muted small", style: { marginTop: "10px", marginBottom: 0 } },
        "🔒 Kunci hanya disimpan di perangkat ini dan langsung dikirim ke Anthropic. Jangan memasukkan kunci di HP orang lain. Yang dikirim ke AI hanya teks soal cerita."));
  }
  renderAi();

  main.append(h("div", { class: "page-head" }, h("div", null, h("h1", null, "Pengaturan"), h("p", null, "Atur tampilan agar nyaman dibaca."))),
    h("div", { class: "grid grid-2", style: { alignItems: "start" } },
      h("section", { class: "card" }, h("h2", null, "Tampilan"),
        h("div", { class: "switch" }, h("div", null, h("b", null, "Tema"), h("div", { class: "muted small" }, "Mode gelap lebih nyaman di malam hari.")), themeSel),
        h("div", { class: "switch" }, h("div", null, h("b", null, "Teks besar"), h("div", { class: "muted small" }, "Perbesar semua tulisan.")),
          toggle(s.bigText, (v) => settings.set({ bigText: v }), "Teks besar")),
        h("div", { class: "switch" }, h("div", null, h("b", null, "Kurangi animasi"), h("div", { class: "muted small" }, "Matikan gerakan yang tidak perlu.")),
          toggle(s.reduceMotion, (v) => settings.set({ reduceMotion: v }), "Kurangi animasi"))),
      h("div", { class: "stack" },
        h("section", { class: "card" }, h("h2", null, "Akun"),
          h("p", null, h("b", null, user.nickname), h("br"), h("span", { class: "muted" }, `@${user.username} · ${user.role === "teacher" ? "Guru" : "Siswa"}`)),
          classBox,
          h("button", { class: "btn secondary", type: "button", style: { marginTop: "12px" }, onclick: () => { session.clear(); location.hash = "#/masuk"; } }, icon("logout"), "Keluar")),
        h("section", { class: "card" }, h("h2", null, "Unduh aplikasi"),
          h("p", { class: "muted small" }, "RelaFun bisa diunduh tanpa Play Store/App Store dan dibuka seperti aplikasi biasa."), installSlot,
          h("p", { class: "muted small", style: { marginTop: "12px", marginBottom: 0 } }, "RelaFun versi 2.0")),
        h("section", { class: "card", id: "fitur-ai" }, h("h2", null, "Fitur AI (opsional)"), aiBox))));
}
