import React from "react";
import { Chip } from "@mui/material";

export type StatusTone = "success" | "warning" | "error" | "info" | "default";

export interface StatusChipProps {
  label: string;
  tone?: StatusTone;
}

const TONE_COLOR: Record<StatusTone, "success" | "warning" | "error" | "info" | "default"> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  default: "default",
};

const StatusChip: React.FC<StatusChipProps> = ({ label, tone = "default" }) => (
  <Chip label={label} color={TONE_COLOR[tone]} size="small" variant="filled" sx={{ fontWeight: 600, textTransform: "capitalize" }} />
);

export default StatusChip;
