import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  Box,
  InputLabel,
  MenuItem,
  FormControl,
  Select as MuiSelect,
  Checkbox as MuiCheckbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  OutlinedInput,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DescriptionIcon from "@mui/icons-material/Description";
import TextField from "../../../atoms/TextField/TextField";
import Button from "../../../atoms/Button/Button";
import ErrorMessage from "../../../atoms/ErrorMessage/ErrorMessage";
import StatusChip from "../../../atoms/Chip/StatusChip";
import { CARETAKER_VERIFICATION_STATUS_TONE } from "../../../atoms/Chip/statusTones";
import Avatar from "../../../atoms/Avatar/Avatar";
import { ProfileSkeleton } from "../../../molecules/Skeletons/Skeletons";
import WeeklyAvailabilityEditor from "../../../molecules/WeeklyAvailability/WeeklyAvailabilityEditor";
import {
  useCaretakerService,
  type AvailabilitySlot,
  type CaretakerVerificationDocumentResponse,
} from "../../../../services/useCaretakerService";
import { useFileService } from "../../../../services/useFileService";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { useAuthenticatedUser } from "../../../../hooks/useAuthenticatedUser";
import { ServiceCategoryEnum, ServiceCategoryLabels } from "../../../../utils/enums";
import { formatDateTime, getErrorMessage } from "../../../../utils/helper";

const CaretakerMyProfilePage: React.FC = () => {
  const caretakerService = useCaretakerService();
  const fileService = useFileService();
  const { showSnackbar } = useSnackbar();
  const { user } = useAuthenticatedUser();

  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<ServiceCategoryEnum[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">("");
  const [hourlyRate, setHourlyRate] = useState<number | "">("");

  const [availabilityId, setAvailabilityId] = useState<number | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [uploadingDocument, setUploadingDocument] = useState(false);
  // Listing a caretaker's own submitted documents back is admin-only on the backend (see
  // CARETAKER_URLS.VERIFICATION_DOCUMENTS_BY_ID) — this page can only show what was
  // uploaded during the current visit, as a receipt, not a persisted history.
  const [documentsUploadedThisSession, setDocumentsUploadedThisSession] = useState<CaretakerVerificationDocumentResponse[]>([]);

  useEffect(() => {
    caretakerService
      .getMyProfile()
      .then((profile) => {
        setExists(true);
        setBio(profile.bio ?? "");
        setSpecialties(profile.specialties ?? []);
        setYearsOfExperience(profile.yearsOfExperience ?? "");
        setHourlyRate(profile.hourlyRate ?? "");
        setVerificationStatus(profile.verificationStatus);
        setPhotoUrl(profile.profilePhotoUrl ?? null);
        setAvailabilityId(profile.id);
        return caretakerService.getAvailability(profile.id);
      })
      .then((availabilityResponse) => setAvailability(availabilityResponse?.slots ?? []))
      .catch(() => setExists(false))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const response = await caretakerService.replaceMyAvailability(availability);
      setAvailability(response.slots);
      showSnackbar("success", "Availability saved successfully");
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not save your availability"));
    } finally {
      setSavingAvailability(false);
    }
  };

  const handlePhotoUpload = async (file: File | null | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const asset = await fileService.upload(file, "CARETAKER_PROFILE_PHOTO");
      setPhotoUrl(asset.url);
      showSnackbar("success", "Photo uploaded — don't forget to save your profile.");
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Photo upload failed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (file: File | null | undefined) => {
    if (!file) return;
    setUploadingDocument(true);
    try {
      const document = await caretakerService.uploadVerificationDocument(file);
      setDocumentsUploadedThisSession((docs) => [document, ...docs]);
      showSnackbar("success", "Document uploaded — our team will review it as part of your verification.");
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Document upload failed"));
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const profile = await caretakerService.upsertMyProfile({
        bio,
        specialties,
        yearsOfExperience: yearsOfExperience === "" ? undefined : Number(yearsOfExperience),
        hourlyRate: hourlyRate === "" ? undefined : Number(hourlyRate),
      });
      setExists(true);
      setVerificationStatus(profile.verificationStatus);
      showSnackbar("success", "Profile saved successfully");
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your profile"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Avatar
              src={photoUrl ?? undefined}
              name={user?.fullName}
              seed={user?.id ?? user?.email}
              sx={{ width: 96, height: 96, mx: "auto", mb: 2, fontSize: 28 }}
            />
            {!photoUrl && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -1.5, mb: 1.5 }}>
                <BadgeIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }} />
                No photo yet — showing a generated avatar
              </Typography>
            )}
            <Button variant="outline" component="label" startIcon={<UploadFileIcon />} loading={uploadingPhoto}>
              Upload Photo
              <input type="file" hidden accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} />
            </Button>
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Verification Status
              </Typography>
              {exists && verificationStatus ? (
                <StatusChip label={verificationStatus} tone={CARETAKER_VERIFICATION_STATUS_TONE[verificationStatus]} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Save your profile to start verification
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <BadgeIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Caretaker Profile
              </Typography>
            </Stack>
            <ErrorMessage message={error} />
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <TextField label="Bio" multiline minRows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
              <FormControl size="small" fullWidth>
                <InputLabel id="specialties-label">Specialties</InputLabel>
                <MuiSelect
                  labelId="specialties-label"
                  multiple
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value as ServiceCategoryEnum[])}
                  input={<OutlinedInput label="Specialties" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={ServiceCategoryLabels[value as ServiceCategoryEnum]} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {Object.values(ServiceCategoryEnum).map((category) => (
                    <MenuItem key={category} value={category}>
                      <MuiCheckbox checked={specialties.includes(category)} size="small" />
                      <ListItemText primary={ServiceCategoryLabels[category]} />
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    label="Years of Experience"
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Hourly Rate (₹)"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="primary" size="large" loading={saving}>
                {exists ? "Save Changes" : "Create Profile"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {exists && (
        <Grid size={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EventAvailableIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>
                    Weekly Availability
                  </Typography>
                </Stack>
                <Button variant="primary" onClick={handleSaveAvailability} loading={savingAvailability}>
                  Save Availability
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Add the time windows you're generally available each day — families see this on your public profile.
              </Typography>
              <WeeklyAvailabilityEditor value={availability} onChange={setAvailability} disabled={savingAvailability} />
            </CardContent>
          </Card>
        </Grid>
      )}

      {exists && (
        <Grid size={12}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <VerifiedUserIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>
                  Verification Documents
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Upload an ID, certification, or background-check document to support your verification review by our
                admin team.
              </Typography>
              <Button variant="outline" component="label" startIcon={<UploadFileIcon />} loading={uploadingDocument}>
                Upload Document
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={(e) => handleDocumentUpload(e.target.files?.[0])}
                />
              </Button>
              {documentsUploadedThisSession.length > 0 && (
                <List dense disablePadding sx={{ mt: 2 }}>
                  {documentsUploadedThisSession.map((doc) => (
                    <ListItem key={doc.id} divider>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <DescriptionIcon color="action" />
                      </ListItemIcon>
                      <ListItemText primary={doc.fileName} secondary={`Uploaded ${formatDateTime(doc.createdAt)}`} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default CaretakerMyProfilePage;
