// Installable-shell service worker — static assets only, no offline reading.
//
// This app is multi-profile, and which profile's data renders is decided
// server-side per request via a cookie (not client-side), so caching HTML or
// API responses risks showing one profile's page to another on a shared
// device after a switch. Keep the cache scope to content-hashed static
// assets only; everything else goes to the network, with a stale-page
// fallback only when genuinely offline.
const CACHE_NAME = "bookhoard-shell-v1";
const STATIC_ASSET_RE = /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API routes or the reader — both are profile-scoped and
  // must always reflect live server state.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/read/")) return;

  if (STATIC_ASSET_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML navigations: network-first, so a profile switch is never masked by
  // a stale cached page — the cache fallback only engages when offline.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
