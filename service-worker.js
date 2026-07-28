const CACHE_VERSION = "liberty-bookkeeping-v7";
const SYNC_TAG = "liberty-learning-sync";
const ASSET_VERSION = "20260728-7";

const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  `./manifest.webmanifest?v=${ASSET_VERSION}`,
  `./app-icon.svg?v=${ASSET_VERSION}`,
  "./style.css",
  "./config.js",
  "./app.js?v=4",
  `./daily-ui.css?v=${ASSET_VERSION}`,
  `./daily-ui.js?v=${ASSET_VERSION}`,
  `./pwa-install.js?v=${ASSET_VERSION}`,
  `./offline-sync.js?v=${ASSET_VERSION}`,
  `./study-sync-adapter.js?v=${ASSET_VERSION}`,
  `./learning-progress.js?v=${ASSET_VERSION}`,
  `./account-search.js?v=${ASSET_VERSION}`,
  `./entry-input-ux.js?v=${ASSET_VERSION}`,
  "./analytics.html",
  "./history.html",
  "./contents.html",
  "./quiz.html"
];

const notifyClients = async (message) => {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true
  });

  clients.forEach((client) => client.postMessage(message));
  return clients.length;
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(() => notifyClients({ type: "LIBERTY_SERVICE_WORKER_READY" }))
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./offline.html"));
        })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              event.waitUntil(
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
              );
            }
            return response;
          })
          .catch(() => cached);

        return cached || network;
      })
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag !== SYNC_TAG) return;

  event.waitUntil((async () => {
    const clientCount = await notifyClients({
      type: "LIBERTY_SYNC_REQUEST",
      source: "background-sync"
    });

    if (clientCount === 0 && self.registration.sync) {
      try {
        await self.registration.sync.register(SYNC_TAG);
      } catch (error) {
        console.debug("Background sync could not be re-registered:", error);
      }
    }
  })());
});

self.addEventListener("message", (event) => {
  const message = event.data || {};

  if (message.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (message.type === "LIBERTY_REQUEST_SYNC") {
    event.waitUntil(
      notifyClients({
        type: "LIBERTY_SYNC_REQUEST",
        source: "client-message"
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    const existing = clients.find((client) => "focus" in client);
    if (existing) {
      await existing.focus();
      existing.postMessage({ type: "LIBERTY_SYNC_REQUEST", source: "notification" });
      return;
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow("./");
    }
  })());
});
