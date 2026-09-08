import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";

const LANDING_URLS = {
  PAGE: "/landing/page",
  CONFIG: "/landing/config",
  FEATURES: "/landing/features",
  FEATURE_BY_ID: "/landing/features/:id",
  FAQS: "/landing/faqs",
  FAQ_BY_ID: "/landing/faqs/:id",
  TESTIMONIALS: "/landing/testimonials",
  TESTIMONIAL_BY_ID: "/landing/testimonials/:id",
};

export interface LandingPageConfigResponse {
  id: number;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroImageUrl?: string;
  ctaHeadline?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
}

export interface LandingFeatureResponse {
  id: number;
  title: string;
  description?: string;
  iconName?: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface LandingFaqResponse {
  id: number;
  question: string;
  answer: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface LandingTestimonialResponse {
  id: number;
  authorName: string;
  authorRole?: string;
  content: string;
  avatarUrl?: string;
  rating?: number;
  sortOrder?: number;
  isActive: boolean;
}

export interface LandingPageResponse {
  config: LandingPageConfigResponse;
  features: LandingFeatureResponse[];
  faqs: LandingFaqResponse[];
  testimonials: LandingTestimonialResponse[];
}

export type LandingFeaturePayload = Omit<LandingFeatureResponse, "id">;
export type LandingFaqPayload = Omit<LandingFaqResponse, "id">;
export type LandingTestimonialPayload = Omit<LandingTestimonialResponse, "id">;
export type LandingConfigPayload = Omit<LandingPageConfigResponse, "id">;

export const useLandingService = () => {
  return useMemo(
    () => ({
      getPublicPage: () => request<LandingPageResponse>("GET", LANDING_URLS.PAGE),
      updateConfig: (payload: LandingConfigPayload) =>
        request<LandingPageConfigResponse>("PUT", LANDING_URLS.CONFIG, payload),

      getAllFeatures: () => request<LandingFeatureResponse[]>("GET", LANDING_URLS.FEATURES),
      createFeature: (payload: LandingFeaturePayload) =>
        request<LandingFeatureResponse>("POST", LANDING_URLS.FEATURES, payload),
      updateFeature: (id: number, payload: LandingFeaturePayload) =>
        request<LandingFeatureResponse>("PUT", replaceUrlParams(LANDING_URLS.FEATURE_BY_ID, { id }), payload),
      deleteFeature: (id: number) => request<string>("DELETE", replaceUrlParams(LANDING_URLS.FEATURE_BY_ID, { id })),

      getAllFaqs: () => request<LandingFaqResponse[]>("GET", LANDING_URLS.FAQS),
      createFaq: (payload: LandingFaqPayload) => request<LandingFaqResponse>("POST", LANDING_URLS.FAQS, payload),
      updateFaq: (id: number, payload: LandingFaqPayload) =>
        request<LandingFaqResponse>("PUT", replaceUrlParams(LANDING_URLS.FAQ_BY_ID, { id }), payload),
      deleteFaq: (id: number) => request<string>("DELETE", replaceUrlParams(LANDING_URLS.FAQ_BY_ID, { id })),

      getAllTestimonials: () => request<LandingTestimonialResponse[]>("GET", LANDING_URLS.TESTIMONIALS),
      createTestimonial: (payload: LandingTestimonialPayload) =>
        request<LandingTestimonialResponse>("POST", LANDING_URLS.TESTIMONIALS, payload),
      updateTestimonial: (id: number, payload: LandingTestimonialPayload) =>
        request<LandingTestimonialResponse>("PUT", replaceUrlParams(LANDING_URLS.TESTIMONIAL_BY_ID, { id }), payload),
      deleteTestimonial: (id: number) =>
        request<string>("DELETE", replaceUrlParams(LANDING_URLS.TESTIMONIAL_BY_ID, { id })),
    }),
    []
  );
};
