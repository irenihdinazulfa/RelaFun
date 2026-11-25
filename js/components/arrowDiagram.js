// Diagram panah interaktif — menjawab EL02/K03 (panah banyak & bersilangan bikin pusing)
// dan DS01 (siswa ingin menghubungkan dua himpunan sendiri).
//
// mode:
//   "static"  : tampil; ketuk anggota kiri untuk menyorot panahnya saja
//   "animate" : panah muncul satu per satu (Berikutnya / Ulang / Tampilkan semua)
//   "check"   : cek satu per satu "tepat satu pasangan?" (GL02)
//   "sets"    : tombol sorot Domain / Kodomain / Range (IL01)
//   "edit"    : siswa membuat panah sendiri (ketuk kiri, lalu ketuk kanan)

import { h, svgEl, clear } from "../dom.js";
import { icon } from "../icons.js";

const W = 560;
const GAP = 52;
const TOP = 58;
const LX = 150;
const RX = 410;

function textWidth(t) {
  return Math.min(170, Math.max(46, String(t).length * 9.2 + 24));
}

function crossings(pairs, dom, cod) {
  let n = 0;
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const a = dom.indexOf(pairs[i][0]) - dom.indexOf(pairs[j][0]);
      const b = cod.indexOf(pairs[i][1]) - cod.indexOf(pairs[j][1]);
      if (a * b < 0) n++;
    }
  }
  return n;
}

