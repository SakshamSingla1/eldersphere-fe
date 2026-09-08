import { createTheme, alpha, type Theme } from "@mui/material/styles";

export type ThemeModeName = "light" | "dark";

// ElderSphere brand palette — "warm & trustworthy". The forest-green primary is kept
// (it's already in the logo/CTAs); a warm terracotta secondary/accent is layered on top
// for badges, secondary CTAs and the emergency button. These brand hues stay constant
// across light and dark mode — only the surrounding surfaces/text/neutrals shift — so the
// product still reads as "ElderSphere" no matter which mode is active.
const brand = {
  danger: "#C0392B",
  success: "#2E8B57",
  warning: "#E8A33D",
  info: "#3178C6",
};

// Light-mode brand + neutral ramp (unchanged from the first design pass).
export const palette = {
  primary: "#2F6F5E",
  primaryDark: "#1F4F42",
  primaryLight: "#5C9C89",
  accent: "#E0875A",
  // Was #C36B41 — at the dark end of the accent button gradient, the near-black text MUI
  // picks for it (secondary.contrastText, below) only reached ~4.3:1, short of WCAG AA's
  // 4.5:1 for normal-weight text. Lightened just enough to clear 4.5:1 across the whole
  // gradient without changing the brand hue.
  accentDark: "#C97748",
  accentLight: "#EBAD8B",
  neutral900: "#241F1A",
  neutral700: "#4A423C",
  // Was #7A716A — read 4.47:1 against the app background (#FAF7F2), just under WCAG AA's
  // 4.5:1 for normal text. text.secondary is used everywhere (card subtitles, empty-state
  // descriptions, table meta text) so this small darkening buys real margin (5.0-5.4:1).
  neutral500: "#726960",
  neutral300: "#E6DFD3",
  neutral100: "#FAF7F2",
  neutral0: "#FFFFFF",
  danger: brand.danger,
  success: brand.success,
  warning: brand.warning,
  info: brand.info,
};

// Dark-mode ramp — not a naive invert. Surfaces are a warm near-black (a hint of green,
// not cool blue-gray) so the brand still feels "ElderSphere" at night; primary/accent are
// lightened a touch so they keep AA contrast on dark surfaces without turning neon.
const darkPalette = {
  primary: "#4FA085",
  primaryDark: "#2F6F5E",
  primaryLight: "#7FC1AA",
  accent: "#E79A6E",
  accentDark: "#C97748", // kept in sync with the light-mode fix above
  accentLight: "#F0BB98",
  neutral900: "#F3EFE8", // brightest text
  neutral700: "#D8D2C7", // secondary text
  neutral500: "#9B968D", // muted secondary text
  neutral300: "#3A3D37", // borders/dividers on dark surfaces
  neutral100: "#14181A", // app background
  neutral0: "#1D2320", // paper / card surfaces
  danger: "#E5695A",
  success: "#4FA97A",
  warning: "#EFB463",
  info: "#5B9BE0",
};

type PaletteShape = typeof palette;

// Soft, warm-tinted shadows (low opacity, large blur, brown/black tint instead of pure
// black) used across the whole `shadows` scale so every elevated surface (menus,
// dialogs, popovers, drawers) picks up the same gentle depth. Dark mode reuses the same
// curve but leans on a pure-black tint at slightly higher opacity, since a warm-brown
// shadow barely reads against an already-dark surface.
const buildShadows = (mode: ThemeModeName): Theme["shadows"] => {
  const shadowRgb = mode === "light" ? "36, 31, 26" : "0, 0, 0";
  const opacityScale = mode === "light" ? 1 : 1.6;
  const softShadow = (y: number, blur: number, spread: number, opacity: number) =>
    `0 ${y}px ${blur}px ${spread}px rgba(${shadowRgb}, ${Math.min(opacity * opacityScale, 0.6)})`;

  return [
    "none",
    softShadow(1, 3, 0, 0.05),
    softShadow(2, 6, 0, 0.05),
    softShadow(3, 8, 0, 0.06),
    softShadow(4, 10, 0, 0.06),
    softShadow(5, 12, 0, 0.06),
    softShadow(6, 14, 0, 0.07),
    softShadow(7, 16, 0, 0.07),
    softShadow(8, 18, 0, 0.07),
    softShadow(9, 20, -1, 0.07),
    softShadow(10, 22, -1, 0.07),
    softShadow(11, 24, -1, 0.08),
    softShadow(12, 26, -1, 0.08),
    softShadow(13, 28, -1, 0.08),
    softShadow(14, 30, -1, 0.08),
    softShadow(15, 32, -1, 0.08),
    softShadow(16, 34, -2, 0.09),
    softShadow(17, 36, -2, 0.09),
    softShadow(18, 38, -2, 0.09),
    softShadow(19, 40, -2, 0.09),
    softShadow(20, 42, -2, 0.1),
    softShadow(21, 44, -2, 0.1),
    softShadow(22, 46, -2, 0.1),
    softShadow(23, 48, -2, 0.1),
    softShadow(24, 50, -2, 0.11),
  ] as unknown as Theme["shadows"];
};

