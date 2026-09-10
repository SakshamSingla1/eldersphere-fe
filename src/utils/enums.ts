// Mirrors com.eldersphere.enums.* on the backend — keep values in sync with the Java enums.

export const UserTypeEnum = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  ELDER: "ELDER",
  CARETAKER: "CARETAKER",
  FAMILY_MEMBER: "FAMILY_MEMBER",
} as const;
export type UserTypeEnum = (typeof UserTypeEnum)[keyof typeof UserTypeEnum];

// Friendly display label for a base account role (the multi-role UserTypeEnum above) —
// used by the in-session role switcher (Topbar) and the admin "base roles" chips (Admin >
// Users), both of which need to show these to end users rather than the raw enum value.
// Not to be confused with the separate custom-Role/Permission RBAC system's own `roleName`.
export const USER_TYPE_LABEL: Record<UserTypeEnum, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ELDER: "Elder",
  CARETAKER: "Caretaker",
  FAMILY_MEMBER: "Family Member",
};

export const UserStatusEnum = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
} as const;
export type UserStatusEnum = (typeof UserStatusEnum)[keyof typeof UserStatusEnum];

export const ServiceCategoryEnum = {
  NURSING: "NURSING",
  PHYSIOTHERAPY: "PHYSIOTHERAPY",
  MEDICATION_ASSISTANCE: "MEDICATION_ASSISTANCE",
  COMPANION_CARE: "COMPANION_CARE",
} as const;
export type ServiceCategoryEnum = (typeof ServiceCategoryEnum)[keyof typeof ServiceCategoryEnum];

export const ServiceCategoryLabels: Record<ServiceCategoryEnum, string> = {
  NURSING: "Nursing",
  PHYSIOTHERAPY: "Physiotherapy",
  MEDICATION_ASSISTANCE: "Medication Assistance",
  COMPANION_CARE: "Companion Care",
};

export const BookingStatusEnum = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type BookingStatusEnum = (typeof BookingStatusEnum)[keyof typeof BookingStatusEnum];

export const CaretakerVerificationStatusEnum = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type CaretakerVerificationStatusEnum =
  (typeof CaretakerVerificationStatusEnum)[keyof typeof CaretakerVerificationStatusEnum];

export const EmergencyAlertStatusEnum = {
  TRIGGERED: "TRIGGERED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED",
} as const;
export type EmergencyAlertStatusEnum = (typeof EmergencyAlertStatusEnum)[keyof typeof EmergencyAlertStatusEnum];

export const MedicalRecordTypeEnum = {
  PRESCRIPTION: "PRESCRIPTION",
  TREATMENT: "TREATMENT",
  LAB_REPORT: "LAB_REPORT",
} as const;
export type MedicalRecordTypeEnum = (typeof MedicalRecordTypeEnum)[keyof typeof MedicalRecordTypeEnum];

export const ContactUsStatusEnum = {
  NEW: "NEW",
  RESPONDED: "RESPONDED",
  CLOSED: "CLOSED",
} as const;
export type ContactUsStatusEnum = (typeof ContactUsStatusEnum)[keyof typeof ContactUsStatusEnum];

export const NotificationTypeEnum = {
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_REMINDER: "BOOKING_REMINDER",
  EMERGENCY_ALERT: "EMERGENCY_ALERT",
  NEW_MESSAGE: "NEW_MESSAGE",
  GENERAL: "GENERAL",
  ELDER_LINK_INVITE: "ELDER_LINK_INVITE",
  ELDER_LINK_ACCEPTED: "ELDER_LINK_ACCEPTED",
  ELDER_LINK_DECLINED: "ELDER_LINK_DECLINED",
} as const;
export type NotificationTypeEnum = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const LinkInviteStatusEnum = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  REVOKED: "REVOKED",
} as const;
export type LinkInviteStatusEnum = (typeof LinkInviteStatusEnum)[keyof typeof LinkInviteStatusEnum];

export const RoleStatusEnum = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type RoleStatusEnum = (typeof RoleStatusEnum)[keyof typeof RoleStatusEnum];

export const ColorThemeStatusEnum = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type ColorThemeStatusEnum = (typeof ColorThemeStatusEnum)[keyof typeof ColorThemeStatusEnum];

export const ResourceTypeEnum = {
  CARETAKER_PROFILE_PHOTO: "CARETAKER_PROFILE_PHOTO",
  MEDICAL_RECORD_DOCUMENT: "MEDICAL_RECORD_DOCUMENT",
  LANDING_TESTIMONIAL_AVATAR: "LANDING_TESTIMONIAL_AVATAR",
  GENERAL: "GENERAL",
} as const;
export type ResourceTypeEnum = (typeof ResourceTypeEnum)[keyof typeof ResourceTypeEnum];

export const DayOfWeekEnum = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;
export type DayOfWeekEnum = (typeof DayOfWeekEnum)[keyof typeof DayOfWeekEnum];

export const DAYS_OF_WEEK: DayOfWeekEnum[] = [
  DayOfWeekEnum.MONDAY,
  DayOfWeekEnum.TUESDAY,
  DayOfWeekEnum.WEDNESDAY,
  DayOfWeekEnum.THURSDAY,
  DayOfWeekEnum.FRIDAY,
  DayOfWeekEnum.SATURDAY,
  DayOfWeekEnum.SUNDAY,
];

export const DayOfWeekShortLabels: Record<DayOfWeekEnum, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export const NavLinkStatusEnum = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type NavLinkStatusEnum = (typeof NavLinkStatusEnum)[keyof typeof NavLinkStatusEnum];

export const GenderEnum = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;
export type GenderEnum = (typeof GenderEnum)[keyof typeof GenderEnum];

export const enumToOptions = <T extends Record<string, string>>(
  e: T,
  labels?: Partial<Record<T[keyof T], string>>
): { value: string; label: string }[] =>
  Object.values(e).map((v) => ({ value: v, label: labels?.[v as T[keyof T]] ?? titleCase(v) }));

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
