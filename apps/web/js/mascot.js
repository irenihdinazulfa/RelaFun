// Wen — maskot orisinal RelaFun: kelinci putih bertudung pastel (telinga kelinci panjang, lencana bintang, pita).
// mood: "happy" | "cheer" | "calm" | "think" | "wink" | "surprised" | "sad" | "love"

const HOOD = "#ffc1d6";
const HOOD_LINE = "#eea4c0";
const HOOD_INNER = "#ffe3ec";
const FACE = "#ffffff";
const FACE_LINE = "#f2d3df";
const INK = "#3a2530";
const BLUSH = "#ffa8c6";
const STAR = "#ffe27a";
const STAR_LINE = "#f2c14c";
const BOW = "#a9d6ff";
const BOW_DARK = "#7fbcf2";
const HEART = "#ff6f9f";

const roundEye = (x, y, dx = 0, dy = 0, r = 7.5) => `
  <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r + 1.5}" fill="${INK}"/>
  <circle cx="${x + 2.6 + dx}" cy="${y - 3.4 + dy}" r="2.9" fill="#fff"/>
  <circle cx="${x - 2.4 + dx}" cy="${y + 3.6 + dy}" r="1.4" fill="#fff"/>`;
const arcEye = (x, y) => `<path d="M${x - 8} ${y + 2} q8 -10 16 0" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
const heartEye = (x, y) => `<path d="M${x} ${y + 7} l-7.5 -7.5 a4.3 4.3 0 0 1 7.5 -5.2 a4.3 4.3 0 0 1 7.5 5.2 z" fill="${HEART}"/>`;
const sadEye = (x, y, flip) => `<path d="M${x - 7} ${y} q7 6 14 0" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  <path d="M${x - 8} ${y - 9} l14 ${flip ? 4 : -4}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;

const MOUTH = {
  smile: `<path d="M92 130 q4 4.5 8 0 q4 4.5 8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  open: `<path d="M91 128 q9 12 18 0 z" fill="#ff8fb0" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`,
  o: `<ellipse cx="100" cy="132" rx="4.5" ry="5.5" fill="#ff8fb0" stroke="${INK}" stroke-width="2.2"/>`,
  small: `<circle cx="100" cy="131" r="2.6" fill="${INK}"/>`,
  frown: `<path d="M93 134 q7 -6 14 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  tongue: `<path d="M92 129 q8 8 16 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
           <path d="M101 133 q4 7 8 0 z" fill="#ff8fb0" stroke="${INK}" stroke-width="1.8"/>`,
};

function face(mood) {
  switch (mood) {
    case "happy": return arcEye(84, 114) + arcEye(116, 114) + MOUTH.smile;
    case "cheer": return arcEye(84, 114) + arcEye(116, 114) + MOUTH.open;
    case "calm": return roundEye(84, 114) + roundEye(116, 114) + MOUTH.smile;
    case "think": return roundEye(84, 113, -2, -2) + roundEye(116, 113, -2, -2) + MOUTH.small;
    case "wink": return roundEye(84, 114) + arcEye(116, 114) + MOUTH.tongue
      + `<path d="M136 100l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="${STAR}"/>`;
    case "surprised": return `<circle cx="84" cy="113" r="9" fill="#fff" stroke="${INK}" stroke-width="2.6"/><circle cx="84" cy="113" r="4.5" fill="${INK}"/>
      <circle cx="116" cy="113" r="9" fill="#fff" stroke="${INK}" stroke-width="2.6"/><circle cx="116" cy="113" r="4.5" fill="${INK}"/>` + MOUTH.o;
    case "sad": return sadEye(84, 116, false) + sadEye(116, 116, true) + MOUTH.frown
      + `<path d="M138 98 q6 9 0 12 q-6 -3 0 -12z" fill="${BOW}"/>`;
    case "love": return heartEye(84, 112) + heartEye(116, 112) + MOUTH.open;
    default: return roundEye(84, 114) + roundEye(116, 114) + MOUTH.smile;
  }
}

