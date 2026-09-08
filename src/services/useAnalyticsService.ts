import { useMemo } from "react";
import { request } from ".";

const ANALYTICS_URLS = {
  BOOKINGS_TIMESERIES: "/analytics/bookings-timeseries",
  REVENUE_TIMESERIES: "/analytics/revenue-timeseries",
  LEADERBOARD: "/analytics/caretaker-leaderboard",
};

export interface BookingTimeseriesPoint {
  bucketStart: string;
  total: number;
  byStatus: Record<string, number>;
}

export interface RevenueTimeseriesPoint {
  bucketStart: string;
  revenue: number;
}

export interface CaretakerLeaderboardEntry {
  caretakerId: number;
  fullName: string;
  ratingAverage?: number | null;
  completedBookingCount: number;
}

export const useAnalyticsService = () => {
  return useMemo(
    () => ({
      getBookingsTimeseries: (start: string, end: string, granularity: "day" | "week" = "day") =>
        request<BookingTimeseriesPoint[]>("GET", ANALYTICS_URLS.BOOKINGS_TIMESERIES, null, {
          params: { start, end, granularity },
        }),
      getRevenueTimeseries: (start: string, end: string, granularity: "day" | "week" = "day") =>
        request<RevenueTimeseriesPoint[]>("GET", ANALYTICS_URLS.REVENUE_TIMESERIES, null, {
          params: { start, end, granularity },
        }),
      getCaretakerLeaderboard: (limit = 10, sortBy: "RATING" | "COMPLETED_BOOKINGS" = "RATING") =>
        request<CaretakerLeaderboardEntry[]>("GET", ANALYTICS_URLS.LEADERBOARD, null, {
          params: { limit, sortBy },
        }),
    }),
    []
  );
};
