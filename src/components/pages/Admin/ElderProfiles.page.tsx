import React, { useState } from "react";
import { Card, CardContent, Typography, Stack, Grid, Alert } from "@mui/material";
import ElderlyIcon from "@mui/icons-material/Elderly";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import KeyValueGrid from "../../molecules/KeyValueGrid/KeyValueGrid";
import ConfirmableButton from "../../atoms/ConfirmableButton/ConfirmableButton";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import { useElderProfileService, type ElderProfileResponse } from "../../../services/useElderProfileService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { formatDate, getErrorMessage } from "../../../utils/helper";

// Note: ElderProfileController has no admin "list all" endpoint — its GET / is scoped to
// the authenticated family user's own elders (via JWT), which returns nothing for an
// admin account. This page is therefore a lookup-by-ID tool (the ID is visible from
// Admin > Bookings / Medical Records rows) rather than a full listing + CrudModule table.
const AdminElderProfilesPage: React.FC = () => {
  const elderProfileService = useElderProfileService();
  const { showSnackbar } = useSnackbar();

  const [idInput, setIdInput] = useState("");
  const [profile, setProfile] = useState<ElderProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput) return;
    setError(null);
    setLoading(true);
    try {
      const result = await elderProfileService.getById(Number(idInput));
      setProfile(result);
    } catch (err) {
      setProfile(null);
      setError(getErrorMessage(err, "Elder profile not found"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;
    try {
      await elderProfileService.remove(profile.id);
      showSnackbar("success", "Elder profile deleted");
      setProfile(null);
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not delete this elder profile"));
      throw err;
    }
  };

  return (
    <div>
      <PageHeader icon={<ElderlyIcon color="primary" />} title="Elder Profile Lookup" />
      <Alert severity="info" sx={{ mb: 2 }}>
        The backend only exposes elder profiles scoped to the owning family member, so admins look one up by ID
        (visible from Bookings or Medical Records) rather than browsing a full list.
      </Alert>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ErrorMessage message={error} />
          <Stack direction="row" spacing={2} component="form" onSubmit={handleLookup}>
            <TextField label="Elder Profile ID" type="number" value={idInput} onChange={(e) => setIdInput(e.target.value)} />
            <Button type="submit" variant="primary" loading={loading}>
              Look Up
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {profile && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {profile.name}
              </Typography>
              <ConfirmableButton
                variant="danger"
                size="small"
                confirmTitle="Delete elder profile"
                confirmMessage="Are you sure you want to delete this elder profile? This cannot be undone."
                danger
                onConfirm={handleDelete}
              >
                Delete
              </ConfirmableButton>
            </Stack>
            <KeyValueGrid
              items={[
                { label: "Date of Birth", value: formatDate(profile.dateOfBirth) },
                { label: "Gender", value: profile.gender ?? "—" },
                { label: "Medical Conditions", value: profile.medicalConditions || "—", fullWidth: true },
                { label: "Address", value: profile.address || "—", fullWidth: true },
                { label: "Emergency Contact", value: profile.emergencyContactName || "—" },
                { label: "Emergency Phone", value: profile.emergencyContactPhone || "—" },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminElderProfilesPage;
