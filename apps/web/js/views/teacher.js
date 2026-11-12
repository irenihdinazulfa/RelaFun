// Dashboard guru: kode kelas, pengaturan, kemajuan siswa, kesalahan umum, soal tersulit.

import { h, clear, fmt, toast } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";

const SEQ = ["--seq-1", "--seq-2", "--seq-3", "--seq-4", "--seq-5", "--seq-6"];

function heatCell(v, title) {
  if (v === null || v === undefined) return h("span", { class: "heat", title, style: { background: "var(--surface-2)" } }, "–");
  const step = Math.min(SEQ.length - 1, Math.floor((v / 100) * SEQ.length));
  return h("span", { class: "heat", title: `${title}: ${v}%`, style: { background: `var(${SEQ[step]})`, color: step >= 3 ? "#fff" : "var(--text)" } }, v);
}

function hbars(rows, { suffix = "", max = null, empty = "Belum ada data." } = {}) {
  if (!rows.length) return h("p", { class: "muted" }, empty);
  const top = max ?? Math.max(...rows.map((r) => r.value), 1);
  return h("div", { class: "hbar-list", role: "list" }, rows.map((r) =>
    h("div", { class: "hbar", role: "listitem", title: `${r.label}: ${r.value}${suffix}` },
      h("span", null, r.label),
      h("div", { class: "track" }, h("div", { class: "fill", style: { width: `${(r.value / top) * 100}%` } })),
      h("span", { class: "val" }, `${fmt(r.value)}${suffix}`))));
}

function toggle(checked, onChange, label, disabled = false) {
  const input = h("input", { type: "checkbox", role: "switch", "aria-label": label, disabled });
  input.checked = checked;
  input.onchange = () => onChange(input.checked, input);
  return h("label", { class: "toggle" }, input, h("span"));
}

