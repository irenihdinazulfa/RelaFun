// Wen — maskot orisinal RelaFun (versi 2.3, gaya doodle stiker: garis tepi tebal, warna pastel datar).
// Kelinci putih chibi: kepala bulat penuh, jambul kecil, telinga panjang berbentuk daun (ujung kanan menekuk),
// hoodie pink pastel berlencana bintang, pita biru muda di telinga, kaki berbantalan pink.
// mascot(mood) → <svg>;  tapMascot(mood) → tombol: ketuk Wen untuk ekspresi acak.
// Alat gambar bersama (kit) juga dipakai teman-teman Wen di friends.js.

export const INK = "#3b2a33";
export const C = {
  fur: "#ffffff", innerEar: "#ffc2d6", hoodie: "#ffc4d8",
  blush: "#ffb3cd", blushLine: "#f07fa6", nose: "#ff8fb0", mouth: "#e8668f", tongue: "#ffa8c2",
  star: "#ffe27a", bow: "#a9d6ff", heart: "#ff7aa6", tear: "#a8dbff", zzz: "#9ccbf2",
  carrot: "#ffb067", leaf: "#9fdcae",
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

// ------------------------------------------------------------------ alat gambar bersama
const r1 = (n) => Math.round(n * 10) / 10;
const O = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const line = (d, w = 4.4, color = INK) => `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

function starPath(cx, cy, R, r) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const k = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${r1(cx + k * Math.cos(a))} ${r1(cy + k * Math.sin(a))}`;
  }
  return `${d}Z`;
}
const sparkle = (x, y, s, fill, w = 2.2) => {
  const k = r1(s * 0.22);
  return `<path d="M${x} ${y - s}Q${x + k} ${y - k} ${x + s} ${y}Q${x + k} ${y + k} ${x} ${y + s}Q${x - k} ${y + k} ${x - s} ${y}Q${x - k} ${y - k} ${x} ${y - s}Z" fill="${fill}" ${O(w)}/>`;
};
const heart = (x, y, s, fill, w = 2.2) =>
  `<path d="M${x} ${r1(y + s * 0.9)}C${r1(x - s * 1.5)} ${r1(y - s * 0.1)} ${r1(x - s * 0.9)} ${r1(y - s * 1.3)} ${x} ${r1(y - s * 0.45)}C${r1(x + s * 0.9)} ${r1(y - s * 1.3)} ${r1(x + s * 1.5)} ${r1(y - s * 0.1)} ${x} ${r1(y + s * 0.9)}Z" fill="${fill}" ${O(w)}/>`;
const drop = (x, y, s = 1) =>
  `<path d="M${x} ${y}C${r1(x - 3 * s)} ${r1(y + 6 * s)} ${r1(x - 5 * s)} ${r1(y + 9 * s)} ${r1(x - 5 * s)} ${r1(y + 12 * s)}A${r1(5 * s)} ${r1(5 * s)} 0 0 0 ${r1(x + 5 * s)} ${r1(y + 12 * s)}C${r1(x + 5 * s)} ${r1(y + 9 * s)} ${r1(x + 3 * s)} ${r1(y + 6 * s)} ${x} ${y}Z" fill="${C.tear}" ${O(2)}/>
   <ellipse cx="${r1(x - 1.8 * s)}" cy="${r1(y + 11 * s)}" rx="${r1(1.2 * s)}" ry="${r1(2 * s)}" fill="#fff"/>`;
