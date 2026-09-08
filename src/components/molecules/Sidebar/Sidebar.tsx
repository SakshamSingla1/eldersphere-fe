import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";

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
}

export const SIDEBAR_WIDTH = 248;

const Sidebar: React.FC<SidebarProps> = ({ navItems, roleLabel, mobileOpen = false, onMobileClose }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const content = (
    <>
      <Toolbar sx={{ gap: 1.25, py: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            flexShrink: 0,
          }}
        >
          <FavoriteIcon fontSize="small" />
        </Box>
        <Box minWidth={0}>
          {/* component="span": this is persistent chrome repeated on every authenticated
              page, not that page's content heading — kept out of the h1-h6 outline so
              each page's own <h1> (see Dashboard pages) is the first heading a screen
              reader encounters. */}
          <Typography variant="subtitle1" component="span" fontWeight={800} lineHeight={1.1} noWrap>
            ElderSphere
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {roleLabel}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.25, py: 1.5 }}>
        {navItems.map((item, idx) => {
          const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
          // A group heading renders once, right before the first item of that group —
          // i.e. whenever this item's group differs from the previous item's. The very
          // first group in the list gets no leading Divider (nothing above it to divide
          // from); every subsequent group gets a hairline + label so related items read as
          // one visual cluster instead of one long flat list.
          const showGroupHeading = Boolean(item.group) && item.group !== navItems[idx - 1]?.group;
          return (
            <React.Fragment key={item.path}>
              {showGroupHeading && (
                <>
                  {idx > 0 && <Divider sx={{ my: 1 }} />}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", px: 1.5, pt: idx > 0 ? 0.5 : 0, pb: 0.75, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}
                  >
                    {item.group}
                  </Typography>
                </>
              )}
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.end}
              disableRipple
              data-tour-nav={item.path}
              onClick={isMobile ? onMobileClose : undefined}
              sx={{
                position: "relative",
                borderRadius: "10px",
                mb: 0.5,
                minHeight: 46,
                color: isActive ? "primary.contrastText" : "text.secondary",
                fontWeight: isActive ? 700 : 500,
                zIndex: 0,
                overflow: "hidden",
                "&:hover": { backgroundColor: isActive ? null : "action.hover", color: isActive ? "primary.contrastText" : "text.primary" },
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
                    borderRadius: 10,
                    backgroundColor: theme.palette.primary.main,
                    zIndex: -1,
                  }}
                />
              )}
              <ListItemIcon sx={{ minWidth: 38, color: "inherit", "& svg": { fontSize: 21 } }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: "inherit" }} />
            </ListItemButton>
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

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: SIDEBAR_WIDTH, boxSizing: "border-box", borderRight: "1px solid", borderColor: "divider" },
      }}
    >
      {content}
    </Drawer>
  );
};

export default Sidebar;
