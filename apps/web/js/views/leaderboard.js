import { h, fmt } from "../dom.js";
import { api } from "../api.js";
import { icon } from "../icons.js";

export async function leaderboardView(main) {
  const lb = await api.get("/api/leaderboard");
  main.append(h("div", { class: "page-head" }, h("div", null, h("h1", null, "Peringkat Kelas"),
    h("p", null, lb.enabled ? `Kelas ${lb.class_name} · hanya nama panggilan yang ditampilkan` : "Papan peringkat"))));
  if (!lb.enabled) {
    main.append(h("div", { class: "alert info" }, icon("info"), h("div", null, lb.reason)));
    return;
  }
  main.append(h("div", { class: "card", style: { maxWidth: "640px" } },
    h("ol", { class: "lb-list" }, lb.rows.map((r) => h("li", { class: r.me ? "me" : "" },
      h("span", { class: "lb-rank" }, r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank),
      h("span", { class: "avatar", style: { width: "32px", height: "32px", fontSize: ".85rem" } }, r.nickname.slice(0, 1)),
      h("span", null, r.nickname, r.me ? " (kamu)" : ""),
      h("span", { class: "lb-pts" }, `${fmt(r.points)} poin`)))),
    h("p", { class: "muted small", style: { marginTop: "12px", marginBottom: 0 } },
      "Poin diberikan sekali untuk setiap soal yang dijawab benar. Yang terpenting adalah kemajuanmu sendiri.")));
}
