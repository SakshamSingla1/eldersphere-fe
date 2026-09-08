import type { StatusTone } from "./StatusChip";

/**
 * Centralized status -> tone mappings, one small config object per status-bearing
 * domain in the app. Every page that renders one of these enums as a `StatusChip`
 * should import the matching map here rather than hand-rolling its own copy.
 */

/** Booking.status: PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED */
export const BOOKING_STATUS_TONE: Record<string, StatusTone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "error",
};

/** EmergencyAlert.status: TRIGGERED | ACKNOWLEDGED | RESOLVED */
export const EMERGENCY_ALERT_STATUS_TONE: Record<string, StatusTone> = {
  TRIGGERED: "error",
  ACKNOWLEDGED: "warning",
  RESOLVED: "success",
};

/** ContactUs.status: NEW | RESPONDED | CLOSED */
export const CONTACT_US_STATUS_TONE: Record<string, StatusTone> = {
  NEW: "warning",
  RESPONDED: "info",
  CLOSED: "success",
};

/** Caretaker.verificationStatus: PENDING | VERIFIED | REJECTED */
export const CARETAKER_VERIFICATION_STATUS_TONE: Record<string, StatusTone> = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "error",
};

/** User.status: ACTIVE | INACTIVE | PENDING_VERIFICATION */
export const USER_ACCOUNT_STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: "success",
  INACTIVE: "default",
  PENDING_VERIFICATION: "warning",
};
