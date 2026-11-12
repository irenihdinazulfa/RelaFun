// Kuro — maskot kelinci orisinal RelaFun. mood: "happy" | "think" | "cheer" | "calm"

const FUR = "#5b5466";       // abu-abu gelap ("kuro" = hitam)
const FUR_LIGHT = "#6e6779";
const CREAM = "#fff4f7";
const INNER_EAR = "#ffb3c9";
const BLUSH = "#ff9fbf";
const PINK = "#e64980";
const PINK_DARK = "#c2255c";
const INK = "#1f1a24";

export function mascot(mood = "happy", cls = "mascot") {
  const eyes = {
    happy: `<path d="M74 104q8-10 16 0" /><path d="M110 104q8-10 16 0" />`,
    cheer: `<path d="M74 104q8-10 16 0" /><path d="M110 104q8-10 16 0" />`,
    calm: `<circle cx="82" cy="102" r="7.5" fill="${INK}" stroke="none"/><circle cx="118" cy="102" r="7.5" fill="${INK}" stroke="none"/>
           <circle cx="84.5" cy="99" r="2.6" fill="#fff" stroke="none"/><circle cx="120.5" cy="99" r="2.6" fill="#fff" stroke="none"/>`,
    think: `<circle cx="84" cy="99" r="7.5" fill="${INK}" stroke="none"/><circle cx="120" cy="99" r="7.5" fill="${INK}" stroke="none"/>
            <circle cx="86.5" cy="96" r="2.6" fill="#fff" stroke="none"/><circle cx="122.5" cy="96" r="2.6" fill="#fff" stroke="none"/>`,
  }[mood] || "";

  const arms = mood === "cheer"
    ? `<path d="M58 150 q-22 -16 -20 -40" stroke="${FUR}" stroke-width="13" fill="none" stroke-linecap="round"/>
       <path d="M142 150 q22 -16 20 -40" stroke="${FUR}" stroke-width="13" fill="none" stroke-linecap="round"/>
       <circle cx="38" cy="108" r="8" fill="${FUR_LIGHT}"/><circle cx="162" cy="108" r="8" fill="${FUR_LIGHT}"/>
       <path d="M24 78l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#ffc94d"/><path d="M176 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffc94d"/>`
    : `<ellipse cx="74" cy="160" rx="11" ry="9" fill="${FUR_LIGHT}"/><ellipse cx="126" cy="160" rx="11" ry="9" fill="${FUR_LIGHT}"/>`;

  const extra = mood === "think"
    ? `<circle cx="160" cy="62" r="6" fill="#ffd6e5"/><circle cx="174" cy="44" r="10" fill="#ffd6e5"/>`
    : "";

  const wrap = document.createElement("span");
  wrap.style.display = "contents";
  wrap.innerHTML = `
<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="Kuro si kelinci">
  ${extra}
  <ellipse cx="100" cy="190" rx="50" ry="7" fill="rgba(0,0,0,.12)"/>
  <g transform="rotate(-14 76 50)">
    <ellipse cx="76" cy="50" rx="17" ry="44" fill="${FUR}"/>
    <ellipse cx="76" cy="54" rx="8.5" ry="32" fill="${INNER_EAR}"/>
  </g>
  <g transform="rotate(14 124 50)">
    <ellipse cx="124" cy="50" rx="17" ry="44" fill="${FUR}"/>
    <ellipse cx="124" cy="54" rx="8.5" ry="32" fill="${INNER_EAR}"/>
  </g>
  <ellipse cx="100" cy="158" rx="46" ry="36" fill="${FUR}"/>
  <ellipse cx="100" cy="164" rx="27" ry="24" fill="${CREAM}"/>
  <ellipse cx="80" cy="186" rx="14" ry="7" fill="${FUR_LIGHT}"/>
  <ellipse cx="120" cy="186" rx="14" ry="7" fill="${FUR_LIGHT}"/>
  ${arms}
  <circle cx="100" cy="108" r="48" fill="${FUR}"/>
  <ellipse cx="100" cy="124" rx="28" ry="20" fill="${CREAM}"/>
  <g stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round">${eyes}</g>
  <ellipse cx="70" cy="122" rx="9" ry="6" fill="${BLUSH}" opacity=".85"/>
  <ellipse cx="130" cy="122" rx="9" ry="6" fill="${BLUSH}" opacity=".85"/>
  <path d="M95 115 h10 l-5 6 z" fill="#ff7aa2" stroke="#ff7aa2" stroke-width="2" stroke-linejoin="round"/>
  <path d="M91 125 q4.5 5 9 0 q4.5 5 9 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="96" y="127" width="8" height="7" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="1.2"/>
  <path d="M70 66 L100 52 L130 66 L100 78 Z" fill="${PINK}"/>
  <rect x="84" y="68" width="32" height="10" rx="3" fill="${PINK_DARK}"/>
  <path d="M130 66 q8 6 6 20" stroke="#ffc94d" stroke-width="3" fill="none"/>
  <circle cx="136" cy="88" r="4" fill="#ffc94d"/>
</svg>`;
  return wrap.firstElementChild;
}
