// Game "Lompat Wen": jawab soal Relasi & Fungsi untuk membantu Wen melompati 10 batu.
// Ramah CLT: tanpa batas waktu (bawaan), satu soal per layar, penjelasan singkat saat salah.

import { h, clear } from "../dom.js";
import { icon } from "../icons.js";
import { mascot } from "../mascot.js";
import { arrowDiagram } from "../components/arrowDiagram.js";
import { valueTable } from "./lesson.js";
import { LEVELS, makeRound } from "../game/generators.js";

const STEPS = 10;
const HEARTS = 3;
const KILAT_SECONDS = 15;

// ---------- penyimpanan rekor (per akun, di perangkat) ----------
function storeKey(ctx) { return `rf_game_v1_${ctx.user?.id ?? "tamu"}`; }
function loadSave(ctx) {
  try { return { levels: {}, carrots: 0, sound: true, kilat: false, ...JSON.parse(localStorage.getItem(storeKey(ctx)) || "{}") }; }
  catch { return { levels: {}, carrots: 0, sound: true, kilat: false }; }
}
function saveSave(ctx, s) { try { localStorage.setItem(storeKey(ctx), JSON.stringify(s)); } catch { /* abaikan */ } }

// ---------- suara kecil (Web Audio) ----------
let audio = null;
function tone(freq, start, dur, type = "sine", vol = 0.08) {
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, audio.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + dur);
  o.connect(g).connect(audio.destination);
  o.start(audio.currentTime + start);
  o.stop(audio.currentTime + start + dur + 0.02);
}
const SFX = {
  right: () => { tone(660, 0, 0.12); tone(880, 0.1, 0.18); },
  wrong: () => { tone(200, 0, 0.25, "square", 0.05); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.2)),
};

