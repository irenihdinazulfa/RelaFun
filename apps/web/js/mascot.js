// Wen — maskot orisinal RelaFun (versi 2.2).
// Kelinci putih chibi: kepala "mochi" besar, jambul kecil, telinga panjang (ujung kanan terlipat),
// hoodie pink pastel berlencana bintang, pita biru muda di telinga, kaki berbantalan pink.
// mascot(mood) → <svg>;  tapMascot(mood) → tombol: ketuk Wen untuk ekspresi acak.

const C = {
  fur: "#ffffff", line: "#e8bdd0", innerEar: "#ffc6da",
  hoodie: "#ffc4d8", hoodieLine: "#eb9fbd",
  ink: "#3a2530", blush: "#ffadc9", nose: "#ff8fb0", mouth: "#d9547e", tongue: "#ffa3bf",
  star: "#ffe07a", starLine: "#efb942", bow: "#a9d6ff", bowDark: "#74b4ec",
  heart: "#ff6f9f", tear: "#a8dbff", tearLine: "#6fb4ea", zzz: "#86b9e6",
  carrot: "#ffb067", carrotLine: "#ec8a36", leaf: "#8fd3a0",
};

// Ekspresi: [nama, kapan muncul]
export const MOOD_INFO = {
  happy: ["Senang", "Di beranda"],
  calm: ["Tenang", "Ekspresi dasar Wen"],
  cheer: ["Bersorak", "Saat jawabanmu benar"],
  wave: ["Menyapa", "Di halaman masuk"],
  wink: ["Kedip", "Saat combo di game"],
  love: ["Sayang", "Combo 3× atau latihan sempurna"],
  starry: ["Kagum", "Dapat 3 bintang"],
  laugh: ["Tertawa", "Saat kamu mengetuknya"],
  shy: ["Malu-malu", "Kalau diketuk terus 🙈"],
  think: ["Berpikir", "Saat AI membaca soal"],
  idea: ["Punya ide", "Di kotak Tips dari Wen"],
  confused: ["Bingung", "Saat istilah tidak ditemukan"],
  surprised: ["Kaget", "Saat waktu habis"],
  sad: ["Sedih", "Saat jawaban salah di game"],
  sleepy: ["Mengantuk", "Saat sudah malam"],
  determined: ["Semangat", "Setelah salah: ayo coba lagi!"],
  carrot: ["Makan wortel", "Di game Lompat Wen"],
  cool: ["Keren", "Saat memecahkan rekor"],
};
export const MOODS = Object.keys(MOOD_INFO);

// Telinga: sudut kiri/kanan (derajat) dan seberapa jauh ujungnya menekuk ke luar (bl/br)
const EARS = {
  up: { l: -10, r: 12, bl: 0, br: 15 },
  wide: { l: -20, r: 22, bl: 0, br: 15 },
  perk: { l: -4, r: 4, bl: 0, br: 0 },
  shy: { l: -30, r: 30, bl: 14, br: 14 },
  droop: { l: -112, r: 112, bl: 20, br: 20 },
  think: { l: -8, r: 16, bl: 0, br: 26 },
  confused: { l: -6, r: 20, bl: 0, br: 40 },
};

