import { useMemo } from "react";
import { request } from ".";
import type { UserTypeEnum, NotificationTypeEnum } from "../utils/enums";
import type { PushSubscriptionJSON } from "../utils/webPush";

const USER_SELF_URLS = {
  ROLES: "/users/me/roles",
  DEFAULT_ROLE: "/users/me/default-role",
  NOTIFICATION_PREFERENCES: "/users/me/notification-preferences",
  PUSH_SUBSCRIPTIONS: "/users/me/push-subscriptions",
};

// Mirrors com.eldersphere.dtos.User.UserRolesResponse.
export interface UserRolesResponse {
  userId: number;
  roles: UserTypeEnum[];
  primaryRole: UserTypeEnum;
}

// Mirrors com.eldersphere.dtos.Notification.NotificationPreferenceDTO — one (notification
// type -> channel toggles) entry, used both for GET's resolved list and PUT's bulk-upsert
// request body.
export interface NotificationPreferenceDTO {
  type: NotificationTypeEnum;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  webPushEnabled: boolean;
}

// The logged-in user's own multi-role info — full role list, and switching which
// already-held role is their primary/default (the one they land on after login).
// Backs the "log in as a specific role" flow in useRoleGatedLogin: an account that holds
// a role but doesn't currently have it as primary gets switched over via this endpoint
// rather than being rejected.
export const useUserSelfService = () => {
  return useMemo(
    () => ({
      getMyRoles: () => request<UserRolesResponse>("GET", USER_SELF_URLS.ROLES),
      switchDefaultRole: (roleType: UserTypeEnum) =>
        request<UserRolesResponse>("PUT", USER_SELF_URLS.DEFAULT_ROLE, { roleType }),
      getNotificationPreferences: () =>
        request<NotificationPreferenceDTO[]>("GET", USER_SELF_URLS.NOTIFICATION_PREFERENCES),
      updateNotificationPreferences: (preferences: NotificationPreferenceDTO[]) =>
        request<NotificationPreferenceDTO[]>("PUT", USER_SELF_URLS.NOTIFICATION_PREFERENCES, { preferences }),
      registerPushSubscription: (subscription: PushSubscriptionJSON) =>
        request<void>("POST", USER_SELF_URLS.PUSH_SUBSCRIPTIONS, subscription),
      removePushSubscription: (endpoint: string) =>
        request<void>("DELETE", USER_SELF_URLS.PUSH_SUBSCRIPTIONS, { endpoint }),
    }),
    []
  );
};
