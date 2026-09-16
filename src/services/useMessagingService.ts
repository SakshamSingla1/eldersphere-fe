import { useMemo } from "react";
import { request } from ".";
import { replaceUrlParams } from "../utils/helper";
import type { PageResponse } from "../utils/types";

const MESSAGING_URLS = {
  CONVERSATIONS: "/conversations",
  MESSAGES: "/conversations/:id/messages",
  READ: "/conversations/:id/read",
};

export interface ConversationResponse {
  id: number;
  userAId: number;
  userBId: number;
  otherUserId: number;
  otherUserName?: string;
  bookingId?: number | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  senderName?: string;
  content: string;
  sentAt: string;
  readAt?: string | null;
  fileAssetId?: number | null;
  fileUrl?: string | null;
}

export const useMessagingService = () => {
  return useMemo(
    () => ({
      getOrCreateConversation: (otherUserId: number, bookingId?: number) =>
        request<ConversationResponse>("POST", MESSAGING_URLS.CONVERSATIONS, { otherUserId, bookingId }),
      getMyConversations: (page = 0, size = 50) =>
        request<PageResponse<ConversationResponse>>("GET", MESSAGING_URLS.CONVERSATIONS, null, {
          params: { page, size, sort: "lastMessageAt,desc" },
        }),
      // `beforeId` (a message id) fetches the page immediately preceding that message,
      // still oldest-first within the page — used for "load older messages"; omit it for
      // the initial (most recent) page.
      getMessages: (conversationId: number, options?: { beforeId?: number; size?: number }) =>
        request<PageResponse<MessageResponse>>("GET", replaceUrlParams(MESSAGING_URLS.MESSAGES, { id: conversationId }), null, {
          params: { beforeId: options?.beforeId, size: options?.size ?? 50 },
        }),
      sendMessage: (conversationId: number, content: string, fileAssetId?: number) =>
        request<MessageResponse>("POST", replaceUrlParams(MESSAGING_URLS.MESSAGES, { id: conversationId }), {
          content,
          fileAssetId,
        }),
      markRead: (conversationId: number) =>
        request<string>("PUT", replaceUrlParams(MESSAGING_URLS.READ, { id: conversationId })),
    }),
    []
  );
};
