import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "../../atoms/Button/Button";
import StatusChip from "../../atoms/Chip/StatusChip";
import { useUserSelfService, type NotificationPreferenceDTO } from "../../../services/useUserSelfService";
import { useWebPushSubscription } from "../../../hooks/useWebPushSubscription";
import { NotificationTypeEnum } from "../../../utils/enums";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../utils/helper";

// Friendly copy for each backend NotificationTypeEnum value — kept here rather than a
// generic title-case of the enum key so "NEW_MESSAGE" reads as "New Message" and
// "EMERGENCY_ALERT" carries the weight it should.
const TYPE_LABELS: Record<NotificationTypeEnum, string> = {
  [NotificationTypeEnum.BOOKING_CONFIRMED]: "Booking Confirmed",
  [NotificationTypeEnum.BOOKING_REMINDER]: "Booking Reminder",
  [NotificationTypeEnum.EMERGENCY_ALERT]: "Emergency Alert",
  [NotificationTypeEnum.NEW_MESSAGE]: "New Message",
  [NotificationTypeEnum.GENERAL]: "General",
};

const CHANNELS: { key: keyof NotificationPreferenceDTO; label: string }[] = [
  { key: "inAppEnabled", label: "In-App" },
  { key: "emailEnabled", label: "Email" },
  { key: "smsEnabled", label: "SMS" },
  { key: "webPushEnabled", label: "Push" },
];

// Mounted on every role's Settings page (see AccountSettings.page.tsx, shared across
// Family/Caretaker/Admin/Elder). Two independent controls:
//  1. Per-notification-type channel toggles (In-App/Email/SMS/Push) — GET/PUT
//     /users/me/notification-preferences. Each toggle saves itself immediately (same
//     "flip it, it's saved" pattern as the Assign Permissions tab on Roles & Permissions)
//     rather than a separate Save button, since there's no multi-field form here.
//  2. A device-level "Enable push notifications" toggle — the actual browser
//     Notification permission + pushManager.subscribe() flow (see
//     useWebPushSubscription). Independent of the per-type Push column above: that column
//     only controls whether THIS type is allowed to push once the device is subscribed at
//     all.
const NotificationPreferences: React.FC = () => {
  const userSelfService = useUserSelfService();
  const { showSnackbar } = useSnackbar();
  const push = useWebPushSubscription();

  const [preferences, setPreferences] = useState<NotificationPreferenceDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    userSelfService
      .getNotificationPreferences()
      .then(setPreferences)
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Could not load notification preferences")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleChannel = async (type: NotificationTypeEnum, channelKey: keyof NotificationPreferenceDTO) => {
    if (!preferences) return;
    const rowIndex = preferences.findIndex((p) => p.type === type);
    if (rowIndex === -1) return;
    const cellKey = `${type}:${channelKey}`;
    const previous = preferences;
    const updatedRow: NotificationPreferenceDTO = { ...preferences[rowIndex], [channelKey]: !preferences[rowIndex][channelKey] };
    const next = [...preferences];
    next[rowIndex] = updatedRow;
    setPreferences(next);
    setSavingKey(cellKey);
    try {
      await userSelfService.updateNotificationPreferences([updatedRow]);
    } catch (err) {
      setPreferences(previous);
      showSnackbar("error", getErrorMessage(err, "Could not update this preference"));
    } finally {
      setSavingKey(null);
    }
  };

  const pushStatusChip = () => {
    switch (push.status) {
      case "subscribed":
        return <StatusChip label="Enabled" tone="success" />;
      case "denied":
        return <StatusChip label="Blocked by browser" tone="error" />;
      case "unsupported":
        return <StatusChip label="Not supported" tone="default" />;
      case "checking":
        return <StatusChip label="Checking…" tone="default" />;
      default:
        return <StatusChip label="Disabled" tone="default" />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <NotificationsActiveIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Notification Preferences
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Push notifications on this device
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {push.status === "denied"
                ? "Notifications are blocked for this site in your browser settings."
                : push.status === "unsupported"
                ? "Your browser doesn't support push notifications."
                : "Get real-time alerts even when ElderSphere isn't open."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {pushStatusChip()}
            {push.status !== "unsupported" && push.status !== "denied" && (
              <Button
                variant={push.status === "subscribed" ? "outline" : "primary"}
                size="small"
                loading={push.busy}
                onClick={push.status === "subscribed" ? push.unsubscribe : push.subscribe}
              >
                {push.status === "subscribed" ? "Disable" : "Enable"}
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : !preferences || preferences.length === 0 ? (
          <Typography color="text.secondary">No notification types configured yet.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Notification</TableCell>
                  {CHANNELS.map((c) => (
                    <TableCell key={c.key} align="center">
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {preferences.map((pref) => (
                  <TableRow key={pref.type}>
                    <TableCell>{TYPE_LABELS[pref.type] ?? pref.type}</TableCell>
                    {CHANNELS.map((c) => {
                      const cellKey = `${pref.type}:${c.key}`;
                      return (
                        <TableCell key={c.key} align="center">
                          <Switch
                            size="small"
                            checked={Boolean(pref[c.key])}
                            disabled={savingKey === cellKey}
                            onChange={() => toggleChannel(pref.type, c.key)}
                            inputProps={{ "aria-label": `${TYPE_LABELS[pref.type] ?? pref.type} — ${c.label}` }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
