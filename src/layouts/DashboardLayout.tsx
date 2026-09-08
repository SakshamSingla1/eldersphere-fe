import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import Sidebar, { type SidebarNavItem } from "../components/molecules/Sidebar/Sidebar";
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
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ navItems, roleLabel, settingsPath }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <CommandPalette navItems={navItems} />
      <Sidebar
        navItems={navItems}
        roleLabel={roleLabel}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Topbar settingsPath={settingsPath} onMenuClick={() => setMobileOpen(true)} />
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{ flexGrow: 1, bgcolor: "background.default", minHeight: "100vh", minWidth: 0 }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
