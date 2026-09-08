import React from "react";
import { Alert } from "@mui/material";

const ErrorMessage: React.FC<{ message?: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
};

export default ErrorMessage;
