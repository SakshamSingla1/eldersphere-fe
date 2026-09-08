import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse, PageResponse } from "../utils/types";

const REVIEW_URLS = {
  BASE: "/reviews",
  BY_CARETAKER: "/reviews/caretaker/:caretakerId",
  REPLY: "/reviews/:reviewId/reply",
};

export interface ReviewReplyResponse extends AuditableResponse {
  id: number;
  reviewId: number;
  caretakerId: number;
  content: string;
}

export interface ReviewResponse extends AuditableResponse {
  id: number;
  bookingId: number;
  reviewerId: number;
  reviewerName?: string;
  caretakerId: number;
  rating: number;
  comment?: string;
  punctualityRating?: number;
  careQualityRating?: number;
  communicationRating?: number;
  photoFileAssetId?: number | null;
  photoUrl?: string | null;
  reply?: ReviewReplyResponse | null;
}

export interface ReviewPayload {
  bookingId: number;
  rating: number;
  comment?: string;
  punctualityRating?: number;
  careQualityRating?: number;
  communicationRating?: number;
  photoFileAssetId?: number;
}

export const useReviewService = () => {
  return useMemo(
    () => ({
      create: (payload: ReviewPayload) => request<ReviewResponse>("POST", REVIEW_URLS.BASE, payload),
      getByCaretaker: (caretakerId: number, page = 0, size = 10) =>
        request<PageResponse<ReviewResponse>>("GET", replaceUrlParams(REVIEW_URLS.BY_CARETAKER, { caretakerId }), null, {
          params: { page, size },
        }),
      reply: (reviewId: number, content: string) =>
        request<ReviewReplyResponse>("PUT", replaceUrlParams(REVIEW_URLS.REPLY, { reviewId }), { content }),
    }),
    []
  );
};
