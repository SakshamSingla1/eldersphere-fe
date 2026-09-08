import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ElderlyIcon from "@mui/icons-material/Elderly";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PaidIcon from "@mui/icons-material/Paid";
import StatCard from "../../molecules/StatCard/StatCard";
import ActivityFeed from "../../molecules/ActivityFeed/ActivityFeed";
import { DashboardSkeleton } from "../../molecules/Skeletons/Skeletons";
import { useDashboardService, type DashboardSummaryDTO } from "../../../services/useDashboardService";
import { formatCurrency } from "../../../utils/helper";

const AdminDashboardPage: React.FC = () => {
  const dashboardService = useDashboardService();
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardSkeleton statCount={6} rowCount={3} />;
  if (!summary) return null;

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>
        Platform Overview
      </Typography>
      <Grid id="dashboard-stat-cards" container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Bookings" value={summary.totalBookings} icon={<EventNoteIcon />} accentColor="#3178C6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Active Caretakers" value={summary.activeCaretakers} icon={<VolunteerActivismIcon />} accentColor="#2F6F5E" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Pending Emergencies" value={summary.pendingEmergencyAlerts} icon={<WarningAmberIcon />} accentColor="#C0392B" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Elders" value={summary.totalElders} icon={<ElderlyIcon />} accentColor="#E8A33D" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Families" value={summary.totalFamilies} icon={<FamilyRestroomIcon />} accentColor="#8E44AD" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Revenue (30 days)" value={formatCurrency(summary.revenueLast30Days)} icon={<PaidIcon />} accentColor="#2E8B57" />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Recent Activity
          </Typography>
          <ActivityFeed items={summary.recentActivities} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboardPage;
