// Wen — maskot kelinci putih orisinal RelaFun (gaya chibi). mood: "happy" | "think" | "cheer" | "calm"

const FUR = "#ffffff";
const SHADE = "#fbeff4";
const LINE = "#ecc7d6";
const INNER_EAR = "#ffc4d6";
const BLUSH = "#ffa3c2";
const BOW = "#ff6b9d";
const BOW_DARK = "#e64980";
const INK = "#3a2530";

const eye = (cx, cy, dx = 0, dy = 0) => `
  <ellipse cx="${cx}" cy="${cy}" rx="9" ry="10.5" fill="${INK}"/>
  <circle cx="${cx + 3 + dx}" cy="${cy - 4 + dy}" r="3.6" fill="#fff"/>
  <circle cx="${cx - 3 + dx}" cy="${cy + 4 + dy}" r="1.7" fill="#fff"/>`;

export function mascot(mood = "happy", cls = "mascot") {
  const eyes = {
    happy: `<path d="M71 114 q9 -11 18 0" /><path d="M111 114 q9 -11 18 0" />`,
    cheer: `<path d="M71 114 q9 -11 18 0" /><path d="M111 114 q9 -11 18 0" />`,
    calm: "",
    think: "",
  }[mood] ?? "";
  const openEyes = mood === "calm" ? eye(80, 112) + eye(120, 112)
    : mood === "think" ? eye(80, 110, -1.5, -1.5) + eye(120, 110, -1.5, -1.5) : "";

  const paws = mood === "cheer"
    ? `<path d="M72 162 q-22 -4 -32 -30" stroke="${LINE}" stroke-width="17" fill="none" stroke-linecap="round"/>
       <path d="M72 162 q-22 -4 -32 -30" stroke="${FUR}" stroke-width="12" fill="none" stroke-linecap="round"/>
       <path d="M128 162 q22 -4 32 -30" stroke="${LINE}" stroke-width="17" fill="none" stroke-linecap="round"/>
       <path d="M128 162 q22 -4 32 -30" stroke="${FUR}" stroke-width="12" fill="none" stroke-linecap="round"/>
       <circle cx="40" cy="131" r="3" fill="${INNER_EAR}"/><circle cx="160" cy="131" r="3" fill="${INNER_EAR}"/>
       <path d="M24 92l3.5 8 8 3.5-8 3.5-3.5 8-3.5-8-8-3.5 8-3.5z" fill="#ffc94d"/>
       <path d="M176 84l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffc94d"/>
       <circle cx="40" cy="70" r="3" fill="${BOW}"/><circle cx="164" cy="60" r="2.5" fill="${BOW}"/>`
    : `<ellipse cx="88" cy="160" rx="9" ry="8" fill="${FUR}" stroke="${LINE}" stroke-width="2.5"/>
       <ellipse cx="112" cy="160" rx="9" ry="8" fill="${FUR}" stroke="${LINE}" stroke-width="2.5"/>`;

  const extra = mood === "think"
    ? `<circle cx="158" cy="58" r="5" fill="#ffd6e5"/><circle cx="172" cy="40" r="9" fill="#ffd6e5"/>`
    : "";

  const wrap = document.createElement("span");
  wrap.style.display = "contents";
  wrap.innerHTML = `
<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="Wen si kelinci">
  ${extra}
  <ellipse cx="100" cy="191" rx="42" ry="6" fill="rgba(120,40,80,.12)"/>
  <!-- telinga kiri (tegak) -->
  <g transform="rotate(-10 78 58)">
    <ellipse cx="78" cy="48" rx="15" ry="38" fill="${FUR}" stroke="${LINE}" stroke-width="3"/>
    <ellipse cx="78" cy="52" rx="7.5" ry="28" fill="${INNER_EAR}"/>
  </g>
  <!-- telinga kanan (sedikit terkulai) -->
  <g transform="rotate(28 122 62)">
    <ellipse cx="122" cy="48" rx="15" ry="36" fill="${FUR}" stroke="${LINE}" stroke-width="3"/>
    <ellipse cx="122" cy="52" rx="7.5" ry="26" fill="${INNER_EAR}"/>
  </g>
  <!-- badan mungil -->
  <ellipse cx="100" cy="164" rx="34" ry="27" fill="${FUR}" stroke="${LINE}" stroke-width="3"/>
  <ellipse cx="100" cy="170" rx="18" ry="15" fill="${SHADE}"/>
  <ellipse cx="84" cy="188" rx="13" ry="7" fill="${FUR}" stroke="${LINE}" stroke-width="2.5"/>
  <ellipse cx="116" cy="188" rx="13" ry="7" fill="${FUR}" stroke="${LINE}" stroke-width="2.5"/>
  <circle cx="84" cy="188" r="2.6" fill="${INNER_EAR}"/><circle cx="116" cy="188" r="2.6" fill="${INNER_EAR}"/>
  ${mood === "cheer" ? "" : paws}
  <!-- kepala besar -->
  <ellipse cx="100" cy="114" rx="54" ry="47" fill="${FUR}" stroke="${LINE}" stroke-width="3"/>
  <ellipse cx="100" cy="134" rx="30" ry="15" fill="${SHADE}"/>
  ${openEyes}
  <g stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round">${eyes}</g>
  <ellipse cx="64" cy="128" rx="11" ry="7" fill="${BLUSH}" opacity=".75"/>
  <ellipse cx="136" cy="128" rx="11" ry="7" fill="${BLUSH}" opacity=".75"/>
  <path d="M95.5 124 q4.5 -3 9 0 q-1 5 -4.5 6 q-3.5 -1 -4.5 -6z" fill="#ff8fb0"/>
  <path d="M92 132 q4 4.5 8 0 q4 4.5 8 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  ${mood === "cheer" ? paws : ""}
  <!-- pita -->
  <g transform="translate(128 72) rotate(18)">
    <path d="M0 0 l-15 -9 q-3 9 0 18 z" fill="${BOW}"/>
    <path d="M0 0 l15 -9 q3 9 0 18 z" fill="${BOW}"/>
    <circle cx="0" cy="0" r="4.5" fill="${BOW_DARK}"/>
  </g>
</svg>`;
  return wrap.firstElementChild;
}
