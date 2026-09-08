import React from "react";
import { Stack } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Consistent inline field-validation-error convention used both by the generic
// CrudModule form fields and by bespoke, non-generic forms (e.g. the booking form on
// CaretakerProfileView) that want the exact same look: an icon + message, rendered as a
// field's helperText (so it inherits the error color for free once `error` is set on the
// field) directly under the input instead of only in a page-level banner.
const FieldError: React.FC<{ message: string }> = ({ message }) => (
  <Stack direction="row" spacing={0.5} alignItems="center" component="span">
    <ErrorOutlineIcon sx={{ fontSize: 14 }} />
    <span>{message}</span>
  </Stack>
);

export default FieldError;
