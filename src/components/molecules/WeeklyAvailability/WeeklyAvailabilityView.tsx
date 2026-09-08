import React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import { DAYS_OF_WEEK, DayOfWeekShortLabels } from "../../../utils/enums";
import type { AvailabilitySlot } from "../../../services/useCaretakerService";

// Compact read-only weekly schedule — used on the family-facing caretaker profile view so
// a family member can see at a glance when a caretaker is generally available before
// booking (the actual booking slot is still whatever date/time they pick in the form;
// this isn't a live calendar, just the caretaker's stated weekly pattern).
const WeeklyAvailabilityView: React.FC<{ slots: AvailabilitySlot[] }> = ({ slots }) => {
  if (slots.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        This caretaker hasn't shared their weekly availability yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {DAYS_OF_WEEK.map((day) => {
        const daySlots = slots.filter((s) => s.dayOfWeek === day);
        return (
          <Box key={day} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body2" fontWeight={700} sx={{ width: 44, flexShrink: 0 }}>
              {DayOfWeekShortLabels[day]}
            </Typography>
            {daySlots.length === 0 ? (
              <Typography variant="body2" color="text.disabled">
                Unavailable
              </Typography>
            ) : (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {daySlots.map((slot, i) => (
                  <Chip
                    key={i}
                    size="small"
                    variant="outlined"
                    label={`${slot.startTime?.slice(0, 5)}–${slot.endTime?.slice(0, 5)}`}
                  />
                ))}
              </Stack>
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

export default WeeklyAvailabilityView;
