import { useCallback, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useSnackbar } from "../contexts/SnackbarContext";

/**
 * Returns a `celebrate(message)` function for the app's brief, tasteful milestone
 * celebrations (first booking ever, Getting Started checklist complete, newly verified —
 * see utils/celebrations.ts for the "has this already happened" gating). Fires a short
 * warm-colored confetti burst (~1.8s) alongside the usual success snackbar.
 *
 * `canvas-confetti` is loaded via a dynamic import so it never touches the main bundle —
 * it's fetched (and cached) only the first time a real celebration actually fires, as its
 * own on-demand chunk.
 *
 * Respects prefers-reduced-motion: skips the confetti entirely and just shows a warm,
 * still success message instead (no motion substitute, per the brief).
 */
export function useCelebration() {
  const prefersReducedMotion = useReducedMotion();
  const { showSnackbar } = useSnackbar();
  // Guards against overlapping bursts if two milestones were somehow triggered back to
  // back — lets the in-flight animation finish rather than stacking confetti calls.
  const activeRef = useRef(false);

  return useCallback(
    (message: string) => {
      showSnackbar("success", message, 5500);

      if (prefersReducedMotion || activeRef.current) return;
      activeRef.current = true;

      import("canvas-confetti")
        .then(({ default: confetti }) => {
          const colors = ["#2F6F5E", "#E0875A", "#E8A33D", "#FAF7F2"];
          const durationMs = 1800;
          const end = Date.now() + durationMs;

          const frame = () => {
            confetti({ particleCount: 3, startVelocity: 38, spread: 65, angle: 60, origin: { x: 0, y: 0.75 }, colors, scalar: 0.9 });
            confetti({ particleCount: 3, startVelocity: 38, spread: 65, angle: 120, origin: { x: 1, y: 0.75 }, colors, scalar: 0.9 });
            if (Date.now() < end) {
              requestAnimationFrame(frame);
            } else {
              activeRef.current = false;
            }
          };
          frame();
        })
        .catch(() => {
          // Confetti is pure delight, never load-bearing — a failed dynamic import (e.g.
          // offline) just means the snackbar above is the whole celebration.
          activeRef.current = false;
        });
    },
    [prefersReducedMotion, showSnackbar]
  );
}

export default useCelebration;
