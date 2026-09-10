import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";
import type { GenderEnum } from "../utils/enums";

const ELDER_URLS = {
  BASE: "/elder-profiles",
  BY_ID: "/elder-profiles/:id",
  ME: "/elder-profiles/me",
  SEARCH: "/elder-profiles/search",
};

export interface ElderProfileResponse extends AuditableResponse {
  id: number;
  familyUserId?: number | null;
  elderUserId?: number | null;
  name: string;
  dateOfBirth?: string | null;
  gender?: GenderEnum;
  medicalConditions?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface ElderProfilePayload {
  name: string;
  dateOfBirth?: string | null;
  gender?: GenderEnum;
  medicalConditions?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface FamilyMemberSummaryDTO {
  userId: number;
  fullName?: string;
  relationshipLabel?: string;
  isOwner: boolean;
}

export const useElderProfileService = () => {
  return useMemo(
    () => ({
      create: (payload: ElderProfilePayload) => request<ElderProfileResponse>("POST", ELDER_URLS.BASE, payload),
      update: (id: number, payload: ElderProfilePayload) =>
        request<ElderProfileResponse>("PUT", replaceUrlParams(ELDER_URLS.BY_ID, { id }), payload),
      getById: (id: number) => request<ElderProfileResponse>("GET", replaceUrlParams(ELDER_URLS.BY_ID, { id })),
      getMine: () => request<ElderProfileResponse[]>("GET", ELDER_URLS.BASE),
      // Called by a logged-in ELDER user to fetch their own self-managed profile.
      getMyProfile: () => request<ElderProfileResponse>("GET", ELDER_URLS.ME),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(ELDER_URLS.BY_ID, { id })),
      // Admin-only "find an elder profile by name" picker — see ELDER_URLS.SEARCH. Used
      // instead of requiring an admin to already know a profile's numeric ID.
      searchByName: (query: string, page = 0, size = 10) =>
        request<PageResponse<ElderProfileResponse>>("GET", ELDER_URLS.SEARCH, null, { params: { query, page, size } }),
    }),
    []
  );
};
