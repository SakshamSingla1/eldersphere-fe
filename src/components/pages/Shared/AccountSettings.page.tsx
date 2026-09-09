import React, { useState } from "react";
import { Card, CardContent, Typography, Stack, Grid, Divider } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import NotificationPreferences from "../../molecules/NotificationPreferences/NotificationPreferences";
import ThemePicker from "../../molecules/ThemePicker/ThemePicker";
import { useAuthService } from "../../../services/useAuthService";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { REGEX } from "../../../utils/constant";
import { getErrorMessage } from "../../../utils/helper";

// Shared across the Family and Caretaker shells (and reusable for Admin) — the backend
// has no "update my profile" endpoint for fullName/email/phone (only admins can edit
// users; caretakers separately manage bio/rate/specialties via their own profile page),
// so account settings here covers read-only identity plus the one thing every
// authenticated user can self-service: their password.
const AccountSettingsPage: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const authService = useAuthService();
  const { showSnackbar } = useSnackbar();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (!REGEX.PASSWORD.test(newPassword)) {
      setError("New password must be at least 8 characters and include an uppercase letter and a digit.");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      showSnackbar("success", "Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not change your password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Card>
          <CardContent>
            <PageHeader icon={<SettingsIcon color="primary" />} title="Account" />
            <Stack spacing={1.5}>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Full Name
                </Typography>
                <Typography fontWeight={600}>{user?.fullName}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography fontWeight={600}>{user?.email}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography fontWeight={600}>{user?.phone || "—"}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Account Type
                </Typography>
                <Typography fontWeight={600}>{user?.userType}</Typography>
              </div>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ErrorMessage message={error} />
            <Stack component="form" spacing={2} onSubmit={handleSubmit} maxWidth={400}>
              <TextField
                label="Current Password"
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
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
              <Button type="submit" variant="primary" loading={saving}>
                Update Password
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={12}>
        <ThemePicker />
      </Grid>
      <Grid size={12}>
        <NotificationPreferences />
      </Grid>
    </Grid>
  );
};

export default AccountSettingsPage;
