import React from "react";
import { Box, Stack, Typography, IconButton, Chip } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DatePicker from "../../atoms/DatePicker/DatePicker";
import { DAYS_OF_WEEK, DayOfWeekShortLabels, type DayOfWeekEnum } from "../../../utils/enums";
import type { AvailabilitySlot } from "../../../services/useCaretakerService";

export interface WeeklyAvailabilityEditorProps {
  value: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
  disabled?: boolean;
}

// 7 rows (Mon-Sun), each with zero or more start/end slots — the backend models
// availability as a flat replace-all list (CaretakerAvailabilityRequest#slots), so this
// component just presents that flat list grouped by day and emits the same flat shape
// back on every change.
const WeeklyAvailabilityEditor: React.FC<WeeklyAvailabilityEditorProps> = ({ value, onChange, disabled }) => {
  const slotsForDay = (day: DayOfWeekEnum) =>
    value.map((slot, index) => ({ slot, index })).filter(({ slot }) => slot.dayOfWeek === day);

  const addSlot = (day: DayOfWeekEnum) => {
    onChange([...value, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: "startTime" | "endTime", newValue: string) => {
    onChange(value.map((slot, i) => (i === index ? { ...slot, [field]: newValue } : slot)));
  };

  return (
    <Stack spacing={2}>
      {DAYS_OF_WEEK.map((day) => {
        const daySlots = slotsForDay(day);
        return (
          // Each day is its own labeled section — same visual language as the admin
          // forms' field-group headings (a small bold heading + a divider) — rather than
          // one flat 7-row list, since a week of availability really is 7 separate groups.
          <Box
            key={day}
            sx={{
              p: 1.75,
              borderRadius: "12px",
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                {DayOfWeekShortLabels[day]}
              </Typography>
              <Chip
                label={daySlots.length === 0 ? "Unavailable" : `${daySlots.length} slot${daySlots.length > 1 ? "s" : ""}`}
                size="small"
                color={daySlots.length === 0 ? "default" : "primary"}
                variant="outlined"
              />
            </Stack>
            <Stack spacing={1}>
              {daySlots.map(({ slot, index }, rowIdx) => (
                <Stack key={`${day}-${rowIdx}`} direction="row" spacing={1} alignItems="center">
                  <DatePicker
                    type="time"
                    size="small"
                    value={slot.startTime}
                    disabled={disabled}
                    onChange={(newValue) => updateSlot(index, "startTime", newValue)}
                    sx={{ maxWidth: 140 }}
                  />
                  <Typography color="text.secondary">to</Typography>
                  <DatePicker
                    type="time"
                    size="small"
                    value={slot.endTime}
                    disabled={disabled}
                    onChange={(newValue) => updateSlot(index, "endTime", newValue)}
                    sx={{ maxWidth: 140 }}
                  />
                  <IconButton size="small" onClick={() => removeSlot(index)} disabled={disabled} aria-label={`Remove ${day} slot`}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <IconButton size="small" onClick={() => addSlot(day)} disabled={disabled} sx={{ alignSelf: "flex-start" }} aria-label={`Add ${day} slot`}>
                <AddCircleOutlineIcon fontSize="small" color="primary" />
              </IconButton>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};

export default WeeklyAvailabilityEditor;
