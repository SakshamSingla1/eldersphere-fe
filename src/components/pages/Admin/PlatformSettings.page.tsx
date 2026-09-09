import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Stack, Grid } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import Loader from "../../atoms/Loader/Loader";
import ColorThemeManagement from "../../molecules/ColorThemeManagement/ColorThemeManagement";
import { usePlatformSettingsService, type PlatformSettingsDTO } from "../../../services/usePlatformSettingsService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../utils/helper";

const AdminPlatformSettingsPage: React.FC = () => {
  const platformSettingsService = usePlatformSettingsService();
  const { showSnackbar } = useSnackbar();

  const [settings, setSettings] = useState<PlatformSettingsDTO>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    platformSettingsService
      .get()
      .then(setSettings)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await platformSettingsService.update(settings);
      setSettings(updated);
      showSnackbar("success", "Platform settings updated");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update platform settings"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader minHeight={300} />;

  return (
    <Stack spacing={3}>
      <Card sx={{ maxWidth: 640 }}>
        <CardContent>
          <PageHeader icon={<TuneIcon color="primary" />} title="Platform Settings" />
          <ErrorMessage message={error} />
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField
              label="Platform Name"
              value={settings.platformName ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Support Email"
                  value={settings.supportEmail ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Support Phone"
                  value={settings.supportPhone ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, supportPhone: e.target.value }))}
                />
              </Grid>
              {/* Kept in the same 2-up grid as the row above rather than its own full-width
                  Stack row — a single-digit-minutes number field stretched the full card
                  width looked disproportionate next to the paired fields above it. */}
              <Grid size={6}>
                <TextField
                  label="Emergency Response SLA (minutes)"
                  type="number"
                  value={settings.emergencyResponseSlaMinutes ?? ""}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, emergencyResponseSlaMinutes: e.target.value === "" ? undefined : Number(e.target.value) }))
                  }
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="primary" loading={saving} sx={{ alignSelf: "flex-start" }}>
              Save Settings
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <ColorThemeManagement />
    </Stack>
  );
};

export default AdminPlatformSettingsPage;
