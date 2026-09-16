import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SubdirectoryArrowLeftIcon from "@mui/icons-material/SubdirectoryArrowLeft";
import TextField from "../../atoms/TextField/TextField";
import DialogTransition from "../../atoms/DialogTransition/DialogTransition";
import type { SidebarNavItem } from "../Sidebar/Sidebar";

export interface CommandPaletteProps {
  /** Same nav-item list the Sidebar renders for the current role — reused verbatim so the
   * palette can never drift out of sync with what a role can actually navigate to. */
  navItems: SidebarNavItem[];
  open: boolean;
  onClose: () => void;
}

// Cheap substring + subsequence "fuzzy" match — good enough for a short nav list (a dozen
// or so items per role) without pulling in a fuzzy-search dependency. Scores lower =
// better match; items that don't match at all are filtered out entirely.
function matchScore(label: string, query: string): number | null {
  const haystack = label.toLowerCase();
  const needle = query.toLowerCase();
  if (needle.length === 0) return 0;
  const idx = haystack.indexOf(needle);
  if (idx !== -1) return idx; // earlier substring match ranks higher
  // Subsequence fallback: every query character appears in order (not necessarily
  // contiguous) — e.g. "bkng" matches "Bookings".
  let hi = 0;
  for (let ni = 0; ni < needle.length; ni += 1) {
    const found = haystack.indexOf(needle[ni], hi);
    if (found === -1) return null;
    hi = found + 1;
  }
  return 1000 + haystack.length; // subsequence matches rank below substring matches
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ navItems, open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return navItems;
    return navItems
      .map((item) => ({ item, score: matchScore(item.label, query) }))
      .filter((r): r is { item: SidebarNavItem; score: number } => r.score !== null)
      .sort((a, b) => a.score - b.score)
      .map((r) => r.item);
  }, [navItems, query]);

  const close = () => {
    onClose();
    setQuery("");
    setActiveIndex(0);
  };

  const goTo = (path: string) => {
    navigate(path);
    close();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) goTo(target.path);
    }
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // DialogTransition (the app's framer-motion Dialog transition) only fires `onEnter`/
  // `onExited`, not react-transition-group's `onEntered` — so focus the search field
  // directly once `open` flips true rather than relying on a transition callback.
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={close}
      TransitionComponent={DialogTransition}
      maxWidth="sm"
      fullWidth
      // Anchors the palette near the top of the viewport (the classic Cmd+K feel) instead
      // of MUI's default vertically-centered dialog.
      sx={{ "& .MuiDialog-container": { alignItems: "flex-start" }, "& .MuiDialog-paper": { mt: { xs: 4, sm: 10 } } }}
    >
      <Box sx={{ p: 1.5 }}>
        <TextField
          inputRef={inputRef}
          autoFocus
          placeholder="Jump to a page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <List sx={{ maxHeight: 360, overflowY: "auto", px: 1, pb: 1 }}>
        {results.length === 0 ? (
          <Box px={2} py={3} textAlign="center">
            <Typography color="text.secondary" variant="body2">
              No matching pages.
            </Typography>
          </Box>
        ) : (
          results.map((item, idx) => (
            <ListItemButton
              key={item.path}
              selected={idx === activeIndex}
              onClick={() => goTo(item.path)}
              onMouseEnter={() => setActiveIndex(idx)}
              sx={{ borderRadius: "8px", mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, "& svg": { fontSize: 20 } }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
              {idx === activeIndex && <SubdirectoryArrowLeftIcon fontSize="small" color="action" />}
            </ListItemButton>
          ))
        )}
      </List>
    </Dialog>
  );
};

export default CommandPalette;
