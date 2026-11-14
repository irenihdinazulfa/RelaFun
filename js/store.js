// Sesi login dan pengaturan tampilan (disimpan di perangkat ini saja).

const TOKEN_KEY = "lk_token";
const USER_KEY = "lk_user";
const SETTINGS_KEY = "lk_settings";

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* penyimpanan tidak tersedia (mode privat) */
  }
}

export const session = {
  get token() { return read(TOKEN_KEY, null); },
  get user() { return read(USER_KEY, null); },
  set(token, user) { write(TOKEN_KEY, token); write(USER_KEY, user); },
  setUser(user) { write(USER_KEY, user); },
  clear() { write(TOKEN_KEY, null); write(USER_KEY, null); },
};

const DEFAULTS = { theme: "system", bigText: false, reduceMotion: false };

export const settings = {
  get() { return { ...DEFAULTS, ...read(SETTINGS_KEY, {}) }; },
  set(patch) {
    const next = { ...this.get(), ...patch };
    write(SETTINGS_KEY, next);
    this.apply(next);
    return next;
  },
  apply(s = this.get()) {
    const root = document.documentElement;
    if (s.theme === "dark" || s.theme === "light") root.dataset.theme = s.theme;
    else delete root.dataset.theme;
    root.classList.toggle("big-text", !!s.bigText);
    root.classList.toggle("reduce-motion", !!s.reduceMotion);
  },
};
