import { useMemo } from "react";
import { request } from ".";

const PUSH_URLS = {
  VAPID_PUBLIC_KEY: "/push/vapid-public-key",
};

// Mirrors com.eldersphere.dtos.Notification.VapidPublicKeyResponse. Public, no-auth
// endpoint — the frontend fetches it fresh at runtime rather than hardcoding a value,
// since a dev-generated VAPID keypair changes on backend restart unless env-pinned.
export interface VapidPublicKeyResponse {
  publicKey: string;
}

export const usePushService = () => {
  return useMemo(
    () => ({
      getVapidPublicKey: () => request<VapidPublicKeyResponse>("GET", PUSH_URLS.VAPID_PUBLIC_KEY),
    }),
    []
  );
};
