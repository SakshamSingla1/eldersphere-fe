import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Card, Typography, Stack, Link as MuiLink } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SecurityIcon from "@mui/icons-material/Security";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import ElderlyIcon from "@mui/icons-material/Elderly";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HandshakeIcon from "@mui/icons-material/Handshake";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

export interface AuthCardBrandPoint {
  icon: React.ReactNode;
  text: string;
}

export type AuthCardVariant = "default" | "admin" | "super-admin" | "family" | "caretaker" | "elder";

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Switches the side panel's icon, copy and brand points to match the portal this page
   * belongs to. "admin"/"super-admin" also switch the gradient to a dialed-back, staff tone. */
  variant?: AuthCardVariant;
}

interface VariantMeta {
  icon: React.ReactNode;
  brandSuffix: string;
  headline: string;
  body: string;
  points: AuthCardBrandPoint[];
  /** Staff-tone (dark/neutral) gradient vs. the warm consumer gradient. */
  staffTone: boolean;
}

// Per-portal side-panel content — same layout/motion/theme-token treatment for every
// variant so none of these reads as a jarring visual departure from the rest, just a
// different heading/description/icon set (and, for staff portals, a dialed-back tone).
const VARIANT_META: Record<AuthCardVariant, VariantMeta> = {
  default: {
    icon: <FavoriteIcon />,
    brandSuffix: "",
    headline: "Compassionate care, right at home.",
    body: "Join thousands of families connecting with verified caretakers for the people they love most.",
    points: [
      { icon: <VerifiedUserIcon fontSize="small" />, text: "Background-checked, verified caretakers" },
      { icon: <EventAvailableIcon fontSize="small" />, text: "Flexible booking for nursing, therapy & more" },
      { icon: <FolderSharedIcon fontSize="small" />, text: "Shared medical records & one-tap emergency alerts" },
    ],
    staffTone: false,
  },
  admin: {
    icon: <AdminPanelSettingsIcon />,
    brandSuffix: " Admin",
    headline: "Internal access for platform administrators.",
    body: "This portal is reserved for ElderSphere staff. Sign in with your administrator credentials.",
    points: [
      { icon: <LockPersonIcon fontSize="small" />, text: "Restricted to administrator accounts" },
      { icon: <ManageAccountsIcon fontSize="small" />, text: "Manage users, caretakers and platform settings" },
    ],
    staffTone: true,
  },
  "super-admin": {
    icon: <SecurityIcon />,
    brandSuffix: " Super Admin",
    headline: "Full platform access for super administrators.",
    body: "Reserved for super administrator accounts with unrestricted control over the platform.",
    points: [
      { icon: <LockPersonIcon fontSize="small" />, text: "Restricted to super administrator accounts" },
      { icon: <ManageAccountsIcon fontSize="small" />, text: "Full control over roles, permissions and platform settings" },
    ],
    staffTone: true,
  },
  family: {
    icon: <FamilyRestroomIcon />,
    brandSuffix: "",
    headline: "Caring for your family, together.",
    body: "Manage bookings, records and care for the people you love, all from one place.",
    points: [
      { icon: <VerifiedUserIcon fontSize="small" />, text: "Background-checked, verified caretakers" },
      { icon: <EventAvailableIcon fontSize="small" />, text: "Flexible booking for nursing, therapy & more" },
      { icon: <FolderSharedIcon fontSize="small" />, text: "Shared medical records & one-tap emergency alerts" },
    ],
    staffTone: false,
  },
  caretaker: {
    icon: <VolunteerActivismIcon />,
    brandSuffix: "",
    headline: "Meaningful care work, made simple.",
    body: "Manage your schedule, bookings and client relationships as a verified ElderSphere caretaker.",
    points: [
      { icon: <EventNoteIcon fontSize="small" />, text: "Manage your availability and upcoming bookings" },
      { icon: <HandshakeIcon fontSize="small" />, text: "Connect with families who need your care" },
      { icon: <VerifiedUserIcon fontSize="small" />, text: "Build your verified caretaker reputation" },
    ],
    staffTone: false,
  },
  elder: {
    icon: <ElderlyIcon />,
    brandSuffix: "",
    headline: "Your care, your way.",
    body: "View your bookings, care plan, and stay connected with your family and caretakers.",
    points: [
      { icon: <EventAvailableIcon fontSize="small" />, text: "See your upcoming visits and bookings" },
      { icon: <FolderSharedIcon fontSize="small" />, text: "Keep your medical records close at hand" },
      { icon: <FavoriteBorderIcon fontSize="small" />, text: "Stay connected with the family who cares for you" },
    ],
    staffTone: false,
  },
};

// Shared chrome for every auth page (login/register/forgot/reset password) — a two-column
// layout on wider screens: a brand/messaging panel (built entirely from theme tokens so it
// holds up in dark mode) alongside the actual form card. Collapses to just the centered
// card on mobile. Replaces the old bare-centered-card + hardcoded light-only gradient.
const AuthCard: React.FC<AuthCardProps> = ({ title, subtitle, children, variant = "default" }) => {
  const theme = useTheme();
  const meta = VARIANT_META[variant];
  const isStaff = meta.staffTone;
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "background.default",
      }}
    >
      {/* Brand panel — hidden below md, so mobile just gets the form card full-width. */}
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
          background: isStaff
            ? `linear-gradient(160deg, ${theme.palette.grey[900]} 0%, ${theme.palette.primary.dark} 80%, ${theme.palette.secondary.dark} 140%)`
            : `linear-gradient(160deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.dark} 130%)`,
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
            {meta.icon}
            <Typography variant="h6" component="span" fontWeight={800}>
              ElderSphere{meta.brandSuffix}
            </Typography>
          </Stack>
          {/* Marketing copy in the side panel, not the page's actual heading — the form
              title below (rendered as the real <h1>) is what the page is "about". */}
          <Typography
            variant="h3"
            component="p"
            fontWeight={800}
            sx={{ fontSize: { md: isStaff ? 30 : 32, lg: isStaff ? 34 : 38 }, mb: 2, lineHeight: 1.2 }}
          >
            {meta.headline}
          </Typography>
          <Typography sx={{ opacity: 0.9, mb: 4 }}>{meta.body}</Typography>
          <Stack spacing={2}>
            {meta.points.map((point) => (
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

      {/* Form panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: 440 }}
        >
          <Card sx={{ width: "100%", p: 1 }}>
            <Box sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                justifyContent="center"
                mb={2}
                sx={{ display: { xs: "flex", md: "none" } }}
              >
                <MuiLink component={RouterLink} to="/" underline="none" color="inherit">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {React.cloneElement(meta.icon as React.ReactElement, { color: "primary" } as object)}
                    <Typography variant="h6" component="span" fontWeight={800}>
                      ElderSphere{meta.brandSuffix}
                    </Typography>
                  </Stack>
                </MuiLink>
              </Stack>
              <Typography variant="h5" component="h1" fontWeight={800} textAlign="center" gutterBottom>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
                  {subtitle}
                </Typography>
              )}
              {children}
            </Box>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
};

export default AuthCard;
