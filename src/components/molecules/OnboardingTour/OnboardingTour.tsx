import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../atoms/Button/Button";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import type { SidebarNavItem } from "../Sidebar/Sidebar";

export interface OnboardingTourProps {
  roleLabel: string;
  navItems: SidebarNavItem[];
}

interface TourStepDef {
  key: string;
  selector: string;
  title: string;
  description: string;
}

// Per-role "most relevant nav item" to spotlight — mirrors what a brand-new user of that
// role would most want to find first. Falls back gracefully (step is simply skipped) for
// any role label not listed here, so this never breaks if a role is renamed/added later.
const ROLE_NAV_HIGHLIGHT: Record<string, { path: string; blurb: string }> = {
  Family: { path: "/family/caretakers", blurb: "Search verified, background-checked caretakers and book care for the people you look after." },
  Caretaker: { path: "/caretaker/bookings", blurb: "Every family booking — upcoming, in progress or completed — lives here." },
  Elder: { path: "/elder/bookings", blurb: "See your upcoming visits and care appointments at a glance." },
  Admin: { path: "/admin/analytics", blurb: "Track platform trends — bookings, revenue and top-rated caretakers over time." },
  "Super Admin": { path: "/admin/analytics", blurb: "Track platform trends — bookings, revenue and top-rated caretakers over time." },
};

const STORAGE_PREFIX = "eldersphere_onboarding_seen_";
const CARD_WIDTH = 320;
const SPOTLIGHT_PADDING = 8;

// Polls for the target element (dashboard data — and therefore #dashboard-stat-cards —
// loads asynchronously after mount) and keeps its rect fresh across resize/scroll so the
// spotlight tracks it. Gives up after ~4s so a step whose target never appears (e.g. the
// user navigated away mid-tour) degrades to a centered, un-highlighted tooltip rather than
// hanging forever.
function useTargetRect(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setRect(null);
    if (!selector) return;
    let cancelled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(selector);
      if (el) {
        setRect(el.getBoundingClientRect());
        return;
      }
      attempts += 1;
      if (attempts < 40) {
        timeoutId = setTimeout(measure, 100);
      }
    };
    measure();

    const onReposition = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [selector]);

  return rect;
}

