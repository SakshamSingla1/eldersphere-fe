import React from "react";
import { Box, Typography, IconButton, Divider } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export interface FormShellProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /**
   * When this FormShell is rendered inside a MUI Dialog (see CrudModule.template.tsx and
   * Reviews.page.tsx), the Dialog has no <DialogTitle> of its own — pass the same id here
   * and as the Dialog's `aria-labelledby` so screen readers get an accessible name for the
   * dialog instead of just "dialog". Not needed when FormShell renders as a full page.
   */
  titleId?: string;
}

// Shared form chrome reused by every admin add/edit form (rendered either as a full
// page or inside a Dialog) — a small header with an optional back button, the form
// body, and an actions row. Mirrors the reference project's FormShell.template.tsx.
const FormShell: React.FC<FormShellProps> = ({ title, subtitle, onBack, children, actions, titleId }) => (
  <Box>
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      {onBack && (
        <IconButton size="small" onClick={onBack} aria-label="Go back">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      )}
      <Box>
        <Typography id={titleId} variant="h6" fontWeight={800}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    <Divider sx={{ mb: 2.5 }} />
    <Box>{children}</Box>
    {actions && (
      <>
        <Divider sx={{ mt: 3 }} />
        {/*
          Sticky, not fixed: this only pins the row once it's inside a scrollable
          ancestor (e.g. a Dialog's DialogContent, which has its own overflow-y:auto) so
          Save/Cancel stay reachable on a long form without scrolling to find them. Inside
          a normal (non-scrolling) full-page FormShell this is a no-op — the row just sits
          in its natural place.
        */}
        <Box
          display="flex"
          justifyContent="flex-end"
          gap={1.5}
          sx={{ position: "sticky", bottom: 0, bgcolor: "background.paper", pt: 2.5, pb: 0.5, mt: 2.5 }}
        >
          {actions}
        </Box>
      </>
    )}
  </Box>
);

export default FormShell;
