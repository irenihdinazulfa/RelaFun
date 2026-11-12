// Diagram Kartesius / grafik fungsi linear dengan lapisan sorot (crosshair + nilai).

import { h, svgEl, fmt } from "../dom.js";

const W = 540;
const H = 360;
const M = { l: 64, r: 20, t: 18, b: 44 };

function niceStep(range, target = 6) {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

export function functionGraph(cfg) {
  const points = cfg.points || [];
  const lines = cfg.lines || [];
  const xs = points.map((p) => p[0]);
  let x0 = cfg.x_min ?? Math.min(0, ...xs);
  let x1 = cfg.x_max ?? Math.max(4, ...xs.map((x) => x + 1));
  const ys = [0, ...points.map((p) => p[1])];
  for (const l of lines) ys.push(l.a * x0 + l.b, l.a * x1 + l.b);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  if (y1 - y0 < 1e-9) { y1 += 1; y0 -= 1; }
  const xStep = niceStep(x1 - x0, 8);
  const yStep = niceStep(y1 - y0, 6);
  x0 = Math.floor(x0 / xStep) * xStep;
  x1 = Math.ceil(x1 / xStep) * xStep;
  y0 = Math.floor(y0 / yStep) * yStep;
  y1 = Math.ceil(y1 / yStep) * yStep;
  if (y1 === Math.max(...ys)) y1 += yStep * 0.5;

  const sx = (x) => M.l + ((x - x0) / (x1 - x0)) * (W - M.l - M.r);
  const sy = (y) => H - M.b - ((y - y0) / (y1 - y0)) * (H - M.t - M.b);

  const label = cfg.title || (lines.length ? lines.map((l) => l.label || `${l.a}x + ${l.b}`).join(" dan ") : "Diagram Kartesius");
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `Grafik: ${label}` });
  const clipId = `clip${Math.random().toString(36).slice(2, 8)}`;
  const defs = svgEl("defs");
  const cp = svgEl("clipPath", { id: clipId });
  cp.append(svgEl("rect", { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b }));
  defs.append(cp);
  svg.append(defs);

  for (let x = x0; x <= x1 + 1e-9; x += xStep) {
    svg.append(svgEl("line", { class: "grid-line", x1: sx(x), x2: sx(x), y1: M.t, y2: H - M.b }));
    const t = svgEl("text", { class: "tick", x: sx(x), y: H - M.b + 18, "text-anchor": "middle" });
    t.textContent = fmt(+x.toFixed(6));
    svg.append(t);
  }
  for (let y = y0; y <= y1 + 1e-9; y += yStep) {
    svg.append(svgEl("line", { class: "grid-line", x1: M.l, x2: W - M.r, y1: sy(y), y2: sy(y) }));
    const t = svgEl("text", { class: "tick", x: M.l - 8, y: sy(y) + 4, "text-anchor": "end" });
    t.textContent = fmt(+y.toFixed(6));
    svg.append(t);
  }
  // Sumbu (pada 0 bila terlihat)
  const ax = Math.min(Math.max(0, y0), y1);
  const ay = Math.min(Math.max(0, x0), x1);
  svg.append(svgEl("line", { class: "axis", x1: M.l, x2: W - M.r, y1: sy(ax), y2: sy(ax) }));
  svg.append(svgEl("line", { class: "axis", x1: sx(ay), x2: sx(ay), y1: M.t, y2: H - M.b }));
  const xl = svgEl("text", { class: "axis-label", x: W - M.r, y: H - 6, "text-anchor": "end" });
  xl.textContent = cfg.x_label || "x";
  const yl = svgEl("text", { class: "axis-label", x: 8, y: 12 });
  yl.textContent = cfg.y_label || "f(x)";
  svg.append(xl, yl);

  const plot = svgEl("g", { "clip-path": `url(#${clipId})` });
  lines.forEach((l, i) => {
    plot.append(svgEl("line", { class: `line-${(i % 2) + 1}`, x1: sx(x0), y1: sy(l.a * x0 + l.b), x2: sx(x1), y2: sy(l.a * x1 + l.b) }));
  });
  svg.append(plot);

  points.forEach(([px, py]) => {
    svg.append(svgEl("circle", { class: "pt", cx: sx(px), cy: sy(py), r: 5.5 }));
    if (points.length <= 6) {
      const t = svgEl("text", { class: "pt-label", x: sx(px) + 9, y: sy(py) - 9 });
      t.textContent = `(${fmt(px)}, ${fmt(py)})`;
      svg.append(t);
    }
  });

  // Lapisan sorot: garis bantu vertikal + nilai setiap fungsi
  const guide = svgEl("line", { class: "axis", x1: 0, x2: 0, y1: M.t, y2: H - M.b, "stroke-dasharray": "4 4", visibility: "hidden" });
  const tipBg = svgEl("rect", { rx: 6, fill: "var(--text)", visibility: "hidden" });
  const tip = svgEl("text", { fill: "var(--bg)", "font-size": 12, "font-weight": 700, visibility: "hidden" });
  svg.append(guide, tipBg, tip);
  if (lines.length) {
    const hit = svgEl("rect", { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b, fill: "transparent" });
    const show = (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      let x = x0 + ((px - M.l) / (W - M.l - M.r)) * (x1 - x0);
      const snap = xStep >= 1 ? 1 : xStep;
      x = Math.round(x / snap) * snap;
      x = Math.min(Math.max(x, x0), x1);
      guide.setAttribute("x1", sx(x));
      guide.setAttribute("x2", sx(x));
      tip.textContent = `x = ${fmt(x)}: ` + lines.map((l, i) => `${l.name || (lines.length > 1 ? "ABCD"[i] : "f")}(x) = ${fmt(l.a * x + l.b)}`).join("  ·  ");
      for (const el of [guide, tip, tipBg]) el.setAttribute("visibility", "visible");
      const tw = tip.getComputedTextLength() + 16;
      const tx = Math.min(Math.max(sx(x) - tw / 2, 4), W - tw - 4);
      tip.setAttribute("x", tx + 8);
      tip.setAttribute("y", M.t + 18);
      tipBg.setAttribute("x", tx);
      tipBg.setAttribute("y", M.t + 3);
      tipBg.setAttribute("width", tw);
      tipBg.setAttribute("height", 22);
    };
    const hide = () => { for (const el of [guide, tip, tipBg]) el.setAttribute("visibility", "hidden"); };
    hit.addEventListener("pointermove", show);
    hit.addEventListener("pointerdown", show);
    hit.addEventListener("pointerleave", hide);
    svg.append(hit);
  }

  const legend = lines.some((l) => l.label)
    ? h("div", { class: "legend" }, lines.map((l, i) => h("span", null, h("i", { style: { background: `var(--series-${(i % 2) + 1})` } }), l.label || "")))
    : null;
  return h("div", { class: "graph" }, svg, legend);
}
