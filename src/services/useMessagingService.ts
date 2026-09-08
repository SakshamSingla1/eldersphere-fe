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
      getMessages: (conversationId: number, page = 0, size = 50) =>
        request<PageResponse<MessageResponse>>("GET", replaceUrlParams(MESSAGING_URLS.MESSAGES, { id: conversationId }), null, {
          params: { page, size },
        }),
      sendMessage: (conversationId: number, content: string) =>
        request<MessageResponse>("POST", replaceUrlParams(MESSAGING_URLS.MESSAGES, { id: conversationId }), { content }),
      markRead: (conversationId: number) =>
        request<string>("PUT", replaceUrlParams(MESSAGING_URLS.READ, { id: conversationId })),
    }),
    []
  );
};
