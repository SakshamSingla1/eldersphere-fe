import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Stack, Link as MuiLink, Typography, Alert } from "@mui/material";
import AuthCard from "./AuthCard";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useAuthService } from "../../../services/useAuthService";
import { getErrorMessage } from "../../../utils/helper";

const ForgotPasswordPage: React.FC = () => {
  const authService = useAuthService();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not send the reset link. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      <ErrorMessage message={error} />
      {sent ? (
        <Alert severity="success">
          If an account exists for {email}, a password reset link has been sent.
        </Alert>
      ) : (
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="primary" size="large" loading={loading}>
            Send Reset Link
          </Button>
        </Stack>
      )}
      <Typography variant="body2" textAlign="center" mt={3}>
        <MuiLink component={RouterLink} to="/login" fontWeight={700}>
          Back to log in
        </MuiLink>
      </Typography>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
