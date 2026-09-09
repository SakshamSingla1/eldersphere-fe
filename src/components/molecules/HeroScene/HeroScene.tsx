import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

// The landing hero's single highest-effort visual: an illustrated "home and care" scene —
// a house, a tree, a caretaker sitting with an elder on the porch, warm light — built
// entirely from inline SVG (no external image/CDN dependency, no stock photography) so it
// always matches the live theme (forest green / terracotta, light/dark) with zero extra
// network cost. Composed as several independent layers, each with its own gentle idle
// drift (a leaf sway, a slow heartbeat pulse, floating warmth sparkles) *and* its own
// parallax depth, so moving the mouse over it on desktop makes the whole thing feel like a
// real dimensional diorama rather than a flat graphic.
//
// Parallax is intentionally contained: skipped entirely under prefers-reduced-motion, and
// never attached on touch devices (where there's no hover/pointer-move concept anyway —
// `pointer: fine` is the standard media-query test for "has a mouse-like precise
// pointer"). Idle per-layer drift still respects reduced motion too — every animate/style
// value below collapses to its resting position when either the media query fires or the
// app's own reducedMotion="user" MotionConfig (see main.tsx) is active.

interface Layer {
  depth: number; // parallax multiplier in px — larger = feels closer, moves more
}

const useParallaxLayer = (mouseX: ReturnType<typeof useSpring>, mouseY: ReturnType<typeof useSpring>, { depth }: Layer) => {
  const x = useTransform(mouseX, (v) => v * depth);
  const y = useTransform(mouseY, (v) => v * depth * 0.6);
  return { x, y };
};

