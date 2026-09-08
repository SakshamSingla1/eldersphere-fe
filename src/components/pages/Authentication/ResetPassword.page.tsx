import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Stack, Typography, Alert } from "@mui/material";
import AuthCard from "./AuthCard";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useAuthService } from "../../../services/useAuthService";
import { REGEX } from "../../../utils/constant";
import { getErrorMessage } from "../../../utils/helper";

const ResetPasswordPage: React.FC = () => {
  const authService = useAuthService();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!REGEX.PASSWORD.test(newPassword)) {
      setError("Password must be at least 8 characters and include an uppercase letter and a digit.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      navigate("/login", { state: { passwordReset: true } });
    } catch (err) {
      setError(getErrorMessage(err, "Could not reset your password. The link may have expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Reset your password" subtitle="Choose a new password for your account.">
      {!token && <Alert severity="warning" sx={{ mb: 2 }}>No reset token found in the URL. Please use the link from your email.</Alert>}
      <ErrorMessage message={error} />
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="New Password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <TextField
          label="Confirm New Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" size="large" loading={loading}>
          Reset Password
        </Button>
      </Stack>
      <Typography variant="body2" textAlign="center" mt={3}>
        Remembered it after all? Head back to log in.
      </Typography>
    </AuthCard>
  );
};

export default ResetPasswordPage;
