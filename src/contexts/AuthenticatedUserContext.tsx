import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import type { UserTypeEnum, UserStatusEnum } from "../utils/enums";
import { clearWsToken } from "../utils/wsToken";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface AuthenticatedUserType {
  id: number;
  fullName: string;
  email: string;
  phone?: string | undefined;
  userType: UserTypeEnum;
  status?: UserStatusEnum;
  roleId?: number | undefined;
  roleName?: string | undefined;
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

  useEffect(() => {
    if (user) {
      localStorage.setItem("es_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("es_user");
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Ignore network errors — proceed with local logout regardless.
    }
    setAuthenticatedUser(null);
    localStorage.removeItem("es_user");
    clearWsToken();
  }, []);

  const value = useMemo(
    () => ({ user, setAuthenticatedUser, logout, isLoading }),
    [user, logout, isLoading]
  );

  return <AuthenticatedUserContext.Provider value={value}>{children}</AuthenticatedUserContext.Provider>;
};
