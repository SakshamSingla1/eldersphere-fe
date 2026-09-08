import React, { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Stack, Link as MuiLink, Typography, Alert } from "@mui/material";
import AuthCard, { type AuthCardVariant } from "./AuthCard";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useRoleGatedLogin } from "../../../hooks/useRoleGatedLogin";
import { getErrorMessage } from "../../../utils/helper";
import type { UserTypeEnum } from "../../../utils/enums";

export interface RoleLoginPageProps {
  /** The single role this dedicated portal admits. */
  allowedUserType: UserTypeEnum;
  variant: AuthCardVariant;
  title: string;
  subtitle: string;
  /** Lowercase noun used in the rejection/footer copy, e.g. "elder", "family member". */
  roleLabel: string;
  /** Register only offers Family/Caretaker/Elder — admin tiers don't self-register. */
  showSignup?: boolean;
}

// Shared form + gating logic for every single-role dedicated login page (/login/elder,
// /login/caretaker, /login/family, /login/super-admin). /admin/login predates this and
// keeps its own copy since it admits two roles (ADMIN + SUPER_ADMIN) rather than one, but
// it uses the same underlying useRoleGatedLogin hook.
const RoleLoginPage: React.FC<RoleLoginPageProps> = ({
  allowedUserType,
  variant,
  title,
  subtitle,
  roleLabel,
  showSignup = true,
}) => {
  const { login } = useRoleGatedLogin([allowedUserType]);
  const location = useLocation();
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRejected(false);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.rejected) {
        setRejected(true);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard variant={variant} title={title} subtitle={subtitle}>
      {registered && !error && !rejected && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Account created! Sign in below to get started.
        </Alert>
      )}
      <ErrorMessage message={error} />
      {rejected && <ErrorMessage message={`This login is for ${roleLabel} accounts. Choose your login.`} />}
      {rejected && (
        <Typography variant="body2" textAlign="center" sx={{ mt: -1, mb: 2 }}>
          <MuiLink component={RouterLink} to="/login" fontWeight={700}>
            Choose your login
          </MuiLink>
        </Typography>
      )}
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <MuiLink component={RouterLink} to="/forgot-password" variant="body2" textAlign="right">
          Forgot password?
        </MuiLink>
        <Button type="submit" variant="primary" size="large" loading={loading}>
          Log In
        </Button>
      </Stack>
      {showSignup && (
        <Typography variant="body2" textAlign="center" mt={3}>
          Don't have an account?{" "}
          <MuiLink component={RouterLink} to="/register" fontWeight={700}>
            Sign up
          </MuiLink>
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" textAlign="center" mt={showSignup ? 2 : 3}>
        Not a {roleLabel}?{" "}
        <MuiLink component={RouterLink} to="/login" fontWeight={700}>
          Choose your login
        </MuiLink>
      </Typography>
    </AuthCard>
  );
};

export default RoleLoginPage;
