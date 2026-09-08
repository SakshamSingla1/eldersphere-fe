import { useMemo } from "react";
import { request } from ".";
import type { PageResponse } from "../utils/types";
import type { CaretakerVerificationStatusEnum, ServiceCategoryEnum } from "../utils/enums";

const SEARCH_CARETAKERS_URL = "/search/caretakers";

export interface CaretakerSearchResultDTO {
  id: number;
  userId: number;
  fullName: string;
  bio?: string;
  specialties?: ServiceCategoryEnum[];
  yearsOfExperience?: number;
  hourlyRate?: number;
  ratingAverage?: number;
  verificationStatus: CaretakerVerificationStatusEnum;
  profilePhotoUrl?: string;
  serviceArea?: string;
}

export interface CaretakerSearchParams {
  category?: ServiceCategoryEnum;
  minRating?: number;
  verificationStatus?: CaretakerVerificationStatusEnum;
  minRate?: number;
  maxRate?: number;
  location?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const useSearchService = () => {
  return useMemo(
    () => ({
      searchCaretakers: (params: CaretakerSearchParams) =>
        request<PageResponse<CaretakerSearchResultDTO>>("GET", SEARCH_CARETAKERS_URL, null, { params }),
    }),
    []
  );
};
