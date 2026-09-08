import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { PageResponse, AuditableResponse } from "../utils/types";
import type { UserTypeEnum, UserStatusEnum } from "../utils/enums";

const USER_URLS = {
  BASE: "/admin/users",
  BY_ID: "/admin/users/:id",
  STATUS: "/admin/users/:id/status",
  BULK_STATUS: "/admin/users/bulk-status",
  ROLE: "/admin/users/:id/role",
  ROLES: "/admin/users/:id/roles",
  ROLES_REVOKE: "/admin/users/:id/roles/:roleType",
};

export interface UserResponse extends AuditableResponse {
  id: number;
  email: string;
  phone?: string;
  fullName: string;
  userType: UserTypeEnum;
  status: UserStatusEnum;
  /** Only applies to Admin accounts — the fine-grained RBAC Role (Bookings Coordinator,
   * etc.) restricting them to specific modules. Unrelated to `roles` below — see the
   * "base account roles" vs "fine-grained permission role" distinction in Users.page.tsx. */
  roleId?: number | null;
  roleName?: string | null;
  /** Full set of base account roles (UserTypeEnum) this user holds — multi-role support.
   * `userType` above is just whichever of these is currently primary/default. */
  roles?: UserTypeEnum[];
}

// Mirrors com.eldersphere.dtos.User.UserRolesResponse — the response from the grant/revoke
// base-role endpoints below.
export interface UserRolesResponse {
  userId: number;
  roles: UserTypeEnum[];
  primaryRole: UserTypeEnum;
}

export interface AdminCreateUserPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  userType: UserTypeEnum;
  roleId?: number | null;
}

export interface UserFilterParams {
  search?: string;
  userType?: UserTypeEnum;
  status?: UserStatusEnum;
  page?: number;
  size?: number;
  sort?: string;
}

export const useUserService = () => {
  return useMemo(
    () => ({
      list: (params: UserFilterParams) => request<PageResponse<UserResponse>>("GET", USER_URLS.BASE, null, { params }),
      getById: (id: number) => request<UserResponse>("GET", replaceUrlParams(USER_URLS.BY_ID, { id })),
      create: (payload: AdminCreateUserPayload) => request<UserResponse>("POST", USER_URLS.BASE, payload),
      updateStatus: (id: number, status: UserStatusEnum) =>
        request<UserResponse>("PUT", replaceUrlParams(USER_URLS.STATUS, { id }), { status }),
      bulkUpdateStatus: (userIds: number[], status: UserStatusEnum) =>
        request<number>("PUT", USER_URLS.BULK_STATUS, { userIds, status }),
      // roleId: null clears a restricted admin back to unrestricted (full admin) access.
      // This is the fine-grained RBAC `roleId` (Bookings Coordinator etc.) — NOT a base
      // account role; see grantRole/revokeRole below for that separate concept.
      assignRole: (id: number, roleId: number | null) =>
        request<UserResponse>("PUT", replaceUrlParams(USER_URLS.ROLE, { id }), { roleId }),
      // Base account roles (multi-role support) — grants/revokes one of the 5 UserTypeEnum
      // roles a user can hold simultaneously. The backend enforces the real safety rules
      // (can't revoke a user's last role or their current primary; granting/revoking
      // ADMIN/SUPER_ADMIN requires the caller to be SUPER_ADMIN) — surface its rejection
      // message rather than a generic failure toast.
      grantRole: (id: number, roleType: UserTypeEnum) =>
        request<UserRolesResponse>("POST", replaceUrlParams(USER_URLS.ROLES, { id }), { roleType }),
      revokeRole: (id: number, roleType: UserTypeEnum) =>
        request<UserRolesResponse>("DELETE", replaceUrlParams(USER_URLS.ROLES_REVOKE, { id, roleType })),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(USER_URLS.BY_ID, { id })),
    }),
    []
  );
};
