// Service worker Pramuka Mars: app shell cache-first, ubin Mars Trek disimpan saat dilihat.
const VERSI = "pramuka-mars-v1";
const SHELL = ["./", "index.html", "style.css", "app.js", "misi.js", "manifest.webmanifest",
  "vendor/leaflet.js", "vendor/leaflet.css", "icons/icon-192.png", "icons/icon-512.png"];
const UBIN = "pramuka-mars-ubin";
const MAKS_UBIN = 1500;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSI && k !== UBIN).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname === "trek.nasa.gov") {
    e.respondWith(caches.open(UBIN).then(async (c) => {
      const lama = await c.match(e.request);
      if (lama) return lama;
      try {
        const baru = await fetch(e.request);
        if (baru.ok || baru.type === "opaque") {
          c.put(e.request, baru.clone());
          c.keys().then((ks) => { if (ks.length > MAKS_UBIN) ks.slice(0, ks.length - MAKS_UBIN).forEach((k) => c.delete(k)); });
        }
        return baru;
      } catch (err) {
        return new Response("", { status: 504 });
      }
    }));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      const salin = res.clone(); caches.open(VERSI).then((c) => c.put(e.request, salin)); return res;
    }).catch(() => caches.match("index.html"))));
  }
});
