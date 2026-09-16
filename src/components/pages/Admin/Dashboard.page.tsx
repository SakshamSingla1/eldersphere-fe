import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Grid, Card, CardContent, Typography, Box, Stack, Skeleton } from "@mui/material";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import dayjs from "dayjs";
import EventNoteIcon from "@mui/icons-material/EventNote";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ElderlyIcon from "@mui/icons-material/Elderly";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PaidIcon from "@mui/icons-material/Paid";
import StatCard from "../../molecules/StatCard/StatCard";
import ActivityFeed from "../../molecules/ActivityFeed/ActivityFeed";
import Button from "../../atoms/Button/Button";
import { DashboardSkeleton } from "../../molecules/Skeletons/Skeletons";
import { useDashboardService, type DashboardSummaryDTO } from "../../../services/useDashboardService";
import {
  useAnalyticsService,
  type BookingTimeseriesPoint,
  type RevenueTimeseriesPoint,
} from "../../../services/useAnalyticsService";
import { formatCurrency } from "../../../utils/helper";

const AdminDashboardPage: React.FC = () => {
  const dashboardService = useDashboardService();
  const analyticsService = useAnalyticsService();
  const navigate = useNavigate();
  const theme = useTheme();
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingTimeseriesPoint[]>([]);
  const [revenue, setRevenue] = useState<RevenueTimeseriesPoint[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const end = dayjs().format("YYYY-MM-DD");
    const start = dayjs().subtract(29, "day").format("YYYY-MM-DD");
    Promise.all([analyticsService.getBookingsTimeseries(start, end), analyticsService.getRevenueTimeseries(start, end)])
      .then(([bookingsData, revenueData]) => {
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setRevenue(Array.isArray(revenueData) ? revenueData : []);
      })
      .catch(() => {
        setBookings([]);
        setRevenue([]);
      })
      .finally(() => setChartsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookingsChartData = useMemo(
    () => bookings.map((p) => ({ ...p, label: dayjs(p.bucketStart).format("DD MMM") })),
    [bookings]
  );
  const revenueChartData = useMemo(
    () => revenue.map((p) => ({ ...p, label: dayjs(p.bucketStart).format("DD MMM") })),
    [revenue]
  );

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

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Bookings (Last 30 Days)
                </Typography>
                <Button variant="text" size="small" onClick={() => navigate("/admin/analytics")}>
                  View Analytics
                </Button>
              </Stack>
              <Box sx={{ width: "100%", height: 220 }}>
                {chartsLoading ? (
                  <Skeleton variant="rounded" width="100%" height="100%" />
                ) : bookingsChartData.length === 0 ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={0.5}>
                    <Typography color="text.secondary">No bookings in this range yet.</Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer>
                    <LineChart data={bookingsChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={theme.palette.divider} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickLine={false} axisLine={{ stroke: theme.palette.divider }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickLine={false} axisLine={false} width={32} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 10, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}
                        labelStyle={{ color: theme.palette.text.primary, fontWeight: 700 }}
                      />
                      <Line type="monotone" dataKey="total" name="Bookings" stroke={theme.palette.primary.main} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Revenue (Last 30 Days)
                </Typography>
                <Button variant="text" size="small" onClick={() => navigate("/admin/analytics")}>
                  View Analytics
                </Button>
              </Stack>
              <Box sx={{ width: "100%", height: 220 }}>
                {chartsLoading ? (
                  <Skeleton variant="rounded" width="100%" height="100%" />
                ) : revenueChartData.length === 0 ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={0.5}>
                    <Typography color="text.secondary">No revenue in this range yet.</Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={revenueChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                      <Bar dataKey="revenue" name="Revenue" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
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
