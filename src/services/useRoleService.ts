import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse } from "../utils/types";
import type { RoleStatusEnum } from "../utils/enums";

const ROLE_URLS = {
  BASE: "/roles",
  BY_ID: "/roles/:id",
};

export interface RoleResponseDTO extends AuditableResponse {
  id: number;
  name: string;
  description?: string;
  status: RoleStatusEnum;
}

export interface RoleRequestPayload {
  name: string;
  description?: string;
  status?: RoleStatusEnum;
}

export const useRoleService = () => {
  return useMemo(
    () => ({
      getAll: () => request<RoleResponseDTO[]>("GET", ROLE_URLS.BASE),
      getById: (id: number) => request<RoleResponseDTO>("GET", replaceUrlParams(ROLE_URLS.BY_ID, { id })),
      create: (payload: RoleRequestPayload) => request<RoleResponseDTO>("POST", ROLE_URLS.BASE, payload),
      update: (id: number, payload: RoleRequestPayload) =>
        request<RoleResponseDTO>("PUT", replaceUrlParams(ROLE_URLS.BY_ID, { id }), payload),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(ROLE_URLS.BY_ID, { id })),
    }),
    []
  );
};
