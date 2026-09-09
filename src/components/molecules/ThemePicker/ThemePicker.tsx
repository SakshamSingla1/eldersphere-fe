import React, { useEffect, useState } from "react";
import { Box, Card, CardActionArea, Stack, Typography, CircularProgress } from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useColorThemeService, type ColorThemePreset } from "../../../services/useColorThemeService";
import { useUserSelfService } from "../../../services/useUserSelfService";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import { useThemeMode } from "../../../contexts/ThemeModeContext";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../utils/helper";

// One swatch card in the grid — a tiny mock of the theme's own palette (a rounded rect
// split into its primary/secondary hues, over its own background) so the preview genuinely
// reflects that preset rather than a generic placeholder, plus the theme's name and a
// checkmark/border highlight when it's the caller's current active theme.
const ThemeSwatch: React.FC<{
  theme: ColorThemePreset;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
}> = ({ theme, active, disabled, onSelect }) => {
  const { palette } = theme;
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: active ? palette.primary.main : null,
        borderWidth: active ? 2 : 1,
        boxShadow: active ? `0 0 0 3px ${palette.primary.main}22` : null,
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
      }}
    >
      <CardActionArea
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={active}
        aria-label={`${theme.name}${active ? " (active)" : ""}`}
        sx={{ p: 1.5 }}
      >
        <Stack spacing={1.25}>
          <Box
            sx={{
              height: 56,
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: palette.background.default,
            }}
          >
            <Box sx={{ flex: 1.4, backgroundColor: palette.primary.main }} />
            <Box sx={{ flex: 1, backgroundColor: palette.secondary.main }} />
            <Box
              sx={{
                flex: 1.6,
                backgroundColor: palette.background.paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ width: 22, height: 6, borderRadius: 3, backgroundColor: palette.text.secondary, opacity: 0.5 }} />
            </Box>
          </Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {theme.name}
            </Typography>
            {active && <CheckCircleIcon fontSize="small" sx={{ color: palette.primary.main, flexShrink: 0 }} />}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
};

// Mounted on every role's Settings page (see AccountSettings.page.tsx), parallel to
// NotificationPreferences. Lets any authenticated user pick one of the catalog's color
// theme presets for their own dashboard — clicking a swatch calls PUT /users/me/theme and
// applies the result immediately (no reload) by updating ThemeModeContext, the same state
// `buildTheme` reads from, so the whole app re-renders in the new palette right away. This
// is orthogonal to the separate light/dark toggle (see ThemeModeContext/Topbar) — either
// can change independently of the other.
const ThemePicker: React.FC = () => {
  const colorThemeService = useColorThemeService();
  const userSelfService = useUserSelfService();
  const { user } = useAuthenticatedUser();
  const { activeColorTheme, applyActiveColorTheme } = useThemeMode();
  const { showSnackbar } = useSnackbar();

  const [themes, setThemes] = useState<ColorThemePreset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  useEffect(() => {
    colorThemeService
      .listActive()
      .then(setThemes)
      .catch((err) => showSnackbar("error", getErrorMessage(err, "Could not load color themes")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (theme: ColorThemePreset) => {
    if (!user || applyingId !== null) return;
    if (activeColorTheme?.themeId === theme.id) return;
    setApplyingId(theme.id);
    try {
      const resolved = await userSelfService.setMyTheme(theme.id);
      applyActiveColorTheme(resolved, user.id);
      showSnackbar("success", `Switched to ${theme.name}`);
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not switch your color theme"));
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Card>
      <Box sx={{ p: 2.75 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <PaletteIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Appearance
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Pick an accent color theme for your dashboard. This is independent of light/dark mode — you can pair any theme
          with either.
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : !themes || themes.length === 0 ? (
          <Typography color="text.secondary">No color themes available yet.</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 1.5,
            }}
          >
            {themes.map((theme) => (
              <ThemeSwatch
                key={theme.id}
                theme={theme}
                active={(activeColorTheme?.themeId ?? themes.find((t) => t.isDefault)?.id) === theme.id}
                disabled={applyingId !== null}
                onSelect={() => handleSelect(theme)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ThemePicker;
