import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Stack, Box } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import StatCard from "../../../molecules/StatCard/StatCard";
import EmptyState from "../../../molecules/EmptyState/EmptyState";
import ActivityFeed from "../../../molecules/ActivityFeed/ActivityFeed";
import Button from "../../../atoms/Button/Button";
import { NoRecordsIllustration } from "../../../atoms/Illustrations/Illustrations";
import { DashboardSkeleton } from "../../../molecules/Skeletons/Skeletons";
import { useAuthenticatedUser } from "../../../../hooks/useAuthenticatedUser";
import { useDashboardService, type ElderDashboardSummaryDTO } from "../../../../services/useDashboardService";
import { useInviteService } from "../../../../services/useInviteService";

const ElderDashboardPage: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const dashboardService = useDashboardService();
  const inviteService = useInviteService();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<ElderDashboardSummaryDTO | null>(null);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    // A brand-new elder account has no ElderProfile linked yet (one gets created by a
    // family member, or self-service via My Profile) — the summary endpoint 404s until
    // then, same "not set up yet" shape as every other role's dashboard, so this falls
    // back to null rather than leaving an unhandled rejection that blanks the page.
    // Pending invites are fetched independently since they matter most in exactly this
    // no-profile-yet state (a family member inviting this account to become the elder).
    dashboardService
      .getElderSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
    inviteService
      .myInvites()
      .then((invites) => setPendingInviteCount(invites.length))
      .catch(() => setPendingInviteCount(0))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardSkeleton statCount={3} rowCount={2} />;

  const pendingInviteBanner = pendingInviteCount > 0 && (
    <Card sx={{ mb: 3, borderLeft: "4px solid", borderColor: "warning.main" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <MailOutlineIcon color="warning" />
            <Typography variant="body1" fontWeight={700}>
              {pendingInviteCount === 1 ? "You have 1 pending family link invite" : `You have ${pendingInviteCount} pending family link invites`}
            </Typography>
          </Stack>
          <Button variant="primary" size="small" onClick={() => navigate("/elder/invites")}>
            Review
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  if (!summary) {
    return (
      <Box>
        <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>
          Welcome, {user?.fullName?.split(" ")[0]}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Here's an overview of your care and wellbeing.
        </Typography>
        {pendingInviteBanner}
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <PersonIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Your profile isn't set up yet
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 420, mx: "auto", mb: 2.5 }}>
              Once your profile is created — by you or a family member — your bookings, alerts and notifications will show up here.
            </Typography>
            <Button variant="primary" startIcon={<PersonIcon />} onClick={() => navigate("/elder/profile")}>
              Set Up My Profile
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>
        Welcome back, {user?.fullName?.split(" ")[0]}
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Here's an overview of your care and wellbeing.
      </Typography>

      {pendingInviteBanner}

      <Grid id="dashboard-stat-cards" container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Upcoming Bookings" value={summary.upcomingBookings} icon={<EventNoteIcon />} accentColor="#3178C6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Active Emergency Alerts"
            value={summary.activeEmergencyAlerts}
            icon={<WarningAmberIcon />}
            accentColor="#C0392B"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Unread Notifications"
            value={summary.unreadNotifications}
            icon={<NotificationsIcon />}
            accentColor="#E8A33D"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>
                  Recent Medical Records
                </Typography>
                <Button variant="text" onClick={() => navigate("/elder/medical-records")}>
                  View all
                </Button>
              </Stack>
              {summary.recentMedicalRecords.length === 0 ? (
                <EmptyState
                  illustration={<NoRecordsIllustration size={80} />}
                  title="No medical records yet"
                  description="Prescriptions and treatment notes shared by your caretaker will show up here."
                  minHeight={140}
                />
              ) : (
                <ActivityFeed items={summary.recentMedicalRecords} />
              )}
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
                <Button variant="danger" startIcon={<WarningAmberIcon />} onClick={() => navigate("/elder/emergency")}>
                  Emergency Alert
                </Button>
                <Button variant="outline" startIcon={<EventNoteIcon />} onClick={() => navigate("/elder/bookings")}>
                  My Bookings
                </Button>
                <Button variant="outline" startIcon={<PersonIcon />} onClick={() => navigate("/elder/profile")}>
                  My Profile
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ElderDashboardPage;
