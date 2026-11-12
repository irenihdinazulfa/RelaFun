// Service worker RelaFun: tampilan aplikasi tersimpan agar cepat dibuka & tetap
// tampil saat sinyal lemah. Data API selalu diambil dari jaringan (network-first).

const VERSION = "relafun-v9";
const SHELL = [
  "./", "index.html", "config.js", "manifest.webmanifest", "css/app.css",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "js/app.js", "js/api.js", "js/errors.js", "js/dom.js", "js/icons.js", "js/mascot.js", "js/store.js",
  "js/components/arrowDiagram.js", "js/components/calculator.js", "js/components/dnd.js",
  "js/components/graph.js", "js/components/reveal.js", "js/components/terms.js", "js/components/installBanner.js",
  "js/views/calculatorPage.js", "js/views/glossary.js", "js/views/home.js", "js/views/leaderboard.js",
  "js/views/lesson.js", "js/views/login.js", "js/views/menu.js", "js/views/modeler.js",
  "js/views/modules.js", "js/views/practice.js", "js/views/settings.js", "js/views/teacher.js",
  "js/local/backend.js", "js/local/ai.js", "js/local/checker.js", "js/local/mathfn.js", "js/local/modeler.js", "js/local/rational.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.includes("/api/")) {
    // Materi & glosarium disimpan cadangannya agar bisa dibaca ulang saat luring.
    const cacheable = /\/api\/(modules|glossary|tools\/modeler\/presets)/.test(url.pathname);
    e.respondWith(
      fetch(e.request).then((res) => {
        if (cacheable && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then((r) => r || new Response(
        JSON.stringify({ detail: "Sedang luring. Sambungkan internet untuk menyimpan jawaban." }),
        { status: 503, headers: { "Content-Type": "application/json" } }))),
    );
    return;
  }

  // Tampilan aplikasi: selalu periksa versi terbaru ke server (abaikan cache HTTP),
  // dan pakai cadangan dari cache hanya bila luring.
  e.respondWith(
    fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))),
  );
});
