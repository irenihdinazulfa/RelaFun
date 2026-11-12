// Papan seret-taruh yang juga bisa dipakai dengan KETUK (ketuk kartu, lalu ketuk kotak)
// dan papan ketik (Enter). Bekerja di layar sentuh maupun tetikus.

import { h, clear } from "../dom.js";

export function dndBoard({ chips, bins, onChange }) {
  const place = Object.fromEntries(chips.map((c) => [c.id, "pool"]));
  let selected = null;
  let locked = false;
  const chipEls = {};
  const zones = {};

  const root = h("div", { class: "dnd" });
  const pool = h("div", { class: "dnd-pool", dataset: { zone: "pool" }, "aria-label": "Kartu yang belum ditempatkan" });
  zones.pool = pool;
  const binsWrap = h("div", { class: "dnd-bins" });
  for (const b of bins) {
    const zone = h("div", { class: "dnd-bin", dataset: { zone: b.id }, role: "button", tabindex: 0, "aria-label": `Kotak ${b.label}` },
      h("div", { class: "bin-label" }, b.label));
    zones[b.id] = zone;
    binsWrap.append(zone);
  }
  root.append(h("p", { class: "muted small" }, "Seret kartu ke kotak yang tepat, atau ketuk kartu lalu ketuk kotaknya."), pool, binsWrap);

  for (const z of Object.values(zones)) {
    const act = (e) => {
      if (locked || e.target.closest(".dnd-chip") || !selected) return;
      move(selected, z.dataset.zone);
    };
    z.addEventListener("click", act);
    z.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(e); } });
  }

  for (const c of chips) {
    const el = h("button", { class: "dnd-chip", type: "button", dataset: { chip: c.id } }, c.label);
    chipEls[c.id] = el;
    attachDrag(el, c.id);
    el.addEventListener("click", (e) => { if (e.detail === 0 && !locked) select(c.id); }); // papan ketik
  }

  function select(id) {
    selected = selected === id ? null : id;
    sync();
  }

  function move(id, zoneId) {
    place[id] = zoneId;
    selected = null;
    sync();
    onChange?.(mapping());
  }

  function mapping() {
    const m = {};
    for (const [id, z] of Object.entries(place)) if (z !== "pool") m[id] = z;
    return m;
  }

  function sync() {
    for (const [id, el] of Object.entries(chipEls)) {
      const zone = zones[place[id]];
      if (el.parentElement !== zone) zone.append(el);
      el.classList.toggle("selected", selected === id);
    }
    for (const z of Object.values(zones)) z.classList.toggle("armed", !!selected);
    pool.style.display = Object.values(place).some((z) => z === "pool") || selected ? "" : "none";
  }

  function zoneAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el?.closest?.("[data-zone]");
  }

  function attachDrag(el, id) {
    let start = null;
    let ghost = null;
    let over = null;
    el.addEventListener("pointerdown", (e) => {
      if (locked || e.button > 0) return;
      start = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!start) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) {
        ghost = el.cloneNode(true);
        ghost.classList.add("dnd-ghost");
        document.body.append(ghost);
        el.style.opacity = ".35";
      }
      if (ghost) {
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        const z = zoneAt(e.clientX, e.clientY);
        if (over !== z) { over?.classList.remove("over"); over = z; over?.classList.add("over"); }
      }
    });
    const end = (e) => {
      if (!start) return;
      if (ghost) {
        const z = zoneAt(e.clientX, e.clientY);
        ghost.remove();
        ghost = null;
        el.style.opacity = "";
        over?.classList.remove("over");
        over = null;
        if (z) move(id, z.dataset.zone);
      } else if (e.type === "pointerup") {
        select(id);
      }
      start = null;
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  sync();
  return {
    el: root,
    getMapping: mapping,
    mark(wrongIds = [], rightIds = []) {
      for (const [id, el] of Object.entries(chipEls)) {
        el.classList.toggle("wrong", wrongIds.includes(id));
        el.classList.toggle("right", rightIds.includes(id));
      }
    },
    lock() { locked = true; selected = null; sync(); },
    reset() { for (const id of Object.keys(place)) place[id] = "pool"; this.mark(); sync(); },
  };
}

export function clearBoard(el) { clear(el); }
