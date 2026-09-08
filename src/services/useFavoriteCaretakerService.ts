import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { CaretakerSearchResultDTO } from "./useSearchService";

const FAVORITE_URLS = {
  BASE: "/favorites",
  BY_CARETAKER_ID: "/favorites/:caretakerId",
};

export const useFavoriteCaretakerService = () => {
  return useMemo(
    () => ({
      addFavorite: (caretakerId: number) =>
        request<CaretakerSearchResultDTO>("POST", replaceUrlParams(FAVORITE_URLS.BY_CARETAKER_ID, { caretakerId })),
      removeFavorite: (caretakerId: number) =>
        request<string>("DELETE", replaceUrlParams(FAVORITE_URLS.BY_CARETAKER_ID, { caretakerId })),
      listFavorites: () => request<CaretakerSearchResultDTO[]>("GET", FAVORITE_URLS.BASE),
    }),
    []
  );
};