// Builds a full theme for the given mode. Every `components` override below is derived
// from `pal` (the mode-specific ramp) rather than hardcoded light-mode hex values, so
// switching modes recolors table headers, drawers, dialogs, etc. consistently instead of
// just flipping `palette.mode`.
export const buildTheme = (mode: ThemeModeName): Theme => {
  const pal: PaletteShape = mode === "light" ? palette : darkPalette;
  const shadows = buildShadows(mode);

  return createTheme({
    palette: {
      mode,
      primary: { main: pal.primary, dark: pal.primaryDark, light: pal.primaryLight, contrastText: mode === "light" ? "#fff" : "#0D1210" },
      secondary: { main: pal.accent, dark: pal.accentDark, light: pal.accentLight, contrastText: mode === "light" ? pal.neutral900 : "#241708" },
      error: { main: pal.danger },
      success: { main: pal.success },
      warning: { main: pal.warning },
      info: { main: pal.info },
      background: { default: pal.neutral100, paper: pal.neutral0 },
      text: { primary: pal.neutral900, secondary: pal.neutral500 },
      divider: mode === "light" ? alpha(pal.neutral900, 0.09) : alpha(pal.neutral0, 0.14),
      action: {
        hover: alpha(pal.primary, mode === "light" ? 0.06 : 0.1),
        selected: alpha(pal.primary, mode === "light" ? 0.1 : 0.16),
        focus: alpha(pal.primary, mode === "light" ? 0.12 : 0.18),
        disabledBackground: alpha(pal.neutral900, 0.06),
      },
    },
    shape: { borderRadius: 16 },
    shadows,
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Nunito", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: 15,
      h1: { fontWeight: 800, fontSize: "2.75rem", lineHeight: 1.15, letterSpacing: "-0.02em" },
      h2: { fontWeight: 800, fontSize: "2.25rem", lineHeight: 1.2, letterSpacing: "-0.015em" },
      h3: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.25, letterSpacing: "-0.01em" },
      h4: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.3 },
      h5: { fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.35 },
      h6: { fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.4 },
      subtitle1: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },
      subtitle2: { fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.5 },
      body1: { fontSize: "1rem", lineHeight: 1.65 },
      body2: { fontSize: "0.9375rem", lineHeight: 1.6 },
      caption: { fontSize: "0.8125rem", lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 600, fontSize: "0.9375rem", letterSpacing: "0.01em" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: pal.neutral100 },
          "*:focus-visible": {
            outline: `3px solid ${alpha(pal.primary, 0.45)}`,
            outlineOffset: 2,
            transition: "outline-color 0.15s ease",
          },
          "::selection": { backgroundColor: alpha(pal.accent, 0.3) },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            minHeight: 44,
            padding: "10px 22px",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          sizeSmall: { minHeight: 36, padding: "6px 14px", borderRadius: 10 },
          sizeLarge: { minHeight: 52, padding: "13px 30px", fontSize: "1rem", borderRadius: 14 },
          containedPrimary: {
            backgroundImage: `linear-gradient(135deg, ${pal.primary} 0%, ${pal.primaryDark} 100%)`,
            "&:hover": { boxShadow: `0 6px 16px ${alpha(pal.primary, 0.28)}` },
          },
          containedSecondary: {
            backgroundImage: `linear-gradient(135deg, ${pal.accent} 0%, ${pal.accentDark} 100%)`,
            "&:hover": { boxShadow: `0 6px 16px ${alpha(pal.accent, 0.32)}` },
          },
          containedError: {
            "&:hover": { boxShadow: `0 6px 16px ${alpha(pal.danger, 0.3)}` },
          },
          outlined: { borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 12, transition: "transform 0.15s ease, background-color 0.15s ease" },
          sizeMedium: { padding: 10 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${pal.neutral300}`,
            boxShadow: mode === "light" ? shadows[2] : "none",
            backgroundColor: pal.neutral0,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 22, "&:last-child": { paddingBottom: 22 } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 12 },
          notchedOutline: { borderColor: pal.neutral300 },
        },
        variants: [
          {
            props: { size: "small" },
            style: {
              "& .MuiOutlinedInput-input": { paddingTop: 11, paddingBottom: 11 },
            },
          },
        ],
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
          sizeSmall: { height: 26 },
        },
      },
      MuiAvatar: {
        styleOverrides: { root: { fontWeight: 700 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: "14px 18px", borderBottom: `1px solid ${pal.neutral300}` },
          head: {
            fontWeight: 700,
            color: pal.neutral700,
            backgroundColor: pal.neutral100,
            fontSize: "0.8125rem",
            letterSpacing: "0.02em",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:last-of-type td": { borderBottom: "none" },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          toolbar: { minHeight: 56 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { borderRight: `1px solid ${pal.neutral300}`, backgroundImage: "none", backgroundColor: pal.neutral0 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: { borderRadius: 10, minHeight: 46 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, backgroundColor: pal.neutral0 },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: "14px !important",
            overflow: "hidden",
            border: `1px solid ${pal.neutral300}`,
            marginBottom: 12,
            boxShadow: "none",
            "&:before": { display: "none" },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: { minHeight: 60 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          colorInherit: { backgroundColor: pal.neutral0 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: "0.75rem" },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: { borderRadius: 14 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            alignItems: "center",
            fontWeight: 600,
            boxShadow: shadows[8],
          },
        },
      },
    },
  });
};

// Default (light) theme — kept as the module's default export for anywhere that still
// wants a static theme (e.g. tests/tooling); the app itself renders through
// `ThemeModeProvider`, which calls `buildTheme(mode)` for the live light/dark theme.
const theme = buildTheme("light");

export default theme;
