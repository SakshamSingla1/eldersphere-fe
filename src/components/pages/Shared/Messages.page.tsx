import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  Stack,
  Typography,
  Avatar,
  Badge,
  Chip,
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
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
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
import { useFileService } from "../../../services/useFileService";
import { usePresenceService } from "../../../services/usePresenceService";
import { useWebSocket } from "../../../contexts/WebSocketContext";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { formatDateTime, getErrorMessage, getInitials } from "../../../utils/helper";
import { ResourceTypeEnum } from "../../../utils/enums";

const PAGE_SIZE = 30;
const TYPING_PUBLISH_INTERVAL_MS = 1500;
const TYPING_STOP_DELAY_MS = 2000;
const TYPING_AUTO_CLEAR_MS = 4000;

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp)$/i.test(url.split("?")[0]);
const fileNameFromUrl = (url: string) => decodeURIComponent(url.split("?")[0].split("/").pop() ?? "file");

const presenceDotSx = (online?: boolean) => ({
  "& .MuiBadge-dot": {
    backgroundColor: online ? "success.main" : "grey.400",
    border: "2px solid",
    borderColor: "background.paper",
  },
});

// Shared across the Family, Caretaker and Elder shells (messaging is user-to-user, not
// role-scoped) — classic two-pane chat: conversation list left, thread right, collapsing
// to a stacked mobile view (list OR thread, never both) below `md`. Live delivery rides
// the STOMP topic /topic/conversations/{id} (see WebSocketContext); the REST endpoints
// under /conversations remain the source of truth for history and are what populate the
// page on load. Reachable both as its own nav item and via `?conversationId=` from a
// booking's "Message caretaker/family" action, which already did the getOrCreate call.
// Role-agnostic — Admin renders this same component from Admin/Messages.page.tsx.
const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const messagingService = useMessagingService();
  const fileService = useFileService();
  const presenceService = usePresenceService();
  const { subscribe, publish } = useWebSocket();
  const { user } = useAuthenticatedUser();
  const { showSnackbar } = useSnackbar();

  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingOther, setTypingOther] = useState(false);
  const [presence, setPresence] = useState<Record<number, boolean>>({});
  const [bottomTick, setBottomTick] = useState(0);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const typingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingLastSentRef = useRef(0);

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

  // Initial presence snapshot for everyone in the list (so both the list dots and the
  // thread header have something to show before the first /topic/presence event arrives).
  useEffect(() => {
    if (conversations.length === 0) return;
    const ids = Array.from(new Set(conversations.map((c) => c.otherUserId)));
    presenceService
      .getStatus(ids)
      .then((status) => {
        setPresence((prev) => {
          const next = { ...prev };
          Object.entries(status).forEach(([id, online]) => {
            next[Number(id)] = online;
          });
          return next;
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.map((c) => c.otherUserId).join(",")]);

  useEffect(() => {
    return subscribe("/topic/presence", (frame) => {
      try {
        const payload: { userId: number; online: boolean } = JSON.parse(frame.body);
        setPresence((prev) => ({ ...prev, [payload.userId]: payload.online }));
      } catch {
        // ignore malformed presence frames
      }
    });
  }, [subscribe]);

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
      setHasMoreOlder(false);
      try {
        const page = await messagingService.getMessages(id, { size: PAGE_SIZE });
        setMessages(page.content);
        setHasMoreOlder(page.content.length >= PAGE_SIZE);
        setBottomTick((t) => t + 1);
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

  const loadOlderMessages = useCallback(async () => {
    if (!activeId || !hasMoreOlder || loadingOlder || messages.length === 0) return;
    const oldestId = messages[0].id;
    pendingScrollAdjustRef.current = threadScrollRef.current?.scrollHeight ?? null;
    setLoadingOlder(true);
    try {
      const page = await messagingService.getMessages(activeId, { beforeId: oldestId, size: PAGE_SIZE });
      setMessages((prev) => [...page.content, ...prev]);
      setHasMoreOlder(page.content.length >= PAGE_SIZE);
    } catch (error) {
      pendingScrollAdjustRef.current = null;
      showSnackbar("error", getErrorMessage(error, "Could not load older messages"));
    } finally {
      setLoadingOlder(false);
    }
  }, [activeId, hasMoreOlder, loadingOlder, messages, messagingService, showSnackbar]);

  // Preserve scroll position when older messages are prepended, instead of letting the
  // browser keep scrollTop fixed (which would jump the view down as content grows above it).
  useLayoutEffect(() => {
    const container = threadScrollRef.current;
    if (container && pendingScrollAdjustRef.current != null) {
      container.scrollTop = container.scrollHeight - pendingScrollAdjustRef.current;
      pendingScrollAdjustRef.current = null;
    }
  }, [messages]);

  const handleThreadScroll = () => {
    const container = threadScrollRef.current;
    if (container && container.scrollTop < 60 && hasMoreOlder && !loadingOlder && !loadingMessages) {
      loadOlderMessages();
    }
  };

  // Auto-open once the list has loaded and a conversationId is pending from the query string.
  useEffect(() => {
    const fromQuery = searchParams.get("conversationId");
    if (fromQuery && !loadingConversations && conversations.some((c) => c.id === Number(fromQuery)) && messages.length === 0) {
      openConversation(Number(fromQuery));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConversations, conversations]);

  // Scroll-to-bottom only fires for the initial load of a thread and for messages
  // appended at the end (sent or received) — never for older pages prepended on top.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bottomTick]);

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
          setBottomTick((t) => t + 1);
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

  // Typing indicator is scoped to whichever thread is currently open.
  useEffect(() => {
    setTypingOther(false);
    if (!activeId) return undefined;
    const unsubscribe = subscribe(`/topic/conversations/${activeId}/typing`, (frame) => {
      let payload: { userId: number; typing: boolean };
      try {
        payload = JSON.parse(frame.body);
      } catch {
        return;
      }
      if (payload.userId === user?.id) return;
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      if (payload.typing) {
        setTypingOther(true);
        typingClearTimerRef.current = setTimeout(() => setTypingOther(false), TYPING_AUTO_CLEAR_MS);
      } else {
        setTypingOther(false);
      }
    });
    return () => {
      unsubscribe();
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
    };
  }, [subscribe, activeId, user?.id]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
    };
  }, []);

  const stopTyping = useCallback(() => {
    if (!activeId) return;
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    typingLastSentRef.current = 0;
    publish(`/app/conversations/${activeId}/typing`, { typing: false });
  }, [activeId, publish]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!activeId) return;
    const now = Date.now();
    if (now - typingLastSentRef.current > TYPING_PUBLISH_INTERVAL_MS) {
      publish(`/app/conversations/${activeId}/typing`, { typing: true });
      typingLastSentRef.current = now;
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY_MS);
  };

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
      stopTyping();
      setBottomTick((t) => t + 1);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Message could not be sent"));
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async (file: File | null | undefined) => {
    if (!file || !activeId) return;
    setUploading(true);
    try {
      const asset = await fileService.upload(file, ResourceTypeEnum.GENERAL);
      const sent = await messagingService.sendMessage(activeId, draft.trim(), asset.id);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, lastMessageAt: sent.sentAt } : c))
      );
      setDraft("");
      stopTyping();
      setBottomTick((t) => t + 1);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "File could not be sent"));
    } finally {
      setUploading(false);
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
                        <Badge
                          overlap="circular"
                          variant="dot"
                          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                          sx={presenceDotSx(presence[conversation.otherUserId])}
                        >
                          <Avatar>{getInitials(conversation.otherUserName)}</Avatar>
                        </Badge>
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
                <Stack sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} px={2} py={1.5}>
                    {isMobile && (
                      <IconButton size="small" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                        <ArrowBackIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Badge
                      overlap="circular"
                      variant="dot"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      sx={presenceDotSx(presence[activeConversation.otherUserId])}
                    >
                      <Avatar sx={{ width: 34, height: 34, fontSize: 13 }}>{getInitials(activeConversation.otherUserName)}</Avatar>
                    </Badge>
                    <Box minWidth={0}>
                      <Typography fontWeight={700} noWrap>
                        {activeConversation.otherUserName ?? "User"}
                      </Typography>
                      {typingOther && (
                        <Typography variant="caption" color="text.secondary">
                          typing…
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Stack>

                <Box
                  ref={threadScrollRef}
                  onScroll={handleThreadScroll}
                  sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}
                >
                  {loadingMessages ? (
                    <Loader minHeight={200} />
                  ) : messages.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" mt={4}>
                      No messages yet — say hello!
                    </Typography>
                  ) : (
                    <>
                      {hasMoreOlder && (
                        <Box textAlign="center" mb={1}>
                          <Button variant="text" loading={loadingOlder} onClick={loadOlderMessages} sx={{ fontSize: 12 }}>
                            Load older messages
                          </Button>
                        </Box>
                      )}
                      {messages.map((message) => {
                        const isMine = message.senderId === user?.id;
                        const fileUrl = message.fileUrl;
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
                            {fileUrl &&
                              (isImageUrl(fileUrl) ? (
                                <Box
                                  component="img"
                                  src={fileUrl}
                                  onClick={() => window.open(fileUrl, "_blank", "noopener")}
                                  sx={{
                                    display: "block",
                                    maxWidth: 200,
                                    maxHeight: 200,
                                    borderRadius: 1,
                                    cursor: "pointer",
                                    mb: message.content ? 0.75 : 0,
                                  }}
                                />
                              ) : (
                                <Chip
                                  component="a"
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener"
                                  clickable
                                  size="small"
                                  icon={<InsertDriveFileIcon />}
                                  label={fileNameFromUrl(fileUrl)}
                                  sx={{ mb: message.content ? 0.75 : 0, maxWidth: "100%" }}
                                />
                              ))}
                            {message.content && (
                              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {message.content}
                              </Typography>
                            )}
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.4} mt={0.25}>
                              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                                {formatDateTime(message.sentAt)}
                              </Typography>
                              {isMine &&
                                (message.readAt ? (
                                  <DoneAllIcon sx={{ fontSize: 14, opacity: 0.75 }} />
                                ) : (
                                  <DoneIcon sx={{ fontSize: 14, opacity: 0.75 }} />
                                ))}
                            </Stack>
                          </Box>
                        );
                      })}
                    </>
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
                  <IconButton component="label" size="small" disabled={uploading || sending} sx={{ mb: 0.5 }}>
                    <AttachFileIcon fontSize="small" />
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        handleAttach(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </IconButton>
                  <TextField
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onBlur={stopTyping}
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
                  <Button
                    type="submit"
                    variant="primary"
                    loading={sending || uploading}
                    disabled={!draft.trim()}
                    sx={{ minWidth: 0, px: 2 }}
                  >
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
