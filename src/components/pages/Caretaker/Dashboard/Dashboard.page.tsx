import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Stack, List, ListItem, ListItemText, Box, Alert } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import StarIcon from "@mui/icons-material/Star";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StatCard from "../../../molecules/StatCard/StatCard";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { BOOKING_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import ActivityFeed from "../../../molecules/ActivityFeed/ActivityFeed";
import Button from "../../../atoms/Button/Button";
import { DashboardSkeleton } from "../../../molecules/Skeletons/Skeletons";
import GettingStartedChecklist from "../../../molecules/GettingStartedChecklist/GettingStartedChecklist";
import { CaretakerVerificationStatusEnum } from "../../../../utils/enums";
import { useCaretakerService, type CaretakerProfileResponse } from "../../../../services/useCaretakerService";
import { useBookingService, type BookingResponse } from "../../../../services/useBookingService";
import { useDashboardService, type CaretakerDashboardSummaryDTO } from "../../../../services/useDashboardService";
import { useAuthenticatedUser } from "../../../../hooks/useAuthenticatedUser";
import { useCelebration } from "../../../../hooks/useCelebration";
import { consumeChecklistCompleteMilestone, checkVerificationMilestone } from "../../../../utils/celebrations";
import { formatDate } from "../../../../utils/helper";

const CaretakerDashboardPage: React.FC = () => {
  const caretakerService = useCaretakerService();
  const bookingService = useBookingService();
  const dashboardService = useDashboardService();
  const navigate = useNavigate();
  const { user } = useAuthenticatedUser();
  const celebrate = useCelebration();

  const [profile, setProfile] = useState<CaretakerProfileResponse | null>(null);
  const [summary, setSummary] = useState<CaretakerDashboardSummaryDTO | null>(null);
  const [upcoming, setUpcoming] = useState<BookingResponse[]>([]);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caretakerService
      .getMyProfile()
      .then(async (p) => {
        setProfile(p);
        const [bookings, caretakerSummary, availability] = await Promise.all([
          bookingService.search({ caretakerId: p.id, page: 0, size: 5, sort: "scheduledDate,asc" }),
          dashboardService.getCaretakerSummary(),
          caretakerService.getAvailability(p.id).catch(() => ({ caretakerId: p.id, slots: [] })),
        ]);
        setUpcoming(bookings.content);
        setSummary(caretakerSummary);
        setHasAvailability((availability.slots ?? []).length > 0);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Two of the app's celebration milestones live here: the caretaker finishing every
  // Getting Started step, and their verification flipping to VERIFIED (an admin-side
  // action this dashboard only finds out about by comparing against what it last saw).
  // Both gates are one-shot, per-user localStorage flags (see utils/celebrations.ts) so
  // navigating back to this dashboard never re-fires either celebration.
  useEffect(() => {
    if (!user || !profile) return;

    // Verification takes priority if both flip true on the same load (e.g. an admin
    // verifies a caretaker who already had availability set) — one celebration, not two
    // competing snackbars.
    const justVerified = checkVerificationMilestone(user.id, profile.verificationStatus);
    if (justVerified) {
      celebrate("You're verified! Your profile now shows a verified badge to families.");
      consumeChecklistCompleteMilestone(user.id); // mark done silently so it can't also fire later
      return;
    }

    const checklistDone = hasAvailability && profile.verificationStatus === CaretakerVerificationStatusEnum.VERIFIED;
    if (checklistDone && consumeChecklistCompleteMilestone(user.id)) {
      celebrate("You're all set up! Families can now find and book you.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, hasAvailability]);

  if (loading) return <DashboardSkeleton statCount={5} rowCount={3} />;

  if (!profile) {
    return (
      <Box>
        {/*
          "Getting started" for a brand-new, genuinely empty account — distinct from
          OnboardingTour (UI walkthrough, once per user regardless of account data). This
          disappears entirely once all three steps are complete, tracked here across the
          whole dashboard (not just this no-profile branch) so it also covers a caretaker
          who has a profile but hasn't set availability or isn't verified yet.
        */}
        <GettingStartedChecklist
          description="A few quick steps before families can find and book you."
          steps={[
            { label: "Complete your profile", done: false, actionLabel: "Get Started", onAction: () => navigate("/caretaker/profile") },
            { label: "Set your availability", done: false },
            { label: "Get verified", done: false },
          ]}
        />
        <Alert severity="info" action={<Button variant="primary" size="small" onClick={() => navigate("/caretaker/profile")}>Create Profile</Button>}>
          You haven't set up your caretaker profile yet — families won't be able to find or book you until you do.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>
        Welcome back!
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Here's an overview of your caretaker activity.
      </Typography>

      <GettingStartedChecklist
        description="A few quick steps before families can find and book you."
        steps={[
          { label: "Complete your profile", done: true },
          {
            label: "Set your availability",
            done: hasAvailability,
            actionLabel: hasAvailability ? undefined : "Set Availability",
            onAction: hasAvailability ? undefined : () => navigate("/caretaker/profile"),
          },
          { label: "Get verified", description: "Reviewed by our team after you submit your profile.", done: profile.verificationStatus === CaretakerVerificationStatusEnum.VERIFIED },
        ]}
      />

      <Grid id="dashboard-stat-cards" container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Upcoming Bookings" value={summary?.upcomingBookings ?? 0} icon={<EventNoteIcon />} accentColor="#3178C6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Completed Bookings" value={summary?.completedBookings ?? 0} icon={<EventNoteIcon />} accentColor="#8E44AD" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Average Rating"
            value={summary?.averageRating?.toFixed(1) ?? profile.ratingAverage?.toFixed(1) ?? "—"}
            icon={<StarIcon />}
            accentColor="#E8A33D"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Verification" value={profile.verificationStatus} icon={<VerifiedUserIcon />} accentColor="#2F6F5E" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Unread Notifications" value={summary?.unreadNotifications ?? 0} icon={<NotificationsIcon />} accentColor="#C0392B" />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight={700}>
              Upcoming Bookings
            </Typography>
            <Button variant="text" onClick={() => navigate("/caretaker/bookings")}>
              View all
            </Button>
          </Stack>
          {upcoming.length === 0 ? (
            <Typography color="text.secondary">No upcoming bookings.</Typography>
          ) : (
            <List>
              {upcoming.map((b) => (
                <ListItem key={b.id} divider secondaryAction={<StatusChip label={b.status} tone={BOOKING_STATUS_TONE[b.status]} />}>
                  <ListItemText
                    primary={`${b.serviceName ?? "Service"} for ${b.elderName ?? "elder"}`}
                    secondary={`${formatDate(b.scheduledDate)} at ${b.scheduledTime}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Recent Activity
          </Typography>
          <ActivityFeed items={summary?.recentActivities ?? []} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default CaretakerDashboardPage;
