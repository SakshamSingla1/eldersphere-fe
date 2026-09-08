import React from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export interface IllustrationProps {
  size?: number;
}

// Shared gentle "float/breathe" idle loop for the handful of illustrations rich enough to
// earn one (the most-seen empty states + 404) — a slow, tiny rise-and-fall so the whole
// scene reads as quietly alive rather than a static graphic, without becoming busy. Pure
// CSS (like the Landing hero's blob backgrounds) rather than framer-motion, since these are
// plain SVG-returning components with no other motion dependencies — and explicitly
// disabled under prefers-reduced-motion rather than merely slowed, consistent with every
// other decorative-only animation in the app.
let floatIdCounter = 0;
const IllustrationFloat: React.FC<{ children: React.ReactNode; duration?: number }> = ({ children, duration = 5 }) => {
  const animationName = React.useRef(`es-illustration-float-${floatIdCounter++}`).current;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        animation: `${animationName} ${duration}s ease-in-out infinite`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        [`@keyframes ${animationName}`]: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      }}
    >
      {children}
    </Box>
  );
};

// Shared "soft blob backdrop + simple line-art mark" recipe behind every illustration
// below — an organic rounded backdrop (never a plain circle) tinted from the current
// theme's primary/accent colors, so every illustration reads as one warm, on-brand family
// and adapts automatically to dark mode instead of using fixed hex values. Replaces the
// old generic "icon in a circle" EmptyState pattern for the handful of empty states/404
// common enough to earn a bit more visual craft.
const Backdrop: React.FC<{ fill: string }> = ({ fill }) => (
  <path
    d="M100 18c26 0 41 17 52 36 11 19 20 40 10 60-10 21-36 26-58 30-23 4-49 4-63-14-14-17-13-45-4-67 9-21 27-45 63-45Z"
    fill={fill}
  />
);

// No bookings yet — a simple line-art calendar page with a small "+" where a booking
// would go, echoing the "add a booking" action nearby without duplicating its icon.
export const NoBookingsIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const accent = theme.palette.secondary.main;
  return (
    <IllustrationFloat duration={5}>
      <svg width={size} height={size} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <Backdrop fill={alpha(primary, theme.palette.mode === "light" ? 0.1 : 0.16)} />
        {/* A second, smaller calendar page peeking out behind the main one — reads as "a
            stack of days", not just one lone card, without adding real visual noise. */}
        <rect x="66" y="42" width="72" height="66" rx="9" fill={alpha(primary, 0.14)} transform="rotate(-4 66 42)" />
        <rect x="58" y="48" width="84" height="76" rx="10" fill={theme.palette.background.paper} stroke={primary} strokeWidth="3" />
        <path d="M58 68h84" stroke={primary} strokeWidth="3" strokeLinecap="round" />
        <path d="M78 40v16M122 40v16" stroke={primary} strokeWidth="3" strokeLinecap="round" />
        {/* A faint week-grid of dots below the header bar, hinting at empty days waiting
            to be filled rather than a totally bare card. */}
        <circle cx="74" cy="82" r="2.5" fill={alpha(primary, 0.3)} />
        <circle cx="88" cy="82" r="2.5" fill={alpha(primary, 0.3)} />
        <circle cx="112" cy="82" r="2.5" fill={alpha(primary, 0.3)} />
        <circle cx="126" cy="82" r="2.5" fill={alpha(primary, 0.3)} />
        <circle cx="74" cy="112" r="2.5" fill={alpha(primary, 0.3)} />
        <circle cx="126" cy="112" r="2.5" fill={alpha(primary, 0.3)} />
        <circle cx="100" cy="96" r="16" fill={alpha(accent, 0.16)} stroke={accent} strokeWidth="3" />
        <path d="M100 89v14M93 96h14" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        {/* A tiny warmth sparkle above the "+" — the same small accent used across the
            richer illustrations to tie "empty, but full of care ahead" together. */}
        <path d="M136 44l2.4 5.3 5.3 2.4-5.3 2.4-2.4 5.3-2.4-5.3-5.3-2.4 5.3-2.4Z" fill={alpha(accent, 0.55)} />
      </svg>
    </IllustrationFloat>
  );
};

