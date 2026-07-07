const CACHE_NAME = "pawpal-shell-v7-next-primitives";
const SHELL_ASSETS = [
  "/",
  "/globe",
  "/profile",
  "/store",
  "/offline.html",
  "/assets/logos/pawpal-logo-light.svg",
  "/assets/logos/pawpal-logo-dark.svg",
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

function normalizeNotificationUrl(value) {
  try {
    const url = new URL(typeof value === "string" && value ? value : "/", self.location.origin);
    if (url.origin !== self.location.origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = typeof payload.title === "string" && payload.title.trim() ? payload.title.trim() : "PawPal";
  const body = typeof payload.body === "string" ? payload.body : "";
  const url = normalizeNotificationUrl(payload.url);

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/assets/logos/pawpal-logo-light.svg",
      badge: "/assets/logos/pawpal-logo-light.svg",
      data: { url },
      tag: "pawpal-notification",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = normalizeNotificationUrl(event.notification.data?.url);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const sameOriginWindows = windows.filter((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      const matchingWindow = sameOriginWindows.find((client) => {
        const clientUrl = new URL(client.url);
        return `${clientUrl.pathname}${clientUrl.search}${clientUrl.hash}` === url;
      });
      if (matchingWindow?.focus) {
        await matchingWindow.focus();
        return;
      }

      const reusableWindow = sameOriginWindows.find((client) => "navigate" in client);
      if (reusableWindow) {
        await reusableWindow.navigate(url);
        await reusableWindow.focus();
        return;
      }

      await self.clients.openWindow(url);
    })()
  );
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
