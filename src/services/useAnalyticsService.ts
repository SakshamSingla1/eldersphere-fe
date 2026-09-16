import { useMemo } from "react";
import { request } from ".";

const ANALYTICS_URLS = {
  BOOKINGS_TIMESERIES: "/analytics/bookings-timeseries",
  REVENUE_TIMESERIES: "/analytics/revenue-timeseries",
  LEADERBOARD: "/analytics/caretaker-leaderboard",
  MY_FAMILY_SPENDING: "/analytics/me/family-spending",
  MY_CARETAKER_EARNINGS: "/analytics/me/caretaker-earnings",
  MY_CARETAKER_BOOKINGS_RATING_TREND: "/analytics/me/caretaker-bookings-rating-trend",
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

// Keyed by BookingStatusEnum values, but kept as a loose string-keyed record since the
// endpoint omits zero-count statuses.
export type BookingsByStatusBreakdown = Record<string, number>;

export interface FamilySpendingSummary {
  spendingOverTime: RevenueTimeseriesPoint[];
  bookingsByStatus: BookingsByStatusBreakdown;
}

export interface WeeklyBookingsPoint {
  bucketStart: string;
  total: number;
  byStatus: Record<string, number>;
}

export interface RatingTrendPoint {
  bucketStart: string;
  averageRating: number;
  reviewCount: number;
}

export interface CaretakerBookingsRatingTrend {
  bookingsPerWeek: WeeklyBookingsPoint[];
  ratingTrend: RatingTrendPoint[];
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
      // Self-scoped endpoints below (family/caretaker "my ..." trends), all-time, no params.
      getMyFamilySpending: () => request<FamilySpendingSummary>("GET", ANALYTICS_URLS.MY_FAMILY_SPENDING),
      getMyCaretakerEarnings: () =>
        request<RevenueTimeseriesPoint[]>("GET", ANALYTICS_URLS.MY_CARETAKER_EARNINGS),
      getMyCaretakerBookingsRatingTrend: () =>
        request<CaretakerBookingsRatingTrend>("GET", ANALYTICS_URLS.MY_CARETAKER_BOOKINGS_RATING_TREND),
    }),
    []
  );
};