// No messages — an open speech bubble with a few soft dots (mid-conversation), rather than
// a literal chat-app icon.
export const NoMessagesIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const accent = theme.palette.secondary.main;
  return (
    <IllustrationFloat duration={5.5}>
      <svg width={size} height={size} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <Backdrop fill={alpha(accent, theme.palette.mode === "light" ? 0.1 : 0.16)} />
        {/* A small second bubble tucked behind, as if someone's about to reply — turns
            one lone speech bubble into the start of a conversation. */}
        <path
          d="M118 100c0-6 5-11 11-11h28c6 0 11 5 11 11v18c0 6-5 11-11 11h-6l2 12-14-12h-10c-6 0-11-5-11-11v-18Z"
          fill={alpha(primary, 0.14)}
        />
        <path
          d="M52 54c0-9 7-16 16-16h64c9 0 16 7 16 16v38c0 9-7 16-16 16H92l-22 18v-18h-2c-9 0-16-7-16-16V54Z"
          fill={theme.palette.background.paper}
          stroke={primary}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="84" cy="72" r="5" fill={primary} />
        <circle cx="104" cy="72" r="5" fill={primary} />
        <circle cx="124" cy="72" r="5" fill={alpha(primary, 0.4)} />
        {/* A small heart drifting above the bubble — the same warmth motif used
            throughout the app's branding, quietly tying "messages" to "care". */}
        <path
          d="M60 34c-2.5-3-7.5-2-7.5 2.2 0 3 3.6 5.6 7.5 8.8 3.9-3.2 7.5-5.8 7.5-8.8 0-4.2-5-5.2-7.5-2.2Z"
          fill={alpha(accent, 0.55)}
        />
      </svg>
    </IllustrationFloat>
  );
};

// No medical records — a simple folder outline with a heartbeat/pulse line, tying the
// generic "no documents" shape to elder-care specifically without a literal clipboard icon.
export const NoRecordsIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const accent = theme.palette.secondary.main;
  return (
    <svg width={size} height={size} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <Backdrop fill={alpha(primary, theme.palette.mode === "light" ? 0.1 : 0.16)} />
      <path
        d="M48 58c0-6 5-11 11-11h26l10 12h46c6 0 11 5 11 11v40c0 6-5 11-11 11H59c-6 0-11-5-11-11V58Z"
        fill={theme.palette.background.paper}
        stroke={primary}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M62 92h16l8-14 10 24 8-16h20"
        fill="none"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// No search results — a magnifying glass over an empty field, with a small "×" instead of
// a checkmark/dot to read clearly as "nothing found" rather than "loading".
export const NoSearchResultsIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const accent = theme.palette.secondary.main;
  return (
    <svg width={size} height={size} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <Backdrop fill={alpha(primary, theme.palette.mode === "light" ? 0.1 : 0.16)} />
      <circle cx="90" cy="76" r="30" fill={theme.palette.background.paper} stroke={primary} strokeWidth="3" />
      <path d="M112 98l24 24" stroke={primary} strokeWidth="6" strokeLinecap="round" />
      <path d="M79 65l22 22M101 65l-22 22" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};

// Unexpected render error — a gently cracked heart with a small bandage/plaster over the
// crack, keeping the "something's not quite right, but it's being cared for" tone of the
// rest of the app's illustrations instead of a jarring error glyph (no red X, no bug icon).
export const SomethingWentWrongIllustration: React.FC<IllustrationProps> = ({ size = 140 }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const accent = theme.palette.secondary.main;
  return (
    <svg width={size} height={size} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <Backdrop fill={alpha(primary, theme.palette.mode === "light" ? 0.1 : 0.16)} />
      <path
        d="M100 116 74 92c-12-11-12-29 0-40 11-10 27-9 37 2 10-11 26-12 37-2 12 11 12 29 0 40Z"
        fill={theme.palette.background.paper}
        stroke={primary}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M104 62 94 80l14 6-10 18" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="70" y="86" width="30" height="14" rx="4" fill={alpha(accent, 0.22)} stroke={accent} strokeWidth="2.5" transform="rotate(-18 70 86)" />
    </svg>
  );
};

// 404 — a signpost with a bent/broken arrow, standing in for "this path doesn't lead
// anywhere" more warmly than a bare "page not found" glyph.
export const NotFoundIllustration: React.FC<IllustrationProps> = ({ size = 140 }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const accent = theme.palette.secondary.main;
  return (
    <IllustrationFloat duration={6}>
      <svg width={size} height={size} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <Backdrop fill={alpha(primary, theme.palette.mode === "light" ? 0.1 : 0.16)} />
        {/* A small winding dotted path leading up to the post's base — "the trail that
            led here", reinforcing the signpost metaphor a little further. */}
        <path
          d="M40 140c14-4 22-14 34-16s20 8 34 4 18-16 32-14"
          stroke={alpha(primary, 0.35)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 9"
        />
        <path d="M100 34v92" stroke={primary} strokeWidth="4" strokeLinecap="round" />
        <path
          d="M100 52h38l-8 12 8 12h-38Z"
          fill={alpha(accent, 0.18)}
          stroke={accent}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M100 70H66l6-10-6-10h34Z"
          fill={theme.palette.background.paper}
          stroke={primary}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Two small "?" specks drifting near the bent arrow tip — a light touch of
            "where did this path go" without adding a literal question-mark glyph. */}
        <circle cx="148" cy="42" r="3" fill={alpha(accent, 0.5)} />
        <circle cx="158" cy="54" r="2" fill={alpha(accent, 0.35)} />
        <path d="M84 126h32" stroke={primary} strokeWidth="4" strokeLinecap="round" />
      </svg>
    </IllustrationFloat>
  );
};
