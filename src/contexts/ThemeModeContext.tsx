import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { buildTheme, defaultColorThemePalette, type ActiveColorTheme, type ThemeModeName } from "../utils/theme";

export type { ActiveColorTheme } from "../utils/theme";

const STORAGE_KEY = "eldersphere-theme-mode";
const COLOR_THEME_STORAGE_PREFIX = "eldersphere-color-theme-";

interface ThemeModeContextValue {
  mode: ThemeModeName;
  toggleMode: () => void;
  /** The signed-in user's active color theme preset, or null before one has loaded (in
   * which case `buildTheme` falls back to the backend's own default palette). */
  activeColorTheme: ActiveColorTheme | null;
  /** Applies a resolved active theme immediately (no page reload) and caches it, keyed to
   * this user, so a later reload paints it before any network round-trip lands. Pass
   * `userId` so the cache key matches the account it belongs to (see the per-user
   * localStorage pattern used by OnboardingTour). */
  applyActiveColorTheme: (theme: ActiveColorTheme, userId: number) => void;
  /** Clears any cached color theme (e.g. on logout) so the next session doesn't briefly
   * flash a previous user's palette before its own loads. */
  clearActiveColorTheme: (userId: number) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const getInitialMode = (): ThemeModeName => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (private browsing, disabled storage) — fall through.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

// Peeks at the cached user profile (see AuthenticatedUserContext's "es_user" key) purely to
// recover the signed-in user's id before AuthenticatedUserProvider itself has mounted —
// ThemeModeProvider sits above it in the tree (see main.tsx) so its fallback UI stays
// themed even if something below crashes, which means it can't read AuthenticatedUserContext
// directly. localStorage is the one thing both can reach independently.
const getStoredUserId = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("es_user");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { id?: number };
    return typeof parsed.id === "number" ? parsed.id : null;
  } catch {
    return null;
  }
};

const getInitialColorTheme = (): ActiveColorTheme | null => {
  const userId = getStoredUserId();
  if (userId == null) return null;
  try {
    const stored = window.localStorage.getItem(`${COLOR_THEME_STORAGE_PREFIX}${userId}`);
    return stored ? (JSON.parse(stored) as ActiveColorTheme) : null;
  } catch {
    return null;
  }
};

// App-wide light/dark toggle, persisted to localStorage and defaulting to the OS-level
// preference on first visit — plus the signed-in user's active color-theme preset (which
// preset's palette feeds `buildTheme`, orthogonal to light/dark). Renders its own MUI
// ThemeProvider/CssBaseline so callers just wrap the app once (see main.tsx) instead of
// wiring a separate theme object.
export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeModeName>(getInitialMode);
  const [activeColorTheme, setActiveColorTheme] = useState<ActiveColorTheme | null>(getInitialColorTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // best-effort persistence only
    }
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "light" ? "dark" : "light"));

  const applyActiveColorTheme = (theme: ActiveColorTheme, userId: number) => {
    setActiveColorTheme(theme);
    try {
      window.localStorage.setItem(`${COLOR_THEME_STORAGE_PREFIX}${userId}`, JSON.stringify(theme));
    } catch {
      // best-effort persistence only
    }
  };

  const clearActiveColorTheme = (userId: number) => {
    setActiveColorTheme(null);
    try {
      window.localStorage.removeItem(`${COLOR_THEME_STORAGE_PREFIX}${userId}`);
    } catch {
      // best-effort persistence only
    }
  };

  const theme = useMemo(
    () => buildTheme(mode, activeColorTheme?.palette ?? defaultColorThemePalette),
    [mode, activeColorTheme]
  );
  const value = useMemo(
    () => ({ mode, toggleMode, activeColorTheme, applyActiveColorTheme, clearActiveColorTheme }),
    [mode, activeColorTheme]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return context;
};
