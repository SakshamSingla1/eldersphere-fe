import { useMemo } from "react";
import { request } from ".";

const GEOCODING_URLS = {
  SEARCH: "/geocoding/search",
  REVERSE: "/geocoding/reverse",
};

export interface GeocodingResultDTO {
  displayName: string;
  latitude?: number;
  longitude?: number;
}

export const useGeocodingService = () => {
  return useMemo(
    () => ({
      search: (query: string) => request<GeocodingResultDTO[]>("GET", GEOCODING_URLS.SEARCH, null, { params: { query } }),
      reverse: (lat: number, lon: number) => request<string | null>("GET", GEOCODING_URLS.REVERSE, null, { params: { lat, lon } }),
    }),
    []
  );
};
