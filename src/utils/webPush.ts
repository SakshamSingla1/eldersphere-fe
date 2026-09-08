// Web Push helpers — VAPID key conversion and small feature-detection guards used by the
// "Enable push notifications" toggle (see NotificationPreferences organism). Kept out of
// that component so the (well-known but easy to get subtly wrong) base64url -> Uint8Array
// conversion has one tested home.

/**
 * Converts a VAPID public key delivered as a base64url string (the shape
 * `GET /push/vapid-public-key` returns, and the shape `PushManager.subscribe` requires as
 * `applicationServerKey`) into the `Uint8Array` the Push API actually wants.
 *
 * Standard recipe (see the Web Push / web.dev docs): base64url uses `-`/`_` instead of
 * `+`/`/` and typically omits padding, so both are restored before the browser's built-in
 * `atob` does the heavy lifting.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Shape a browser's `PushSubscription.toJSON()` produces — mirrors PushSubscriptionRequest on the backend. */
export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
