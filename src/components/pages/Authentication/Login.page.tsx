import React from "react";
import { Link as RouterLink, useLocation, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Link as MuiLink,
  Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import ElderlyIcon from "@mui/icons-material/Elderly";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SecurityIcon from "@mui/icons-material/Security";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import FolderSharedIcon from "@mui/icons-material/FolderShared";

/** Which theme-driven color group a role's icon badge draws its gradient from — keeps every
 * badge tied to the active color theme's real palette (so it re-tints across all 6 selectable
 * presets and both modes) instead of a hardcoded hex. "staff" is the one non-semantic tone:
 * a neutral grey/near-black gradient for the two internal portals, mirroring AuthCard's
 * staffTone treatment. */
type RoleTone = "primary" | "secondary" | "info" | "staff";

interface RoleOption {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  tone: RoleTone;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: "family",
    label: "Family Member",
    description: "Manage care for your loved ones",
    icon: <FamilyRestroomIcon fontSize="large" />,
    to: "/login/family",
    tone: "primary",
  },
  {
    key: "caretaker",
    label: "Caretaker",
    description: "Manage your bookings and schedule",
    icon: <VolunteerActivismIcon fontSize="large" />,
    to: "/login/caretaker",
    tone: "secondary",
  },
  {
    key: "elder",
    label: "Elder",
    description: "View your care and bookings",
    icon: <ElderlyIcon fontSize="large" />,
    to: "/login/elder",
    tone: "info",
  },
  {
    key: "admin",
    label: "Admin",
    description: "Manage the platform",
    icon: <AdminPanelSettingsIcon fontSize="large" />,
    to: "/admin/login",
    tone: "staff",
  },
  {
    key: "super-admin",
    label: "Super Admin",
    description: "Full platform access",
    icon: <SecurityIcon fontSize="large" />,
    to: "/login/super-admin",
    tone: "staff",
  },
];