const label = (x, y, size, fill, text) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="900" font-family="system-ui, sans-serif" fill="${fill}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke">${text}</text>`;
const eyeDot = (x, y, { dx = 0, dy = 0, rx = 4.8, ry = 6.4, shine = true } = {}) =>
  `<ellipse cx="${x + dx}" cy="${y + dy}" rx="${rx}" ry="${ry}" fill="${INK}"/>`
  + (shine ? `<circle cx="${r1(x + dx - rx * 0.32)}" cy="${r1(y + dy - ry * 0.4)}" r="${r1(rx * 0.36)}" fill="#fff"/>` : "");
const blush = (x, y, { big = false, soft = false } = {}) => {
  const rx = big ? 11.5 : 9.5;
  const ry = big ? 7 : 5.6;
  const lines = soft ? "" : line(`M${x - 4.5} ${y + 2.5}l2.6 -5M${x} ${y + 2.5}l2.6 -5M${x + 4.5} ${y + 2.5}l2.6 -5`, 1.8, C.blushLine);
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.blush}" opacity="${soft ? 0.55 : 1}"/>${lines}`;
};
const paw = (x, y, { fill = C.fur, pads = false, r = 9 } = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${O(4.5)}/>`
  + (pads ? `<ellipse cx="${x}" cy="${r1(y + 1.8)}" rx="3.3" ry="2.6" fill="${C.innerEar}"/>`
    + `<circle cx="${r1(x - 3.4)}" cy="${r1(y - 2.8)}" r="1.4" fill="${C.innerEar}"/><circle cx="${x}" cy="${r1(y - 4.2)}" r="1.4" fill="${C.innerEar}"/><circle cx="${r1(x + 3.4)}" cy="${r1(y - 2.8)}" r="1.4" fill="${C.innerEar}"/>` : "");
const sleeve = (d, color = C.hoodie) => `<path d="${d}" stroke="${INK}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${color}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
const band = (d, color, w = 12) => `<path d="${d}" stroke="${INK}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${color}" stroke-width="${w - 6.5}" fill="none" stroke-linecap="round"/>`;

export const kit = { INK, C, O, r1, line, starPath, sparkle, heart, drop, label, eyeDot, blush, paw, sleeve, band };

// ------------------------------------------------------------------ bagian tubuh Wen
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
    <path d="${ribbon(P, 0, 1, leaf(11, 16))}" fill="${C.fur}" ${O(5)}/>
    <path d="${ribbon(P, 0.13, 0.85, leaf(3.5, 7.5))}" fill="${C.innerEar}"/></g></g>`;
}

function bow(rot) {
  return `<g transform="translate(122 68) rotate(${rot}) translate(0 -16) rotate(${-rot + 16})">
    <path d="M0 0C-5 -10 -16 -9 -15 0C-16 9 -5 10 0 0Z" fill="${C.bow}" ${O(3.4)}/>
    <path d="M0 0C5 -10 16 -9 15 0C16 9 5 10 0 0Z" fill="${C.bow}" ${O(3.4)}/>
    <circle r="4.2" fill="#8cc4f2" ${O(3)}/></g>`;
}

const foot = (x) => `<ellipse cx="${x}" cy="187" rx="13" ry="8" fill="${C.fur}" ${O(4.5)}/>
  <ellipse cx="${x}" cy="188.8" rx="4.8" ry="3.2" fill="${C.innerEar}"/>
  <circle cx="${x - 5.2}" cy="184.4" r="1.6" fill="${C.innerEar}"/><circle cx="${x}" cy="183" r="1.6" fill="${C.innerEar}"/><circle cx="${x + 5.2}" cy="184.4" r="1.6" fill="${C.innerEar}"/>`;

function carrot() {
  return line("M100 166q-10 6 -16 3M100 166q0 9 -3 14M100 166q9 5 15 1", 9.5)
    + line("M100 166q-10 6 -16 3M100 166q0 9 -3 14M100 166q9 5 15 1", 4.5, C.leaf)
    + `<path d="M100 126Q91 142 91.5 159Q92 167 100 167Q108 167 108.5 159Q109 142 100 126Z" fill="${C.carrot}" ${O(3.4)}/>`
    + line("M95 141h4.5M100.5 149h5M95 156h4.5", 2.2);
}

function arms(kind) {
  switch (kind) {
    case "up": return { back: sleeve("M75 158Q52 156 41 126") + sleeve("M125 158Q148 156 159 126"), front: paw(38, 121, { pads: true }) + paw(162, 121, { pads: true }) };
    case "wave": return { back: paw(79, 165) + sleeve("M125 158Q150 154 157 124"), front: paw(159, 118, { pads: true }) };
    case "point": return {
      back: paw(79, 165) + sleeve("M125 158Q150 152 153 124"),
      front: `<ellipse cx="155" cy="105" rx="4.4" ry="7.5" fill="${C.fur}" ${O(4)}/>` + paw(155, 117),
    };
    case "chin": return { back: paw(79, 165), front: sleeve("M124 163Q133 151 121 145") + paw(118, 141) };
    case "cheeks": return { back: "", front: sleeve("M76 160Q60 157 59 140") + sleeve("M124 160Q140 157 141 140") + paw(59, 134) + paw(141, 134) };
    case "fist": return {
      back: paw(79, 165) + sleeve("M125 158Q155 156 152 130"),
      front: paw(152, 123) + line("M147 120.5q2.6 1.6 0 3.4M152.5 119.8q2.6 1.6 0 3.4", 2),
    };
    case "carrot": return { back: "", front: carrot() + paw(88, 150) + paw(112, 150) };
    default: return { back: paw(79, 165) + paw(121, 165), front: "" };
  }
}

// ------------------------------------------------------------------ wajah
const EYE_L = 78, EYE_R = 122, EYE_Y = 108;
const arcEye = (x, y) => line(`M${x - 7.5} ${y + 2.5}Q${x} ${y - 7} ${x + 7.5} ${y + 2.5}`, 4.6);

function eyes(kind) {
  const L = EYE_L, R = EYE_R, Y = EYE_Y;
  switch (kind) {
    case "open": return `<g class="wen-blink">${eyeDot(L, Y)}${eyeDot(R, Y)}</g>`;
    case "arc": return arcEye(L, Y) + arcEye(R, Y);
    case "wink": return `<g class="wen-blink-one">${eyeDot(L, Y)}</g>` + line(`M${R - 7} ${Y + 1}Q${R} ${Y - 6} ${R + 7} ${Y + 1}`, 4.4);
    case "heart": return heart(L, Y + 1, 8.5, C.heart, 2.4) + heart(R, Y + 1, 8.5, C.heart, 2.4)
      + `<ellipse cx="${L - 4}" cy="${Y - 2.5}" rx="1.7" ry="2.3" fill="#fff"/><ellipse cx="${R - 4}" cy="${Y - 2.5}" rx="1.7" ry="2.3" fill="#fff"/>`;
    case "star": return `<path d="${starPath(L, Y + 1, 10.5, 4.8)}" fill="${C.star}" ${O(2.4)}/><path d="${starPath(R, Y + 1, 10.5, 4.8)}" fill="${C.star}" ${O(2.4)}/>`;
    case "laugh": return line(`M${L - 6.5} ${Y - 6}L${L + 5} ${Y}L${L - 6.5} ${Y + 6}`) + line(`M${R + 6.5} ${Y - 6}L${R - 5} ${Y}L${R + 6.5} ${Y + 6}`);
    case "look": return `<g class="wen-blink">${eyeDot(L, Y, { dx: 1.8, dy: -2.4 })}${eyeDot(R, Y, { dx: 1.8, dy: -2.4 })}</g>`
      + line(`M${R - 6} ${Y - 15}Q${R + 1} ${Y - 20} ${R + 8} ${Y - 15}`, 3.2);
    case "dot": return eyeDot(L, Y, { rx: 4, ry: 5, shine: false }) + eyeDot(R, Y + 1, { rx: 3.2, ry: 4.2, shine: false });
    case "big": return [L, R].map((x) => `<circle cx="${x}" cy="${Y}" r="9.5" fill="#fff" ${O(3)}/><circle cx="${x}" cy="${Y + 1}" r="3.8" fill="${INK}"/><circle cx="${x - 1.3}" cy="${Y - 0.4}" r="1.2" fill="#fff"/>`).join("");
    case "teary": return `<g class="wen-blink">${eyeDot(L, Y, { rx: 5.4, ry: 7 })}${eyeDot(R, Y, { rx: 5.4, ry: 7 })}</g>`
      + line(`M${L - 6} ${Y + 9.5}Q${L} ${Y + 13.5} ${L + 6} ${Y + 9.5}M${R - 6} ${Y + 9.5}Q${R} ${Y + 13.5} ${R + 6} ${Y + 9.5}`, 3, "#7cc0f2");
    case "sleep": return line(`M${L - 7} ${Y}Q${L} ${Y + 5.5} ${L + 7} ${Y}`, 4.2) + line(`M${R - 7} ${Y}Q${R} ${Y + 5.5} ${R + 7} ${Y}`, 4.2);
    case "shades": return line(`M${L + 10} ${Y - 3}H${R - 10}`, 3.4)
      + heart(L, Y + 1, 11, "#4a2a3a", 3) + heart(R, Y + 1, 11, "#4a2a3a", 3)
      + line(`M${L - 8} ${Y - 2}l5 -4.5M${R - 8} ${Y - 2}l5 -4.5`, 2.4, "#fff");
    default: return "";
  }
}

function brows(kind) {
  const L = EYE_L, R = EYE_R, Y = EYE_Y;
  if (kind === "sad") return line(`M${L - 7} ${Y - 14}L${L + 5} ${Y - 18}`, 3.2) + line(`M${R - 5} ${Y - 18}L${R + 7} ${Y - 14}`, 3.2);
  if (kind === "firm") return line(`M${L - 7} ${Y - 16}L${L + 5} ${Y - 14}`, 3.4) + line(`M${R - 5} ${Y - 14}L${R + 7} ${Y - 16}`, 3.4);
  return "";
}

function mouth(kind, g) {
  const W = "M93.5 122q3.25 4 6.5 0q3.25 4 6.5 0";
  switch (kind) {
    case "w": return line(W, 3.2);
    case "open": return `<path id="${g.m}" d="M92 121Q100 135 108 121Q100 124.5 92 121Z" fill="${C.mouth}" ${O(2.8)}/>
      <clipPath id="${g.mc}"><use href="#${g.m}"/></clipPath><ellipse cx="100" cy="129.5" rx="4.6" ry="3.2" fill="${C.tongue}" clip-path="url(#${g.mc})"/>`;
    case "big": return `<path id="${g.m}" d="M89 120Q100 142 111 120Q100 125 89 120Z" fill="${C.mouth}" ${O(2.8)}/>
      <clipPath id="${g.mc}"><use href="#${g.m}"/></clipPath><ellipse cx="100" cy="134" rx="6.5" ry="4.2" fill="${C.tongue}" clip-path="url(#${g.mc})"/>`;
    case "o": return `<ellipse cx="100" cy="126" rx="4.2" ry="5.2" fill="${C.mouth}" ${O(2.6)}/>`;
    case "small": return line("M96.5 123q3.5 3 7 0", 3);
    case "frown": return line("M94.5 127.5q5.5 -5 11 0", 3.2);
    case "tongue": return `<path d="M100.5 123.5q.4 6.5 4.6 6.5q4.2 0 3.8 -6.5z" fill="${C.tongue}" ${O(2.4)}/>` + line(W, 3.2);
    case "pout": return line("M98 121.5q4.2 1.6 0 3.2q4.2 1.6 0 3.2", 2.8);
    case "wavy": return line("M91.5 125q2.1 -2.8 4.2 0q2.1 2.8 4.2 0q2.1 -2.8 4.2 0q2.1 2.8 4.2 0", 2.8);
    case "smirk": return line("M93.5 123.5q7.5 5 14 -2.5", 3.2);
    default: return "";
  }
}

function effects(kind, g) {
  switch (kind) {
    case "sparkles": return sparkle(24, 82, 9, C.star) + sparkle(178, 74, 8, C.star) + sparkle(170, 34, 6, C.bow) + sparkle(32, 46, 6, "#ffb3cf");
    case "wink": return sparkle(146, 96, 6, C.star);
    case "hearts": return heart(26, 78, 7, C.heart) + heart(176, 66, 8.5, C.heart) + heart(163, 30, 5.5, "#ffb3cf") + heart(40, 42, 5, "#ffb3cf");
    case "laugh": return drop(58, 96, 0.8) + drop(142, 96, 0.8) + sparkle(172, 60, 6, C.star) + sparkle(28, 64, 5, C.star);
    case "shy": return heart(170, 78, 6.5, C.heart) + heart(183, 60, 4.5, "#ffb3cf");
    case "thought": return `<circle cx="152" cy="62" r="3.5" fill="#fff" ${O(2.6)}/><circle cx="162" cy="48" r="5.5" fill="#fff" ${O(2.8)}/>
      <ellipse cx="178" cy="28" rx="19" ry="14" fill="#fff" ${O(3)}/>
      <circle cx="170" cy="28" r="2.4" fill="${INK}"/><circle cx="178" cy="28" r="2.4" fill="${INK}"/><circle cx="186" cy="28" r="2.4" fill="${INK}"/>`;
    case "bulb": return line("M176 22l5 -5M182 36h7M160 12l-1 -7M144 22l-5 -5", 3)
      + `<circle cx="162" cy="32" r="12.5" fill="#fff3a8" ${O(3)}/>
      <rect x="156" y="43" width="12" height="8" rx="2.5" fill="${C.innerEar}" ${O(2.6)}/>
      <circle cx="157.5" cy="27.5" r="2.4" fill="#fff"/>`;
    case "question": return label(150, 70, 32, "#ffb3cf", "?") + label(170, 46, 22, C.bow, "?") + drop(150, 82, 0.8);
    case "exclaim": return label(154, 70, 36, "#ffb3cf", "!") + line("M30 70l-8 -6M28 84h-10M34 58l-4 -8", 3);
    case "tear": return drop(64, 119, 1);
    case "zzz": return label(124, 44, 15, C.zzz, "z") + label(138, 31, 20, C.zzz, "Z") + label(155, 18, 26, C.zzz, "Z")
      + `<circle cx="111" cy="121" r="6.5" fill="#e4f3ff" ${O(2)}/><circle cx="109" cy="119" r="1.6" fill="#fff"/>`;
    case "wave": return line("M171 106q5 6 2 13M178 102q8 9 3 21", 3);
    case "band": return `<g clip-path="url(#${g.hc})">${band("M36 88Q100 64 164 88", C.hoodie, 15)}</g>
      <path d="M155 84l14 -8q2 7 -4 11zM155 84l15 6q-4 6 -10 2z" fill="${C.hoodie}" ${O(2.8)}/><circle cx="155" cy="84" r="4.2" fill="${C.hoodie}" ${O(2.6)}/>
      <path d="${starPath(100, 76, 6.5, 3)}" fill="${C.star}" ${O(2)}/>`;
    case "power": return line("M166 112l7 -5M168 125h9M163 101l3 -8M139 108l-6 -5", 3.4) + sparkle(30, 70, 6, C.star);
    case "crumbs": return `<circle cx="117" cy="128" r="2.2" fill="${C.carrot}"/><circle cx="122" cy="134" r="1.7" fill="${C.carrot}"/><circle cx="114" cy="136" r="1.4" fill="${C.carrot}"/>`
      + heart(168, 84, 6.5, C.heart) + `<text x="10" y="70" font-size="13" font-weight="900" font-family="system-ui, sans-serif" fill="${INK}">nyam</text>`;
    case "glint": return sparkle(150, 92, 6, C.star) + sparkle(30, 62, 6, C.star) + sparkle(172, 44, 5, C.bow);
    default: return "";
  }
}

const HEAD = "M100 50C134 50 160 74 160 103C160 133 134 156 100 156C66 156 40 133 40 103C40 74 66 50 100 50Z";
const BODY = "M66 189C62 169 71 148 100 146C129 148 138 169 134 189Z";
let uid = 0;

// ------------------------------------------------------------------ gambar utama
export function mascot(mood = "happy", cls = "mascot") {
  if (!SPEC[mood]) mood = "happy";
  const sp = SPEC[mood];
  const ears = EARS[sp.ears || "up"];
  const arm = arms(sp.arms);
  const jump = sp.jump || 0;
  const id = `wen${++uid}`;
  const g = { m: `${id}m`, mc: `${id}c`, hc: `${id}k` };
  const bl = { big: sp.blush === "big", soft: sp.blush === "soft" };

  const wrap = document.createElement("span");
  wrap.innerHTML = `<svg class="${cls} wen wen-${mood}" viewBox="0 0 200 200" role="img" aria-label="Wen si kelinci: ${MOOD_INFO[mood][0].toLowerCase()}">
  <defs><clipPath id="${g.hc}"><path d="${HEAD}"/></clipPath></defs>
  <ellipse cx="100" cy="193" rx="${40 - jump * 1.5}" ry="5" fill="rgba(59,42,51,.1)"/>
  <g transform="translate(0 ${-jump})"><g class="wen-body">
    ${ear("l", ears.l, ears.bl)}
    ${ear("r", ears.r, ears.br)}
    <circle cx="143" cy="172" r="11" fill="${C.fur}" ${O(4.5)}/>
    <path d="${BODY}" fill="${C.hoodie}" ${O(5)}/>
    <path d="${starPath(100, 172, 9, 4.2)}" fill="${C.star}" ${O(2.8)}/>
    ${foot(84)}${foot(116)}
    ${arm.back}
    <path d="M93 56C89 44 98 36 106 40C100 42 100 47 105 54Z" fill="${C.fur}" ${O(4)}/>
    <path d="${HEAD}" fill="${C.fur}" ${O(5.5)}/>
    ${blush(63, 123, bl)}${blush(137, 123, bl)}
    <ellipse cx="100" cy="116.5" rx="3.8" ry="2.8" fill="${C.nose}" ${O(2)}/>
    ${eyes(sp.eyes)}
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
