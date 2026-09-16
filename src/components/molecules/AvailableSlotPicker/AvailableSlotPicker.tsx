import React, { useEffect, useState } from "react";
import { Box, Chip, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useCaretakerService, type AvailableSlot } from "../../../services/useCaretakerService";
import { getErrorMessage } from "../../../utils/helper";

export interface AvailableSlotPickerProps {
  caretakerId: number;
  serviceId: string | number;
  date: string;
  selectedTime: string;
  onSelect: (startTime: string) => void;
}

const formatTime = (time: string) => dayjs(time, ["HH:mm:ss", "HH:mm"]).format("h:mm A");

// Real-slot picker replacing the old free-typed time field — fetches
// GET /caretakers/{id}/available-slots for the chosen date/service and renders every
// candidate (already-booked ones included, disabled) as a single-select chip grid, so a
// family member can only ever submit a time the caretaker's schedule can actually hold.
const AvailableSlotPicker: React.FC<AvailableSlotPickerProps> = ({ caretakerId, serviceId, date, selectedTime, onSelect }) => {
  const caretakerService = useCaretakerService();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [usingDefaultHours, setUsingDefaultHours] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caretakerId || !serviceId || !date) return;
    setLoading(true);
    setError(null);
    caretakerService
      .getAvailableSlots(caretakerId, date, serviceId)
      .then((res) => {
        setSlots(res.slots);
        setUsingDefaultHours(res.usingDefaultHours);
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Could not load available time slots"));
        setSlots([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caretakerId, serviceId, date]);

  if (loading) {
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={128} height={32} sx={{ borderRadius: "16px" }} />
        ))}
      </Stack>
    );
  }

  if (error) return <ErrorMessage message={error} />;

  if (slots.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No available slots this day.
      </Typography>
    );
  }

  return (
    <Box>
      {usingDefaultHours && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          This caretaker hasn't set specific hours for this day — showing default full-day availability.
        </Typography>
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {slots.map((slot) => {
          const label = `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`;
          const isSelected = selectedTime === slot.startTime;
          const chip = (
            <Chip
              key={slot.startTime}
              label={label}
              clickable={slot.available}
              disabled={!slot.available}
              color={isSelected ? "primary" : "default"}
              variant={isSelected ? "filled" : "outlined"}
              onClick={slot.available ? () => onSelect(slot.startTime) : undefined}
            />
          );
          if (slot.available) return chip;
          return (
            <Tooltip key={slot.startTime} title="Already booked">
              <span>{chip}</span>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
};

export default AvailableSlotPicker;
