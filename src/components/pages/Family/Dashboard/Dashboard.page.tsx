import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Stack, List, ListItem, ListItemText, Box } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
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
import { formatDate } from "../../../../utils/helper";

const FamilyDashboardPage: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const bookingService = useBookingService();
  const dashboardService = useDashboardService();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<FamilyDashboardSummaryDTO | null>(null);
  const [upcoming, setUpcoming] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    </Box>
  );
};

export default FamilyDashboardPage;
