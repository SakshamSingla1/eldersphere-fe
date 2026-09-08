import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";
import type { ServiceCategoryEnum } from "../utils/enums";

const SERVICE_URLS = {
  BASE: "/services",
  BY_ID: "/services/:id",
};

export interface ServiceOfferingResponse extends AuditableResponse {
  id: number;
  name: string;
  category: ServiceCategoryEnum;
  description?: string;
  basePrice?: number;
  durationMinutes?: number;
}

export interface ServiceOfferingPayload {
  name: string;
  category: ServiceCategoryEnum;
  description?: string;
  basePrice?: number;
  durationMinutes?: number;
}

export interface ServiceOfferingFilterParams {
  category?: ServiceCategoryEnum;
  page?: number;
  size?: number;
  sort?: string;
}

export const useServiceOfferingService = () => {
  return useMemo(
    () => ({
      list: (params: ServiceOfferingFilterParams) =>
        request<PageResponse<ServiceOfferingResponse>>("GET", SERVICE_URLS.BASE, null, { params }),
      getById: (id: number) => request<ServiceOfferingResponse>("GET", replaceUrlParams(SERVICE_URLS.BY_ID, { id })),
      create: (payload: ServiceOfferingPayload) => request<ServiceOfferingResponse>("POST", SERVICE_URLS.BASE, payload),
      update: (id: number, payload: ServiceOfferingPayload) =>
        request<ServiceOfferingResponse>("PUT", replaceUrlParams(SERVICE_URLS.BY_ID, { id }), payload),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(SERVICE_URLS.BY_ID, { id })),
    }),
    []
  );
};
