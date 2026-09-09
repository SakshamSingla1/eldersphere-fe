import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Button from "../../atoms/Button/Button";
import TextField from "../../atoms/TextField/TextField";
import DialogTransition from "../../atoms/DialogTransition/DialogTransition";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { useColorThemeService, type ColorThemePreset, type ColorThemeRequestPayload } from "../../../services/useColorThemeService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../utils/helper";
import { defaultColorThemePalette, type ActiveThemePalette, type MuiColorGroup } from "../../../utils/theme";
import { ColorThemeStatusEnum } from "../../../utils/enums";

// A single "pick a color, see/edit its hex" row — native <input type="color"> kept in sync
// with a hex text field, deliberately no third-party color-picker dependency (per the
// build's "watch bundle size" constraint, a native color input is all this admin-only form
// needs).
const ColorField: React.FC<{ label: string; value: string; onChange: (hex: string) => void }> = ({ label, value, onChange }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Box
      component="input"
      type="color"
      value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      sx={{ width: 36, height: 36, p: 0, border: "none", borderRadius: 1, cursor: "pointer", flexShrink: 0 }}
      aria-label={`${label} color swatch`}
    />
    <TextField label={label} value={value} onChange={(e) => onChange(e.target.value)} />
  </Stack>
);

const emptyGroup = (): MuiColorGroup => ({ main: "#000000", light: "#666666", dark: "#000000", contrastText: "#FFFFFF" });

interface FormState {
  name: string;
  isDefault: boolean;
  primary: MuiColorGroup;
  secondary: MuiColorGroup;
  background: { default: string; paper: string };
  text: { primary: string; secondary: string };
}

const formFromPreset = (preset?: ColorThemePreset | null): FormState => {
  if (!preset) {
    return {
      name: "",
      isDefault: false,
      primary: emptyGroup(),
      secondary: emptyGroup(),
      background: { ...defaultColorThemePalette.background },
      text: { ...defaultColorThemePalette.text },
    };
  }
  return {
    name: preset.name,
    isDefault: preset.isDefault,
    primary: { ...preset.palette.primary },
    secondary: { ...preset.palette.secondary },
    background: { ...preset.palette.background },
    text: { ...preset.palette.text },
  };
};

// The semantic (error/warning/info/success) colors are identical across every built-in
// preset — this admin form only exposes what actually varies theme-to-theme (brand
// primary/secondary + background/text), and reuses the shared semantic set for anything it
// creates/edits, keeping the form to a manageable size instead of 6 full color groups.
const buildPalette = (form: FormState): ActiveThemePalette => ({
  primary: form.primary,
  secondary: form.secondary,
  error: defaultColorThemePalette.error,
  warning: defaultColorThemePalette.warning,
  info: defaultColorThemePalette.info,
  success: defaultColorThemePalette.success,
  background: form.background,
  text: form.text,
});