const SPEC = {
  happy: { eyes: "arc", mouth: "w" },
  calm: { eyes: "open", mouth: "w" },
  cheer: { eyes: "arc", mouth: "open", ears: "wide", arms: "up", fx: "sparkles", jump: 8 },
  wave: { eyes: "open", mouth: "open", ears: "wide", arms: "wave", fx: "wave" },
  wink: { eyes: "wink", mouth: "tongue", fx: "wink" },
  love: { eyes: "heart", mouth: "open", ears: "wide", arms: "up", fx: "hearts" },
  starry: { eyes: "star", mouth: "open", ears: "perk", arms: "up", fx: "sparkles", jump: 5 },
  laugh: { eyes: "laugh", mouth: "big", ears: "wide", fx: "laugh" },
  shy: { eyes: "arc", mouth: "small", ears: "shy", arms: "cheeks", fx: "shy", blush: "big" },
  think: { eyes: "look", mouth: "pout", ears: "think", arms: "chin", fx: "thought" },
  idea: { eyes: "open", mouth: "open", ears: "perk", arms: "point", fx: "bulb" },
  confused: { eyes: "dot", mouth: "wavy", ears: "confused", fx: "question" },
  surprised: { eyes: "big", mouth: "o", ears: "perk", fx: "exclaim", jump: 4 },
  sad: { eyes: "teary", mouth: "frown", ears: "droop", fx: "tear", brows: "sad", blush: "soft" },
  sleepy: { eyes: "sleep", mouth: "small", ears: "droop", fx: "zzz" },
  determined: { eyes: "open", mouth: "open", ears: "perk", arms: "fist", fx: "power", brows: "firm", band: true },
  carrot: { eyes: "arc", mouth: "w", arms: "carrot", fx: "crumbs", blush: "big" },
  cool: { eyes: "shades", mouth: "smirk", ears: "wide", fx: "glint" },
};

const r1 = (n) => Math.round(n * 10) / 10;
let uid = 0;

// ------------------------------------------------------------------ bentuk dasar
function starPath(cx, cy, R, r) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const k = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${r1(cx + k * Math.cos(a))} ${r1(cy + k * Math.sin(a))}`;
  }
  return `${d}Z`;
}
const sparkle = (x, y, s, fill) => {
  const k = r1(s * 0.2);
  return `<path d="M${x} ${y - s}Q${x + k} ${y - k} ${x + s} ${y}Q${x + k} ${y + k} ${x} ${y + s}Q${x - k} ${y + k} ${x - s} ${y}Q${x - k} ${y - k} ${x} ${y - s}Z" fill="${fill}"/>`;
};
const heart = (x, y, s, fill, stroke = "none") =>
  `<path d="M${x} ${r1(y + s * 0.9)}C${r1(x - s * 1.5)} ${r1(y - s * 0.1)} ${r1(x - s * 0.9)} ${r1(y - s * 1.3)} ${x} ${r1(y - s * 0.45)}C${r1(x + s * 0.9)} ${r1(y - s * 1.3)} ${r1(x + s * 1.5)} ${r1(y - s * 0.1)} ${x} ${r1(y + s * 0.9)}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>`;
const drop = (x, y, s = 1) =>
  `<path d="M${x} ${y}C${r1(x - 3 * s)} ${r1(y + 6 * s)} ${r1(x - 5 * s)} ${r1(y + 9 * s)} ${r1(x - 5 * s)} ${r1(y + 12 * s)}A${r1(5 * s)} ${r1(5 * s)} 0 0 0 ${r1(x + 5 * s)} ${r1(y + 12 * s)}C${r1(x + 5 * s)} ${r1(y + 9 * s)} ${r1(x + 3 * s)} ${r1(y + 6 * s)} ${x} ${y}Z" fill="${C.tear}" stroke="${C.tearLine}" stroke-width="1.5"/>
   <ellipse cx="${r1(x - 1.8 * s)}" cy="${r1(y + 11 * s)}" rx="${r1(1.2 * s)}" ry="${r1(2 * s)}" fill="#fff"/>`;
const label = (x, y, size, fill, text) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="900" font-family="system-ui, sans-serif" fill="${fill}" stroke="#fff" stroke-width="3" paint-order="stroke">${text}</text>`;
const line = (d, w = 4.4) => `<path d="${d}" stroke="${C.ink}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

