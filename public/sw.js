/* Baydin Service Worker — offline caching + app shell
 * Strategy:
 *   - Precache app shell (/, manifest, icons) on install
 *   - Static assets (JS/CSS/fonts/images): stale-while-revalidate
 *   - API GET requests: network-first (fall back to cache)
 *   - API POST/mutations: pass through (no caching)
 *   - Navigation requests: network-first, fallback to cached "/"
 */
const VERSION = "v1.0.0";
const SHELL_CACHE = `baydin-shell-${VERSION}`;
const RUNTIME_CACHE = `baydin-runtime-${VERSION}`;
const API_CACHE = `baydin-api-${VERSION}`;

const APP_SHELL = [
  "/",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/maskable-192.png",
  "/maskable-512.png",
  "/apple-touch-icon.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Use addAll with tolerance — if any URL fails (e.g., offline.html missing),
      // we still want the SW to install.
      await Promise.allSettled(APP_SHELL.map((u) => cache.add(u)));
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              k.startsWith("baydin-") &&
              k !== SHELL_CACHE &&
              k !== RUNTIME_CACHE &&
              k !== API_CACHE
          )
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|avif|svg|ico)$/.test(
      url.pathname
    )
  );
}

function isApiGet(url, method) {
  return url.pathname.startsWith("/api/") && method === "GET";
}

// Stale-while-revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// Network-first with cache fallback
async function networkFirst(request, cacheName, timeoutMs = 4000) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // API error offline — return JSON fallback
    return new Response(
      JSON.stringify({ offline: true, message: "You are offline." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Navigation fallback — try network, fall back to cached "/"
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put("/", response.clone());
    return response;
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = (await cache.match("/")) || (await cache.match("/offline.html"));
    return (
      cached ||
      new Response(
        "<html><body><h1>Offline</h1><p>Baydin needs an internet connection for first load.</p></body></html>",
        { headers: { "Content-Type": "text/html" } }
      )
    );
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;

  // Skip Next.js HMR / dev-only
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Navigations
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Static assets
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // API GETs
  if (isApiGet(url, request.method)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch (err) {
        const cache = await caches.open(RUNTIME_CACHE);
        return (await cache.match(request)) || Response.error();
      }
    })()
  );
});

// Allow page to trigger updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHES") {
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("baydin-")).map((k) => caches.delete(k)))
    );
  }
});