const HeroScene: React.FC<{ size?: number }> = ({ size = 380 }) => {
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pointerFine] = useState(
    () => typeof window !== "undefined" && (window.matchMedia?.("(pointer: fine)").matches ?? false)
  );
  const parallaxEnabled = pointerFine && !prefersReducedMotion;

  // Raw -0.5..0.5 normalized offsets from the scene's own center, smoothed with a spring
  // so the parallax glides rather than snapping to the cursor every frame. Motion values
  // update imperatively on pointer move (no React re-render per mouse pixel).
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 120, damping: 20, mass: 0.4 });
  const mouseY = useSpring(rawY, { stiffness: 120, damping: 20, mass: 0.4 });

  useEffect(() => {
    if (!parallaxEnabled) return;
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      rawX.set((e.clientX - rect.left) / rect.width - 0.5);
      rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };
    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerleave", handleLeave);
    return () => {
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerleave", handleLeave);
    };
  }, [parallaxEnabled, rawX, rawY]);

  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;
  const accent = theme.palette.secondary.main;
  const accentLight = theme.palette.secondary.light;
  const paper = theme.palette.background.paper;
  const isLight = theme.palette.mode === "light";

  const glow = useParallaxLayer(mouseX, mouseY, { depth: 5 });
  const ground = useParallaxLayer(mouseX, mouseY, { depth: 7 });
  const house = useParallaxLayer(mouseX, mouseY, { depth: 11 });
  const tree = useParallaxLayer(mouseX, mouseY, { depth: 15 });
  const porch = useParallaxLayer(mouseX, mouseY, { depth: 19 });
  const sparkles = useParallaxLayer(mouseX, mouseY, { depth: 25 });

  // Idle keyframe loops are skipped outright under reduced motion rather than left running
  // at their normal amplitude — a "static but complete" scene, not a slowed one.
  const idle = (keyframes: Record<string, (number | string)[]>, duration: number, delay = 0) =>
    prefersReducedMotion ? null : { animate: keyframes, transition: { duration, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <Box
      ref={containerRef}
      sx={{ position: "relative", width: "100%", maxWidth: size, mx: "auto", aspectRatio: "1 / 0.86" }}
    >
      <svg viewBox="0 0 480 412" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        {/* Layer 1 — warmth glow + slowly rotating rays, farthest back, barely parallaxes */}
        <motion.g style={glow}>
          <motion.g {...idle({ rotate: [0, 360] }, 70)} style={{ transformOrigin: "372px 84px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={i}
                x="368"
                y="34"
                width="8"
                height="26"
                rx="4"
                fill={alpha(accent, isLight ? 0.16 : 0.22)}
                transform={`rotate(${i * 45} 372 84)`}
              />
            ))}
          </motion.g>
          <circle cx="372" cy="84" r="46" fill={alpha(accent, isLight ? 0.16 : 0.2)} />
          <circle cx="372" cy="84" r="30" fill={alpha(accent, isLight ? 0.24 : 0.3)} />
        </motion.g>

        {/* Layer 2 — the ground the whole scene sits on */}
        <motion.g style={ground}>
          <path
            d="M0 320c60-22 120-8 170 2 66 13 118-14 180-10 56 3 98 24 130 16v90H0Z"
            fill={alpha(primary, isLight ? 0.1 : 0.18)}
          />
        </motion.g>

        {/* Layer 3 — the house: gable roof, warmly-lit window, door */}
        <motion.g style={house}>
          <motion.g {...idle({ y: [0, -4, 0] }, 6.5)}>
            <path d="M120 210 235 130 350 210Z" fill={primaryDark} />
            <rect x="140" y="205" width="190" height="115" rx="6" fill={paper} stroke={primary} strokeWidth="3" />
            {/* window — a soft pulsing glow, standing in for a warmly lit home */}
            <motion.rect
              x="290"
              y="228"
              width="26"
              height="26"
              rx="4"
              fill={alpha(accent, 0.5)}
              stroke={accent}
              strokeWidth="2.5"
              {...idle({ opacity: [0.55, 1, 0.55] }, 3.2)}
            />
            <path d="M290 241h26M303 228v26" stroke={accent} strokeWidth="2" />
            {/* door */}
            <rect x="155" y="256" width="34" height="64" rx="4" fill={alpha(primary, 0.16)} stroke={primary} strokeWidth="2.5" />
            <circle cx="180" cy="290" r="2.2" fill={primary} />
            <rect x="210" y="270" width="18" height="18" rx="3" fill={alpha(primary, 0.12)} stroke={primary} strokeWidth="2" />
          </motion.g>
        </motion.g>

        {/* Layer 4 — a tree beside the house, foliage swaying gently */}
        <motion.g style={tree}>
          <rect x="60" y="250" width="12" height="60" rx="4" fill={primaryDark} />
          <motion.g {...idle({ x: [0, 4, 0], rotate: [0, 1.5, 0] }, 5)} style={{ transformOrigin: "66px 230px" }}>
            <circle cx="66" cy="215" r="34" fill={alpha(primary, isLight ? 0.35 : 0.45)} />
            <circle cx="40" cy="235" r="24" fill={alpha(primary, isLight ? 0.28 : 0.38)} />
            <circle cx="92" cy="235" r="24" fill={alpha(primary, isLight ? 0.28 : 0.38)} />
          </motion.g>
        </motion.g>

        {/* Layer 5 — the porch: caretaker seated beside the elder, a small heart between
            them beating gently. The genuine emotional center of the whole scene. */}
        <motion.g style={porch}>
          <motion.g {...idle({ y: [0, -3, 0] }, 4.4)}>
            {/* bench */}
            <rect x="150" y="312" width="150" height="10" rx="4" fill={alpha(primaryDark, 0.7)} />
            <rect x="158" y="322" width="8" height="18" fill={alpha(primaryDark, 0.7)} />
            <rect x="284" y="322" width="8" height="18" fill={alpha(primaryDark, 0.7)} />

            {/* elder figure, sitting */}
            <circle cx="196" cy="272" r="15" fill={accentLight} />
            <path d="M172 312v-20c0-13 11-22 24-22s24 9 24 22v20Z" fill={accent} />

            {/* caretaker figure, sitting closer, slightly taller */}
            <circle cx="252" cy="264" r="16" fill={theme.palette.mode === "light" ? "#F0DFC8" : "#E7CBA6"} />
            <path d="M226 312v-24c0-14 12-24 26-24s26 10 26 24v24Z" fill={primary} />

            {/* a small heart floating right where their hands would meet — the
                "warmth/care" focal motif, on its own faster heartbeat-like pulse */}
            <motion.path
              d="M224 288c-3-3.6-9-2.3-9 2.5 0 3.6 4.3 6.7 9 10.5 4.7-3.8 9-6.9 9-10.5 0-4.8-6-6.1-9-2.5Z"
              fill={theme.palette.error.main}
              {...idle({ scale: [1, 1.18, 1] }, 1.7)}
              style={{ transformOrigin: "224px 293px" }}
            />
          </motion.g>
        </motion.g>

        {/* Layer 6 — foreground floating warmth sparkles, closest layer, moves the most
            with the cursor and drifts upward independently, looping. */}
        <motion.g style={sparkles}>
          {[
            { x: 100, y: 120, r: 3.4, delay: 0 },
            { x: 400, y: 200, r: 2.6, delay: 0.9 },
            { x: 360, y: 300, r: 3, delay: 1.7 },
            { x: 60, y: 190, r: 2.2, delay: 0.5 },
          ].map((s, i) => (
            <motion.circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={alpha(accent, 0.6)}
              {...idle({ y: [0, -14, 0], opacity: [0.15, 0.75, 0.15] }, 5.5, s.delay)}
            />
          ))}
        </motion.g>
      </svg>
    </Box>
  );
};

export default HeroScene;