// Pita yang lebarnya berubah di sepanjang kurva kuadrat P (untuk telinga berbentuk daun)
function ribbon(P, t0, t1, wFn, n = 26) {
  const a = [];
  const b = [];
  for (let i = 0; i <= n; i++) {
    const s = 1 - (1 - i / n) ** 1.7; // titik lebih rapat di ujung agar ujung telinga membulat
    const t = t0 + (t1 - t0) * s;
    const u = 1 - t;
    const x = u * u * P[0][0] + 2 * u * t * P[1][0] + t * t * P[2][0];
    const y = u * u * P[0][1] + 2 * u * t * P[1][1] + t * t * P[2][1];
    const dx = 2 * u * (P[1][0] - P[0][0]) + 2 * t * (P[2][0] - P[1][0]);
    const dy = 2 * u * (P[1][1] - P[0][1]) + 2 * t * (P[2][1] - P[1][1]);
    const l = Math.hypot(dx, dy) || 1;
    const w = wFn(s);
    a.push(`${r1(x - (dy / l) * w)} ${r1(y + (dx / l) * w)}`);
    b.push(`${r1(x + (dy / l) * w)} ${r1(y - (dx / l) * w)}`);
  }
  return `M${a.join("L")}L${b.reverse().join("L")}Z`;
}
const leaf = (base, max) => (s) => (s < 0.42
  ? base + (max - base) * Math.sin((s / 0.42) * (Math.PI / 2))
  : max * Math.sqrt(Math.max(0, 1 - ((s - 0.42) / 0.58) ** 2)));

function ear(side, rot, bend) {
  const x = side === "l" ? 78 : 122;
  const b = side === "l" ? -bend : bend;
  const P = [[0, 8], [0, -36], [b, -68 + bend * 0.5]];
  return `<g transform="translate(${x} 68) rotate(${rot})"><g class="wen-ear wen-ear-${side}">
    <path d="${ribbon(P, 0, 1, leaf(11, 16))}" fill="${C.fur}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${ribbon(P, 0.1, 0.88, leaf(3.5, 8))}" fill="${C.innerEar}"/></g></g>`;
}

function bow(rot) {
  return `<g transform="translate(122 68) rotate(${rot}) translate(0 -16) rotate(${-rot + 16})">
    <path d="M0 0C-5 -10 -16 -9 -15 0C-16 9 -5 10 0 0Z" fill="${C.bow}" stroke="${C.bowDark}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M0 0C5 -10 16 -9 15 0C16 9 5 10 0 0Z" fill="${C.bow}" stroke="${C.bowDark}" stroke-width="1.8" stroke-linejoin="round"/>
    <circle r="3.8" fill="${C.bowDark}"/></g>`;
}

const paw = (x, y, pads = false) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${C.fur}" stroke="${C.line}" stroke-width="2.5"/>`
  + (pads ? `<ellipse cx="${x}" cy="${r1(y + 1.6)}" rx="3.3" ry="2.6" fill="${C.innerEar}"/>`
    + `<circle cx="${r1(x - 3.4)}" cy="${r1(y - 3)}" r="1.3" fill="${C.innerEar}"/><circle cx="${x}" cy="${r1(y - 4.3)}" r="1.3" fill="${C.innerEar}"/><circle cx="${r1(x + 3.4)}" cy="${r1(y - 3)}" r="1.3" fill="${C.innerEar}"/>` : "");
const sleeve = (d) => `<path d="${d}" stroke="${C.hoodieLine}" stroke-width="17" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${C.hoodie}" stroke-width="11.5" fill="none" stroke-linecap="round"/>`;
const foot = (x) => `<ellipse cx="${x}" cy="188" rx="13" ry="8" fill="${C.fur}" stroke="${C.line}" stroke-width="2.5"/>
  <ellipse cx="${x}" cy="189.6" rx="5" ry="3.3" fill="${C.innerEar}"/>
  <circle cx="${x - 5.4}" cy="185" r="1.7" fill="${C.innerEar}"/><circle cx="${x}" cy="183.5" r="1.7" fill="${C.innerEar}"/><circle cx="${x + 5.4}" cy="185" r="1.7" fill="${C.innerEar}"/>`;

