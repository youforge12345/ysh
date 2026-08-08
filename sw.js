/* Bump this version any time site files change — forces old caches to clear
   and stops the browser from serving stale HTML/JS to returning visitors. */
const CACHE = "youforge-shell-v2";
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

/* Network-first for everything: always try to fetch the latest version of a
   file first. Only fall back to the cache if the network request fails
   (e.g. offline). This means app code (HTML/CSS/JS) never gets "stuck" on
   an old cached copy after a deploy — unlike a cache-first strategy. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
