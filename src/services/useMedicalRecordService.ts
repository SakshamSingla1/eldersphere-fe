import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";
import type { MedicalRecordTypeEnum } from "../utils/enums";

const MEDICAL_RECORD_URLS = {
  BASE: "/medical-records",
  BY_ID: "/medical-records/:id",
  BY_ELDER: "/medical-records/elder/:elderProfileId",
};

export interface MedicalRecordResponse extends AuditableResponse {
  id: number;
  elderProfileId: number;
  type: MedicalRecordTypeEnum;
  title: string;
  documentFileAssetId?: number | null;
  documentUrl?: string | null;
  notes?: string;
  sharedWithFamily: boolean;
  createdBy?: number;
}

export interface MedicalRecordPayload {
  elderProfileId: number;
  type: MedicalRecordTypeEnum;
  title: string;
  documentFileAssetId?: number | null;
  notes?: string;
  sharedWithFamily: boolean;
}

export const useMedicalRecordService = () => {
  return useMemo(
    () => ({
      create: (payload: MedicalRecordPayload) => request<MedicalRecordResponse>("POST", MEDICAL_RECORD_URLS.BASE, payload),
      update: (id: number, payload: MedicalRecordPayload) =>
        request<MedicalRecordResponse>("PUT", replaceUrlParams(MEDICAL_RECORD_URLS.BY_ID, { id }), payload),
      getById: (id: number) => request<MedicalRecordResponse>("GET", replaceUrlParams(MEDICAL_RECORD_URLS.BY_ID, { id })),
      getByElder: (elderProfileId: number, sharedOnly: boolean, page = 0, size = 10) =>
        request<PageResponse<MedicalRecordResponse>>(
          "GET",
          replaceUrlParams(MEDICAL_RECORD_URLS.BY_ELDER, { elderProfileId }),
          null,
          { params: { sharedOnly, page, size } }
        ),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(MEDICAL_RECORD_URLS.BY_ID, { id })),
    }),
    []
  );
};
