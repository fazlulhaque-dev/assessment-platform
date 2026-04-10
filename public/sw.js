// Service Worker for Offline Mode
// Caches exam pages and API responses for offline resilience

const CACHE_NAME = "assess-platform-v1";
const STATIC_ASSETS = ["/", "/candidate-login", "/employer-login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful GET responses for exam details
          if (
            event.request.method === "GET" &&
            url.pathname.includes("/details") &&
            response.ok
          ) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request).then(
            (cached) =>
              cached ??
              new Response(
                JSON.stringify({ error: "Offline - no cached data" }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                },
              ),
          );
        }),
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached ?? fetch(event.request)),
  );
});
