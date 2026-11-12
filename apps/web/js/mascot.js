// Kiko — maskot burung hantu orisinal RelaFun. mood: "happy" | "think" | "cheer" | "calm"

export function mascot(mood = "happy", cls = "mascot") {
  const eyes = {
    happy: '<path d="M70 92q8-9 16 0" /><path d="M114 92q8-9 16 0" />',
    cheer: '<path d="M70 92q8-9 16 0" /><path d="M114 92q8-9 16 0" />',
    calm: '<circle cx="78" cy="92" r="7" fill="#1c2033" stroke="none"/><circle cx="122" cy="92" r="7" fill="#1c2033" stroke="none"/><circle cx="80" cy="89" r="2.5" fill="#fff" stroke="none"/><circle cx="124" cy="89" r="2.5" fill="#fff" stroke="none"/>',
    think: '<circle cx="80" cy="94" r="7" fill="#1c2033" stroke="none"/><circle cx="124" cy="90" r="7" fill="#1c2033" stroke="none"/><circle cx="82" cy="91" r="2.5" fill="#fff" stroke="none"/><circle cx="126" cy="87" r="2.5" fill="#fff" stroke="none"/>',
  }[mood] || "";
  const extra = mood === "cheer"
    ? '<path d="M38 112l-14-20M162 112l14-20" stroke="#5b4636" stroke-width="10" stroke-linecap="round"/><path d="M28 70l-6-8M172 70l6-8M100 20v-8" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>'
    : mood === "think"
      ? '<circle cx="168" cy="48" r="6" fill="#c7d2fe"/><circle cx="180" cy="30" r="9" fill="#c7d2fe"/>'
      : "";
  const wrap = document.createElement("span");
  wrap.style.display = "contents";
  wrap.innerHTML = `
<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="Kiko si burung hantu">
  ${extra}
  <ellipse cx="100" cy="186" rx="52" ry="8" fill="rgba(0,0,0,.12)"/>
  <path d="M52 66 L40 30 L78 52 Z" fill="#7a5c45"/>
  <path d="M148 66 L160 30 L122 52 Z" fill="#7a5c45"/>
  <ellipse cx="100" cy="112" rx="62" ry="70" fill="#8b6a50"/>
  <ellipse cx="100" cy="132" rx="40" ry="44" fill="#f3e1c4"/>
  <path d="M80 128q4 4 8 0M96 140q4 4 8 0M112 128q4 4 8 0M88 152q4 4 8 0M104 152q4 4 8 0" stroke="#d9bf98" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="78" cy="92" r="21" fill="#fff"/>
  <circle cx="122" cy="92" r="21" fill="#fff"/>
  <g stroke="#1c2033" stroke-width="5" fill="none" stroke-linecap="round">${eyes}</g>
  <path d="M93 104 L100 116 L107 104 Z" fill="#f59e0b"/>
  <path d="M60 96 q-10 26 4 52" stroke="#6f523d" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M140 96 q10 26 -4 52" stroke="#6f523d" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M84 180 l-6 6 M92 181 l0 7 M116 180 l6 6 M108 181 l0 7" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
  <rect x="70" y="40" width="60" height="10" rx="3" fill="#4f46e5"/>
  <path d="M74 40 L100 26 L126 40 Z" fill="#4f46e5"/>
  <path d="M126 44 q10 4 8 18" stroke="#f59e0b" stroke-width="3" fill="none"/>
  <circle cx="134" cy="64" r="4" fill="#f59e0b"/>
</svg>`;
  return wrap.firstElementChild;
}
