// Teman-teman Wen: karakter orisinal RelaFun dengan gaya doodle stiker yang sama seperti Wen.
// friend(id) → <svg>;  friendButton(id) → stiker yang melompat saat diketuk;
// stickerSheet() → kolase stiker Wen & teman-teman (halaman masuk dan galeri).
import { kit, mascot, tapMascot } from "./mascot.js";

const { INK, C, O, line, starPath, sparkle, heart, eyeDot, blush, paw, band } = kit;

export const FRIEND_INFO = {
  oya: { name: "Oya", kind: "anak kucing oranye", desc: "Teliti mengecek: setiap anggota domain punya tepat satu pasangan.", page: "Materi" },
  momo: { name: "Momo", kind: "beruang madu", desc: "Suka berhitung pelan-pelan, langkah demi langkah.", page: "Kalkulator f(x)" },
  ciko: { name: "Ciko", kind: "anak ayam", desc: "Senang membaca soal cerita dan menandai angka penting.", page: "Pemodel Soal Cerita" },
  puyo: { name: "Puyo", kind: "aksolotl", desc: "Suka bertanya arti istilah yang sulit, selalu membawa buku kecilnya.", page: "Glosarium" },
  kopi: { name: "Kopi", kind: "anak anjing corgi", desc: "Paling semangat menyoraki teman-temannya.", page: "Peringkat Kelas" },
};
export const FRIENDS = Object.keys(FRIEND_INFO);

// ------------------------------------------------------------------ Oya: anak kucing oranye bergaris
function oya() {
  const F = "#ffc890", S = "#f0a05a", W = "#fffaf3", P = "#ffb3c8";
  return line("M132 176C162 180 170 150 152 136", 15) + line("M132 176C162 180 170 150 152 136", 6.5, F)
    + line("M160 150l7 1M160 160l7 -2", 3, S)
    + `<ellipse cx="100" cy="164" rx="36" ry="26" fill="${F}" ${O(5)}/>
    <ellipse cx="100" cy="171" rx="18" ry="13" fill="${W}"/>
    <ellipse cx="84" cy="186" rx="12" ry="7.5" fill="${W}" ${O(4.5)}/><ellipse cx="116" cy="186" rx="12" ry="7.5" fill="${W}" ${O(4.5)}/>
    <path d="M50 86L59 37Q63 31 70 35L96 62Z" fill="${F}" ${O(5)}/><path d="M150 86L141 37Q137 31 130 35L104 62Z" fill="${F}" ${O(5)}/>
    <path d="M61 72L65 48L82 62Z" fill="${P}"/><path d="M139 72L135 48L118 62Z" fill="${P}"/>
    <ellipse cx="100" cy="104" rx="58" ry="47" fill="${F}" ${O(5.5)}/>`
    + line("M92 63v10M100 61v13M108 63v10", 4.5, S) + line("M45 99h10M46 109h9M155 99h-10M154 109h-9", 4, S)
    + `<ellipse cx="100" cy="122" rx="17" ry="11" fill="${W}"/>
    <path d="M95.5 113.5h9l-4.5 5z" fill="${C.nose}" ${O(2)}/>`
    + line("M93.5 120q3.25 4 6.5 0q3.25 4 6.5 0", 3) + line("M62 115l-21 -4M62 121l-21 3M138 115l21 -4M138 121l21 3", 2.4)
    + eyeDot(78, 102) + eyeDot(122, 102) + blush(62, 118) + blush(138, 118)
    + band("M66 146Q100 160 134 146", C.bow, 12)
    + `<circle cx="100" cy="155" r="6.5" fill="${C.star}" ${O(3)}/>` + line("M97 157.5h6", 2)
    + paw(82, 168, { fill: W, r: 8 }) + paw(118, 168, { fill: W, r: 8 });
}

