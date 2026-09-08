import React, { useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { SxProps, Theme } from "@mui/material/styles";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker as MuiTimePicker } from "@mui/x-date-pickers/TimePicker";
import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

// @mui/x-date-pickers' own AdapterDayjs already calls dayjs.extend(customParseFormat) as
// a side effect of being imported (see main.tsx's LocalizationProvider), but dayjs plugins
// are applied to the shared/global dayjs singleton, not per-import — extending it again
// here is a cheap no-op if that already happened, and guarantees strict-format parsing
// works even if this atom is ever imported/tested in isolation before the adapter is.
dayjs.extend(customParseFormat);

export type DatePickerType = "date" | "time" | "datetime";

export interface DatePickerProps {
  label?: string;
  value: string | null | null;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  type?: DatePickerType;
  fullWidth?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
}

// The plain (backend-facing) string format each picker type reads/writes — chosen to
// match what the native <input type="date">/<input type="time"> this atom replaced used
// to produce, since every consumer (booking date/time, elder DOB, weekly availability
// slots, admin CRUD "date" fields, the analytics date-range filter) already stores and
// sends these exact shapes to the backend DTOs.
const FORMAT_BY_TYPE: Record<DatePickerType, string> = {
  date: "YYYY-MM-DD",
  time: "HH:mm",
  datetime: "YYYY-MM-DDTHH:mm",
};

// Extra formats a value might already be in (e.g. a time the backend returned with
// seconds, "09:00:00") that we should still parse successfully even though we always
// *write back* the plain format above.
const FALLBACK_FORMATS_BY_TYPE: Record<DatePickerType, string[]> = {
  date: [],
  time: ["HH:mm:ss"],
  datetime: ["YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"],
};

const parseValue = (value: string | null | null, type: DatePickerType): Dayjs | null => {
  if (!value) return null;
  const formats = [FORMAT_BY_TYPE[type], ...FALLBACK_FORMATS_BY_TYPE[type]];
  for (const format of formats) {
    const parsed = dayjs(value, format, true);
    if (parsed.isValid()) return parsed;
  }
  // Last resort — some other ISO-ish string the backend sent; let dayjs guess rather than
  // silently blanking the field.
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback : null;
};

// Themed replacement for the native <input type="date">/<input type="time"> this atom
// used to wrap directly (see git history) — same external contract (string in, string
// out, "" for empty/cleared) so none of the 6+ consumer forms need to change, but the
// popup calendar/clock now render as MUI X components and pick up the app's warm
// forest-green/terracotta theme (incl. dark mode) instead of raw browser chrome.
const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  required,
  error,
  helperText,
  type = "date",
  fullWidth = true,
  disabled,
  size = "small",
  sx,
}) => {
  const dayjsValue = useMemo(() => parseValue(value, type), [value, type]);
  const outputFormat = FORMAT_BY_TYPE[type];

  const handleChange = (next: Dayjs | null) => {
    onChange(next && next.isValid() ? next.format(outputFormat) : "");
  };

  const slotProps = {
    textField: {
      required,
      error,
      helperText,
      fullWidth,
      size,
      sx,
    },
  } as const;

  if (type === "time") {
    return (
      <MuiTimePicker
        label={label}
        value={dayjsValue}
        onChange={handleChange}
        disabled={disabled}
        slotProps={slotProps}
      />
    );
  }

  if (type === "datetime") {
    return (
      <MuiDateTimePicker
        label={label}
        value={dayjsValue}
        onChange={handleChange}
        disabled={disabled}
        slotProps={slotProps}
      />
    );
  }

  return (
    <MuiDatePicker
      label={label}
      value={dayjsValue}
      onChange={handleChange}
      disabled={disabled}
      slotProps={slotProps}
    />
  );
};

export default DatePicker;
