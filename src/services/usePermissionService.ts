import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse } from "../utils/types";

const PERMISSION_URLS = {
  BASE: "/permissions",
  BY_ID: "/permissions/:id",
  ASSIGN: "/permissions/assign",
  REVOKE: "/permissions/roles/:roleId/:permissionId",
  BY_ROLE: "/permissions/roles/:roleId",
};

export interface PermissionResponseDTO extends AuditableResponse {
  id: number;
  name: string;
  description?: string;
}

export interface RolePermissionResponseDTO {
  roleId: number;
  roleName: string;
  permissions: { id: number; name: string }[];
}

export const usePermissionService = () => {
  return useMemo(
    () => ({
      getAll: () => request<PermissionResponseDTO[]>("GET", PERMISSION_URLS.BASE),
      create: (payload: { name: string; description?: string }) =>
        request<PermissionResponseDTO>("POST", PERMISSION_URLS.BASE, payload),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(PERMISSION_URLS.BY_ID, { id })),
      assignToRole: (roleId: number, permissionId: number) =>
        request<RolePermissionResponseDTO>("POST", PERMISSION_URLS.ASSIGN, { roleId, permissionId }),
      revokeFromRole: (roleId: number, permissionId: number) =>
        request<string>("DELETE", replaceUrlParams(PERMISSION_URLS.REVOKE, { roleId, permissionId })),
      getByRole: (roleId: number) =>
        request<RolePermissionResponseDTO>("GET", replaceUrlParams(PERMISSION_URLS.BY_ROLE, { roleId })),
    }),
    []
  );
};