function carrot() {
  return `<path d="M100 166q-10 6 -16 3M100 166q0 9 -3 14M100 166q9 5 15 1" stroke="${C.leaf}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M100 126Q91 142 91.5 159Q92 167 100 167Q108 167 108.5 159Q109 142 100 126Z" fill="${C.carrot}" stroke="${C.carrotLine}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M95 141h4.5M100.5 149h5M95 156h4.5" stroke="${C.carrotLine}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function arms(kind) {
  switch (kind) {
    case "up": return { back: sleeve("M75 158Q52 156 41 126") + sleeve("M125 158Q148 156 159 126"), front: paw(38, 121, true) + paw(162, 121, true) };
    case "wave": return { back: paw(79, 165) + sleeve("M125 158Q150 154 157 124"), front: paw(159, 118, true) };
    case "point": return {
      back: paw(79, 165) + sleeve("M125 158Q150 152 153 124"),
      front: `<ellipse cx="155" cy="105" rx="4.2" ry="7.5" fill="${C.fur}" stroke="${C.line}" stroke-width="2.5"/>` + paw(155, 117),
    };
    case "chin": return { back: paw(79, 165), front: sleeve("M124 163Q133 151 121 145") + paw(118, 141) };
    case "cheeks": return { back: "", front: sleeve("M76 160Q60 157 59 140") + sleeve("M124 160Q140 157 141 140") + paw(59, 134) + paw(141, 134) };
    case "fist": return {
      back: paw(79, 165) + sleeve("M125 158Q155 156 152 130"),
      front: paw(152, 123) + `<path d="M147 120.5q2.6 1.6 0 3.4M152.5 119.8q2.6 1.6 0 3.4" stroke="${C.line}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    };
    case "carrot": return { back: "", front: carrot() + paw(88, 150) + paw(112, 150) };
    default: return { back: paw(79, 165) + paw(121, 165), front: "" };
  }
}

// ------------------------------------------------------------------ wajah
const EYE_L = 76, EYE_R = 124, EYE_Y = 108;

function openEye(x, y, eyeGrad, { dx = 0, dy = 0, rx = 9.5, ry = 11.5, big = false } = {}) {
  return `<ellipse cx="${x + dx}" cy="${y + dy}" rx="${rx}" ry="${ry}" fill="url(#${eyeGrad})"/>
    <circle cx="${r1(x + dx - 3.2)}" cy="${r1(y + dy - 4.6)}" r="${big ? 4.5 : 3.9}" fill="#fff"/>
    <circle cx="${r1(x + dx + 3.3)}" cy="${r1(y + dy + 4.4)}" r="${big ? 2.2 : 1.8}" fill="#fff"/>`;
}
const arcEye = (x, y) => line(`M${x - 9} ${y + 3}Q${x} ${y - 9} ${x + 9} ${y + 3}`);

