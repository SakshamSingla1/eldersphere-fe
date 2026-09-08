import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Stack, Grid } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import TextField from "../../../atoms/TextField/TextField";
import DatePicker from "../../../atoms/DatePicker/DatePicker";
import Select from "../../../atoms/Select/Select";
import Button from "../../../atoms/Button/Button";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import { ProfileSkeleton } from "../../../molecules/Skeletons/Skeletons";
import { useElderProfileService } from "../../../../services/useElderProfileService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { GenderEnum, enumToOptions } from "../../../../utils/enums";
import { getErrorMessage } from "../../../../utils/helper";

// Self-managed elder profile — mirrors CaretakerMyProfilePage's "view/create/edit my own
// record" pattern, but for the ELDER role's own ElderProfile (GET/POST /elder-profiles/me
// and /elder-profiles, which auto-scope to the caller when they're an ELDER user).
const ElderMyProfilePage: React.FC = () => {
  const elderProfileService = useElderProfileService();
  const { showSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  useEffect(() => {
    elderProfileService
      .getMyProfile()
      .then((profile) => {
        setExists(true);
        setProfileId(profile.id);
        setName(profile.name ?? "");
        setDateOfBirth(profile.dateOfBirth ?? "");
        setGender(profile.gender ?? "");
        setMedicalConditions(profile.medicalConditions ?? "");
        setAddress(profile.address ?? "");
        setEmergencyContactName(profile.emergencyContactName ?? "");
        setEmergencyContactPhone(profile.emergencyContactPhone ?? "");
      })
      .catch(() => setExists(false))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      name,
      dateOfBirth: dateOfBirth || null,
      gender: (gender || null) as any,
      medicalConditions,
      address,
      emergencyContactName,
      emergencyContactPhone,
    };
    try {
      if (exists && profileId) {
        await elderProfileService.update(profileId, payload);
      } else {
        const created = await elderProfileService.create(payload);
        setExists(true);
        setProfileId(created.id);
      }
      showSnackbar("success", "Profile saved successfully");
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your profile"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <PersonIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            My Profile
          </Typography>
        </Stack>
        <ErrorMessage message={error} />
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Date of Birth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Select
                label="Gender"
                value={gender}
                options={enumToOptions(GenderEnum)}
                onChange={(e) => setGender(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Medical Conditions"
                multiline
                minRows={3}
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Emergency Contact Name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Emergency Contact Phone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
              />
            </Grid>
          </Grid>
          <Button type="submit" variant="primary" size="large" loading={saving} sx={{ alignSelf: "flex-start" }}>
            {exists ? "Save Changes" : "Create Profile"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ElderMyProfilePage;
