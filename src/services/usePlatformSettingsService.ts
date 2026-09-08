import { useMemo } from "react";
import { request } from ".";

const PLATFORM_SETTINGS_URL = "/platform-settings";

export interface PlatformSettingsDTO {
  platformName?: string;
  supportEmail?: string;
  supportPhone?: string;
  emergencyResponseSlaMinutes?: number;
}

export const usePlatformSettingsService = () => {
  return useMemo(
    () => ({
      get: () => request<PlatformSettingsDTO>("GET", PLATFORM_SETTINGS_URL),
      update: (payload: PlatformSettingsDTO) => request<PlatformSettingsDTO>("PUT", PLATFORM_SETTINGS_URL, payload),
    }),
    []
  );
};
