import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Grid, Card, CardContent, Typography, Stack, List, ListItem, ListItemText, Box, Skeleton } from "@mui/material";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import dayjs from "dayjs";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import StatCard from "../../../molecules/StatCard/StatCard";
import EmptyState from "../../../molecules/EmptyState/EmptyState";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { BOOKING_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import ActivityFeed from "../../../molecules/ActivityFeed/ActivityFeed";
import Button from "../../../atoms/Button/Button";
import { NoBookingsIllustration } from "../../../atoms/Illustrations/Illustrations";
import { DashboardSkeleton } from "../../../molecules/Skeletons/Skeletons";
import GettingStartedChecklist from "../../../molecules/GettingStartedChecklist/GettingStartedChecklist";
import { useAuthenticatedUser } from "../../../../hooks/useAuthenticatedUser";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useDashboardService, type FamilyDashboardSummaryDTO } from "../../../../services/useDashboardService";
import { useInviteService } from "../../../../services/useInviteService";
import {
  useAnalyticsService,
  type RevenueTimeseriesPoint,
  type BookingsByStatusBreakdown,
} from "../../../../services/useAnalyticsService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { BookingStatusEnum } from "../../../../utils/enums";
import { formatCurrency, formatDate, getErrorMessage } from "../../../../utils/helper";