export function arrowDiagram(diagram, opts = {}) {
  const mode = opts.mode || "static";
  const domain = diagram.domain.map(String);
  let codomain = diagram.codomain.map(String);
  let pairs = (diagram.pairs || []).map(([a, b]) => [String(a), String(b)]);
  let highlight = new Set(opts.highlight || []);
  let wrong = new Set(opts.wrongPairs || []);
  let shown = mode === "animate" ? 0 : pairs.length;
  let checkIdx = -1;
  let setsView = null;
  let selected = null;   // edit: anggota kiri yang dipilih
  let focus = null;      // static: anggota kiri yang disorot
  let tidied = false;

  const root = h("div", { class: "diagram" });
  const svgWrap = h("div", { class: "dg-wrap" });
  const caption = h("div", { class: "caption", "aria-live": "polite" });
  const controls = h("div", { class: "controls" });
  root.append(svgWrap, caption, controls);

  const n = Math.max(domain.length, codomain.length, 1);
  const H = TOP + n * GAP + 22;
  const yOf = (i, len) => TOP + GAP / 2 + (i + (n - len) / 2) * GAP;
  const wL = Math.max(...domain.map(textWidth), 46);
  const wR = Math.max(...codomain.map(textWidth), 46);

  function outCount(a) {
    return pairs.filter((p) => p[0] === a).length;
  }

  function render() {
    const minX = Math.max(0, LX - wL / 2 - 34);
    const maxX = Math.min(W, RX + wR / 2 + 34);
    const svg = svgEl("svg", { viewBox: `${minX} 0 ${maxX - minX} ${H}`, role: "img", "aria-label": describe() });
    svg.style.maxWidth = `${Math.round((maxX - minX) * 1.15)}px`;
    // Oval himpunan
    for (const [x, arr, w, label] of [[LX, domain, wL, diagram.left_label || "A"], [RX, codomain, wR, diagram.right_label || "B"]]) {
      svg.append(svgEl("ellipse", { class: "oval", cx: x, cy: TOP + (n * GAP) / 2, rx: w / 2 + 26, ry: (arr.length * GAP) / 2 + 20 }));
      const t = svgEl("text", { class: "set-label", x, y: 26 });
      t.textContent = label;
      svg.append(t);
    }

    // Panah
    const visible = pairs.slice(0, shown);
    visible.forEach(([a, b], idx) => {
      const y1 = yOf(domain.indexOf(a), domain.length);
      const y2 = yOf(codomain.indexOf(b), codomain.length);
      const x1 = LX + wL / 2;
      const x2 = RX - wR / 2 - 3;
      const mx = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 9} ${y2}`;
      const cls = ["arrow"];
      const hd = ["head"];
      const key = `${a}|${b}`;
      const focusEl = mode === "check" && checkIdx >= 0 && checkIdx < domain.length ? domain[checkIdx] : focus;
      if (mode === "animate" && idx === shown - 1 && shown < pairs.length + 1 && shown > 0) { cls.push("new"); hd.push("new"); }
      if (focusEl !== null && focusEl !== undefined) {
        if (a === focusEl) { cls.push("focus"); } else { cls.push("dim"); hd.push("dim"); }
      }
      if (wrong.has(key)) { cls.push("bad"); hd.push("bad"); }
      const g = svgEl("g");
      g.append(svgEl("path", { class: cls.join(" "), d }));
      g.append(svgEl("polygon", { class: hd.join(" "), points: `${x2},${y2} ${x2 - 11},${y2 - 6} ${x2 - 11},${y2 + 6}` }));
      if (mode === "edit") {
        const hit = svgEl("path", { class: "arrow-hit", d });
        hit.addEventListener("click", () => {
          pairs = pairs.filter((p) => !(p[0] === a && p[1] === b));
          shown = pairs.length;
          wrong.delete(key);
          changed();
        });
        const tt = svgEl("title");
        tt.textContent = `Hapus panah ${a} → ${b}`;
        hit.append(tt);
        g.append(hit);
      }
      svg.append(g);
    });

    // Anggota
    const addNode = (label, i, side) => {
      const len = side === "L" ? domain.length : codomain.length;
      const x = side === "L" ? LX : RX;
      const w = side === "L" ? wL : wR;
      const y = yOf(i, len);
      const cls = ["node"];
      if (side === "L") {
        if (selected === label) cls.push("sel");
        if (highlight.has(label)) cls.push("bad");
        if (mode === "check" && checkIdx >= 0) {
          const di = domain.indexOf(label);
          if (di === checkIdx) cls.push("hl");
          else if (di < checkIdx) cls.push(outCount(label) === 1 ? "ok" : "bad");
        }
        if (focus !== null && focus !== label) cls.push("dim");
      }
      if (setsView) {
        const inSet = setsView === "domain" ? side === "L"
          : setsView === "kodomain" ? side === "R"
            : side === "R" && pairs.some((p) => p[1] === label);
        cls.push(inSet ? "hl" : "dim");
      }
      const g = svgEl("g", { class: cls.join(" "), tabindex: mode === "edit" || mode === "static" ? 0 : -1, role: "button",
        "aria-label": `${side === "L" ? "Anggota kiri" : "Anggota kanan"} ${label}` });
      g.append(svgEl("rect", { x: x - w / 2, y: y - 17, width: w, height: 34, rx: 10 }));
      const t = svgEl("text", { x, y });
      t.textContent = label;
      g.append(t);
      const act = () => onNode(label, side);
      g.addEventListener("click", act);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
      svg.append(g);
    };
    domain.forEach((d, i) => addNode(d, i, "L"));
    codomain.forEach((c, i) => addNode(c, i, "R"));

    clear(svgWrap).append(svg);
    renderCaption();
    renderControls();
  }

  function describe() {
    return `Diagram panah dari ${diagram.left_label || "A"} ke ${diagram.right_label || "B"}: ` +
      (pairs.slice(0, shown).map(([a, b]) => `${a} ke ${b}`).join(", ") || "belum ada panah");
  }

  function onNode(label, side) {
    if (mode === "edit") {
      if (side === "L") {
        selected = selected === label ? null : label;
      } else if (selected !== null) {
        const exists = pairs.some((p) => p[0] === selected && p[1] === label);
        pairs = exists ? pairs.filter((p) => !(p[0] === selected && p[1] === label)) : [...pairs, [selected, label]];
        shown = pairs.length;
        selected = null;
        changed();
        return;
      }
      render();
    } else if (mode === "static" && side === "L") {
      focus = focus === label ? null : label;
      render();
    }
  }

  function changed() {
    render();
    opts.onChange?.(pairs.map((p) => p.slice()));
  }

  function renderCaption() {
    let text = "";
    if (mode === "animate") {
      if (shown === 0) text = "Tekan “Berikutnya” untuk memunculkan panah pertama.";
      else {
        const [a, b] = pairs[shown - 1];
        text = `${a} → ${b}` + (shown === pairs.length ? "  (semua panah sudah muncul)" : "");
      }
    } else if (mode === "check") {
      if (checkIdx < 0) text = "Kita cek satu per satu: berapa panah yang keluar dari setiap anggota kiri?";
      else if (checkIdx < domain.length) {
        const el = domain[checkIdx];
        const c = outCount(el);
        text = `${el}: ${c} panah ${c === 1 ? "✓ tepat satu" : c === 0 ? "✗ tidak punya pasangan" : "✗ lebih dari satu"}`;
      } else {
        const ok = domain.every((d) => outCount(d) === 1);
        text = ok ? "Semua anggota kiri punya tepat satu panah → FUNGSI ✓" : "Ada anggota yang tidak tepat satu panah → BUKAN fungsi ✗";
      }
    } else if (mode === "sets" && setsView) {
      const list = setsView === "domain" ? domain : setsView === "kodomain" ? codomain
        : codomain.filter((c) => pairs.some((p) => p[1] === c));
      const name = { domain: "Domain (daerah asal)", kodomain: "Kodomain (daerah kawan)", range: "Range (daerah hasil)" }[setsView];
      text = `${name} = {${list.join(", ")}}`;
    } else if (mode === "sets") {
      text = "Pilih tombol di bawah untuk menyorot himpunannya.";
    } else if (mode === "edit") {
      text = selected !== null ? `Sekarang ketuk pasangan untuk ${selected} di sebelah kanan.`
        : "Ketuk anggota kiri, lalu ketuk pasangannya di kanan. Ketuk panah untuk menghapusnya.";
    } else if (mode === "static" && focus !== null) {
      const outs = pairs.filter((p) => p[0] === focus).map((p) => p[1]);
      text = outs.length ? `${focus} → ${outs.join(", ")}` : `${focus} tidak punya pasangan`;
    } else if (mode === "static" && pairs.length > 2) {
      text = "Ketuk anggota kiri untuk menyorot panahnya saja.";
    }
    caption.textContent = text;
  }

  function btn(label, ic, onClick, variant = "secondary") {
    return h("button", { class: `btn small ${variant}`, type: "button", onclick: onClick }, ic ? icon(ic) : null, label);
  }

  function renderControls() {
    clear(controls);
    if (mode === "animate") {
      controls.append(
        btn("Ulang", "restart", () => { shown = 0; render(); }),
        btn("Berikutnya", "next", () => { shown = Math.min(shown + 1, pairs.length); render(); }, shown < pairs.length ? "" : "secondary"),
        shown < pairs.length ? btn("Tampilkan semua", "eye", () => { shown = pairs.length; render(); }) : null,
      );
    } else if (mode === "check") {
      const done = checkIdx >= domain.length;
      controls.append(
        btn(checkIdx < 0 ? "Cek satu per satu" : done ? "Selesai" : "Berikutnya", "next",
          () => { if (!done) { checkIdx += 1; render(); } }, done ? "secondary" : ""),
        checkIdx >= 0 ? btn("Ulang", "restart", () => { checkIdx = -1; render(); }) : null,
      );
    } else if (mode === "sets") {
      for (const [key, label] of [["domain", "Domain"], ["kodomain", "Kodomain"], ["range", "Range"]]) {
        controls.append(btn(label, null, () => { setsView = setsView === key ? null : key; render(); }, setsView === key ? "" : "secondary"));
      }
    } else if (mode === "edit" && pairs.length) {
      controls.append(btn("Hapus semua panah", "x", () => { pairs = []; shown = 0; selected = null; wrong.clear(); changed(); }));
    }
    if (mode !== "edit" && !tidied && crossings(pairs, domain, codomain) > 0) {
      controls.append(btn("Rapikan panah", "sparkle", tidy, "ghost"));
    }
  }

  // Urutkan ulang anggota kanan agar panah tidak saling bersilangan (EL02).
  function tidy() {
    const score = (c, i) => {
      const ins = pairs.filter((p) => p[1] === c).map((p) => domain.indexOf(p[0]));
      return ins.length ? ins.reduce((s, v) => s + v, 0) / ins.length : i * (domain.length / Math.max(codomain.length, 1));
    };
    codomain = codomain.map((c, i) => [c, score(c, i), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);
    tidied = true;
    render();
  }

  render();
  return {
    el: root,
    getPairs: () => pairs.map((p) => p.slice()),
    setHighlight(list) { highlight = new Set(list || []); render(); },
    setWrong(list) { wrong = new Set(list || []); render(); },
    lock() { selected = null; render(); },
  };
}
