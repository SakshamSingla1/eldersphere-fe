import { useMemo } from "react";
import { request } from ".";
import type { ActiveThemePalette } from "../utils/theme";
import type { ColorThemeStatusEnum } from "../utils/enums";

const COLOR_THEME_URLS = {
  BASE: "/color-themes",
  BY_ID: (id: number) => `/color-themes/${id}`,
};

// Mirrors com.eldersphere.dtos.ColorTheme.ColorThemeResponseDTO — one catalog entry (a
// selectable preset), including SUPER_ADMIN-managed custom ones.
export interface ColorThemePreset {
  id: number;
  name: string;
  palette: ActiveThemePalette;
  isDefault: boolean;
  status: ColorThemeStatusEnum;
}

// Mirrors com.eldersphere.dtos.ColorTheme.ColorThemeRequestDTO — the create/update body
// (SUPER_ADMIN only).
export interface ColorThemeRequestPayload {
  name: string;
  palette: ActiveThemePalette;
  isDefault: boolean;
  status?: ColorThemeStatusEnum;
}

// Catalog of dashboard color-theme presets — listing is open to any authenticated user
// (powers the picker in AccountSettings); create/update/delete are SUPER_ADMIN only.
export const useColorThemeService = () => {
  return useMemo(
    () => ({
      listActive: () => request<ColorThemePreset[]>("GET", COLOR_THEME_URLS.BASE),
      getById: (id: number) => request<ColorThemePreset>("GET", COLOR_THEME_URLS.BY_ID(id)),
      create: (payload: ColorThemeRequestPayload) => request<ColorThemePreset>("POST", COLOR_THEME_URLS.BASE, payload),
      update: (id: number, payload: ColorThemeRequestPayload) =>
        request<ColorThemePreset>("PUT", COLOR_THEME_URLS.BY_ID(id), payload),
      remove: (id: number) => request<string>("DELETE", COLOR_THEME_URLS.BY_ID(id)),
    }),
    []
  );
};
