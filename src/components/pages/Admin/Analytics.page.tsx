import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Grid, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import dayjs from "dayjs";
import InsightsIcon from "@mui/icons-material/Insights";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import DownloadIcon from "@mui/icons-material/Download";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DatePicker from "../../atoms/DatePicker/DatePicker";
import Button from "../../atoms/Button/Button";
import Loader from "../../atoms/Loader/Loader";
import RatingDisplay from "../../atoms/RatingDisplay/RatingDisplay";
import {
  useAnalyticsService,
  type BookingTimeseriesPoint,
  type RevenueTimeseriesPoint,
  type CaretakerLeaderboardEntry,
} from "../../../services/useAnalyticsService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { exportRowsAsCsv } from "../../../utils/csv";
import { formatCurrency, formatDate, getErrorMessage } from "../../../utils/helper";

// Admin/Super Admin only (see AnalyticsController's class-level hasRole('ADMIN')) —
// two single-series time-series charts (never dual-axis — see the bookings/revenue split
// below) plus a leaderboard table, all driven by one date range. Kept deliberately plain
// (recharts LineChart/BarChart, no custom theming layer) per scope — this is an internal
// reporting page, not a public-facing dashboard.
const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const analyticsService = useAnalyticsService();
  const { showSnackbar } = useSnackbar();

  const [startDate, setStartDate] = useState(dayjs().subtract(60, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [bookings, setBookings] = useState<BookingTimeseriesPoint[]>([]);
  const [revenue, setRevenue] = useState<RevenueTimeseriesPoint[]>([]);
  const [leaderboard, setLeaderboard] = useState<CaretakerLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsData, revenueData, leaderboardData] = await Promise.all([
        analyticsService.getBookingsTimeseries(startDate, endDate),
        analyticsService.getRevenueTimeseries(startDate, endDate),
        analyticsService.getCaretakerLeaderboard(10, "RATING"),
      ]);
      setBookings(bookingsData);
      setRevenue(revenueData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Could not load analytics"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const bookingsChartData = useMemo(
    () => bookings.map((p) => ({ ...p, label: dayjs(p.bucketStart).format("DD MMM") })),
    [bookings]
  );
  const revenueChartData = useMemo(
    () => revenue.map((p) => ({ ...p, label: dayjs(p.bucketStart).format("DD MMM") })),
    [revenue]
  );

  const handleExportLeaderboard = () => {
    exportRowsAsCsv(
      `caretaker-leaderboard-${startDate}-to-${endDate}.csv`,
      leaderboard,
      [
        { header: "Caretaker", accessor: (r) => r.fullName },
        { header: "Average Rating", accessor: (r) => r.ratingAverage ?? "" },
        { header: "Completed Bookings", accessor: (r) => r.completedBookingCount },
      ]
    );
  };

  const handleExportBookings = () => {
    exportRowsAsCsv(
      `bookings-timeseries-${startDate}-to-${endDate}.csv`,
      bookings,
      [
        { header: "Date", accessor: (r) => r.bucketStart },
        { header: "Total Bookings", accessor: (r) => r.total },
        ...Object.keys(bookings.reduce((acc, r) => ({ ...acc, ...r.byStatus }), {} as Record<string, number>)).map((status) => ({
          header: status,
          accessor: (r: BookingTimeseriesPoint) => r.byStatus[status] ?? 0,
        })),
      ]
    );
  };

  return (
    <Box>
      <PageHeader icon={<InsightsIcon color="primary" />} title="Analytics" />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-end" }}>
            <DatePicker label="From" value={startDate} onChange={setStartDate} />
            <DatePicker label="To" value={endDate} onChange={setEndDate} />
            <Button variant="outline" onClick={load}>
              Apply
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Loader minHeight={300} />
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Bookings Over Time
                </Typography>
                <Box sx={{ width: "100%", height: 280 }}>
                  {bookingsChartData.length === 0 ? (
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
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Revenue Over Time
                </Typography>
                <Box sx={{ width: "100%", height: 280 }}>
                  {revenueChartData.length === 0 ? (
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

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmojiEventsIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Caretaker Leaderboard
                    </Typography>
                  </Stack>
                  <Button variant="text" size="small" startIcon={<DownloadIcon fontSize="small" />} onClick={handleExportLeaderboard}>
                    Export CSV
                  </Button>
                </Stack>
                {leaderboard.length === 0 ? (
                  <Typography color="text.secondary">No completed bookings in this range yet.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Caretaker</TableCell>
                        <TableCell>Rating</TableCell>
                        <TableCell align="right">Completed</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.map((entry, idx) => (
                        <TableRow key={entry.caretakerId} hover>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{entry.fullName}</TableCell>
                          <TableCell>
                            <RatingDisplay value={entry.ratingAverage ?? 0} />
                          </TableCell>
                          <TableCell align="right">{entry.completedBookingCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Bookings by Day
                  </Typography>
                  <Button variant="text" size="small" startIcon={<DownloadIcon fontSize="small" />} onClick={handleExportBookings}>
                    Export CSV
                  </Button>
                </Stack>
                {bookings.length === 0 ? (
                  <Typography color="text.secondary">No bookings in this range yet.</Typography>
                ) : (
                  <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookings.map((point) => (
                          <TableRow key={point.bucketStart} hover>
                            <TableCell>{formatDate(point.bucketStart)}</TableCell>
                            <TableCell align="right">{point.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsPage;
