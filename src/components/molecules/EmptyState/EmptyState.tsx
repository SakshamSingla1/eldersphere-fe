import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InboxIcon from "@mui/icons-material/Inbox";
import Button from "../../atoms/Button/Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  /**
   * A larger custom inline-SVG illustration (see atoms/Illustrations) to show instead of
   * the default icon-in-a-circle badge — used for the handful of empty states common
   * enough to earn a bit more visual craft (no bookings, no messages, ...). Takes
   * precedence over `icon` when both are given.
   */
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  minHeight?: number | string;
}

// Shared "nothing here yet" pattern — a soft icon badge (or, for the most common cases, a
// bespoke illustration) + friendly copy + optional CTA — used anywhere a list/table can be
// empty (TableV1's built-in empty row, CrudModule's "Add <entity>" prompt, dashboard
// summary cards, etc) instead of a bare line of text.
const EmptyState: React.FC<EmptyStateProps> = ({ icon, illustration, title, description, actionLabel, onAction, minHeight = 220 }) => {
  const theme = useTheme();
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      gap={0.75}
      sx={{ minHeight, py: 5, px: 3 }}
    >
      {illustration ?? (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
            mb: 1,
          }}
        >
          {icon ?? <InboxIcon fontSize="medium" />}
        </Box>
      )}
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="small" onClick={onAction} sx={{ mt: 1.5 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
