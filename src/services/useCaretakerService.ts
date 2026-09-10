import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { AuditableResponse } from "../utils/types";
import type { ServiceCategoryEnum, CaretakerVerificationStatusEnum, DayOfWeekEnum } from "../utils/enums";

const CARETAKER_URLS = {
  ME: "/caretakers/me",
  BY_ID: "/caretakers/:id",
  VERIFICATION: "/caretakers/:id/verification",
  MY_AVAILABILITY: "/caretakers/me/availability",
  AVAILABILITY_BY_ID: "/caretakers/:id/availability",
  MY_VERIFICATION_DOCUMENTS: "/caretakers/me/verification-documents",
  VERIFICATION_DOCUMENTS_BY_ID: "/caretakers/:id/verification-documents",
};

export interface AvailabilitySlot {
  id?: number;
  dayOfWeek: DayOfWeekEnum;
  startTime: string; // "HH:mm" or "HH:mm:ss" — LocalTime on the backend
  endTime: string;
}

export interface CaretakerAvailabilityResponse {
  caretakerId: number;
  slots: AvailabilitySlot[];
}

export interface CaretakerProfileResponse extends AuditableResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  bio?: string;
  specialties?: ServiceCategoryEnum[];
  yearsOfExperience?: number;
  hourlyRate?: number;
  ratingAverage?: number;
  verificationStatus: CaretakerVerificationStatusEnum;
  profilePhotoFileAssetId?: number | null;
  profilePhotoUrl?: string | null;
  serviceArea?: string;
}

export interface CaretakerProfilePayload {
  bio?: string;
  specialties?: ServiceCategoryEnum[];
  yearsOfExperience?: number;
  hourlyRate?: number;
}

// Evidence (ID, certification, background-check document) a caretaker submits to back
// their verification review — see CARETAKER_URLS.MY_VERIFICATION_DOCUMENTS /
// VERIFICATION_DOCUMENTS_BY_ID below. Upload is caretaker-authenticated (isAuthenticated());
// listing by caretaker ID is admin-only (CARETAKER_VERIFICATION_VIEW), so a caretaker can
// upload their own documents but can't fetch the list back through this same endpoint.
export interface CaretakerVerificationDocumentResponse {
  id: number;
  caretakerProfileId: number;
  fileAssetId: number;
  fileName: string;
  fileType: string;
  url: string;
  uploadedBy?: number;
  createdAt: string;
}

export const useCaretakerService = () => {
  return useMemo(
    () => ({
      upsertMyProfile: (payload: CaretakerProfilePayload) =>
        request<CaretakerProfileResponse>("PUT", CARETAKER_URLS.ME, payload),
      getMyProfile: () => request<CaretakerProfileResponse>("GET", CARETAKER_URLS.ME),
      getById: (id: number) => request<CaretakerProfileResponse>("GET", replaceUrlParams(CARETAKER_URLS.BY_ID, { id })),
      updateVerification: (id: number, verificationStatus: CaretakerVerificationStatusEnum) =>
        request<CaretakerProfileResponse>("PUT", replaceUrlParams(CARETAKER_URLS.VERIFICATION, { id }), {
          verificationStatus,
        }),
      replaceMyAvailability: (slots: AvailabilitySlot[]) =>
        request<CaretakerAvailabilityResponse>("PUT", CARETAKER_URLS.MY_AVAILABILITY, { slots }),
      getAvailability: (id: number) =>
        request<CaretakerAvailabilityResponse>("GET", replaceUrlParams(CARETAKER_URLS.AVAILABILITY_BY_ID, { id })),
      uploadVerificationDocument: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return request<CaretakerVerificationDocumentResponse>("POST", CARETAKER_URLS.MY_VERIFICATION_DOCUMENTS, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      },
      listVerificationDocuments: (id: number) =>
        request<CaretakerVerificationDocumentResponse[]>("GET", replaceUrlParams(CARETAKER_URLS.VERIFICATION_DOCUMENTS_BY_ID, { id })),
    }),
    []
  );
};
