import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, ListItemText } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import { useNotificationService, type NotificationResponseDTO } from "../../../services/useNotificationService";
import { useWebSocket } from "../../../contexts/WebSocketContext";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import { formatDateTime } from "../../../utils/helper";

const NotificationBell: React.FC = () => {
  const notificationService = useNotificationService();
  const navigate = useNavigate();
  const { user } = useAuthenticatedUser();
  const { subscribe } = useWebSocket();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>([]);

  const fetchUnread = useCallback(async () => {
    try {
      const count = await notificationService.unreadCount();
      setUnreadCount(count);
    } catch {
      // Silently ignore — the bell simply won't badge until the next successful poll.
    }
  }, [notificationService]);

  // Initial load + a 30s poll remain as the fallback source of truth (also covers the
  // window before the socket connects); the WS subscription below layers live updates
  // on top so the badge/menu react the instant a notification is pushed
  // (/topic/notifications/{userId}, see WebSocketConfig on the backend) rather than
  // waiting for the next poll.
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribe(`/topic/notifications/${user.id}`, (frame) => {
      let notification: NotificationResponseDTO;
      try {
        notification = JSON.parse(frame.body);
      } catch {
        return;
      }
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [notification, ...prev].slice(0, 6));
    });
    return unsubscribe;
  }, [subscribe, user]);

  const handleOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    try {
      const page = await notificationService.list(0, 6);
      setNotifications(page.content);
    } catch {
      setNotifications([]);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = async (n: NotificationResponseDTO) => {
    if (!n.isRead) {
      try {
        await notificationService.markAsRead(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // best-effort
      }
    }
    handleClose();
    if (n.link) navigate(n.link);
  };

  return (
    <>
      <IconButton id="notification-bell-button" onClick={handleOpen} aria-label="Notifications" title="Notifications">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} PaperProps={{ sx: { width: 340 } }}>
        <Box px={2} py={1}>
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="You're all caught up" />
          </MenuItem>
        ) : (
          notifications.map((n) => (
            <MenuItem key={n.id} onClick={() => handleNotificationClick(n)} sx={{ whiteSpace: "normal" }}>
              <ListItemText
                primary={n.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.secondary" display="block">
                      {n.message}
                    </Typography>
                    <Typography component="span" variant="caption" color="text.disabled">
                      {formatDateTime(n.createdAt)}
                    </Typography>
                  </>
                }
                primaryTypographyProps={{ fontWeight: n.isRead ? 400 : 700 }}
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
