import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Stack, Link as MuiLink, Typography } from "@mui/material";
import AuthCard from "./AuthCard";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useRoleGatedLogin } from "../../../hooks/useRoleGatedLogin";
import { getErrorMessage } from "../../../utils/helper";
import { UserTypeEnum } from "../../../utils/enums";

// Staff-only portal — ADMIN only. SUPER_ADMIN used to share this portal with ADMIN, but
// now has its own dedicated page at /login/super-admin (see SuperAdminLogin.page.tsx), so
// this was narrowed to ADMIN-only for consistency with "every role has its own login page".
// Regular accounts (family/caretaker/elder) and SUPER_ADMIN both get rejected back with a
// role-specific message via useRoleGatedLogin, the same shared hook every login page uses.
const ALLOWED_USER_TYPES = [UserTypeEnum.ADMIN];

const AdminLoginPage: React.FC = () => {
  const { login } = useRoleGatedLogin(ALLOWED_USER_TYPES);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rejectedUserType, setRejectedUserType] = useState<UserTypeEnum | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRejectedUserType(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.rejected) {
        setRejectedUserType(result.userType);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = rejectedUserType === UserTypeEnum.SUPER_ADMIN;

  return (
    <AuthCard variant="admin" title="Administrator Access" subtitle="Sign in with your administrator credentials.">
      <ErrorMessage message={error} />
      {rejectedUserType && (
        <ErrorMessage
          message={
            isSuperAdmin
              ? "This portal is for administrators. Super admins have their own portal."
              : "This portal is for administrators. Please use the main login."
          }
        />
      )}
      {rejectedUserType && (
        <Typography variant="body2" textAlign="center" sx={{ mt: -1, mb: 2 }}>
          <MuiLink component={RouterLink} to={isSuperAdmin ? "/login/super-admin" : "/login"} fontWeight={700}>
            {isSuperAdmin ? "Go to super admin portal" : "Go to main login"}
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
      {/* No "Sign up" link — admin accounts are provisioned, not self-registered. */}
      <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
        Not an administrator?{" "}
        <MuiLink component={RouterLink} to="/login" fontWeight={700}>
          Choose your login
        </MuiLink>
      </Typography>
    </AuthCard>
  );
};

export default AdminLoginPage;
