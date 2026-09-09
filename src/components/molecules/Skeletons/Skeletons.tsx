import React from "react";
import { Box, Card, CardContent, Grid, Skeleton, Stack } from "@mui/material";

// Shared "shaped like the real thing" loading placeholders — used in place of a bare
// spinner wherever a page's first paint would otherwise be a blank flash then a sudden
// pop-in. Kept intentionally plain (no shimmer color tricks) so it reads calmly rather
// than distracting, which matters for elder-facing pages in particular.

/** Row of stat-card-shaped skeletons — mirrors StatCard's icon-badge + two-lines layout. */
export const StatCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Grid container spacing={2} mb={3}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid size={{ xs: 12, sm: 6, md: Math.max(3, Math.floor(12 / count)) }} key={i}>
        <Card sx={{ height: "100%" }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: "14px", flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" width="50%" height={30} />
              <Skeleton variant="text" width="75%" height={20} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

/** List-row skeletons — mirrors a `ListItemText` primary/secondary pair. */
export const ListRowsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Stack spacing={2.25} sx={{ py: 0.5 }}>
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i}>
        <Skeleton variant="text" width={`${70 - i * 6}%`} height={22} />
        <Skeleton variant="text" width="40%" height={18} />
      </Box>
    ))}
  </Stack>
);

/** Full dashboard-page skeleton: a stat-card row plus a card containing list rows. */
export const DashboardSkeleton: React.FC<{ statCount?: number; rowCount?: number }> = ({ statCount = 3, rowCount = 3 }) => (
  <Box>
    <Skeleton variant="text" width={220} height={40} sx={{ mb: 1 }} />
    <Skeleton variant="text" width={320} height={24} sx={{ mb: 3 }} />
    <StatCardsSkeleton count={statCount} />
    <Card>
      <CardContent>
        <Skeleton variant="text" width={160} height={28} sx={{ mb: 1.5 }} />
        <ListRowsSkeleton count={rowCount} />
      </CardContent>
    </Card>
  </Box>
);

/** Card-grid skeleton — mirrors a search-results grid of profile/entity cards. */
export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
              <Skeleton variant="circular" width={52} height={52} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={22} />
                <Skeleton variant="text" width="45%" height={18} />
              </Box>
            </Stack>
            <Skeleton variant="text" width="100%" height={18} />
            <Skeleton variant="text" width="80%" height={18} sx={{ mb: 1.5 }} />
            <Skeleton variant="rounded" width="100%" height={36} sx={{ borderRadius: "10px" }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

/** Add/Edit form-page skeleton — mirrors a label+input row per field while the record
 * being edited loads (see CrudFormPage.template.tsx). */
export const FormFieldsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <Stack spacing={2.5}>
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i}>
        <Skeleton variant="text" width={120} height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: "10px" }} />
      </Box>
    ))}
  </Stack>
);

/** Profile-page skeleton — an avatar/photo card beside a details-form-shaped card. */
export const ProfileSkeleton: React.FC = () => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, md: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: "center" }}>
          <Skeleton variant="circular" width={96} height={96} sx={{ mx: "auto", mb: 2 }} />
          <Skeleton variant="rounded" width="60%" height={40} sx={{ mx: "auto", borderRadius: "10px" }} />
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, md: 8 }}>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i}>
                <Skeleton variant="text" width={120} height={20} sx={{ mb: 0.5 }} />
                <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: "10px" }} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);
