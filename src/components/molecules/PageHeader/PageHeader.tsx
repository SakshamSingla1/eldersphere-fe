import React from "react";
import { Box, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "../../atoms/Button/Button";

export interface PageHeaderProps {
  /** Leading icon, e.g. `<InsightsIcon color="primary" />`. Size/color is entirely up to the caller. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** Small secondary line under the title, e.g. "Booking #123". Bumps the title up to h5. */
  subtitle?: React.ReactNode;
  /** Renders a "< Back" button above the title row when provided. */
  onBack?: () => void;
  backLabel?: string;
  /** Right-aligned content (buttons, status chips, ...). */
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}

// Consistent title + optional back-affordance + right-aligned actions row, reused by both
// simple "icon + title" list-page headers (Analytics, Settings, admin lookup pages) and the
// richer "back button + icon/title/subtitle + status chips" detail-page headers (Booking
// Detail, Medical Record Detail). Spacing/typography here mirrors what those pages already
// hand-rolled, not a redesign.
const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, subtitle, onBack, backLabel = "Back", actions, sx }) => (
  <Box sx={sx}>
    {onBack && (
      <Button variant="text" className="no-print" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        {backLabel}
      </Button>
    )}
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2.5}>
      <Stack direction="row" spacing={subtitle ? 1.5 : 1} alignItems="center">
        {icon}
        <div>
          <Typography variant={subtitle ? "h5" : "h6"} fontWeight={800}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </div>
      </Stack>
      {actions && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {actions}
        </Stack>
      )}
    </Stack>
  </Box>
);

export default PageHeader;
