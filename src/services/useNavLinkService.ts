import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";
import type { NavLinkStatusEnum, UserTypeEnum } from "../utils/enums";

const NAV_LINK_URLS = {
  BASE: "/nav-links",
  BY_ID: "/nav-links/:id",
  ME: "/nav-links/me",
};

export interface NavLinkResponse extends AuditableResponse {
  id: number;
  userType: UserTypeEnum;
  navGroup?: string | null;
  navIndex: number;
  name: string;
  path: string;
  icon?: string | null;
  requiredPermission?: string | null;
  superAdminOnly: boolean;
  status: NavLinkStatusEnum;
}

export interface NavLinkPayload {
  userType: UserTypeEnum;
  navGroup?: string;
  navIndex: number;
  name: string;
  path: string;
  icon?: string;
  requiredPermission?: string;
  superAdminOnly?: boolean;
  status?: NavLinkStatusEnum;
}

// Sidebar navigation items, DB-backed (see NavLinkController) instead of a hardcoded array
// per role's Routes.tsx — getMine() is what each portal's routes now call to build its
// sidebar; the rest is the SUPER_ADMIN-only management CRUD (Admin > Navigation Links).
export const useNavLinkService = () => {
  return useMemo(
    () => ({
      getMine: () => request<NavLinkResponse[]>("GET", NAV_LINK_URLS.ME),
      create: (payload: NavLinkPayload) => request<NavLinkResponse>("POST", NAV_LINK_URLS.BASE, payload),
      update: (id: number, payload: NavLinkPayload) =>
        request<NavLinkResponse>("PUT", replaceUrlParams(NAV_LINK_URLS.BY_ID, { id }), payload),
      getById: (id: number) => request<NavLinkResponse>("GET", replaceUrlParams(NAV_LINK_URLS.BY_ID, { id })),
      list: (page = 0, size = 50) =>
        request<PageResponse<NavLinkResponse>>("GET", NAV_LINK_URLS.BASE, null, { params: { page, size, sort: "userType,navIndex" } }),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(NAV_LINK_URLS.BY_ID, { id })),
    }),
    []
  );
};