// ------------------------------------------------------------------ Momo: beruang madu berpensil
function momo() {
  const F = "#ffd78f", M = "#fff3dc", P = "#ffb9a3";
  return `<ellipse cx="100" cy="164" rx="38" ry="27" fill="${F}" ${O(5)}/>
    <ellipse cx="100" cy="171" rx="20" ry="14" fill="${M}"/>
    <ellipse cx="82" cy="186" rx="13" ry="8" fill="${F}" ${O(4.5)}/><ellipse cx="82" cy="187.5" rx="5" ry="3.2" fill="${P}"/>
    <ellipse cx="118" cy="186" rx="13" ry="8" fill="${F}" ${O(4.5)}/><ellipse cx="118" cy="187.5" rx="5" ry="3.2" fill="${P}"/>
    <circle cx="56" cy="64" r="17" fill="${F}" ${O(5)}/><circle cx="56" cy="64" r="8.5" fill="${P}"/>
    <circle cx="144" cy="64" r="17" fill="${F}" ${O(5)}/><circle cx="144" cy="64" r="8.5" fill="${P}"/>
    <ellipse cx="100" cy="102" rx="58" ry="49" fill="${F}" ${O(5.5)}/>
    <ellipse cx="100" cy="121" rx="20" ry="14" fill="${M}" ${O(3.5)}/>
    <ellipse cx="100" cy="114" rx="6" ry="4.4" fill="${INK}"/><ellipse cx="98.2" cy="112.7" rx="1.8" ry="1.1" fill="#fff"/>`
    + line("M94 121q3 3.8 6 0q3 3.8 6 0", 3) + eyeDot(76, 101) + eyeDot(124, 101) + blush(58, 117) + blush(142, 117)
    + band("M60 144Q100 160 140 144", C.bow, 15)
    + `<path d="M118 150l9 19-11 3-6-18z" fill="${C.bow}" ${O(3.5)}/>
    <rect x="93" y="134" width="14" height="11" rx="3.5" fill="${C.blush}" ${O(3)}/>
    <rect x="93" y="144" width="14" height="32" fill="${C.star}" ${O(3)}/>` + line("M100 147v26", 2, "#f2cf63")
    + `<path d="M93 176L100 191L107 176Z" fill="#ffe2c4" ${O(3)}/><path d="M97.6 185.5L100 191L102.4 185.5Z" fill="${INK}"/>`
    + paw(90, 162, { fill: F, r: 8.5 }) + paw(110, 162, { fill: F, r: 8.5 });
}

// ------------------------------------------------------------------ Ciko: anak ayam berbunga
function ciko() {
  const Y = "#fff0a3", WG = "#ffe07a", B = "#ffb36b";
  const flower = [0, 72, 144, 216, 288].map((a) => {
    const t = (a - 90) * (Math.PI / 180);
    return `<circle cx="${(130 + 6.2 * Math.cos(t)).toFixed(1)}" cy="${(64 + 6.2 * Math.sin(t)).toFixed(1)}" r="5" fill="#ffb3cf" ${O(2.4)}/>`;
  }).join("");
  return `<ellipse cx="91" cy="58" rx="5.5" ry="11" transform="rotate(-28 91 58)" fill="${Y}" ${O(4)}/>
    <ellipse cx="100" cy="53" rx="5.5" ry="12" fill="${Y}" ${O(4)}/>
    <ellipse cx="109" cy="58" rx="5.5" ry="11" transform="rotate(28 109 58)" fill="${Y}" ${O(4)}/>
    <ellipse cx="84" cy="187" rx="10" ry="5.5" fill="${B}" ${O(4)}/><ellipse cx="116" cy="187" rx="10" ry="5.5" fill="${B}" ${O(4)}/>
    <path d="M100 62C140 62 160 96 160 128C160 162 134 184 100 184C66 184 40 162 40 128C40 96 60 62 100 62Z" fill="${Y}" ${O(5.5)}/>
    <ellipse cx="45" cy="118" rx="12" ry="20" transform="rotate(-38 45 118)" fill="${WG}" ${O(4.5)}/>
    <ellipse cx="155" cy="118" rx="12" ry="20" transform="rotate(38 155 118)" fill="${WG}" ${O(4.5)}/>`
    + eyeDot(82, 110) + eyeDot(118, 110)
    + `<path d="M91 122Q100 113 109 122Q100 131 91 122Z" fill="${B}" ${O(3)}/>` + line("M92 122h16", 2.2)
    + blush(68, 124) + blush(132, 124)
    + flower + `<circle cx="130" cy="64" r="3.8" fill="${C.star}" ${O(2.2)}/>`
    + line("M88 152q4 4 8 0q4 4 8 0q4 4 8 0", 3, "#f2cf63");
}