export async function teacherView(main, _p, ctx) {
  if (ctx.user.role !== "teacher") {
    main.append(h("div", { class: "alert info" }, icon("info"), h("div", null, "Halaman ini khusus guru.")));
    return;
  }
  const [classes, health] = await Promise.all([api.get("/api/teacher/classes"), api.get("/api/health")]);
  let current = classes[0];
  const body = h("div");
  const picker = h("select", { class: "input", style: { maxWidth: "240px" }, "aria-label": "Pilih kelas" },
    classes.map((c) => h("option", { value: c.id }, c.name)));
  picker.onchange = () => { current = classes.find((c) => String(c.id) === picker.value); load(); };
  const newName = h("input", { class: "input", placeholder: "Nama kelas baru", style: { maxWidth: "200px" } });

  main.append(h("div", { class: "page-head" },
    h("div", null, h("h1", null, "Dashboard Guru"), h("p", null, "Pantau kemajuan dan kesalahan yang sering muncul di kelas.")),
    h("div", { class: "row" }, classes.length > 1 ? picker : null,
      newName, h("button", { class: "btn secondary", type: "button", onclick: async () => {
        if (!newName.value.trim()) return;
        await api.post("/api/teacher/classes", { name: newName.value.trim() });
        toast("Kelas baru dibuat");
        location.reload();
      } }, "+ Kelas"))), body);

  async function load() {
    clear(body).append(h("div", { class: "card muted" }, "Memuat data kelas…"));
    if (!current) { clear(body).append(h("p", null, "Belum ada kelas.")); return; }
    const ov = await api.get(`/api/teacher/classes/${current.id}/overview`);
    clear(body);
    const c = ov.class;
    const students = ov.students;
    const active = students.filter((s) => s.attempts > 0);
    const avgAcc = active.length ? Math.round(active.reduce((t, s) => t + (s.accuracy || 0), 0) / active.length) : null;

    body.append(h("div", { class: "grid grid-3" },
      h("section", { class: "card" }, h("div", { class: "muted small" }, "Kode kelas (bagikan ke siswa)"), h("div", { class: "class-code" }, c.code),
        h("div", { class: "muted small" }, c.name)),
      h("section", { class: "card" }, h("div", { class: "stat-row" },
        h("div", { class: "stat" }, h("b", null, students.length), h("span", null, "siswa")),
        h("div", { class: "stat" }, h("b", null, active.length), h("span", null, "sudah berlatih")),
        h("div", { class: "stat" }, h("b", null, avgAcc === null ? "–" : `${avgAcc}%`), h("span", null, "rata-rata akurasi")),
        h("div", { class: "stat" }, h("b", null, fmt(students.reduce((t, s) => t + s.solved, 0))), h("span", null, "soal benar")))),
      h("section", { class: "card" }, h("h3", null, "Pengaturan kelas"),
        h("div", { class: "switch" }, h("span", null, "Papan peringkat"),
          toggle(c.leaderboard_enabled, async (v) => { await api.patch(`/api/teacher/classes/${c.id}`, { leaderboard_enabled: v }); toast(v ? "Papan peringkat aktif" : "Papan peringkat dimatikan"); }, "Papan peringkat")),
        h("div", { class: "switch" }, h("div", null, h("span", null, "Pemodel AI"), !health.ai_configured ? h("div", { class: "muted small" }, "Isi ANTHROPIC_API_KEY di server dulu") : null),
          toggle(c.ai_enabled, async (v) => { await api.patch(`/api/teacher/classes/${c.id}`, { ai_enabled: v }); toast(v ? "Pemodel AI aktif untuk kelas" : "Pemodel AI dimatikan"); }, "Pemodel AI", !health.ai_configured)))));

    body.append(h("div", { class: "grid grid-2", style: { marginTop: "16px", alignItems: "start" } },
      h("section", { class: "card" }, h("div", { class: "card-title" }, h("h3", null, "Kesalahan yang sering muncul")),
        hbars(ov.errors.map((e) => ({ label: e.label, value: e.count })), { suffix: "×", empty: "Belum ada jawaban salah yang tercatat." }),
        h("p", { class: "muted small", style: { marginTop: "10px", marginBottom: 0 } }, "Gunakan ini untuk menentukan bagian yang perlu dijelaskan ulang di kelas.")),
      h("section", { class: "card" }, h("div", { class: "card-title" }, h("h3", null, "Rata-rata akurasi per materi")),
        hbars(ov.modules.filter((m) => m.avg_accuracy !== null).map((m) => ({ label: m.title, value: m.avg_accuracy })), { suffix: "%", max: 100, empty: "Belum ada latihan yang dikerjakan." }))));

    body.append(h("section", { class: "card", style: { marginTop: "16px" } },
      h("div", { class: "card-title" }, h("h3", null, "Kemajuan siswa"),
        h("button", { class: "btn small secondary", type: "button", onclick: () => api.download(`/api/teacher/classes/${c.id}/export.csv`, `relafun_${c.code}.csv`).catch((e) => toast(e.message)) }, icon("download"), "Unduh CSV")),
      h("div", { class: "heat-legend", style: { marginBottom: "8px" } }, "Penguasaan per materi (%):", SEQ.map((v, i) => h("span", { class: "heat", style: { background: `var(${v})`, color: i >= 3 ? "#fff" : "var(--text)" } }, `${Math.round((i / SEQ.length) * 100)}+`))),
      students.length ? h("div", { class: "table-wrap" }, h("table", { class: "table" },
        h("thead", null, h("tr", null, h("th", null, "Siswa"), h("th", { class: "num" }, "Poin"), h("th", { class: "num" }, "Soal benar"),
          h("th", { class: "num" }, "Akurasi"), h("th", null, "Terakhir aktif"), h("th", null, "Penguasaan materi (urut 1–13)"))),
        h("tbody", null, students.map((s) => h("tr", null,
          h("td", null, h("b", null, s.nickname), h("div", { class: "muted small" }, `@${s.username}`)),
          h("td", { class: "num" }, fmt(s.points)), h("td", { class: "num" }, s.solved),
          h("td", { class: "num" }, s.accuracy === null ? "–" : `${s.accuracy}%`),
          h("td", null, s.last_active || "–"),
          h("td", { style: { minWidth: "380px" } }, ov.modules.map((m) => heatCell(s.modules[m.id] || 0, m.title))))))))
        : h("p", { class: "muted" }, `Belum ada siswa. Bagikan kode kelas ${c.code} agar siswa bisa bergabung.`)));

    body.append(h("section", { class: "card", style: { marginTop: "16px" } }, h("h3", null, "Soal dengan akurasi percobaan pertama terendah"),
      ov.hardest_items.length ? h("div", { class: "table-wrap" }, h("table", { class: "table" },
        h("thead", null, h("tr", null, h("th", null, "Materi"), h("th", null, "Soal"), h("th", { class: "num" }, "Siswa"), h("th", { class: "num" }, "Benar pertama"))),
        h("tbody", null, ov.hardest_items.map((it) => h("tr", null, h("td", null, it.module), h("td", null, it.prompt),
          h("td", { class: "num" }, it.students), h("td", { class: "num" }, `${it.first_try_accuracy}%`))))))
        : h("p", { class: "muted" }, "Belum ada data.")));
  }
  await load();
}
