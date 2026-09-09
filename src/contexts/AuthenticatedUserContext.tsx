import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import type { UserTypeEnum, UserStatusEnum } from "../utils/enums";
import { clearWsToken } from "../utils/wsToken";
import { useThemeMode } from "./ThemeModeContext";
import { useUserSelfService } from "../services/useUserSelfService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface AuthenticatedUserType {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  userType: UserTypeEnum;
  status?: UserStatusEnum;
  roleId?: number | null;
  roleName?: string | null;
  /** Full set of roles this account holds (multi-role support) — `userType` above is just
   * whichever of these is currently primary. */
  roles?: UserTypeEnum[];
}

export interface AuthenticatedUserContextType {
  user: AuthenticatedUserType | null;
  setAuthenticatedUser: (user: AuthenticatedUserType | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthenticatedUserContext = React.createContext<AuthenticatedUserContextType>({
  user: null,
  setAuthenticatedUser: () => {},
  logout: async () => {},
  isLoading: false,
});

export const AuthenticatedUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setAuthenticatedUser] = useState<AuthenticatedUserType | null>(() => {
    try {
      const stored = localStorage.getItem("es_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading] = useState(false);
  const { applyActiveColorTheme, clearActiveColorTheme } = useThemeMode();
  const userSelfService = useUserSelfService();

  useEffect(() => {
    if (user) {
      localStorage.setItem("es_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("es_user");
    }
  }, [user]);

  // Reconciles the active color theme once at app init for a reloaded/already-logged-in
  // session — ThemeModeProvider already applies the per-user cached palette synchronously
  // (see its lazy initial state) so there's no flash of the default theme while this
  // resolves, but a fresh fetch catches e.g. an admin having edited/retired the cached
  // preset since the last visit. A fresh login instead gets its theme from the login
  // response's inline `activeTheme` (see useRoleGatedLogin), so this only needs to run
  // once per app load, not on every `user` change.
  useEffect(() => {
    if (user) {
      userSelfService
        .getMyTheme()
        .then((theme) => applyActiveColorTheme(theme, user.id))
        .catch(() => {
          // Best-effort reconciliation only — the cached (or default) palette already
          // applied stays in place if this fails.
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Ignore network errors — proceed with local logout regardless.
    }
    if (user) {
      clearActiveColorTheme(user.id);
    }
    setAuthenticatedUser(null);
    localStorage.removeItem("es_user");
    clearWsToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = useMemo(
    () => ({ user, setAuthenticatedUser, logout, isLoading }),
    [user, logout, isLoading]
  );

  return <AuthenticatedUserContext.Provider value={value}>{children}</AuthenticatedUserContext.Provider>;
};
