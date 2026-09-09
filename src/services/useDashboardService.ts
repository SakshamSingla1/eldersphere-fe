import { useMemo } from "react";
import { request } from ".";
import type { CaretakerVerificationStatusEnum } from "../utils/enums";

export interface InviteSummaryDTO {
  id: number;
  elderProfileId: number;
  elderName?: string;
  invitedByName?: string;
  relationshipLabel?: string;
  createdAt: string;
}

const DASHBOARD_URLS = {
  SUMMARY: "/dashboard/summary",
  FAMILY_SUMMARY: "/dashboard/family-summary",
  CARETAKER_SUMMARY: "/dashboard/caretaker-summary",
  ELDER_SUMMARY: "/dashboard/elder-summary",
};

export interface ActivityDTO {
  type: string;
  description: string;
  timestamp: string;
  entityId?: string;
}

export interface DashboardSummaryDTO {
  totalBookings: number;
  activeCaretakers: number;
  pendingEmergencyAlerts: number;
  totalElders: number;
  totalFamilies: number;
  revenueThisMonth: number;
  revenueLast30Days: number;
  recentActivities: ActivityDTO[];
}

export interface FamilyDashboardSummaryDTO {
  managedElderCount: number;
  coManagedElderCount: number;
  upcomingBookings: number;
  unreadNotifications: number;
  pendingInviteCount: number;
  pendingInvites: InviteSummaryDTO[];
  recentActivities: ActivityDTO[];
}

export interface CaretakerDashboardSummaryDTO {
  upcomingBookings: number;
  completedBookings: number;
  averageRating: number | null;
  unreadNotifications: number;
  verificationStatus?: CaretakerVerificationStatusEnum;
  hasAvailabilitySet: boolean;
  recentActivities: ActivityDTO[];
}

export interface ElderDashboardSummaryDTO {
  upcomingBookings: number;
  activeEmergencyAlerts: number;
  unreadNotifications: number;
  pendingInviteCount: number;
  pendingInvites: InviteSummaryDTO[];
  recentMedicalRecords: ActivityDTO[];
}

export const useDashboardService = () => {
  return useMemo(
    () => ({
      getSummary: () => request<DashboardSummaryDTO>("GET", DASHBOARD_URLS.SUMMARY),
      getFamilySummary: () => request<FamilyDashboardSummaryDTO>("GET", DASHBOARD_URLS.FAMILY_SUMMARY),
      getCaretakerSummary: () => request<CaretakerDashboardSummaryDTO>("GET", DASHBOARD_URLS.CARETAKER_SUMMARY),
      getElderSummary: () => request<ElderDashboardSummaryDTO>("GET", DASHBOARD_URLS.ELDER_SUMMARY),
    }),
    []
  );
};
