/// <reference lib="webworker" />
// Custom service worker source (vite-plugin-pwa `strategies: "injectManifest"` — see
// vite.config.ts). Two responsibilities beyond the generated app-shell precache:
//  1. A true offline fallback for hard navigations (NetworkOnly + a precached fallback
//     page) — no full offline data sync, matching the brief's explicit scope.
//  2. Real Web Push handling: showing a notification on a `push` event, and focusing/
//     opening the app on `notificationclick` — this is what makes the subscription
//     registered via pushManager.subscribe() (see useWebPushSubscription.ts) actually
//     result in something the user sees, if a real push service ever delivers one.

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

// Injected at build time with the list of hashed build assets (see vite-plugin-pwa docs
// for `injectManifest` — this placeholder is required to appear literally once).
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkOnly({
    plugins: [
      {
        handlerDidError: async () => (await caches.match("/offline.html")) ?? Response.error(),
      },
    ],
  })
);

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "ElderSphere";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "You have a new notification.",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => "focus" in c) as WindowClient | null;
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (event) => {
  // Lets the page ask a waiting SW to activate immediately (registerType: "autoUpdate"
  // already does this automatically, but kept for a manual "Update available" affordance
  // if one is added later without needing another SW change).
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
