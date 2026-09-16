import { useMemo } from "react";
import { request } from ".";

const PRESENCE_URLS = {
  STATUS: "/presence/status",
};

export type PresenceStatusResponse = Record<string, boolean>;

export const usePresenceService = () => {
  return useMemo(
    () => ({
      getStatus: (userIds: number[]) =>
        request<PresenceStatusResponse>("GET", PRESENCE_URLS.STATUS, null, {
          params: { userIds: userIds.join(",") },
        }),
    }),
    []
  );
};
