import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { PageResponse } from "../utils/types";
import type { PaymentStatusEnum } from "../utils/enums";

const PAYMENT_URLS = {
  BASE: "/payments",
  INTENT: "/payments/intent",
  BY_ID: "/payments/:id",
  BY_BOOKING: "/payments/booking/:bookingId",
  REFUND: "/payments/:id/refund",
  MY_EARNINGS: "/payments/me/earnings",
  CARETAKER_EARNINGS: "/payments/caretaker/:caretakerId/earnings",
};

export interface PaymentIntentResponse {
  paymentId: number;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  id: number;
  bookingId: number;
  familyUserId: number;
  amount: number;
  currency: string;
  status: PaymentStatusEnum;
  stripePaymentIntentId?: string;
  failureReason?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt?: string;
}

export interface EarningsResponse {
  totalEarned: number;
  succeededPaymentCount: number;
}

export interface PaymentFilterParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const usePaymentService = () => {
  return useMemo(
    () => ({
      createIntent: (bookingId: number) => request<PaymentIntentResponse>("POST", PAYMENT_URLS.INTENT, { bookingId }),
      getById: (id: number) => request<PaymentResponse>("GET", replaceUrlParams(PAYMENT_URLS.BY_ID, { id })),
      getByBooking: (bookingId: number) =>
        request<PaymentResponse>("GET", replaceUrlParams(PAYMENT_URLS.BY_BOOKING, { bookingId })),
      search: (params: PaymentFilterParams) =>
        request<PageResponse<PaymentResponse>>("GET", PAYMENT_URLS.BASE, null, { params }),
      getMyEarnings: () => request<EarningsResponse>("GET", PAYMENT_URLS.MY_EARNINGS),
      getCaretakerEarnings: (caretakerId: number) =>
        request<EarningsResponse>("GET", replaceUrlParams(PAYMENT_URLS.CARETAKER_EARNINGS, { caretakerId })),
      refund: (id: number) => request<PaymentResponse>("PUT", replaceUrlParams(PAYMENT_URLS.REFUND, { id })),
    }),
    []
  );
};
