import { useMemo } from "react";
import { request } from ".";
import type { UserTypeEnum, UserStatusEnum } from "../utils/enums";

const AUTH_URLS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VALIDATE_RESET_TOKEN: "/auth/validate-reset-token",
  RESET_PASSWORD: "/auth/reset-password",
  CHANGE_PASSWORD: "/auth/change-password",
};

export interface AuthRegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  userType: UserTypeEnum;
}

export interface AuthResponseDTO {
  id: number;
  email: string;
  fullName: string;
  userType: UserTypeEnum;
}

export interface LoginResponseDTO {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  /** Primary/default role — the role the account currently lands on after login. */
  userType: UserTypeEnum;
  status: UserStatusEnum;
  roleId?: number | null;
  roleName?: string | null;
  /** Full set of roles this account holds (multi-role support) — may be absent on older
   * backends, callers should fall back to treating `userType` as the only held role. */
  roles?: UserTypeEnum[];
  token?: string;
}

export const useAuthService = () => {
  return useMemo(
    () => ({
      register: (payload: AuthRegisterPayload) => request<AuthResponseDTO>("POST", AUTH_URLS.REGISTER, payload),
      login: (email: string, password: string) =>
        request<LoginResponseDTO>("POST", AUTH_URLS.LOGIN, { email, password }),
      refresh: () => request<void>("POST", AUTH_URLS.REFRESH),
      logout: () => request<void>("POST", AUTH_URLS.LOGOUT),
      forgotPassword: (email: string) => request<string>("POST", AUTH_URLS.FORGOT_PASSWORD, { email }),
      validateResetToken: (token: string) =>
        request<string>("GET", AUTH_URLS.VALIDATE_RESET_TOKEN, null, { params: { token } }),
      resetPassword: (token: string, newPassword: string) =>
        request<string>("POST", AUTH_URLS.RESET_PASSWORD, { token, newPassword }),
      changePassword: (oldPassword: string, newPassword: string) =>
        request<string>("PUT", AUTH_URLS.CHANGE_PASSWORD, { oldPassword, newPassword }),
    }),
    []
  );
};