const stars = (n, max = 3) => "★".repeat(n) + "☆".repeat(max - n);
const reduceMotion = () => document.documentElement.classList.contains("reduce-motion")
  || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function gameView(main, _p, ctx) {
  const save = loadSave(ctx);
  const root = h("div", { class: "game" });
  main.append(root);
  window.__rfGame = { state: null };

  const play = (fx) => { try { if (save.sound) SFX[fx](); } catch { /* audio tidak tersedia */ } };

  // =========================================================== LOBI
  function lobby() {
    clear(root);
    const unlocked = (lv) => lv.id === 1 || (save.levels[lv.id - 1]?.stars || 0) >= 1;
    const toggle = (label, key, ic) => {
      const input = h("input", { type: "checkbox", role: "switch", "aria-label": label });
      input.checked = !!save[key];
      input.onchange = () => { save[key] = input.checked; saveSave(ctx, save); };
      return h("label", { class: "game-toggle" }, h("span", null, ic, " ", label), h("span", { class: "toggle" }, input, h("span")));
    };
    root.append(
      h("section", { class: "game-hero" },
        h("div", null,
          h("h1", null, "Lompat Wen 🥕"),
          h("p", null, "Bantu Wen melompati 10 batu! Setiap batu berisi satu soal. Jawab benar untuk dapat wortel, hati-hati, nyawamu cuma 3."),
          h("div", { class: "row" }, h("span", { class: "chip primary" }, `🥕 ${save.carrots} wortel terkumpul`))),
        mascot("cheer")),
      h("div", { class: "game-levels" }, LEVELS.map((lv) => {
        const rec = save.levels[lv.id] || {};
        const open = unlocked(lv);
        return h("article", { class: `card game-level${open ? "" : " locked"}` },
          h("div", { class: "game-level-emoji", "aria-hidden": "true" }, open ? lv.emoji : "🔒"),
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("div", { class: "muted small" }, `Level ${lv.id} · ${lv.difficulty}`),
            h("h3", { style: { margin: "2px 0" } }, lv.name),
            h("div", { class: "small muted" }, lv.desc),
            h("div", { class: "game-stars", "aria-label": `${rec.stars || 0} dari 3 bintang` }, stars(rec.stars || 0),
              rec.best ? h("span", { class: "muted small" }, `  rekor ${rec.best}`) : null)),
          open
            ? h("button", { class: "btn", type: "button", onclick: () => start(lv.id) }, icon("play"), "Main")
            : h("span", { class: "muted small", style: { maxWidth: "120px" } }, "Dapatkan 1 ★ di level sebelumnya"));
      })),
      h("section", { class: "card game-settings" },
        toggle(`Mode Kilat (${KILAT_SECONDS} detik per soal, bonus kecepatan)`, "kilat", "⏱"),
        toggle("Suara", "sound", "🔊")),
      h("p", { class: "muted small", style: { textAlign: "center" } }, "Tips: tekan angka 1–4 di papan ketik untuk memilih jawaban."));
  }

  // =========================================================== BERMAIN
  let st = null;
  let timer = null;
  let keyHandler = null;

  function start(levelId) {
    st = { level: levelId, qs: makeRound(levelId, STEPS), i: 0, hearts: HEARTS, score: 0, combo: 0, correct: 0,
      results: [], locked: false, kilat: !!save.kilat };
    window.__rfGame.state = st;
    renderPlay();
  }

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function renderPlay() {
    stopTimer();
    clear(root);
    const q = st.qs[st.i];
    const lv = LEVELS.find((l) => l.id === st.level);

    const hearts = h("div", { class: "game-hearts", "aria-label": `${st.hearts} nyawa` },
      Array.from({ length: HEARTS }, (_, k) => h("span", { class: k < st.hearts ? "" : "lost" }, k < st.hearts ? "❤️" : "🤍")));
    const head = h("div", { class: "game-head" },
      hearts,
      h("div", { class: "game-score" }, "🥕 ", h("b", null, st.score)),
      st.combo >= 2 ? h("span", { class: "chip primary game-combo" }, `Combo ×${st.combo}`) : null,
      h("button", { class: "btn ghost small", type: "button", onclick: () => { stopTimer(); lobby(); } }, icon("x"), "Keluar"));

    // Jalur batu + Wen
    const path = h("div", { class: "game-path", "aria-hidden": "true" });
    for (let k = 0; k < STEPS; k++) {
      const r = st.results[k];
      path.append(h("div", { class: `stone${k === st.i ? " now" : ""}${r === true ? " ok" : r === false ? " miss" : ""}` },
        r === true ? "🥕" : r === false ? "💧" : k === STEPS - 1 ? "🏁" : ""));
    }
    const wen = h("div", { class: "game-wen" }, mascot(st.combo >= 3 ? "wink" : "happy", "mascot"));
    const setMood = (m) => wen.replaceChildren(mascot(m, "mascot"));
    wen.style.left = `calc(${(st.i + 0.5) * (100 / STEPS)}% - 22px)`;
    const track = h("div", { class: "game-track" }, wen, path);

    const timerBar = st.kilat ? h("div", { class: "game-timer" }, h("span")) : null;

    const card = h("section", { class: "card game-q" },
      h("div", { class: "muted small" }, `${lv.emoji} ${lv.name} · Soal ${st.i + 1} dari ${STEPS}`),
      h("div", { class: "game-prompt" }, q.prompt));
    if (q.visual?.type === "diagram") card.append(arrowDiagram(q.visual.diagram, { mode: "static" }).el);
    if (q.visual?.type === "table") card.append(valueTable(q.visual));
    if (q.visual?.type === "text") card.append(h("div", { class: "game-visual-text" }, q.visual.text));

    const fb = h("div", { "aria-live": "polite" });
    const opts = h("div", { class: `game-options${q.options.length === 2 ? " two" : ""}` },
      q.options.map((o, k) => h("button", { class: "game-opt", type: "button", dataset: { k }, onclick: () => answer(k) },
        h("span", { class: "game-opt-key" }, String(k + 1)), h("span", null, o))));
    card.append(opts, fb);
    root.append(...[head, track, timerBar, card].filter(Boolean));

    if (keyHandler) document.removeEventListener("keydown", keyHandler);
    keyHandler = (e) => {
      if (!document.body.contains(root)) { document.removeEventListener("keydown", keyHandler); return; }
      const n = Number(e.key);
      if (!st.locked && n >= 1 && n <= q.options.length) answer(n - 1);
      else if (st.locked && e.key === "Enter") root.querySelector(".game-next")?.click();
    };
    document.addEventListener("keydown", keyHandler);

    if (st.kilat) {
      const t0 = Date.now();
      const bar = timerBar.firstChild;
      timer = setInterval(() => {
        const left = KILAT_SECONDS - (Date.now() - t0) / 1000;
        bar.style.width = `${Math.max(0, (left / KILAT_SECONDS) * 100)}%`;
        st.timeLeft = left;
        if (left <= 0) { stopTimer(); answer(-1); }
      }, 100);
    }

    function answer(k) {
      if (st.locked) return;
      st.locked = true;
      stopTimer();
      const ok = k === q.answer;
      const btns = [...opts.children];
      btns.forEach((b) => { b.disabled = true; });
      btns[q.answer].classList.add("right");
      if (k >= 0 && !ok) btns[k].classList.add("wrong");
      st.results[st.i] = ok;
      if (ok) {
        st.combo += 1;
        st.correct += 1;
        let gain = 10;
        if (st.combo >= 3) gain += 5;
        if (st.kilat && st.timeLeft > 0) gain += Math.ceil(st.timeLeft / 3);
        st.score += gain;
        play("right");
        clear(fb).append(h("div", { class: "game-pop" }, `Benar! +${gain} 🥕`, st.combo >= 3 ? `  Combo ×${st.combo}!` : ""));
        setMood(st.combo >= 3 ? "love" : "cheer");
        wen.classList.add("hop");
        if (st.i < STEPS - 1) wen.style.left = `calc(${(st.i + 1.5) * (100 / STEPS)}% - 22px)`;
        setTimeout(next, reduceMotion() ? 500 : 950);
      } else {
        st.combo = 0;
        st.hearts -= 1;
        play("wrong");
        navigator.vibrate?.(40);
        card.classList.add("shake");
        setMood(k < 0 ? "surprised" : "sad");
        clear(fb).append(h("div", { class: "alert bad feedback" }, icon("alert"),
          h("div", null, h("div", { class: "alert-title" }, k < 0 ? "Waktu habis!" : "Belum tepat"), h("p", null, q.explain))),
          h("div", { class: "row", style: { justifyContent: "flex-end", marginTop: "10px" } },
            h("button", { class: "btn game-next", type: "button", onclick: next }, st.hearts > 0 ? "Lanjut" : "Lihat hasil", icon("arrowRight"))));
        hearts.children[st.hearts]?.classList.add("lost");
        if (hearts.children[st.hearts]) hearts.children[st.hearts].textContent = "🤍";
        root.querySelector(".game-next")?.focus();
      }
    }

    function next() {
      st.locked = false;
      if (st.hearts <= 0 || st.i >= STEPS - 1) return finish();
      st.i += 1;
      renderPlay();
    }
  }

  // =========================================================== HASIL
  function finish() {
    stopTimer();
    if (keyHandler) document.removeEventListener("keydown", keyHandler);
    const done = st.hearts > 0;
    const nStars = !done ? 0 : st.correct >= 9 ? 3 : st.correct >= 7 ? 2 : 1;
    const rec = save.levels[st.level] || { best: 0, stars: 0 };
    const newBest = st.score > (rec.best || 0);
    save.levels[st.level] = { best: Math.max(rec.best || 0, st.score), stars: Math.max(rec.stars || 0, nStars) };
    save.carrots += st.correct;
    saveSave(ctx, save);
    const nextLv = LEVELS.find((l) => l.id === st.level + 1);
    const nextOpen = nextLv && (save.levels[st.level]?.stars || 0) >= 1;
    if (nStars >= 2) { play("win"); if (!reduceMotion()) confetti(); }

    clear(root).append(h("section", { class: "card game-result" },
      mascot(!done ? "sad" : nStars === 3 ? "love" : nStars === 2 ? "cheer" : "happy"),
      h("h2", null, !done ? "Yah, nyawa Wen habis!" : nStars === 3 ? "Luar biasa! 🎉" : nStars === 2 ? "Hebat! 🎉" : "Berhasil sampai finis!"),
      h("div", { class: "game-stars big", "aria-label": `${nStars} dari 3 bintang` }, stars(nStars)),
      h("p", null, `Benar ${st.correct} dari ${st.results.length} soal · Skor `, h("b", null, `${st.score} 🥕`)),
      newBest && st.score > 0 ? h("p", { class: "chip primary" }, "🏆 Rekor baru!") : null,
      !done ? h("p", { class: "muted small" }, "Tidak apa-apa! Baca lagi penjelasannya di materi, lalu coba lagi.") : null,
      h("div", { class: "row", style: { justifyContent: "center", marginTop: "10px" } },
        h("button", { class: "btn secondary", type: "button", onclick: lobby }, icon("arrowLeft"), "Pilih level"),
        h("button", { class: "btn", type: "button", onclick: () => start(st.level) }, icon("restart"), "Main lagi"),
        nextOpen ? h("button", { class: "btn", type: "button", onclick: () => start(nextLv.id) }, `Level ${nextLv.id}`, icon("arrowRight")) : null)));
  }

  function confetti() {
    const box = h("div", { class: "confetti", "aria-hidden": "true" });
    const colors = ["#ffa8c8", "#ffe27a", "#a9d6ff", "#ffd1b8", "#ff8fb5"];
    for (let k = 0; k < 36; k++) {
      const p = h("i");
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[k % colors.length];
      p.style.animationDelay = `${Math.random() * 0.6}s`;
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.append(p);
    }
    document.body.append(box);
    setTimeout(() => box.remove(), 2600);
  }

  lobby();
}
