import React from "react";
import { List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import { formatDateTime } from "../../../utils/helper";

export interface ActivityItem {
  id?: React.Key;
  type?: string;
  description: string;
  timestamp: string;
  /** Overrides the type-based default icon for this one item. */
  icon?: React.ReactNode;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  emptyMessage?: string;
}

// Best-effort icon-per-event-type: the backend's ActivityDTO#type is a freeform string
// (e.g. "BOOKING_CREATED", "MEDICAL_RECORD_ADDED"), so this matches on keyword rather than
// an exact enum. Falls back to a generic history icon for anything unrecognized.
const iconForType = (type?: string): React.ReactNode => {
  const t = (type ?? "").toUpperCase();
  if (t.includes("BOOKING")) return <EventNoteIcon fontSize="small" color="primary" />;
  if (t.includes("MEDICAL") || t.includes("RECORD")) return <FolderSharedIcon fontSize="small" color="primary" />;
  if (t.includes("ALERT") || t.includes("EMERGENCY")) return <WarningAmberIcon fontSize="small" color="error" />;
  if (t.includes("REVIEW") || t.includes("RATING")) return <RateReviewIcon fontSize="small" color="primary" />;
  if (t.includes("MESSAGE") || t.includes("CONVERSATION")) return <ChatBubbleOutlineIcon fontSize="small" color="primary" />;
  if (t.includes("NOTIFICATION")) return <NotificationsIcon fontSize="small" color="primary" />;
  if (t.includes("USER") || t.includes("PROFILE") || t.includes("CARETAKER") || t.includes("ELDER")) return <PersonIcon fontSize="small" color="primary" />;
  return <HistoryIcon fontSize="small" color="disabled" />;
};

// Consolidates the "Recent Activity" (and equivalent) panels hand-rolled on every dashboard
// home page — a list of timestamped events, each with an icon derived from its type, a
// description, and a timestamp — into one component.
const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, emptyMessage = "No recent activity." }) => {
  if (items.length === 0) {
    return <Typography color="text.secondary">{emptyMessage}</Typography>;
  }

  return (
    <List disablePadding>
      {items.map((item, idx) => (
        <ListItem key={item.id ?? idx} divider>
          <ListItemIcon sx={{ minWidth: 36 }}>{item.icon ?? iconForType(item.type)}</ListItemIcon>
          <ListItemText primary={item.description} secondary={item.type ? `${item.type} · ${formatDateTime(item.timestamp)}` : formatDateTime(item.timestamp)} />
        </ListItem>
      ))}
    </List>
  );
};

export default ActivityFeed;
