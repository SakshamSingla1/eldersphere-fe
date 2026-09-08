import React from "react";
import { Link as RouterLink, useLocation, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
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

interface RoleOption {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  staffTone?: boolean;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: "family",
    label: "Family Member",
    description: "Manage care for your loved ones",
    icon: <FamilyRestroomIcon fontSize="large" />,
    to: "/login/family",
  },
  {
    key: "caretaker",
    label: "Caretaker",
    description: "Manage your bookings and schedule",
    icon: <VolunteerActivismIcon fontSize="large" />,
    to: "/login/caretaker",
  },
  {
    key: "elder",
    label: "Elder",
    description: "View your care and bookings",
    icon: <ElderlyIcon fontSize="large" />,
    to: "/login/elder",
  },
  {
    key: "admin",
    label: "Admin",
    description: "Manage the platform",
    icon: <AdminPanelSettingsIcon fontSize="large" />,
    to: "/admin/login",
    staffTone: true,
  },
  {
    key: "super-admin",
    label: "Super Admin",
    description: "Full platform access",
    icon: <SecurityIcon fontSize="large" />,
    to: "/login/super-admin",
    staffTone: true,
  },
];

// Role-picker landing page — replaces what used to be a single generic login form. Every
// role now has its own dedicated login page (see RoleLoginPage.tsx / AdminLogin.page.tsx /
// SuperAdminLogin.page.tsx), and this is the front door every "log in" link in the app
// still points at: Landing's nav, ProtectedRoute's unauthenticated redirect, the session-
// expired redirect in services/index.ts, and the post-logout redirect all send an
// unauthenticated visitor here first so they can choose which portal is theirs.
const LoginPage: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);
  const passwordReset = Boolean((location.state as { passwordReset?: boolean } | null)?.passwordReset);
  const expired = searchParams.get("auth") === "expired";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="md">
          <MuiLink component={RouterLink} to="/" underline="none" color="inherit">
            <Stack direction="row" alignItems="center" spacing={1}>
              <FavoriteIcon color="primary" />
              <Typography variant="h6" component="span" fontWeight={800}>
                ElderSphere
              </Typography>
            </Stack>
          </MuiLink>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Stack alignItems="center" textAlign="center" spacing={1.5} mb={5}>
            <Typography variant="h4" component="h1" fontWeight={800}>
              Choose your login
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={480}>
              Every ElderSphere role has its own portal. Pick the one that's yours to continue.
            </Typography>
          </Stack>

          {registered && (
            <Alert severity="success" sx={{ mb: 4 }}>
              Account created! Choose your role below to sign in.
            </Alert>
          )}
          {passwordReset && (
            <Alert severity="success" sx={{ mb: 4 }}>
              Password reset! Choose your role below to sign in.
            </Alert>
          )}
          {expired && (
            <Alert severity="info" sx={{ mb: 4 }}>
              Your session has expired. Choose your role below to sign in again.
            </Alert>
          )}
        </motion.div>

        <Grid container spacing={3}>
          {ROLE_OPTIONS.map((option, index) => (
            <Grid key={option.key} size={{ xs: 12, sm: 6 }}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
                style={{ height: "100%" }}
              >
                <Card sx={{ height: "100%" }}>
                  <CardActionArea
                    component={RouterLink}
                    to={option.to}
                    sx={{ height: "100%", p: 1 }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            color: option.staffTone ? theme.palette.grey[100] : theme.palette.primary.contrastText,
                            bgcolor: option.staffTone
                              ? alpha(theme.palette.grey[900], 0.9)
                              : alpha(theme.palette.primary.main, 0.9),
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
          ))}
        </Grid>

        <Typography variant="body2" textAlign="center" mt={5}>
          Don't have an account?{" "}
          <MuiLink component={RouterLink} to="/register" fontWeight={700}>
            Sign up
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginPage;
