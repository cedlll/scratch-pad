const CACHE_NAME = "scratchpad-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/app.html",
  "/newtab.html",
  "/newtab.css",
  "/newtab.js",
  "/vendor/dompurify.min.js",
  "/src/core/sanitize.js",
  "/src/config/constants.js",
  "/fonts/dm-sans-latin.woff2",
  "/fonts/dm-sans-latin-ext.woff2",
  "/icons/icon48.png",
  "/icons/icon128.png",
  "/icons/icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch((err) => {
        console.error('[SW] Install failed:', err);
        // Still skip waiting even if cache fails - better than blocking
        return Promise.resolve();
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch((err) => {
          console.error('[SW] Fetch failed for', e.request.url, err);
          // Return cached version if fetch fails
          if (cached) {
            return cached;
          }
          // No cached version available - return error response
          return new Response('Offline and no cached version available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });

      // Return cached first (cache-first strategy) if available, otherwise fetch
      return cached || fetched;
    })
  );
});
