import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  Stack,
  Typography,
  Avatar,
  Badge,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import Loader from "../../atoms/Loader/Loader";
import EmptyState from "../../molecules/EmptyState/EmptyState";
import { NoMessagesIllustration } from "../../atoms/Illustrations/Illustrations";
import {
  useMessagingService,
  type ConversationResponse,
  type MessageResponse,
} from "../../../services/useMessagingService";
import { useWebSocket } from "../../../contexts/WebSocketContext";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { formatDateTime, getErrorMessage, getInitials } from "../../../utils/helper";

// Shared across the Family, Caretaker and Elder shells (messaging is user-to-user, not
// role-scoped) — classic two-pane chat: conversation list left, thread right, collapsing
// to a stacked mobile view (list OR thread, never both) below `md`. Live delivery rides
// the STOMP topic /topic/conversations/{id} (see WebSocketContext); the REST endpoints
// under /conversations remain the source of truth for history and are what populate the
// page on load. Reachable both as its own nav item and via `?conversationId=` from a
// booking's "Message caretaker/family" action, which already did the getOrCreate call.
const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const messagingService = useMessagingService();
  const { subscribe } = useWebSocket();
  const { user } = useAuthenticatedUser();
  const { showSnackbar } = useSnackbar();

  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const page = await messagingService.getMyConversations();
      setConversations(page.content);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not load your conversations"));
    } finally {
      setLoadingConversations(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Deep-link from a booking's "Message caretaker/family" action: ?conversationId=123.
  useEffect(() => {
    const fromQuery = searchParams.get("conversationId");
    if (fromQuery) setActiveId(Number(fromQuery));
  }, [searchParams]);

  const openConversation = useCallback(
    async (id: number) => {
      setActiveId(id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("conversationId", String(id));
        return next;
      });
      setLoadingMessages(true);
      try {
        const page = await messagingService.getMessages(id, 0, 100);
        setMessages(page.content);
        await messagingService.markRead(id);
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
      } catch (error) {
        showSnackbar("error", getErrorMessage(error, "Could not load this conversation"));
      } finally {
        setLoadingMessages(false);
      }
    },
    [messagingService, setSearchParams, showSnackbar]
  );

  // Auto-open once the list has loaded and a conversationId is pending from the query string.
  useEffect(() => {
    const fromQuery = searchParams.get("conversationId");
    if (fromQuery && !loadingConversations && conversations.some((c) => c.id === Number(fromQuery)) && messages.length === 0) {
      openConversation(Number(fromQuery));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConversations, conversations]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeId]);

  const activeIdRef = useRef<number | null>(null);
  activeIdRef.current = activeId;

  // Subscribe to every conversation the user is part of so the list updates live (new
  // preview + unread bump) even for threads that aren't currently open, and the open
  // thread appends incoming messages live without a reload or poll.
  useEffect(() => {
    const unsubscribers = conversations.map((conversation) =>
      subscribe(`/topic/conversations/${conversation.id}`, (frame) => {
        let incoming: MessageResponse;
        try {
          incoming = JSON.parse(frame.body);
        } catch {
          return;
        }
        const isMine = incoming.senderId === user?.id;
        if (activeIdRef.current === conversation.id) {
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          if (!isMine) messagingService.markRead(conversation.id).catch(() => {});
        }
        setConversations((prev) =>
          [...prev]
            .map((c) =>
              c.id === conversation.id
                ? {
                    ...c,
                    lastMessageAt: incoming.sentAt,
                    unreadCount: activeIdRef.current === conversation.id || isMine ? 0 : c.unreadCount + 1,
                  }
                : c
            )
            .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
        );
      })
    );
    return () => unsubscribers.forEach((unsub) => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, conversations.map((c) => c.id).join(","), user?.id]);

  const activeConversation = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      const sent = await messagingService.sendMessage(activeId, draft.trim());
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, lastMessageAt: sent.sentAt } : c))
      );
      setDraft("");
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Message could not be sent"));
    } finally {
      setSending(false);
    }
  };

  const showList = !isMobile || !activeId;
  const showThread = !isMobile || Boolean(activeId);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <ChatBubbleOutlineIcon color="primary" />
        <Typography variant="h6" fontWeight={800}>
          Messages
        </Typography>
      </Stack>
      <Card sx={{ display: "flex", height: { xs: "calc(100vh - 220px)", md: 560 }, overflow: "hidden" }}>
        {showList && (
          <Box
            sx={{
              width: { xs: "100%", md: 300 },
              flexShrink: 0,
              borderRight: { md: "1px solid" },
              borderColor: "divider",
              overflowY: "auto",
            }}
          >
            {loadingConversations ? (
              <Loader minHeight={200} />
            ) : conversations.length === 0 ? (
              <EmptyState
                illustration={<NoMessagesIllustration size={96} />}
                title="No conversations yet"
                description="Message a caretaker or family member from a booking to start one."
                minHeight={300}
              />
            ) : (
              <List disablePadding>
                {conversations.map((conversation) => (
                  <ListItemButton
                    key={conversation.id}
                    selected={conversation.id === activeId}
                    onClick={() => openConversation(conversation.id)}
                  >
                    <ListItemAvatar>
                      <Badge color="error" badgeContent={conversation.unreadCount} max={99}>
                        <Avatar>{getInitials(conversation.otherUserName)}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={conversation.otherUserName ?? "User"}
                      secondary={conversation.lastMessageAt ? formatDateTime(conversation.lastMessageAt) : "No messages yet"}
                      primaryTypographyProps={{ fontWeight: conversation.unreadCount > 0 ? 700 : 500, noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        )}

        {showThread && (
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {!activeConversation ? (
              <EmptyState
                icon={<ChatBubbleOutlineIcon fontSize="large" />}
                title="Select a conversation"
                description="Pick someone from the list to see your messages."
                minHeight={400}
              />
            ) : (
              <>
                <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                  {isMobile && (
                    <IconButton size="small" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Avatar sx={{ width: 34, height: 34, fontSize: 13 }}>{getInitials(activeConversation.otherUserName)}</Avatar>
                  <Typography fontWeight={700} noWrap>
                    {activeConversation.otherUserName ?? "User"}
                  </Typography>
                </Stack>

                <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  {loadingMessages ? (
                    <Loader minHeight={200} />
                  ) : messages.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" mt={4}>
                      No messages yet — say hello!
                    </Typography>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.senderId === user?.id;
                      return (
                        <Box
                          key={message.id}
                          sx={{
                            alignSelf: isMine ? "flex-end" : "flex-start",
                            maxWidth: "75%",
                            bgcolor: isMine ? "primary.main" : "action.hover",
                            color: isMine ? "primary.contrastText" : "text.primary",
                            borderRadius: "14px",
                            borderBottomRightRadius: isMine ? 4 : 14,
                            borderBottomLeftRadius: isMine ? 14 : 4,
                            px: 1.75,
                            py: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {message.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.75, display: "block", textAlign: "right", mt: 0.25 }}
                          >
                            {formatDateTime(message.sentAt)}
                          </Typography>
                        </Box>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </Box>

                <Stack
                  component="form"
                  direction="row"
                  spacing={1}
                  alignItems="flex-end"
                  onSubmit={handleSend}
                  sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}
                >
                  <TextField
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <Button type="submit" variant="primary" loading={sending} disabled={!draft.trim()} sx={{ minWidth: 0, px: 2 }}>
                    <SendIcon fontSize="small" />
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default MessagesPage;
