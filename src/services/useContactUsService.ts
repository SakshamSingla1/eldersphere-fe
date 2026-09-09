import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";
import type { ContactUsStatusEnum } from "../utils/enums";

const CONTACT_URLS = {
  BASE: "/contact-us",
  STATUS: "/contact-us/:id/status",
  BY_ID: "/contact-us/:id",
};

export interface ContactUsResponse extends AuditableResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: ContactUsStatusEnum;
}

export interface ContactUsPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactUsFilterParams {
  search?: string;
  status?: ContactUsStatusEnum;
  page?: number;
  size?: number;
  sort?: string;
}

export const useContactUsService = () => {
  return useMemo(
    () => ({
      submit: (payload: ContactUsPayload) => request<ContactUsResponse>("POST", CONTACT_URLS.BASE, payload),
      search: (params: ContactUsFilterParams) =>
        request<PageResponse<ContactUsResponse>>("GET", CONTACT_URLS.BASE, null, { params }),
      updateStatus: (id: number, status: ContactUsStatusEnum) =>
        request<ContactUsResponse>("PUT", replaceUrlParams(CONTACT_URLS.STATUS, { id }), null, {
          params: { status },
        }),
      // There's no GET /contact-us/{id} endpoint on the backend (only search + delete are
      // scoped to a single id) — the admin edit page still needs to fetch one submission by
      // id though, so this pulls a generously-sized unfiltered page and finds it client-side.
      // Fine for an admin triage queue's realistic volume; revisit if that stops being true.
      getById: async (id: number) => {
        const result = await request<PageResponse<ContactUsResponse>>("GET", CONTACT_URLS.BASE, null, {
          params: { page: 0, size: 1000 },
        });
        const found = result.content.find((c) => c.id === id);
        if (!found) throw new Error("Contact request not found");
        return found;
      },
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(CONTACT_URLS.BY_ID, { id })),
    }),
    []
  );
};