function eyes(kind, g) {
  const L = EYE_L, R = EYE_R, Y = EYE_Y;
  switch (kind) {
    case "open": return `<g class="wen-blink">${openEye(L, Y, g)}${openEye(R, Y, g)}</g>`;
    case "arc": return arcEye(L, Y) + arcEye(R, Y);
    case "wink": return `<g class="wen-blink-one">${openEye(L, Y, g)}</g>` + line(`M${R - 9} ${Y + 1}Q${R} ${Y - 7} ${R + 9} ${Y + 1}`) + line(`M${R + 8} ${Y - 2}l5 -4M${R + 9} ${Y + 3}l6 0`, 2.6);
    case "heart": return heart(L, Y + 1, 10.5, C.heart, "#e24f80") + heart(R, Y + 1, 10.5, C.heart, "#e24f80")
      + `<ellipse cx="${L - 5}" cy="${Y - 3}" rx="2" ry="2.8" fill="#fff" opacity=".9"/><ellipse cx="${R - 5}" cy="${Y - 3}" rx="2" ry="2.8" fill="#fff" opacity=".9"/>`;
    case "star": return `<path d="${starPath(L, Y + 1, 12.5, 5.6)}" fill="#ffd84d" stroke="#e6a52a" stroke-width="1.8" stroke-linejoin="round"/>`
      + `<path d="${starPath(R, Y + 1, 12.5, 5.6)}" fill="#ffd84d" stroke="#e6a52a" stroke-width="1.8" stroke-linejoin="round"/>`
      + `<circle cx="${L - 3}" cy="${Y - 2}" r="2" fill="#fff"/><circle cx="${R - 3}" cy="${Y - 2}" r="2" fill="#fff"/>`;
    case "laugh": return line(`M${L - 8} ${Y - 7}L${L + 6} ${Y}L${L - 8} ${Y + 7}`) + line(`M${R + 8} ${Y - 7}L${R - 6} ${Y}L${R + 8} ${Y + 7}`);
    case "look": return `<g class="wen-blink">${openEye(L, Y, g, { dx: 2.5, dy: -2.5, rx: 9, ry: 11 })}${openEye(R, Y, g, { dx: 2.5, dy: -2.5, rx: 9, ry: 11 })}</g>`
      + line(`M${R - 6} ${Y - 19}Q${R + 2} ${Y - 24} ${R + 9} ${Y - 19}`, 2.6);
    case "dot": return `<ellipse cx="${L}" cy="${Y + 1}" rx="4.6" ry="5.6" fill="${C.ink}"/><ellipse cx="${R}" cy="${Y + 2}" rx="3.6" ry="4.4" fill="${C.ink}"/>`
      + `<circle cx="${L - 1.5}" cy="${Y - 1.2}" r="1.4" fill="#fff"/><circle cx="${R - 1.2}" cy="${Y}" r="1.1" fill="#fff"/>`;
    case "big": return [L, R].map((x) => `<ellipse cx="${x}" cy="${Y}" rx="11" ry="12.5" fill="#fff" stroke="${C.ink}" stroke-width="2.6"/>
      <circle cx="${x}" cy="${Y + 1}" r="5" fill="${C.ink}"/><circle cx="${x - 1.6}" cy="${Y - 1}" r="1.7" fill="#fff"/>`).join("");
    case "teary": return `<g class="wen-blink">${openEye(L, Y + 1, g, { big: true })}${openEye(R, Y + 1, g, { big: true })}</g>`
      + `<path d="M${L - 9} ${Y + 7}Q${L} ${Y + 14} ${L + 9} ${Y + 7}" stroke="${C.tear}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      + `<path d="M${R - 9} ${Y + 7}Q${R} ${Y + 14} ${R + 9} ${Y + 7}" stroke="${C.tear}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "sleep": return line(`M${L - 8} ${Y}Q${L} ${Y + 6} ${L + 8} ${Y}`, 4) + line(`M${R - 8} ${Y}Q${R} ${Y + 6} ${R + 8} ${Y}`, 4);
    case "shades": return `<path d="M${L + 12} ${Y - 4}H${R - 12}" stroke="#5a3346" stroke-width="3"/>`
      + heart(L, Y + 1, 12, "#4a2a3a", "#ff8fb5") + heart(R, Y + 1, 12, "#4a2a3a", "#ff8fb5")
      + `<path d="M${L - 9} ${Y - 3}l6 -5M${R - 9} ${Y - 3}l6 -5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`;
    default: return "";
  }
}

function brows(kind) {
  const L = EYE_L, R = EYE_R, Y = EYE_Y;
  if (kind === "sad") return line(`M${L - 8} ${Y - 16}L${L + 6} ${Y - 20}`, 2.8) + line(`M${R - 6} ${Y - 20}L${R + 8} ${Y - 16}`, 2.8);
  if (kind === "firm") return line(`M${L - 8} ${Y - 18}L${L + 6} ${Y - 16}`, 3) + line(`M${R - 6} ${Y - 16}L${R + 8} ${Y - 18}`, 3);
  return "";
}

