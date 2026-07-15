const CACHE_PREFIX = "vancy-learn-english";
const CACHE_VERSION = "2026-07-15";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const APP_SCOPE = new URL(self.registration.scope);
const INDEX_URL = new URL("./index.html", APP_SCOPE).href;
const ROOT_URL = new URL("./", APP_SCOPE).href;
const SHELL_URLS = [
  ROOT_URL,
  INDEX_URL,
  new URL("./manifest.webmanifest", APP_SCOPE).href,
  new URL("./app-icon.svg", APP_SCOPE).href
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    cacheApplicationShell()
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
            .filter((cacheName) => cacheName !== SHELL_CACHE && cacheName !== RUNTIME_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (!isAppRequest(requestUrl) || requestUrl.pathname.endsWith("/sw.js")) return;

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheApplicationShell() {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const indexResponse = await fetch(INDEX_URL, { cache: "reload" });
    if (isCacheableResponse(indexResponse)) {
      const html = await indexResponse.clone().text();
      await cache.put(INDEX_URL, indexResponse.clone());
      await cache.put(ROOT_URL, indexResponse.clone());
      await cacheUrls(cache, [...SHELL_URLS, ...collectAssetUrls(html)]);
      return;
    }
  } catch {}

  await cacheUrls(cache, SHELL_URLS);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match(INDEX_URL)) ||
      (await caches.match(ROOT_URL)) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request, { ignoreSearch: true });
  if (cachedResponse) return cachedResponse;

  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function cacheUrls(cache, urls) {
  const uniqueUrls = [...new Set(urls)];
  await Promise.all(uniqueUrls.map((url) => cache.add(url).catch(() => undefined)));
}

function collectAssetUrls(html) {
  const urls = [];
  const assetPattern = /\b(?:href|src)=["']([^"']+)["']/g;
  let match = assetPattern.exec(html);

  while (match) {
    const value = match[1];
    if (!value.startsWith("data:")) {
      const assetUrl = new URL(value, APP_SCOPE);
      if (isAppRequest(assetUrl)) urls.push(assetUrl.href);
    }
    match = assetPattern.exec(html);
  }

  return urls;
}

function isAppRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith(APP_SCOPE.pathname);
}

function isCacheableResponse(response) {
  return response.ok && response.type === "basic";
}
