const CACHE_NAME = "pawpal-shell-v5-no-global-install-banner";
const SHELL_ASSETS = [
  "/",
  "/globe",
  "/profile",
  "/store",
  "/offline.html",
  "/pawpal_favicon.svg",
  "/pawpal_icon.svg",
  "/pawpal_icon_white.svg",
  "/pawpal_logo_horizontal.svg",
  "/manifest.webmanifest",
  "/images/app-mockup.png"
];

const STATIC_DESTINATIONS = new Set(["font", "image", "manifest", "script", "style"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          const response = preloadResponse || await fetch(request);
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match("/offline.html");
        }
      })()
    );
    return;
  }

  if (!STATIC_DESTINATIONS.has(request.destination) && !url.pathname.startsWith("/_next/static/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached || Response.error());

      return cached || networkFetch;
    })
  );
});