function mouth(kind, g) {
  switch (kind) {
    case "w": return line("M92.5 123q3.75 4.6 7.5 0q3.75 4.6 7.5 0", 2.5);
    case "open": return `<path id="${g.m}" d="M91 122.5Q100 138 109 122.5Q100 126 91 122.5Z" fill="${C.mouth}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <clipPath id="${g.mc}"><use href="#${g.m}"/></clipPath><ellipse cx="100" cy="131" rx="5" ry="3.4" fill="${C.tongue}" clip-path="url(#${g.mc})"/>`;
    case "big": return `<path id="${g.m}" d="M88 121Q100 145 112 121Q100 126 88 121Z" fill="${C.mouth}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <clipPath id="${g.mc}"><use href="#${g.m}"/></clipPath><ellipse cx="100" cy="136" rx="7" ry="4.5" fill="${C.tongue}" clip-path="url(#${g.mc})"/>`;
    case "o": return `<ellipse cx="100" cy="127.5" rx="4.6" ry="5.6" fill="${C.mouth}" stroke="${C.ink}" stroke-width="2.2"/>`;
    case "small": return line("M96.5 124q3.5 3.2 7 0", 2.4);
    case "frown": return line("M94 128.5q6 -5.5 12 0", 2.5);
    case "tongue": return `<path d="M100.5 124.5q.4 7 5 7q4.6 0 4.2 -7z" fill="${C.tongue}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>` + line("M92.5 123q3.75 4.6 7.5 0q3.75 4.6 7.5 0", 2.5);
    case "pout": return line("M98 122.5q4.6 1.7 0 3.5q4.6 1.7 0 3.5", 2.2);
    case "wavy": return line("M91 126q2.25 -3 4.5 0q2.25 3 4.5 0q2.25 -3 4.5 0q2.25 3 4.5 0", 2.2);
    case "smirk": return line("M93 124.5q8 5.5 15 -2.5", 2.5);
    default: return "";
  }
}