// ------------------------------------------------------------------ Puyo: aksolotl mungil pembawa buku istilah
// Gaya chibi: insang bulat seperti kelopak (bukan runcing), mata besar berkilau yang berdekatan,
// senyum kecil terbuka, rambut ikal di ubun-ubun, memeluk buku kecil (Glosarium).
function puyo() {
  const P = "#ffd6e3", G = "#ffabc8", GL = "#ffd0e0", BL = "#fff2f6", BU = "#d6eeff", BK = "#cfe4f1", PG = "#ffffff";
  const gill = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="14" ry="9.5" fill="${G}" ${O(4)}/>`
    + `<ellipse cx="${x}" cy="${y - 1.5}" rx="7" ry="3.8" fill="${GL}"/></g>`;
  const gills = gill(45, 80, 35) + gill(38, 103, 5) + gill(45, 126, -25) + gill(155, 80, -35) + gill(162, 103, -5) + gill(155, 126, 25);
  const bigEye = (x, y) => eyeDot(x, y, { rx: 6.6, ry: 8.2 }) + `<circle cx="${x + 2.6}" cy="${y + 3.4}" r="1.5" fill="#fff"/>`;
  return line("M126 172C150 180 170 166 166 144", 17) + line("M126 172C150 180 170 166 166 144", 8, P)
    + gills
    + `<ellipse cx="100" cy="164" rx="34" ry="24" fill="${P}" ${O(5)}/>
    <ellipse cx="100" cy="171" rx="19" ry="12" fill="${BL}"/>
    <ellipse cx="84" cy="186" rx="11" ry="7" fill="${P}" ${O(4.5)}/><ellipse cx="116" cy="186" rx="11" ry="7" fill="${P}" ${O(4.5)}/>
    <ellipse cx="100" cy="104" rx="60" ry="50" fill="${P}" ${O(5.5)}/>`
    + line("M100 55C93 46 96 36 105 38C111 40 109 48 103 47", 4.2)
    + bigEye(79, 104) + bigEye(121, 104)
    + `<path d="M92 118Q100 129 108 118Z" fill="${C.mouth}" ${O(3)}/>
    <path d="M95.5 122.6Q100 127 104.5 122.6Q100 120.4 95.5 122.6Z" fill="${C.tongue}"/>`
    + blush(62, 120) + blush(138, 120)
    + `<rect x="79" y="146" width="42" height="27" rx="5" fill="${BK}" ${O(3.6)}/>
    <rect x="83" y="149.5" width="15.5" height="20" rx="2.5" fill="${PG}"/><rect x="101.5" y="149.5" width="15.5" height="20" rx="2.5" fill="${PG}"/>`
    + line("M100 148.5v22", 2.6) + line("M86.5 155h9M86.5 160.5h7M104.5 155h9M104.5 160.5h7", 2, "#8cbfe0")
    + paw(80, 160, { fill: P, r: 7.5 }) + paw(120, 160, { fill: P, r: 7.5 })
    + `<circle cx="166" cy="54" r="7" fill="${BU}" ${O(2.6)}/><circle cx="163.6" cy="51.6" r="2" fill="#fff"/>
    <circle cx="179" cy="35" r="4.6" fill="${BU}" ${O(2.4)}/><circle cx="157" cy="33" r="3.2" fill="${BU}" ${O(2.2)}/>`;
}

// ------------------------------------------------------------------ Kopi: anak anjing corgi
function kopi() {
  const F = "#ffbf86", W = "#ffffff", P = "#ffb3c8";
  return `<circle cx="142" cy="170" r="10" fill="${F}" ${O(4.5)}/>
    <ellipse cx="100" cy="164" rx="37" ry="26" fill="${F}" ${O(5)}/>
    <ellipse cx="100" cy="166" rx="19" ry="16" fill="${W}"/>
    <ellipse cx="84" cy="185" rx="12" ry="8" fill="${W}" ${O(4.5)}/><ellipse cx="116" cy="185" rx="12" ry="8" fill="${W}" ${O(4.5)}/>
    <path d="M48 90L54 30Q58 24 65 29L94 62Z" fill="${F}" ${O(5)}/><path d="M58 77L61 43L82 63Z" fill="${P}"/>
    <path d="M152 90L146 30Q142 24 135 29L106 62Z" fill="${F}" ${O(5)}/><path d="M142 77L139 43L118 63Z" fill="${P}"/>
    <ellipse cx="100" cy="104" rx="58" ry="48" fill="${F}" ${O(5.5)}/>
    <path d="M100 64C95 78 84 98 80 112C76 128 92 138 100 138C108 138 124 128 120 112C116 98 105 78 100 64Z" fill="${W}"/>
    <ellipse cx="100" cy="114" rx="6.2" ry="4.6" fill="${INK}"/><ellipse cx="98.2" cy="112.6" rx="1.8" ry="1.1" fill="#fff"/>
    <path d="M101 123.5q.4 7.5 5 7.5q4.6 0 4.2 -7.5z" fill="${C.tongue}" ${O(2.4)}/>`
    + line("M93.5 121q3.25 4 6.5 0q3.25 4 6.5 0", 3) + eyeDot(76, 102) + eyeDot(124, 102) + blush(60, 119) + blush(140, 119)
    + band("M64 146Q100 160 136 146", "#ff9cc4", 12) + heart(100, 158, 6, C.star, 2.4);
}

const DRAW = { oya, momo, ciko, puyo, kopi };

export function friend(id, cls = "friend") {
  const info = FRIEND_INFO[id];
  const wrap = document.createElement("span");
  wrap.innerHTML = `<svg class="${cls} wen wen-friend friend-${id}" viewBox="0 0 200 200" role="img" aria-label="${info.name} si ${info.kind}">
  <ellipse cx="100" cy="193" rx="40" ry="5" fill="rgba(59,42,51,.1)"/>
  <g class="wen-body">${DRAW[id]()}</g></svg>`;
  return wrap.firstElementChild;
}

// Stiker teman yang melompat saat diketuk
export function friendButton(id, cls = "friend") {
  const info = FRIEND_INFO[id];
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "wen-tap";
  btn.title = `${info.name} si ${info.kind}`;
  btn.setAttribute("aria-label", `${info.name} si ${info.kind}`);
  btn.append(friend(id, cls));
  btn.addEventListener("click", () => { btn.textContent = ""; btn.append(friend(id, `${cls} wen-hop`)); });
  return btn;
}

// ------------------------------------------------------------------ kolase stiker
// Posisi dalam bidang 440 × 300: [id, kiri, atas, lebar]
const SHEET = [["ciko", 8, 22, 96], ["oya", 334, 14, 100], ["momo", 2, 168, 108], ["puyo", 330, 172, 104], ["kopi", 120, 206, 92]];
const DECOR = sparkle(118, 32, 10, "#ffb3cf") + sparkle(316, 124, 9, C.star) + sparkle(24, 140, 7, C.bow) + sparkle(420, 140, 7, "#ffb3cf")
  + `<path d="${starPath(120, 150, 11, 5)}" fill="${C.star}" ${O(2.4)}/><path d="${starPath(306, 40, 10, 4.6)}" fill="#ffb3cf" ${O(2.4)}/>`
  + heart(236, 262, 8, "#ffb3cf") + heart(318, 268, 6, C.heart)
  + `<g transform="translate(258 286) rotate(-10)"><path d="M0 0C-5 -9 -15 -8 -14 0C-15 8 -5 9 0 0Z" fill="${C.bow}" ${O(2.6)}/><path d="M0 0C5 -9 15 -8 14 0C15 8 5 9 0 0Z" fill="${C.bow}" ${O(2.6)}/><circle r="3.6" fill="#8cc4f2" ${O(2.4)}/></g>`
  + [0, 72, 144, 216, 288].map((a) => {
    const t = (a - 90) * (Math.PI / 180);
    return `<circle cx="${(60 + 6 * Math.cos(t)).toFixed(1)}" cy="${(282 + 6 * Math.sin(t)).toFixed(1)}" r="4.8" fill="#ffe6a8" ${O(2.2)}/>`;
  }).join("") + `<circle cx="60" cy="282" r="3.4" fill="#ffb3cf" ${O(2)}/>`;

export function stickerSheet({ wenMood = "wave", tap = true } = {}) {
  const sheet = document.createElement("div");
  sheet.className = "sticker-sheet";
  const deco = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  deco.setAttribute("viewBox", "0 0 440 300");
  deco.setAttribute("class", "sheet-deco");
  deco.setAttribute("aria-hidden", "true");
  deco.innerHTML = DECOR;
  sheet.append(deco);
  const place = (el, left, top, width) => {
    const box = document.createElement("div");
    box.className = "stk";
    box.style.left = `${(left / 440) * 100}%`;
    box.style.top = `${(top / 300) * 100}%`;
    box.style.width = `${(width / 440) * 100}%`;
    box.append(el);
    sheet.append(box);
    return box;
  };
  for (const [id, l, t, w] of SHEET) place(tap ? friendButton(id) : friend(id), l, t, w);
  place(tap ? tapMascot(wenMood) : mascot(wenMood), 118, 6, 200).classList.add("stk-wen");
  return sheet;
}