function arms(mood) {
  if (mood === "cheer" || mood === "love") {
    return `<path d="M74 158 q-20 -6 -30 -30" stroke="${HOOD_LINE}" stroke-width="17" fill="none" stroke-linecap="round"/>
      <path d="M74 158 q-20 -6 -30 -30" stroke="${HOOD}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M126 158 q20 -6 30 -30" stroke="${HOOD_LINE}" stroke-width="17" fill="none" stroke-linecap="round"/>
      <path d="M126 158 q20 -6 30 -30" stroke="${HOOD}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="44" cy="127" r="8" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
      <circle cx="156" cy="127" r="8" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
      <path d="M26 88l3.5 8 8 3.5-8 3.5-3.5 8-3.5-8-8-3.5 8-3.5z" fill="${STAR}"/>
      <path d="M176 80l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="${mood === "love" ? HEART : STAR}"/>`;
  }
  if (mood === "think") {
    return `<circle cx="84" cy="160" r="8" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
      <path d="M118 160 q8 -14 0 -26" stroke="${HOOD_LINE}" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M118 160 q8 -14 0 -26" stroke="${HOOD}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <circle cx="117" cy="136" r="7.5" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>`;
  }
  return `<circle cx="84" cy="160" r="8" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
    <circle cx="116" cy="160" r="8" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>`;
}

export const MOODS = ["happy", "cheer", "calm", "think", "wink", "surprised", "sad", "love"];

export function mascot(mood = "happy", cls = "mascot") {
  const up = mood === "cheer" || mood === "love";
  const extra = mood === "think"
    ? `<circle cx="160" cy="58" r="5" fill="${BOW}"/><circle cx="174" cy="40" r="9" fill="${BOW}"/>`
    : mood === "surprised" ? `<path d="M164 56 v18" stroke="${HEART}" stroke-width="5" stroke-linecap="round"/><circle cx="164" cy="83" r="3" fill="${HEART}"/>` : "";
  const wrap = document.createElement("span");
  wrap.style.display = "contents";
  wrap.innerHTML = `
<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="Wen si kelinci (${mood})">
  ${extra}
  <ellipse cx="100" cy="191" rx="42" ry="6" fill="rgba(140,60,100,.12)"/>
  <circle cx="138" cy="172" r="9" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
  <g transform="rotate(-16 74 72)">
    <ellipse cx="74" cy="40" rx="16" ry="38" fill="${HOOD}" stroke="${HOOD_LINE}" stroke-width="3"/>
    <ellipse cx="74" cy="44" rx="8" ry="28" fill="${HOOD_INNER}"/>
  </g>
  <g transform="rotate(${mood === "sad" ? 40 : 16} 126 72)">
    <ellipse cx="126" cy="40" rx="16" ry="38" fill="${HOOD}" stroke="${HOOD_LINE}" stroke-width="3"/>
    <ellipse cx="126" cy="44" rx="8" ry="28" fill="${HOOD_INNER}"/>
  </g>
  <ellipse cx="100" cy="165" rx="33" ry="26" fill="${HOOD}" stroke="${HOOD_LINE}" stroke-width="3"/>
  <rect x="85" y="164" width="30" height="16" rx="7" fill="${HOOD_INNER}" stroke="${HOOD_LINE}" stroke-width="2"/>
  <ellipse cx="85" cy="189" rx="12" ry="7" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
  <ellipse cx="115" cy="189" rx="12" ry="7" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
  ${up ? "" : arms(mood)}
  <circle cx="100" cy="110" r="55" fill="${HOOD}" stroke="${HOOD_LINE}" stroke-width="3"/>
  <ellipse cx="100" cy="120" rx="43" ry="37" fill="${FACE}" stroke="${FACE_LINE}" stroke-width="2.5"/>
  <path d="M100 58 l4.4 9 9.8 1.4 -7.1 6.9 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.1 -6.9 9.8 -1.4z" fill="${STAR}" stroke="${STAR_LINE}" stroke-width="1.6" stroke-linejoin="round"/>
  <g transform="translate(146 82) rotate(20)">
    <path d="M0 0 l-13 -8 q-3 8 0 16 z" fill="${BOW}"/><path d="M0 0 l13 -8 q3 8 0 16 z" fill="${BOW}"/>
    <circle r="4" fill="${BOW_DARK}"/>
  </g>
  <ellipse cx="72" cy="131" rx="9.5" ry="6" fill="${BLUSH}" opacity=".7"/>
  <ellipse cx="128" cy="131" rx="9.5" ry="6" fill="${BLUSH}" opacity=".7"/>
  <ellipse cx="100" cy="124" rx="3.6" ry="2.6" fill="#ff8fb0"/>
  ${face(mood)}
  ${up ? arms(mood) : ""}
</svg>`;
  return wrap.firstElementChild;
}