// Lightweight, dependency-free (MUI + framer-motion only, both already installed) 3-step
// guided tour shown once per user on their first authenticated page load — spotlighting
// the dashboard stat cards, the nav item most relevant to their role, and the notification
// bell. "Seen" state is a localStorage flag keyed by user id, so it never repeats for that
// user but does show again for a different account signing in on the same browser.
//
// Deliberately non-modal: it dims the page and draws a spotlight ring around the current
// target, but never traps focus or blocks clicks outside its own card — a user who clicks
// away (e.g. straight onto the highlighted nav item) simply navigates normally. Motion is
// all framer-motion `motion.*`, so the app-wide `MotionConfig reducedMotion="user"` (see
// main.tsx) automatically collapses it to instant fades for prefers-reduced-motion users.
const OnboardingTour: React.FC<OnboardingTourProps> = ({ roleLabel, navItems }) => {
  const theme = useTheme();
  const { user } = useAuthenticatedUser();
  const [dismissed, setDismissed] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const highlight = ROLE_NAV_HIGHLIGHT[roleLabel];
  const navLabel = navItems.find((n) => n.path === highlight?.path)?.label ?? "this section";

  const steps: TourStepDef[] = useMemo(() => {
    const list: TourStepDef[] = [
      {
        key: "stats",
        selector: "#dashboard-stat-cards",
        title: "Your dashboard at a glance",
        description: "These cards summarize what matters most right now and stay current automatically — no need to refresh.",
      },
    ];
    if (highlight) {
      list.push({
        key: "nav",
        selector: `[data-tour-nav="${highlight.path}"]`,
        title: navLabel,
        description: highlight.blurb,
      });
    }
    list.push({
      key: "bell",
      selector: "#notification-bell-button",
      title: "Stay in the loop",
      description: "New bookings, messages and alerts land here first — check back whenever the badge lights up.",
    });
    return list;
  }, [highlight, navLabel]);

  // Decide once per signed-in user whether the tour should run at all.
  useEffect(() => {
    if (!user) {
      setDismissed(true);
      return;
    }
    let seen = true;
    try {
      seen = localStorage.getItem(`${STORAGE_PREFIX}${user.id}`) === "true";
    } catch {
      seen = true; // storage unavailable/blocked — fail safe by not showing rather than erroring
    }
    setStepIndex(0);
    setDismissed(seen);
  }, [user]);

  const finish = useCallback(() => {
    if (user) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${user.id}`, "true");
      } catch {
        // best-effort only — worst case the tour reappears next session, which is harmless
      }
    }
    setDismissed(true);
  }, [user]);

  const active = !dismissed && Boolean(user);
  const currentStep = active ? steps[stepIndex] : null;
  const rect = useTargetRect(currentStep?.selector ?? null);

  // Move focus onto the tour card whenever a new step appears, and let Escape dismiss it
  // — keyboard/screen-reader users get an explicit, discoverable entry point and exit
  // instead of the tour silently intercepting nothing and going unnoticed.
  useEffect(() => {
    if (!currentStep) return;
    const id = requestAnimationFrame(() => cardRef.current?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [currentStep, finish]);

  if (!currentStep) return null;

  const isLast = stepIndex === steps.length - 1;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1280;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;

  const spotlightRect = rect
    ? {
        top: rect.top - SPOTLIGHT_PADDING,
        left: rect.left - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  // Auto-placement: prefer below the target, flip above if there isn't room; clamp
  // horizontally so the card never runs off either edge of the viewport.
  const cardStyle: React.CSSProperties = spotlightRect
    ? {
        position: "fixed",
        left: Math.min(Math.max(spotlightRect.left, 16), viewportW - CARD_WIDTH - 16),
        top:
          spotlightRect.top + spotlightRect.height + 220 < viewportH
            ? spotlightRect.top + spotlightRect.height + 16
            : Math.max(spotlightRect.top - 220, 16),
        width: CARD_WIDTH,
      }
    : {
        position: "fixed",
        left: "50%",
        top: "50%",
        width: CARD_WIDTH,
        transform: "translate(-50%, -50%)",
      };

  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: theme.zIndex.tooltip + 10, pointerEvents: "none" }}>
      {/* Dimmed backdrop with a cut-out "spotlight" around the current target, drawn via a
          single oversized box-shadow rather than a separate full-screen scrim element. */}
      <AnimatePresence>
        {spotlightRect ? (
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{
              position: "fixed",
              borderRadius: 14,
              border: `2px solid ${theme.palette.primary.main}`,
              boxShadow: `0 0 0 4000px ${theme.palette.mode === "light" ? "rgba(20,16,12,0.55)" : "rgba(0,0,0,0.7)"}`,
              pointerEvents: "none",
            }}
          />
        ) : (
          <motion.div
            key="no-spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: theme.palette.mode === "light" ? "rgba(20,16,12,0.55)" : "rgba(0,0,0,0.7)",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ ...cardStyle, pointerEvents: "auto" }}
        >
          <Paper
            ref={cardRef}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="onboarding-tour-title"
            aria-describedby="onboarding-tour-description"
            elevation={8}
            sx={{ p: 2.5, borderRadius: "16px", outline: "none" }}
          >
            <Typography id="onboarding-tour-title" variant="subtitle1" fontWeight={800} gutterBottom>
              {currentStep.title}
            </Typography>
            <Typography id="onboarding-tour-description" variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {currentStep.description}
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={0.75} aria-hidden="true">
                {steps.map((s, idx) => (
                  <Box
                    key={s.key}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: idx === stepIndex ? "primary.main" : "action.disabledBackground",
                    }}
                  />
                ))}
              </Stack>
              <Typography
                component="span"
                sx={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clip: "rect(0 0 0 0)",
                  whiteSpace: "nowrap",
                }}
              >
                Step {stepIndex + 1} of {steps.length}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="text" size="small" onClick={finish}>
                  Skip
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
                >
                  {isLast ? "Finish" : "Next"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default OnboardingTour;
