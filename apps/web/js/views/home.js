// Beranda siswa — mengikuti gambaran mockup: hero bermaskot, Lanjutkan Materi,
// Bangun Keahlian, Topik Pilihan, Sasaran Harian, dan Papan Peringkat.

import { h, fmt } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { mascot } from "../mascot.js";

export const GROUP_LABEL = { prasyarat: "Prasyarat", inti: "Relasi & Fungsi", literasi: "Literasi" };

export function moduleIcon(m) {
  return h("div", { class: `module-icon ${m.group}` }, icon(m.icon || "book"));
}

function goalRing(done, goal) {
  const pct = Math.min(1, done / goal);
  const r = 56;
  const c = 2 * Math.PI * r;
  const wrap = h("div", { class: "goal-ring", role: "img", "aria-label": `Sasaran harian: ${done} dari ${goal} soal benar` });
  wrap.innerHTML = `<svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="12"/>
    ${pct > 0 ? `<circle cx="66" cy="66" r="${r}" fill="none" stroke="${pct >= 1 ? "var(--good)" : "var(--accent)"}" stroke-width="12" stroke-linecap="round"
    stroke-dasharray="${c * pct} ${c}"/>` : ""}</svg>`;
  wrap.append(h("div", { class: "goal-num" }, `${Math.min(done, goal)}/${goal}`, h("small", null, "soal benar")));
  return wrap;
}

export async function homeView(main, _p, ctx) {
  const [s, lb] = await Promise.all([api.get("/api/me/summary"), api.get("/api/leaderboard").catch(() => ({ enabled: false }))]);
  const hour = new Date().getHours();
  const greet = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";
  const c = s.continue;

  const hero = h("section", { class: "hero" },
    h("div", null,
      h("h1", null, `${greet}, ${s.nickname}!`),
      h("p", null, s.daily.correct >= s.daily.goal
        ? "Sasaran hari ini sudah tercapai. Hebat! Mau mengulang materi yang masih sulit?"
        : "Belajar sedikit-sedikit tapi rutin itu lebih mudah. Yuk, lanjutkan langkahmu hari ini."),
      c ? h("a", { class: "btn", href: `#/materi/${c.id}` }, icon("play"), "Lanjut belajar") : null),
    mascot(s.daily.correct >= s.daily.goal ? "cheer" : "happy"));

  const cont = c ? h("div", { class: "card continue-card" },
    moduleIcon(c),
    h("div", { style: { minWidth: 0 } },
      h("div", { class: "row", style: { gap: "6px" } }, h("span", { class: "chip" }, GROUP_LABEL[c.group]), h("span", { class: "muted small" }, `± ${c.minutes} menit`)),
      h("h3", { style: { margin: "4px 0 8px" } }, c.title),
      h("div", { class: "progress", role: "progressbar", "aria-valuenow": c.stats.mastery, "aria-valuemin": 0, "aria-valuemax": 100 }, h("span", { style: { width: `${c.stats.mastery}%` } })),
      h("div", { class: "muted small", style: { marginTop: "4px" } }, `${c.stats.solved} dari ${c.stats.total} soal latihan benar`)),
    h("a", { class: "btn", href: c.stats.lesson_done ? `#/materi/${c.id}/latihan` : `#/materi/${c.id}` }, c.stats.lesson_done ? "Latihan" : "Lanjutkan"),
  ) : null;

  const core = s.modules.filter((m) => m.group === "inti");
  const skills = h("div", { class: "skill-grid" }, core.map((m) =>
    h("a", { class: "card skill-card", href: `#/materi/${m.id}` },
      h("div", { class: "row" }, moduleIcon(m), h("span", { class: "chip primary" }, `${m.stats.mastery}%`)),
      h("b", null, m.title),
      h("div", { class: "progress" }, h("span", { style: { width: `${m.stats.mastery}%` } })))));

  const topics = h("div", { class: "topic-grid" },
    s.modules.filter((m) => m.group === "literasi").map((m) =>
      h("a", { class: "card topic-card", href: `#/materi/${m.id}` }, moduleIcon(m),
        h("div", null, h("b", null, m.title), h("div", { class: "muted small" }, m.subtitle)))),
    h("a", { class: "card topic-card", href: "#/pemodel" }, h("div", { class: "module-icon literasi" }, icon("model")),
      h("div", null, h("b", null, "Pemodel Soal Cerita"), h("div", { class: "muted small" }, "Ubah cerita jadi rumus fungsi"))),
    h("a", { class: "card topic-card", href: "#/kalkulator" }, h("div", { class: "module-icon" }, icon("calc")),
      h("div", null, h("b", null, "Kalkulator f(x)"), h("div", { class: "muted small" }, "Cek hitungan langkah demi langkah"))));

  const side = h("aside", { class: "stack" },
    h("div", { class: "card" },
      h("div", { class: "card-title" }, h("h3", null, "Sasaran harian")),
      goalRing(s.daily.correct, s.daily.goal),
      h("div", { class: "stat-row" },
        h("div", { class: "stat" }, h("b", null, icon("fire"), " ", s.streak), h("span", null, "hari berturut-turut")),
        h("div", { class: "stat" }, h("b", null, fmt(s.points)), h("span", null, "poin")))),
    lb.enabled ? h("div", { class: "card" },
      h("div", { class: "card-title" }, h("h3", null, "Peringkat kelas"), h("a", { href: "#/peringkat", class: "small" }, "Lihat semua")),
      h("ol", { class: "lb-list" }, lb.rows.slice(0, 5).map((r) => h("li", { class: r.me ? "me" : "" },
        h("span", { class: "lb-rank" }, r.rank), h("span", { class: "avatar", style: { width: "32px", height: "32px", fontSize: ".85rem" } }, r.nickname.slice(0, 1)),
        h("span", null, r.nickname, r.me ? " (kamu)" : ""), h("span", { class: "lb-pts" }, fmt(r.points))))))
      : h("div", { class: "card muted small" }, lb.reason || "Papan peringkat tidak aktif."),
    !ctx.user.class ? h("div", { class: "alert info" }, icon("info"), h("div", null, "Kamu belum bergabung ke kelas. Masukkan kode kelas di ", h("a", { href: "#/pengaturan" }, "Pengaturan"), ".")) : null,
  );

  main.append(h("div", { class: "home-grid" },
    h("div", null, hero,
      h("div", { class: "section-title" }, h("h2", null, "Lanjutkan materi")), cont,
      h("div", { class: "section-title" }, h("h2", null, "Bangun keahlian"), h("a", { href: "#/materi" }, "Semua materi")), skills,
      h("div", { class: "section-title" }, h("h2", null, "Literasi & alat bantu")), topics),
    side));
}
