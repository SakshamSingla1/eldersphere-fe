import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";
import type { BookingStatusEnum } from "../utils/enums";

const BOOKING_URLS = {
  BASE: "/bookings",
  BY_ID: "/bookings/:id",
  STATUS: "/bookings/:id/status",
  RECURRING_GROUP: "/bookings/recurring/:groupId",
  RECURRING_GROUP_CANCEL: "/bookings/recurring/:groupId/cancel",
};

export interface BookingResponse extends AuditableResponse {
  id: number;
  familyUserId: number;
  elderProfileId: number;
  elderName?: string;
  caretakerId: number;
  caretakerName?: string;
  serviceId: number;
  serviceName?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: BookingStatusEnum;
  cost?: number;
  notes?: string;
  recurringGroupId?: string;
}

export interface BookingPayload {
  elderProfileId: number;
  caretakerId: number;
  serviceId: number;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
  /** When true, creates `occurrences` (2-12) weekly bookings sharing one recurringGroupId. */
  repeatWeekly?: boolean;
  occurrences?: number;
}

export interface BookingFilterParams {
  familyUserId?: number;
  caretakerId?: number;
  status?: BookingStatusEnum;
  page?: number;
  size?: number;
  sort?: string;
}

export const useBookingService = () => {
  return useMemo(
    () => ({
      create: (payload: BookingPayload) => request<BookingResponse>("POST", BOOKING_URLS.BASE, payload),
      updateStatus: (id: number, status: BookingStatusEnum) =>
        request<BookingResponse>("PUT", replaceUrlParams(BOOKING_URLS.STATUS, { id }), { status }),
      getById: (id: number) => request<BookingResponse>("GET", replaceUrlParams(BOOKING_URLS.BY_ID, { id })),
      search: (params: BookingFilterParams) =>
        request<PageResponse<BookingResponse>>("GET", BOOKING_URLS.BASE, null, { params }),
      getRecurringSeries: (groupId: string) =>
        request<BookingResponse[]>("GET", replaceUrlParams(BOOKING_URLS.RECURRING_GROUP, { groupId })),
      cancelSeries: (groupId: string) =>
        request<BookingResponse[]>("PUT", replaceUrlParams(BOOKING_URLS.RECURRING_GROUP_CANCEL, { groupId })),
    }),
    []
  );
};
