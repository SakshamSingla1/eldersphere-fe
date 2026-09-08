import React from "react";
import { Card, CardContent, Stack, Typography, Box } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import Button from "../../atoms/Button/Button";

export interface GettingStartedStep {
  label: string;
  description?: string;
  done: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export interface GettingStartedChecklistProps {
  title?: string;
  description?: string;
  steps: GettingStartedStep[];
}

// A one-time-per-account-lifecycle "getting started" nudge for a genuinely empty account
// (e.g. a caretaker with no profile yet, a family with no elder profiles yet) — distinct
// from OnboardingTour, which explains the UI chrome once per *user* regardless of whether
// their account actually has any real data yet. This instead tracks account-completeness
// facts (profile saved? availability set? verified?) passed in by the caller, and simply
// disappears on its own once every step is done — no dismiss button or localStorage flag
// needed, since "done" becoming true for every step IS the natural dismiss condition.
const GettingStartedChecklist: React.FC<GettingStartedChecklistProps> = ({ title = "Getting started", description, steps }) => {
  if (steps.length === 0 || steps.every((s) => s.done)) return null;

  return (
    <Card sx={{ mb: 3, borderLeft: "4px solid", borderColor: "primary.main" }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={description ? 0.5 : 1.5}>
          <FlagRoundedIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        {description && (
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {description}
          </Typography>
        )}
        <Stack spacing={1.25}>
          {steps.map((step) => (
            <Stack
              key={step.label}
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                p: 1.25,
                borderRadius: "10px",
                bgcolor: step.done ? "transparent" : "action.hover",
              }}
            >
              {step.done ? (
                <CheckCircleRoundedIcon color="success" fontSize="small" />
              ) : (
                <RadioButtonUncheckedRoundedIcon color="disabled" fontSize="small" />
              )}
              <Box flexGrow={1} minWidth={0}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ textDecoration: step.done ? "line-through" : "none", color: step.done ? "text.secondary" : "text.primary" }}
                >
                  {step.label}
                </Typography>
                {step.description && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {step.description}
                  </Typography>
                )}
              </Box>
              {!step.done && step.actionLabel && step.onAction && (
                <Button variant="outline" size="small" onClick={step.onAction} sx={{ flexShrink: 0 }}>
                  {step.actionLabel}
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default GettingStartedChecklist;
