export const API_METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

export const REGEX = {
  EMAIL: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
  // Backend requires >= 8 chars, at least one uppercase letter and one digit.
  PASSWORD: /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/,
};

export const PUBLIC_ROUTES = {
  LANDING: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
};

export const FAMILY_ROUTES = {
  ROOT: "/family",
  DASHBOARD: "/family/dashboard",
  ELDER_PROFILES: "/family/elder-profiles",
  CARETAKER_SEARCH: "/family/caretakers",
  CARETAKER_PROFILE: "/family/caretakers/:id",
  BOOKINGS: "/family/bookings",
  MEDICAL_RECORDS: "/family/medical-records",
  REVIEWS: "/family/reviews",
  NOTIFICATIONS: "/family/notifications",
  EMERGENCY: "/family/emergency",
  SETTINGS: "/family/settings",
};

export const CARETAKER_ROUTES = {
  ROOT: "/caretaker",
  DASHBOARD: "/caretaker/dashboard",
  MY_PROFILE: "/caretaker/profile",
  BOOKINGS: "/caretaker/bookings",
  REVIEWS: "/caretaker/reviews",
  NOTIFICATIONS: "/caretaker/notifications",
  SETTINGS: "/caretaker/settings",
};

export const ADMIN_ROUTES = {
  ROOT: "/admin",
  DASHBOARD: "/admin/dashboard",
  USERS: "/admin/users",
  CARETAKER_VERIFICATION: "/admin/caretaker-verification",
  ELDER_PROFILES: "/admin/elder-profiles",
  SERVICES: "/admin/services",
  BOOKINGS: "/admin/bookings",
  MEDICAL_RECORDS: "/admin/medical-records",
  REVIEWS: "/admin/reviews",
  EMERGENCY_ALERTS: "/admin/emergency-alerts",
  LANDING_MANAGEMENT: "/admin/landing-management",
  CONTACT_US: "/admin/contact-us",
  ROLES_PERMISSIONS: "/admin/roles-permissions",
  PLATFORM_SETTINGS: "/admin/platform-settings",
};
