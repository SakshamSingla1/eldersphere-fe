import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { PageResponse } from "../utils/types";
import type { NotificationTypeEnum } from "../utils/enums";

const NOTIFICATION_URLS = {
  BASE: "/notifications",
  UNREAD_COUNT: "/notifications/unread-count",
  READ: "/notifications/:id/read",
  READ_ALL: "/notifications/read-all",
  BY_ID: "/notifications/:id",
};

export interface NotificationResponseDTO {
  id: number;
  type: NotificationTypeEnum;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotificationService = () => {
  return useMemo(
    () => ({
      list: (page = 0, size = 10) =>
        request<PageResponse<NotificationResponseDTO>>("GET", NOTIFICATION_URLS.BASE, null, { params: { page, size } }),
      unreadCount: () => request<number>("GET", NOTIFICATION_URLS.UNREAD_COUNT),
      markAsRead: (id: number) => request<string>("PUT", replaceUrlParams(NOTIFICATION_URLS.READ, { id })),
      markAllAsRead: () => request<string>("PUT", NOTIFICATION_URLS.READ_ALL),
      remove: (id: number) => request<string>("DELETE", replaceUrlParams(NOTIFICATION_URLS.BY_ID, { id })),
    }),
    []
  );
};
