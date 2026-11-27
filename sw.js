const CACHE_NAME = "bubulle-blybly-shell-v1";
const APP_ROOT = new URL("./", self.registration.scope);
const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./avatar.html",
  "./avatar.css",
  "./avatar.js",
  "./manifest.webmanifest",
  "./assets/app-icon.svg",
  "./assets/bubulle.jpg",
  "./assets/blybly.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES.map(path => new URL(path, APP_ROOT).toString())))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("bubulle-blybly-") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(APP_ROOT.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(new URL("./index.html", APP_ROOT).toString(), copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(new URL("./index.html", APP_ROOT).toString())) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});