const FamilyDashboardPage: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const theme = useTheme();
  const bookingService = useBookingService();
  const dashboardService = useDashboardService();
  const inviteService = useInviteService();
  const analyticsService = useAnalyticsService();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<FamilyDashboardSummaryDTO | null>(null);
  const [upcoming, setUpcoming] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingInviteId, setRespondingInviteId] = useState<number | null>(null);
  const [spendingTrend, setSpendingTrend] = useState<RevenueTimeseriesPoint[]>([]);
  const [bookingsByStatus, setBookingsByStatus] = useState<BookingsByStatusBreakdown>({});
  const [chartsLoading, setChartsLoading] = useState(true);

  const loadSummary = () => {
    if (!user) return;
    Promise.all([
      dashboardService.getFamilySummary(),
      bookingService.search({ familyUserId: user.id, page: 0, size: 5, sort: "scheduledDate,asc" }),
    ])
      .then(([familySummary, bookings]) => {
        setSummary(familySummary);
        setUpcoming(bookings.content);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetched independently of the main summary/bookings load above: this is a new,
  // self-scoped analytics endpoint, so a missing route or shape mismatch here shouldn't
  // block the rest of the dashboard.
  useEffect(() => {
    if (!user) return;
    analyticsService
      .getMyFamilySpending()
      .then((data) => {
        setSpendingTrend(Array.isArray(data?.spendingOverTime) ? data.spendingOverTime : []);
        setBookingsByStatus(data?.bookingsByStatus && typeof data.bookingsByStatus === "object" ? data.bookingsByStatus : {});
      })
      .catch(() => {
        setSpendingTrend([]);
        setBookingsByStatus({});
      })
      .finally(() => setChartsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const spendingChartData = useMemo(
    () =>
      spendingTrend.map((p) => ({
        ...p,
        label: dayjs(p.bucketStart).isValid() ? dayjs(p.bucketStart).format("MMM YY") : p.bucketStart,
      })),
    [spendingTrend]
  );

  const respondToInvite = async (inviteId: number, action: "accept" | "decline") => {
    setRespondingInviteId(inviteId);
    try {
      await (action === "accept" ? inviteService.accept(inviteId) : inviteService.decline(inviteId));
      loadSummary();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Failed to respond to invite"));
    } finally {
      setRespondingInviteId(null);
    }
  };

  if (loading || !summary) return <DashboardSkeleton statCount={3} rowCount={3} />;

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>
        Welcome back, {user?.fullName?.split(" ")[0]}
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Here's what's happening with your family's care.
      </Typography>

      {/*
        "Getting started" for a genuinely empty family account (no elder profiles yet) —
        distinct from OnboardingTour, which explains the UI once per user regardless of
        account data. Only "Add an elder profile" is a fact we can actually track here, so
        rather than rely on GettingStartedChecklist's own all-steps-done auto-hide, this is
        gated explicitly on managedElderCount: once the family adds their first elder
        profile, this whole "brand new account" phase is over and the widget disappears —
        the normal dashboard (including the "No bookings yet" empty state further down)
        takes over as the next nudge.
      */}
      {summary.managedElderCount === 0 && (
        <GettingStartedChecklist
          description="A few quick steps to start booking care for your family."
          steps={[
            {
              label: "Add an elder profile",
              done: false,
              actionLabel: "Add Elder Profile",
              onAction: () => navigate("/family/elder-profiles"),
            },
            { label: "Find a caretaker", done: false, actionLabel: "Find a Caretaker", onAction: () => navigate("/family/caretakers") },
            { label: "Book your first visit", done: false },
          ]}
        />
      )}

      {summary.managedElderCount > 0 && summary.coManagedElderCount === 0 && (
        <GettingStartedChecklist
          title="Share the care"
          description="Invite another family member to help manage your elder's care."
          steps={[
            {
              label: "Invite a family member",
              done: false,
              actionLabel: "Invite Family Member",
              onAction: () => navigate("/family/elder-profiles"),
            },
          ]}
        />
      )}

      {summary.pendingInvites.length > 0 && (
        <Card sx={{ mb: 3, borderLeft: "4px solid", borderColor: "warning.main" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <MailOutlineIcon color="warning" />
                <Typography variant="h6" fontWeight={700}>
                  Pending Invites
                </Typography>
              </Stack>
              <Button variant="text" onClick={() => navigate("/family/invites")}>
                View all
              </Button>
            </Stack>
            <List>
              {summary.pendingInvites.map((invite) => (
                <ListItem
                  key={invite.id}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="primary"
                        size="small"
                        loading={respondingInviteId === invite.id}
                        onClick={() => respondToInvite(invite.id, "accept")}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        disabled={respondingInviteId === invite.id}
                        onClick={() => respondToInvite(invite.id, "decline")}
                      >
                        Decline
                      </Button>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={invite.elderName ?? "Elder profile"}
                    secondary={`Invited by ${invite.invitedByName ?? "a family member"}${invite.relationshipLabel ? ` · ${invite.relationshipLabel}` : ""}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Grid id="dashboard-stat-cards" container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Elder Profiles" value={summary.managedElderCount} icon={<PeopleIcon />} accentColor="#2F6F5E" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Upcoming Bookings" value={summary.upcomingBookings} icon={<EventNoteIcon />} accentColor="#3178C6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Unread Notifications" value={summary.unreadNotifications} icon={<NotificationsIcon />} accentColor="#E8A33D" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>
                  Upcoming Bookings
                </Typography>
                <Button variant="text" onClick={() => navigate("/family/bookings")}>
                  View all
                </Button>
              </Stack>
              {upcoming.length === 0 ? (
                <EmptyState
                  illustration={<NoBookingsIllustration size={88} />}
                  title="No bookings yet"
                  description="Find a verified caretaker to book your first service."
                  actionLabel="Find a Caretaker"
                  onAction={() => navigate("/family/caretakers")}
                  minHeight={160}
                />
              ) : (
                <List>
                  {upcoming.map((b) => (
                    <ListItem
                      key={b.id}
                      divider
                      secondaryAction={<StatusChip label={b.status} tone={BOOKING_STATUS_TONE[b.status]} />}
                    >
                      <ListItemText
                        primary={`${b.serviceName ?? "Service"} for ${b.elderName ?? "elder"}`}
                        secondary={`${formatDate(b.scheduledDate)} at ${b.scheduledTime} · ${b.caretakerName ?? "Caretaker"}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Activity
              </Typography>
              <ActivityFeed items={summary.recentActivities} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1.5}>
                <Button variant="outline" startIcon={<SearchIcon />} onClick={() => navigate("/family/caretakers")}>
                  Find a Caretaker
                </Button>
                <Button variant="outline" startIcon={<PeopleIcon />} onClick={() => navigate("/family/elder-profiles")}>
                  Manage Elder Profiles
                </Button>
                <Button variant="danger" startIcon={<WarningAmberIcon />} onClick={() => navigate("/family/emergency")}>
                  Emergency Alert
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mt={0.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Spending Over Time
              </Typography>
              <Box sx={{ width: "100%", height: 260 }}>
                {chartsLoading ? (
                  <Skeleton variant="rounded" width="100%" height="100%" />
                ) : spendingChartData.length === 0 ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={0.5}>
                    <Typography color="text.secondary">No spending yet.</Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={spendingChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={theme.palette.divider} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickLine={false} axisLine={{ stroke: theme.palette.divider }} />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(typeof value === "number" ? value : Number(value))}
                        contentStyle={{ borderRadius: 10, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}
                        labelStyle={{ color: theme.palette.text.primary, fontWeight: 700 }}
                      />
                      <Bar dataKey="revenue" name="Spending" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Bookings by Status
              </Typography>
              {chartsLoading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" width="60%" height={32} />
                  ))}
                </Stack>
              ) : Object.values(bookingsByStatus).every((count) => !count) ? (
                <Typography color="text.secondary">No bookings yet.</Typography>
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {Object.values(BookingStatusEnum).map((status) => (
                    <StatusChip key={status} label={`${status}: ${bookingsByStatus[status] ?? 0}`} tone={BOOKING_STATUS_TONE[status]} />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FamilyDashboardPage;
