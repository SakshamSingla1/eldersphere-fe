import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED, type SidebarNavItem } from "../components/molecules/Sidebar/Sidebar";
import Topbar from "../components/molecules/Topbar/Topbar";
import RouteTransition from "../components/atoms/RouteTransition/RouteTransition";
import OnboardingTour from "../components/molecules/OnboardingTour/OnboardingTour";
import CommandPalette from "../components/molecules/CommandPalette/CommandPalette";

export interface DashboardLayoutProps {
  navItems: SidebarNavItem[];
  roleLabel: string;
  settingsPath: string;
}

// Shared chrome for all five authenticated shells (Super Admin / Admin / Caretaker /
// Family / Elder) — only the sidebar nav items and role label differ per role; see
// routes/*Routes. The Sidebar/Topbar chrome stays mounted across in-shell navigation;
// only the Outlet content below fades+rises on each page change (keyed by pathname), so
// switching sidebar pages never re-triggers the sidebar's own mount animation.
//
// Below the `md` breakpoint the Sidebar renders as a hamburger-triggered temporary
// drawer instead of a permanently docked rail — `mobileOpen` is lifted here so the
// Topbar's hamburger button and the Sidebar's drawer/backdrop/nav-click-to-close all
// share the same open state.
// localStorage key for the desktop rail's collapsed/expanded preference — deliberately not
// scoped per-role/user, since "I like a slim sidebar" is a device/screen preference, not
// something tied to which of the 5 dashboards is currently open.
const SIDEBAR_COLLAPSED_KEY = "eldersphere.sidebarCollapsed";

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ navItems, roleLabel, settingsPath }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // Private-browsing / storage-disabled: the toggle still works for this session, it
      // just won't be remembered on the next visit — not worth surfacing to the user.
    }
  }, [collapsed]);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  // Global Cmd+K / Ctrl+K — listens at the window level so it fires regardless of what's
  // focused on the page, but only ever reacts to the modifier+K combo, so plain "k"
  // keypresses while typing in a real text field are left completely alone.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      {/* Skip link — the first focusable element in every authenticated shell, deliberately
          rendered before OnboardingTour below so it stays the very first Tab stop even
          while the tour's own Skip/Next buttons are on screen. Invisible until it receives
          keyboard focus (Tab from a fresh page load), at which point it jumps straight past
          the sidebar nav to the main content landmark below. Screen reader and
          keyboard-only users otherwise have to tab through the full nav list (and, on a
          first login, the tour) on every single page. */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          left: 12,
          top: -80,
          zIndex: (theme) => theme.zIndex.tooltip + 20,
          px: 2.5,
          py: 1.25,
          borderRadius: "10px",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
          transition: "top 0.15s ease",
          "&:focus-visible": { top: 12 },
        }}
      >
        Skip to main content
      </Box>
      {/* Shown once per user (see OnboardingTour) — a 3-step guided walkthrough of the
          dashboard stat cards, this role's most relevant nav item, and the notification
          bell. No-ops entirely once localStorage records that user id as having seen it. */}
      <OnboardingTour roleLabel={roleLabel} navItems={navItems} />
      {/* Cmd+K / Ctrl+K quick nav — reuses the exact navItems list the Sidebar renders for
          this role, so it can never offer a destination the current user can't actually
          reach. */}
      <CommandPalette navItems={navItems} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Sidebar
        navItems={navItems}
        roleLabel={roleLabel}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />
      <Topbar
        settingsPath={settingsPath}
        onMenuClick={() => setMobileOpen(true)}
        onOpenCommandPalette={() => setPaletteOpen(true)}
        sidebarWidth={sidebarWidth}
      />
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{ flexGrow: 1, bgcolor: "background.default", minHeight: "100vh", minWidth: 0 }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 }, maxWidth: 1600, mx: "auto" }}>
          <AnimatePresence mode="wait" initial={false}>
            <RouteTransition key={location.pathname}>
              <Outlet />
            </RouteTransition>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
