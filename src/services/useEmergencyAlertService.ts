import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";
import type { EmergencyAlertStatusEnum } from "../utils/enums";

const EMERGENCY_URLS = {
  BASE: "/emergency-alerts",
  BY_ID: "/emergency-alerts/:id",
  STATUS: "/emergency-alerts/:id/status",
};

export interface EmergencyAlertResponse extends AuditableResponse {
  id: number;
  elderProfileId: number;
  elderName?: string;
  triggeredByUserId: number;
  latitude?: number;
  longitude?: number;
  resolvedAddress?: string | null;
  status: EmergencyAlertStatusEnum;
  respondingCaretakerId?: number | null;
  triggeredAt?: string;
  resolvedAt?: string | null;
  responseTimeSeconds?: number | null;
}

export interface EmergencyAlertFilterParams {
  elderProfileId?: number;
  status?: EmergencyAlertStatusEnum;
  page?: number;
  size?: number;
  sort?: string;
}

export const useEmergencyAlertService = () => {
  return useMemo(
    () => ({
      trigger: (elderProfileId: number, latitude?: number, longitude?: number) =>
        request<EmergencyAlertResponse>("POST", EMERGENCY_URLS.BASE, { elderProfileId, latitude, longitude }),
      updateStatus: (id: number, status: EmergencyAlertStatusEnum, respondingCaretakerId?: number) =>
        request<EmergencyAlertResponse>("PUT", replaceUrlParams(EMERGENCY_URLS.STATUS, { id }), {
          status,
          respondingCaretakerId,
        }),
      getById: (id: number) => request<EmergencyAlertResponse>("GET", replaceUrlParams(EMERGENCY_URLS.BY_ID, { id })),
      search: (params: EmergencyAlertFilterParams) =>
        request<PageResponse<EmergencyAlertResponse>>("GET", EMERGENCY_URLS.BASE, null, { params }),
    }),
    []
  );
};