// Role-picker landing page — replaces what used to be a single generic login form. Every
// role now has its own dedicated login page (see RoleLoginPage.tsx / AdminLogin.page.tsx /
// SuperAdminLogin.page.tsx), and this is the front door every "log in" link in the app
// still points at: Landing's nav, ProtectedRoute's unauthenticated redirect, the session-
// expired redirect in services/index.ts, and the post-logout redirect all send an
// unauthenticated visitor here first so they can choose which portal is theirs.
//
// Laid out as the same two-column brand-panel + content pattern every other auth page uses
// (see AuthCard.tsx) rather than a bare centered list of cards on an empty background — this
// is the first thing an unauthenticated or session-expired visitor sees, so it should read as
// considered as any of the role-specific login pages, not a step down from them. Every color
// below comes from theme tokens (palette groups, alpha of those, theme.shadows), so it holds
// up across all 6 selectable color themes and in dark mode, where a flat, low-contrast
// treatment reads as an unfinished placeholder rather than a landing page.
const LoginPage: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isLight = theme.palette.mode === "light";

  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);
  const passwordReset = Boolean((location.state as { passwordReset?: boolean } | null)?.passwordReset);
  const expired = searchParams.get("auth") === "expired";

  const toneColors: Record<RoleTone, { main: string; dark: string; contrastText: string }> = {
    primary: {
      main: theme.palette.primary.main,
      dark: theme.palette.primary.dark,
      contrastText: theme.palette.primary.contrastText,
    },
    secondary: {
      main: theme.palette.secondary.main,
      dark: theme.palette.secondary.dark,
      contrastText: theme.palette.secondary.contrastText,
    },
    info: {
      main: theme.palette.info.main,
      dark: theme.palette.info.dark,
      contrastText: theme.palette.info.contrastText,
    },
    staff: {
      main: theme.palette.grey[800],
      dark: theme.palette.grey[900],
      contrastText: theme.palette.grey[100],
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      {/* Brand panel — hidden below md, so mobile just gets the picker full-width, same
          breakpoint/behavior as AuthCard's side panel. */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          width: "42%",
          minWidth: 380,
          position: "relative",
          overflow: "hidden",
          p: 6,
          background: `linear-gradient(160deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.dark} 130%)`,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: alpha("#FFFFFF", 0.08),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -140,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: alpha("#FFFFFF", 0.06),
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ position: "relative" }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={4}>
            <FavoriteIcon />
            <Typography variant="h6" component="span" fontWeight={800}>
              ElderSphere
            </Typography>
          </Stack>
          <Typography
            variant="h3"
            component="p"
            fontWeight={800}
            sx={{ fontSize: { md: 32, lg: 38 }, mb: 2, lineHeight: 1.2 }}
          >
            One platform, every kind of care.
          </Typography>
          <Typography sx={{ opacity: 0.9, mb: 4 }}>
            Family members, caretakers, elders and staff each get a portal built just for them.
            Choose yours to continue.
          </Typography>
          <Stack spacing={2}>
            {[
              { icon: <VerifiedUserIcon fontSize="small" />, text: "Background-checked, verified caretakers" },
              { icon: <EventAvailableIcon fontSize="small" />, text: "Flexible booking for nursing, therapy & more" },
              { icon: <FolderSharedIcon fontSize="small" />, text: "Shared medical records & one-tap emergency alerts" },
            ].map((point) => (
              <Stack key={point.text} direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha("#FFFFFF", 0.15),
                    flexShrink: 0,
                  }}
                >
                  {point.icon}
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  {point.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </motion.div>
      </Box>

      {/* Picker panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          p: { xs: 2, sm: 4, md: 6 },
          overflowY: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 720, my: "auto" }}>
          {/* Mobile-only logo, same inline treatment AuthCard uses below md. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            justifyContent="center"
            mb={3}
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <MuiLink component={RouterLink} to="/" underline="none" color="inherit">
              <Stack direction="row" alignItems="center" spacing={1}>
                <FavoriteIcon color="primary" />
                <Typography variant="h6" component="span" fontWeight={800}>
                  ElderSphere
                </Typography>
              </Stack>
            </MuiLink>
          </Stack>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Stack alignItems="center" textAlign="center" spacing={1.5} mb={4}>
              <Typography variant="h4" component="h1" fontWeight={800}>
                Choose your login
              </Typography>
              <Typography variant="body1" color="text.secondary" maxWidth={480}>
                Every ElderSphere role has its own portal. Pick the one that's yours to continue.
              </Typography>
            </Stack>

            {registered && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Account created! Choose your role below to sign in.
              </Alert>
            )}
            {passwordReset && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Password reset! Choose your role below to sign in.
              </Alert>
            )}
            {expired && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Your session has expired. Choose your role below to sign in again.
              </Alert>
            )}
          </motion.div>

          <Grid container spacing={3}>
            {ROLE_OPTIONS.map((option, index) => {
              const tone = toneColors[option.tone];
              return (
                <Grid key={option.key} size={{ xs: 12, sm: 6 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
                    style={{ height: "100%" }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: alpha(tone.main, isLight ? 0.22 : 0.4),
                        boxShadow: isLight ? theme.shadows[2] : theme.shadows[6],
                        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: theme.shadows[10],
                          borderColor: alpha(tone.main, isLight ? 0.45 : 0.65),
                        },
                      }}
                    >
                      <CardActionArea component={RouterLink} to={option.to} sx={{ height: "100%", p: 1 }}>
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                color: tone.contrastText,
                                backgroundImage: `linear-gradient(135deg, ${tone.main} 0%, ${tone.dark} 100%)`,
                                boxShadow: `0 6px 16px ${alpha(tone.main, 0.35)}`,
                              }}
                            >
                              {option.icon}
                            </Box>
                            <Box flex={1}>
                              <Typography variant="h6" component="h2" fontWeight={700}>
                                {option.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {option.description}
                              </Typography>
                            </Box>
                            <ArrowForwardIcon color="action" />
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>

          <Typography variant="body2" textAlign="center" mt={4}>
            Don't have an account?{" "}
            <MuiLink component={RouterLink} to="/register" fontWeight={700}>
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
