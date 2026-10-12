// Only deploy-owned static bytes belong in this shared cache. App documents,
// user media, API responses and URL query variants are always network-only.
const CACHE_NAME = "pawpal-public-v1";
const LEGACY_CACHE_PREFIX = "pawpal-shell-";
const PUBLIC_ASSETS = [
  "/offline.html",
  "/assets/logos/pawpal-logo-light.svg",
  "/assets/logos/pawpal-logo-dark.svg",
  "/manifest.webmanifest",
  "/images/app-mockup.png",
];
const PUBLIC_PATHS = new Set(PUBLIC_ASSETS);

function isPublicRequest(request) {
  const url = new URL(request.url);
  return request.method === "GET" && url.origin === self.location.origin &&
    !url.search && !request.headers.has("authorization") &&
    !request.headers.has("range") &&
    !["no-store", "no-cache", "reload"].includes(request.cache) &&
    !/no-store|no-cache/i.test(request.headers.get("cache-control") || "") &&
    (PUBLIC_PATHS.has(url.pathname) || url.pathname.startsWith("/_next/static/"));
}

function isPublicResponse(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque" || response.redirected) return false;
  if (response.url && response.url !== request.url) return false;
  if (/private|no-store|no-cache/i.test(response.headers.get("cache-control") || "")) return false;
  if (response.headers.has("set-cookie")) return false;
  if (/(^|,)\s*(cookie|authorization|\*)\s*(,|$)/i.test(response.headers.get("vary") || "")) return false;
  const type = response.headers.get("content-type") || "";
  return new URL(request.url).pathname === "/offline.html" ||
    !/text\/html|application\/(json|xhtml\+xml)|text\/x-component/i.test(type);
}

async function clearLegacyCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith(LEGACY_CACHE_PREFIX) ||
    (key.startsWith("pawpal-public-") && key !== CACHE_NAME)).map((key) => caches.delete(key)));
}

async function cachePublicAsset(request, response) {
  const cache = await caches.open(CACHE_NAME);
  if (isPublicRequest(request) && isPublicResponse(request, response)) {
    await cache.put(request, response.clone());
  } else {
    await cache.delete(request);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    await Promise.all(PUBLIC_ASSETS.map(async (path) => {
      const request = new Request(new URL(path, self.location.origin), { credentials: "omit" });
      try {
        await cachePublicAsset(request, await fetch(request, { cache: "reload" }));
      } catch {
        // A missing optional asset must not keep the unsafe old worker active.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await clearLegacyCaches();
    if ("navigationPreload" in self.registration) await self.registration.navigationPreload.disable();
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_AUTH_CACHE") {
    event.waitUntil(clearLegacyCaches().then(() => event.ports?.[0]?.postMessage({ cleared: true })));
  }
});

async function offlineDocument() {
  const request = new Request(new URL("/offline.html", self.location.origin));
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(request);
  if (isPublicResponse(request, response)) return response;
  await cache.delete(request);
  return new Response(`<!doctype html><html lang="en"><title>PawPal is offline</title><h1>You are offline</h1><p>Reconnect to load PawPal.</p></html>`, {
    status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

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
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // No app HTML is ever copied into CacheStorage, even if a server accidentally
  // labels a protected page public. Auth, profile, checkout and locale routes
  // therefore have the same generic offline fallback.
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith((async () => {
      try {
        // Do not reuse navigation preload: its HTTP-cache policy cannot be
        // replaced with this explicit no-store request.
        return await fetch(request, { cache: "no-store" });
      } catch {
        return offlineDocument();
      }
    })());
    return;
  }
  if (!isPublicRequest(request)) return;

  // Revalidate before serving so a newly private/no-store response also removes
  // an older public copy. Only genuine network failure can use the public cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    let response;
    try {
      response = await fetch(request, { credentials: "omit", cache: "no-store" });
    } catch {
      const cached = await cache.match(request);
      if (isPublicResponse(request, cached)) return cached;
      await cache.delete(request);
      return Response.error();
    }
    try {
      await cachePublicAsset(request, response);
    } catch {
      // Storage failures never replace a fresh response with an older copy.
    }
    return response;
  })());
});