// SUPER_ADMIN-only catalog management for color theme presets (create/edit/delete), mounted
// on Platform Settings (see PlatformSettings.page.tsx) — the least-disruptive place for a
// low-priority admin tool, next to the platform's other global configuration. Every user's
// picker (see ThemePicker) reads from the same GET /api/v1/color-themes list this manages.
const ColorThemeManagement: React.FC = () => {
  const colorThemeService = useColorThemeService();
  const { showSnackbar } = useSnackbar();

  const [themes, setThemes] = useState<ColorThemePreset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ColorThemePreset | null>(null);
  const [form, setForm] = useState<FormState>(formFromPreset(null));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ColorThemePreset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    colorThemeService
      .listActive()
      .then(setThemes)
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Could not load color themes")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null);
    setForm(formFromPreset(null));
    setDialogOpen(true);
  };

  const openEdit = (preset: ColorThemePreset) => {
    setEditing(preset);
    setForm(formFromPreset(preset));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showSnackbar("error", "Theme name is required");
      return;
    }
    setSaving(true);
    const payload: ColorThemeRequestPayload = {
      name: form.name.trim(),
      isDefault: form.isDefault,
      palette: buildPalette(form),
      status: ColorThemeStatusEnum.ACTIVE,
    };
    try {
      if (editing) {
        await colorThemeService.update(editing.id, payload);
        showSnackbar("success", "Color theme updated");
      } else {
        await colorThemeService.create(payload);
        showSnackbar("success", "Color theme created");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not save this color theme"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await colorThemeService.remove(deleteTarget.id);
      showSnackbar("success", "Color theme deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not delete this color theme"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <Box sx={{ p: 2.75 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PaletteIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>
              Color Theme Catalog
            </Typography>
          </Stack>
          <Button variant="outline" size="small" startIcon={<AddIcon />} onClick={openCreate}>
            New Theme
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Every user's Appearance picker reads from this catalog. Deleting the current default theme isn't allowed.
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {(themes ?? []).map((preset) => (
              <Grid key={preset.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={() => openEdit(preset)} sx={{ p: 1.5 }}>
                    <Box
                      sx={{
                        height: 40,
                        borderRadius: 2,
                        overflow: "hidden",
                        display: "flex",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box sx={{ flex: 1, backgroundColor: preset.palette.primary.main }} />
                      <Box sx={{ flex: 1, backgroundColor: preset.palette.secondary.main }} />
                    </Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {preset.name}
                      </Typography>
                      {preset.isDefault && <CheckCircleIcon fontSize="small" color="primary" />}
                    </Stack>
                  </CardActionArea>
                  <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ px: 1, pb: 0.5 }}>
                    <IconButton size="small" onClick={() => openEdit(preset)} aria-label={`Edit ${preset.name}`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(preset)}
                      disabled={preset.isDefault}
                      aria-label={`Delete ${preset.name}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth TransitionComponent={DialogTransition}>
        <DialogTitle>{editing ? `Edit "${editing.name}"` : "New Color Theme"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <TextField label="Theme Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                />
              }
              label="Make this the default theme"
            />

            <Typography variant="subtitle2" fontWeight={700}>
              Primary
            </Typography>
            <Grid container spacing={1.5}>
              {(["main", "light", "dark", "contrastText"] as const).map((key) => (
                <Grid key={key} size={6}>
                  <ColorField
                    label={key}
                    value={form.primary[key]}
                    onChange={(hex) => setForm((f) => ({ ...f, primary: { ...f.primary, [key]: hex } }))}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" fontWeight={700}>
              Secondary
            </Typography>
            <Grid container spacing={1.5}>
              {(["main", "light", "dark", "contrastText"] as const).map((key) => (
                <Grid key={key} size={6}>
                  <ColorField
                    label={key}
                    value={form.secondary[key]}
                    onChange={(hex) => setForm((f) => ({ ...f, secondary: { ...f.secondary, [key]: hex } }))}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" fontWeight={700}>
              Background &amp; Text
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={6}>
                <ColorField
                  label="background.default"
                  value={form.background.default}
                  onChange={(hex) => setForm((f) => ({ ...f, background: { ...f.background, default: hex } }))}
                />
              </Grid>
              <Grid size={6}>
                <ColorField
                  label="background.paper"
                  value={form.background.paper}
                  onChange={(hex) => setForm((f) => ({ ...f, background: { ...f.background, paper: hex } }))}
                />
              </Grid>
              <Grid size={6}>
                <ColorField
                  label="text.primary"
                  value={form.text.primary}
                  onChange={(hex) => setForm((f) => ({ ...f, text: { ...f.text, primary: hex } }))}
                />
              </Grid>
              <Grid size={6}>
                <ColorField
                  label="text.secondary"
                  value={form.text.secondary}
                  onChange={(hex) => setForm((f) => ({ ...f, text: { ...f.text, secondary: hex } }))}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {editing ? "Save Changes" : "Create Theme"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Color Theme"
        message={`Delete "${deleteTarget?.name}"? Any user whose active theme is this one falls back to the default automatically.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
};

export default ColorThemeManagement;
