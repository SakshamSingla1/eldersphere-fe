import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Tooltip, IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  end?: boolean;
  /**
   * Optional section label (e.g. "Overview", "Care Operations") — items sharing the same
   * `group` are rendered together under one small heading + divider, in array order. Items
   * with no `group` render exactly as before (flat, no heading), so this is opt-in per
   * role — only roles with enough nav items to feel like a "wall of text" (Admin) use it.
   */
  group?: string;
}

export interface SidebarProps {
  navItems: SidebarNavItem[];
  roleLabel: string;
  /** Controlled open state for the mobile (temporary) drawer variant. Ignored on desktop. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /**
   * Desktop-only icon-rail mode — the mobile (temporary) drawer always renders full-width
   * regardless of this prop, since a phone-width overlay has no "docked rail" affordance to
   * collapse to. Presence of `onToggleCollapse` is what actually renders the collapse
   * toggle; `collapsed` alone with no toggle would strand the user with no way back.
   */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SIDEBAR_WIDTH = 248;
/** Width of the desktop rail once collapsed — wide enough for a centered 24px icon plus its
 *  hit target, narrow enough to read as "minimized" rather than a second full drawer. */
export const SIDEBAR_WIDTH_COLLAPSED = 84;

const Sidebar: React.FC<SidebarProps> = ({ navItems, roleLabel, mobileOpen = false, onMobileClose, collapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  // Mobile's temporary drawer never collapses (see SidebarProps doc above) — everything
  // downstream reads `rail`, not the raw `collapsed` prop, so it can't do so by accident.
  const rail = collapsed && !isMobile;

  const widthTransition = theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.shorter,
  });

  const content = (
    <>
      <Toolbar sx={{ gap: 1.25, py: 2.25, px: rail ? 1.5 : 2.5, justifyContent: rail ? "center" : "flex-start" }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: `0 4px 12px ${theme.palette.mode === "light" ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.4)"}`,
            flexShrink: 0,
          }}
        >
          <FavoriteIcon fontSize="small" />
        </Box>
        {!rail && (
          <Box minWidth={0}>
            {/* component="span": this is persistent chrome repeated on every authenticated
                page, not that page's content heading — kept out of the h1-h6 outline so
                each page's own <h1> (see Dashboard pages) is the first heading a screen
                reader encounters. */}
            <Typography variant="subtitle1" component="span" fontWeight={800} lineHeight={1.1} noWrap>
              ElderSphere
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {roleLabel}
            </Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: rail ? 1 : 1.5, py: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {navItems.map((item, idx) => {
          const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
          // A group heading renders once, right before the first item of that group —
          // i.e. whenever this item's group differs from the previous item's. The very
          // first group in the list gets no leading Divider (nothing above it to divide
          // from); every subsequent group gets a hairline + label so related items read as
          // one visual cluster instead of one long flat list. Collapsed to just the hairline
          // (no label — there's no room to write one legibly) once the rail is collapsed.
          const showGroupHeading = Boolean(item.group) && item.group !== navItems[idx - 1]?.group;
          const button = (
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.end}
              disableRipple
              data-tour-nav={item.path}
              onClick={isMobile ? onMobileClose : undefined}
              sx={{
                position: "relative",
                borderRadius: "12px",
                minHeight: 46,
                justifyContent: rail ? "center" : "flex-start",
                px: rail ? 1 : 1.75,
                color: isActive ? "primary.contrastText" : "text.secondary",
                fontWeight: isActive ? 700 : 500,
                zIndex: 0,
                overflow: "hidden",
                transition: "color 0.15s ease, transform 0.15s ease",
                "&:hover": {
                  backgroundColor: isActive ? null : "action.hover",
                  color: isActive ? "primary.contrastText" : "text.primary",
                  transform: rail ? "none" : "translateX(2px)",
                },
                "& .MuiListItemIcon-root": { color: isActive ? "primary.contrastText" : "inherit" },
              }}
            >
              {isActive && (
                // Sliding highlight — shares a layoutId across every nav item, so
                // framer-motion animates it moving between positions on navigation
                // instead of the old instant background-color swap. Automatically
                // collapses to an instant snap for prefers-reduced-motion users via the
                // app-wide <MotionConfig reducedMotion="user"> in main.tsx.
                <motion.div
                  layoutId="sidebar-active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 12,
                    backgroundColor: theme.palette.primary.main,
                    zIndex: -1,
                  }}
                />
              )}
              <ListItemIcon sx={{ minWidth: rail ? "auto" : 38, color: "inherit", "& svg": { fontSize: 21 } }}>{item.icon}</ListItemIcon>
              {!rail && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: "inherit" }} />}
            </ListItemButton>
          );
          return (
            <React.Fragment key={item.path}>
              {showGroupHeading &&
                (rail ? (
                  idx > 0 && <Divider sx={{ my: 0.75, mx: 1 }} />
                ) : (
                  <>
                    {idx > 0 && <Divider sx={{ my: 1 }} />}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", px: 1.75, pt: idx > 0 ? 0.5 : 0, pb: 0.75, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}
                    >
                      {item.group}
                    </Typography>
                  </>
                ))}
              {rail ? (
                <Tooltip title={item.label} placement="right" arrow>
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </React.Fragment>
          );
        })}
      </List>
    </>
  );

  // Below the `md` breakpoint the sidebar becomes a hamburger-triggered temporary drawer
  // (overlay + backdrop, closes on nav or backdrop click) instead of a permanently docked
  // rail that would otherwise squeeze the whole layout on a phone-width screen.
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          [`& .MuiDrawer-paper`]: { width: SIDEBAR_WIDTH, boxSizing: "border-box" },
        }}
      >
        {content}
      </Drawer>
    );
  }

  const width = rail ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <Box sx={{ position: "relative", flexShrink: 0, width, transition: widthTransition }}>
      <Drawer
        variant="permanent"
        sx={{
          width,
          flexShrink: 0,
          transition: widthTransition,
          [`& .MuiDrawer-paper`]: {
            width,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            overflowX: "hidden",
            transition: widthTransition,
          },
        }}
      >
        {content}
      </Drawer>
      {onToggleCollapse && (
        // Floating edge tab, half on/half off the drawer's border — the same affordance
        // pattern as Notion/Linear/VS Code's sidebar collapse control, so it reads as
        // familiar rather than a bespoke toggle the user has to discover. `left` tracks the
        // drawer's own width transition so the two animate in lockstep instead of the
        // button jumping to its new spot after the drawer finishes resizing.
        <Tooltip title={rail ? "Expand sidebar" : "Collapse sidebar"} placement="right">
          <IconButton
            onClick={onToggleCollapse}
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            size="small"
            sx={{
              position: "fixed",
              top: 84,
              left: width - 14,
              zIndex: (t) => t.zIndex.drawer + 1,
              width: 28,
              height: 28,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: theme.shadows[4],
              transition: `left 0.2s ${theme.transitions.easing.sharp}, background-color 0.15s ease, border-color 0.15s ease`,
              "&:hover": { bgcolor: "action.hover", borderColor: "primary.main" },
            }}
          >
            {rail ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default Sidebar;
