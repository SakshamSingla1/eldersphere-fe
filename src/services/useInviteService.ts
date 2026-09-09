import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse } from "../utils/types";
import type { LinkInviteStatusEnum, UserTypeEnum } from "../utils/enums";
import type { FamilyMemberSummaryDTO } from "./useElderProfileService";

const INVITE_URLS = {
  FOR_PROFILE: "/elder-profiles/:elderProfileId/invites",
  MY_INVITES: "/invites/me",
  ACCEPT: "/invites/:id/accept",
  DECLINE: "/invites/:id/decline",
  REVOKE: "/invites/:id",
  FAMILY_MEMBERS: "/elder-profiles/:elderProfileId/family-members",
  REMOVE_FAMILY_MEMBER: "/elder-profiles/:elderProfileId/family-members/:userId",
};

export interface InviteResponse extends AuditableResponse {
  id: number;
  elderProfileId: number;
  elderName?: string;
  invitedUserId: number;
  invitedUserName?: string;
  invitedRole: UserTypeEnum;
  invitedByUserId: number;
  invitedByName?: string;
  relationshipLabel?: string;
  status: LinkInviteStatusEnum;
  respondedAt?: string | null;
}

export interface CreateInvitePayload {
  targetUserId: number;
  invitedRole: UserTypeEnum;
  relationshipLabel?: string;
}

export const useInviteService = () => {
  return useMemo(
    () => ({
      createInvite: (elderProfileId: number, payload: CreateInvitePayload) =>
        request<InviteResponse>("POST", replaceUrlParams(INVITE_URLS.FOR_PROFILE, { elderProfileId }), payload),
      listForProfile: (elderProfileId: number) =>
        request<InviteResponse[]>("GET", replaceUrlParams(INVITE_URLS.FOR_PROFILE, { elderProfileId })),
      myInvites: () => request<InviteResponse[]>("GET", INVITE_URLS.MY_INVITES),
      accept: (id: number) => request<InviteResponse>("PUT", replaceUrlParams(INVITE_URLS.ACCEPT, { id })),
      decline: (id: number) => request<InviteResponse>("PUT", replaceUrlParams(INVITE_URLS.DECLINE, { id })),
      revoke: (id: number) => request<string>("DELETE", replaceUrlParams(INVITE_URLS.REVOKE, { id })),
      listFamilyMembers: (elderProfileId: number) =>
        request<FamilyMemberSummaryDTO[]>("GET", replaceUrlParams(INVITE_URLS.FAMILY_MEMBERS, { elderProfileId })),
      removeFamilyMember: (elderProfileId: number, userId: number) =>
        request<string>("DELETE", replaceUrlParams(INVITE_URLS.REMOVE_FAMILY_MEMBER, { elderProfileId, userId })),
    }),
    []
  );
};
