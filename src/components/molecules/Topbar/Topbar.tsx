import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Menu, MenuItem, Divider, IconButton, Tooltip, useMediaQuery, CircularProgress, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightModeRounded";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckIcon from "@mui/icons-material/Check";
import { SIDEBAR_WIDTH } from "../Sidebar/Sidebar";
import NotificationBell from "../NotificationBell/NotificationBell";
import Avatar from "../../atoms/Avatar/Avatar";
import Button from "../../atoms/Button/Button";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import { useThemeMode } from "../../../contexts/ThemeModeContext";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useUserSelfService } from "../../../services/useUserSelfService";
import { homePathForUser } from "../../../routes/ProtectedRoute";
import { USER_TYPE_LABEL, type UserTypeEnum } from "../../../utils/enums";
import { getErrorMessage } from "../../../utils/helper";

const Topbar: React.FC<{
  settingsPath: string;
  onMenuClick?: () => void;
  onOpenCommandPalette?: () => void;
  /** Current desktop sidebar width (full or collapsed-rail) — see DashboardLayout, which
   * owns the collapsed/expanded state and keeps this in sync with the Sidebar itself so the
   * two never drift out of alignment. Ignored below `md`, where the Sidebar is an overlay
   * that doesn't reserve any layout width. */
  sidebarWidth?: number;
}> = ({ settingsPath, onMenuClick, onOpenCommandPalette, sidebarWidth = SIDEBAR_WIDTH }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, setAuthenticatedUser, logout } = useAuthenticatedUser();
  const { mode, toggleMode } = useThemeMode();
  const { showSnackbar } = useSnackbar();
  const userSelfService = useUserSelfService();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [roleAnchorEl, setRoleAnchorEl] = useState<null | HTMLElement>(null);
  const [switchingRole, setSwitchingRole] = useState<UserTypeEnum | null>(null);

  // Multi-role support: an account can hold more than one of the 5 UserTypeEnum roles
  // (see useRoleGatedLogin / UserRolesResponse) — the switcher below only ever appears for
  // those accounts. A single-role account's `roles` is a 1-element (or absent) list, so
  // this is false for it and nothing extra renders.
  const heldRoles = user?.roles ?? [];
  const hasMultipleRoles = heldRoles.length > 1;

  const handleSwitchRole = async (roleType: UserTypeEnum) => {
    if (!user || roleType === user.userType || switchingRole) return;
    setSwitchingRole(roleType);
    try {
      await userSelfService.switchDefaultRole(roleType);
      // No full page reload: swapping `userType` on the existing context re-renders
      // ProtectedRoute/Sidebar/DashboardLayout for the new role in place, and the
      // navigate() below lands on that role's own dashboard home.
      setAuthenticatedUser({ ...user, userType: roleType });
      setRoleAnchorEl(null);
      setAnchorEl(null);
      navigate(homePathForUser(roleType));
      showSnackbar("success", `Switched to ${USER_TYPE_LABEL[roleType]}`);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Failed to switch role"));
    } finally {
      setSwitchingRole(null);
    }
  };

  const pageTitle =
    location.pathname
      .split("/")
      .filter(Boolean)
      .slice(1)
      .join(" / ")
      .split("-")
      .join(" ") || "Dashboard";

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { xs: "100%", md: `calc(100% - ${sidebarWidth}px)` },
        ml: { xs: 0, md: `${sidebarWidth}px` },
        transition: (t) => t.transitions.create(["width", "margin"], { easing: t.transitions.easing.sharp, duration: t.transitions.duration.shorter }),
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box display="flex" alignItems="center" gap={1} minWidth={0}>
          {isMobile && (
            <IconButton onClick={onMenuClick} aria-label="Open navigation menu" edge="start">
              <MenuIcon />
            </IconButton>
          )}
          {/* component="div": an auto-derived breadcrumb-style label, not curated page
              content — the page's own top heading (rendered as <h1>, see Dashboard
              pages) is the real heading for screen-reader navigation. */}
          <Typography variant="h6" component="div" fontWeight={700} textTransform="capitalize" noWrap>
            {pageTitle}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {/* Desktop only — on mobile this collapses into the account menu below instead
              of sitting as its own always-visible control, to avoid crowding a 375px-wide
              toolbar that already has the theme toggle + notification bell + avatar. */}
          {hasMultipleRoles && !isMobile && (
            <>
              <Button
                variant="outline"
                size="small"
                onClick={(e) => setRoleAnchorEl(e.currentTarget)}
                loading={Boolean(switchingRole)}
                startIcon={<SwapHorizIcon fontSize="small" />}
                aria-label={`Switch role — currently ${USER_TYPE_LABEL[user!.userType]}`}
                sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
              >
                {USER_TYPE_LABEL[user!.userType]}
              </Button>
              <Menu anchorEl={roleAnchorEl} open={Boolean(roleAnchorEl)} onClose={() => setRoleAnchorEl(null)}>
                <Box px={2} py={0.75}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.4}>
                    Switch role
                  </Typography>
                </Box>
                {heldRoles.map((role) => (
                  <MenuItem
                    key={role}
                    selected={role === user!.userType}
                    disabled={Boolean(switchingRole)}
                    onClick={() => handleSwitchRole(role)}
                  >
                    <Box sx={{ width: 22, display: "inline-flex", alignItems: "center" }}>
                      {role === user!.userType && <CheckIcon fontSize="small" />}
                    </Box>
                    {USER_TYPE_LABEL[role]}
                    {switchingRole === role && <CircularProgress size={14} sx={{ ml: 1.5 }} />}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          {/* Desktop only, same reasoning as the role switcher above — a 375px-wide mobile
              toolbar has no room for a discoverability hint on top of its other controls. */}
          {!isMobile && (
            <Tooltip title="Quick navigation">
              <Chip
                label="⌘K"
                size="small"
                variant="outlined"
                onClick={onOpenCommandPalette}
                aria-label="Open quick navigation (Cmd+K)"
                sx={{ fontWeight: 700, letterSpacing: 0.3, cursor: "pointer" }}
              />
            </Tooltip>
          )}
          <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
            <IconButton onClick={toggleMode} aria-label="Toggle color mode">
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          <NotificationBell />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Open account menu">
            <Avatar name={user?.fullName} seed={user?.id ?? user?.email} sx={{ width: 38, height: 38, fontSize: 15 }} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box px={2} py={1} minWidth={200}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate(settingsPath);
              }}
            >
              <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} /> Settings
            </MenuItem>
            {/* Mobile collapses the role switcher in here instead of its own toolbar
                control (see above) — same handler, same current-role indicator. */}
            {hasMultipleRoles && isMobile && [
              <Divider key="role-divider" />,
              <Box key="role-heading" px={2} py={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.4}>
                  Switch role
                </Typography>
              </Box>,
              ...heldRoles.map((role) => (
                <MenuItem key={role} selected={role === user!.userType} disabled={Boolean(switchingRole)} onClick={() => handleSwitchRole(role)}>
                  <Box sx={{ width: 22, display: "inline-flex", alignItems: "center" }}>
                    {role === user!.userType && <CheckIcon fontSize="small" />}
                  </Box>
                  {USER_TYPE_LABEL[role]}
                  {switchingRole === role && <CircularProgress size={14} sx={{ ml: 1.5 }} />}
                </MenuItem>
              )),
              <Divider key="role-divider-end" />,
            ]}
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