function effects(kind, g) {
  switch (kind) {
    case "sparkles": return sparkle(24, 82, 9, C.star) + sparkle(178, 74, 8, C.star) + sparkle(170, 34, 5, C.bow) + sparkle(32, 46, 5, C.heart);
    case "wink": return sparkle(146, 96, 6, C.star);
    case "hearts": return heart(26, 78, 7, C.heart) + heart(176, 66, 9, C.heart) + heart(163, 30, 5.5, "#ffa3c2") + heart(40, 42, 4.5, "#ffa3c2");
    case "laugh": return drop(57, 98, 0.8) + drop(143, 98, 0.8) + sparkle(172, 60, 6, C.star) + sparkle(28, 64, 5, C.star);
    case "shy": return `<path d="M54 125l-3 5M59 125l-3 5M64 125l-3 5M136 125l-3 5M141 125l-3 5M146 125l-3 5" stroke="#f0789f" stroke-width="1.8" stroke-linecap="round"/>`
      + heart(170, 78, 6.5, C.heart) + heart(183, 60, 4.5, "#ffa3c2");
    case "thought": return `<circle cx="152" cy="62" r="3.5" fill="#fff" stroke="${C.line}" stroke-width="2"/><circle cx="162" cy="48" r="5.5" fill="#fff" stroke="${C.line}" stroke-width="2"/>
      <ellipse cx="178" cy="28" rx="19" ry="14" fill="#fff" stroke="${C.line}" stroke-width="2.4"/>
      <circle cx="170" cy="28" r="2.4" fill="${C.ink}"/><circle cx="178" cy="28" r="2.4" fill="${C.ink}"/><circle cx="186" cy="28" r="2.4" fill="${C.ink}"/>`;
    case "bulb": return `<path d="M176 22l5 -5M182 36h7M160 12l-1 -7M144 22l-5 -5" stroke="${C.starLine}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="162" cy="32" r="12.5" fill="#fff3a8" stroke="${C.starLine}" stroke-width="2.4"/>
      <rect x="156" y="43" width="12" height="8" rx="2.5" fill="${C.innerEar}" stroke="${C.hoodieLine}" stroke-width="1.8"/>
      <path d="M158 32q4 -6 8 0" stroke="${C.starLine}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="157.5" cy="27.5" r="2.2" fill="#fff"/>`;
    case "question": return label(150, 70, 32, C.heart, "?") + label(170, 46, 22, C.zzz, "?") + drop(150, 82, 0.8);
    case "exclaim": return label(154, 70, 36, C.heart, "!") + `<path d="M30 70l-8 -6M28 84h-10M34 58l-4 -8" stroke="${C.heart}" stroke-width="3" stroke-linecap="round"/>`;
    case "tear": return drop(64, 121, 1);
    case "zzz": return label(124, 44, 15, C.zzz, "z") + label(138, 31, 20, C.zzz, "Z") + label(155, 18, 26, C.zzz, "Z")
      + `<circle cx="111" cy="121" r="6.5" fill="#e4f3ff" fill-opacity=".9" stroke="${C.tear}" stroke-width="1.5"/><circle cx="109" cy="119" r="1.6" fill="#fff"/>`;
    case "wave": return `<path d="M170 106q5 6 2 13M177 102q8 9 3 21" stroke="${C.line}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "band": return `<g clip-path="url(#${g.hc})"><path d="M36 88Q100 64 164 88" stroke="${C.hoodieLine}" stroke-width="13" fill="none"/><path d="M36 88Q100 64 164 88" stroke="${C.hoodie}" stroke-width="8.5" fill="none"/></g>
      <path d="M155 84l14 -8q2 7 -4 11zM155 84l15 6q-4 6 -10 2z" fill="${C.hoodie}" stroke="${C.hoodieLine}" stroke-width="2" stroke-linejoin="round"/><circle cx="155" cy="84" r="4" fill="${C.hoodieLine}"/>
      <path d="${starPath(100, 76, 6.5, 3)}" fill="${C.star}" stroke="${C.starLine}" stroke-width="1.4" stroke-linejoin="round"/>`;
    case "power": return `<path d="M166 112l7 -5M168 125h9M163 101l3 -8M139 108l-6 -5" stroke="${C.starLine}" stroke-width="3.2" stroke-linecap="round"/>` + sparkle(30, 70, 6, C.star);
    case "crumbs": return `<circle cx="117" cy="128" r="2" fill="${C.carrot}"/><circle cx="122" cy="134" r="1.5" fill="${C.carrot}"/><circle cx="114" cy="136" r="1.3" fill="${C.carrot}"/>`
      + heart(168, 84, 6.5, C.heart) + label(146, 72, 13, C.heart, "nyam");
    case "glint": return sparkle(150, 92, 7, "#fff") + sparkle(150, 92, 5, C.star) + sparkle(30, 62, 6, C.star) + sparkle(172, 44, 5, C.bow);
    default: return "";
  }
}

const HEAD = "M100 50C135 50 160 72 160 103C160 117 156 128 149 137L157 141L146 143C136 152 120 156 100 156C80 156 64 152 54 143L43 141L51 137C44 128 40 117 40 103C40 72 65 50 100 50Z";
const BODY = "M66 189C62 169 71 148 100 146C129 148 138 169 134 189Z";

// ------------------------------------------------------------------ gambar utama
export function mascot(mood = "happy", cls = "mascot") {
  if (!SPEC[mood]) mood = "happy";
  const sp = SPEC[mood];
  const ears = EARS[sp.ears || "up"];
  const arm = arms(sp.arms);
  const jump = sp.jump || 0;
  const id = `wen${++uid}`;
  const g = { eye: `${id}e`, head: `${id}h`, body: `${id}b`, m: `${id}m`, mc: `${id}c`, hc: `${id}k` };
  const blush = sp.blush === "big" ? { rx: 13, ry: 8.5, op: 0.95 } : sp.blush === "soft" ? { rx: 10.5, ry: 6.5, op: 0.45 } : { rx: 11, ry: 7, op: 0.75 };

  const wrap = document.createElement("span");
  wrap.innerHTML = `<svg class="${cls} wen wen-${mood}" viewBox="0 0 200 200" role="img" aria-label="Wen si kelinci: ${MOOD_INFO[mood][0].toLowerCase()}">
  <defs>
    <linearGradient id="${g.eye}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24141b"/><stop offset=".55" stop-color="#3a2530"/><stop offset="1" stop-color="#c0718f"/></linearGradient>
    <radialGradient id="${g.head}" cx=".5" cy=".42" r=".62"><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#fce6ef"/></radialGradient>
    <clipPath id="${g.hc}"><path d="${HEAD}"/></clipPath>
    <linearGradient id="${g.body}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd3e2"/><stop offset="1" stop-color="#ffb5cd"/></linearGradient>
  </defs>
  <ellipse cx="100" cy="193" rx="${44 - jump * 1.5}" ry="5.5" fill="rgba(150,70,110,.13)"/>
  <g transform="translate(0 ${-jump})"><g class="wen-body">
    ${ear("l", ears.l, ears.bl)}
    ${ear("r", ears.r, ears.br)}
    <circle cx="143" cy="172" r="11" fill="${C.fur}" stroke="${C.line}" stroke-width="2.5"/>
    <path d="${BODY}" fill="url(#${g.body})" stroke="${C.hoodieLine}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${starPath(100, 172, 8.5, 3.9)}" fill="${C.star}" stroke="${C.starLine}" stroke-width="1.6" stroke-linejoin="round"/>
    ${foot(84)}${foot(116)}
    ${arm.back}
    <path d="M93 56C89 44 98 36 106 40C100 42 100 47 105 54Z" fill="${C.fur}" stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${HEAD}" fill="url(#${g.head})" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="62" cy="126" rx="${blush.rx}" ry="${blush.ry}" fill="${C.blush}" opacity="${blush.op}"/>
    <ellipse cx="138" cy="126" rx="${blush.rx}" ry="${blush.ry}" fill="${C.blush}" opacity="${blush.op}"/>
    <path d="M96.4 116.6Q100 115 103.6 116.6Q101.6 120.6 100 120.6Q98.4 120.6 96.4 116.6Z" fill="${C.nose}"/>
    ${eyes(sp.eyes, g.eye)}
    ${brows(sp.brows)}
    ${mouth(sp.mouth, g)}
    ${bow(ears.r)}
    ${arm.front}
    ${sp.band ? effects("band", g) : ""}
    ${effects(sp.fx, g)}
  </g></g>
</svg>`;
  return wrap.firstElementChild;
}

// Tombol Wen: ketuk untuk ekspresi acak; diketuk 5× berturut-turut → malu-malu.
const RANDOM = ["cheer", "wave", "wink", "love", "starry", "laugh", "idea", "cool", "carrot", "surprised"];
export function tapMascot(mood = "happy", cls = "mascot") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "wen-tap";
  btn.title = "Ketuk aku!";
  btn.setAttribute("aria-label", "Ketuk Wen untuk melihat ekspresinya");
  btn.append(mascot(mood, cls));
  let taps = 0;
  let last = mood;
  let tapTimer = null;
  let backTimer = null;
  btn.addEventListener("click", () => {
    taps += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 2500);
    let next = "shy";
    if (taps < 5) {
      do next = RANDOM[Math.floor(Math.random() * RANDOM.length)]; while (next === last || next === mood);
    }
    last = next;
    btn.replaceChildren(mascot(next, `${cls} wen-hop`));
    btn.dataset.mood = next;
    clearTimeout(backTimer);
    backTimer = setTimeout(() => { btn.replaceChildren(mascot(mood, cls)); btn.dataset.mood = mood; last = mood; }, 2200);
  });
  btn.dataset.mood = mood;
  return btn;
}
