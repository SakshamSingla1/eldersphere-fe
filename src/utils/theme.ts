import { createTheme, alpha, darken, lighten, type Theme } from "@mui/material/styles";

export type ThemeModeName = "light" | "dark";

// Mirrors com.eldersphere.entities.ColorPalette (and the flat shape ColorThemeResponseDTO /
// UserThemeResponseDTO carry it in) exactly — deliberately MUI-shaped so it can be spread
// straight into `createTheme({ palette: {...} })` below without any reshaping. This is the
// single source of truth for "what a color theme preset looks like" on the frontend; there
// is intentionally no second, differently-shaped copy of a palette anywhere else.
export interface MuiColorGroup {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

export interface ActiveThemePalette {
  primary: MuiColorGroup;
  secondary: MuiColorGroup;
  error: MuiColorGroup;
  warning: MuiColorGroup;
  info: MuiColorGroup;
  success: MuiColorGroup;
  background: { default: string; paper: string };
  text: { primary: string; secondary: string };
}

// The caller's resolved active color theme — mirrors
// com.eldersphere.dtos.ColorTheme.UserThemeResponseDTO, which both the login response's
// inline `activeTheme` and `GET /users/me/theme` return. Always carries a concrete
// palette (the backend resolves to the default theme rather than a null palette).
export interface ActiveColorTheme {
  themeId: number;
  themeName: string;
  palette: ActiveThemePalette;
  usingDefault: boolean;
}

// "Forest & Terracotta" — the backend's own default theme (id 1, isDefault=true; see
// GET /api/v1/color-themes). These values are the source of truth for the fallback palette
// used whenever no active theme has loaded yet (or the caller has never picked one) — kept
// in exact sync with the backend's seed data rather than a separately hand-tuned copy, so
// there is only ever one definition of "the default palette" to maintain.
export const defaultColorThemePalette: ActiveThemePalette = {
  primary: { main: "#2F6F5E", light: "#4F8B7A", dark: "#1D4E40", contrastText: "#FFFFFF" },
  secondary: { main: "#E0875A", light: "#EAA57F", dark: "#B86A42", contrastText: "#1B1B1B" },
  error: { main: "#C62828", light: "#E57373", dark: "#8E0000", contrastText: "#FFFFFF" },
  warning: { main: "#ED6C02", light: "#FFB74D", dark: "#B53D00", contrastText: "#000000" },
  info: { main: "#01659C", light: "#4FA8D8", dark: "#013E61", contrastText: "#FFFFFF" },
  success: { main: "#2E7D32", light: "#66BB6A", dark: "#1B5E20", contrastText: "#FFFFFF" },
  background: { default: "#F7F4F0", paper: "#FFFFFF" },
  text: { primary: "#1E2A26", secondary: "#55645F" },
};

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

// A color theme preset only ships ONE set of primary/secondary/semantic/background/text
// colors (see ColorPalette's javadoc on the backend — light/dark mode is deliberately kept
// an orthogonal frontend concern, not duplicated per preset). So dark mode is derived from
// that one set rather than looked up from a second hardcoded ramp:
//  - primary/secondary/error/warning/info/success: swap to the group's own `light` shade as
//    `main` (a brand hue that was tuned to sit on a white surface reads too dark/muddy on a
//    near-black one) and its `main` becomes the new `dark`; `contrastText` is deliberately
//    left for MUI's palette augmentation to recompute against the new `main` rather than
//    reusing the light-mode value, which was only ever verified against the old `main`.
//  - background/text: derived by mixing the theme's own light-mode background/text hues
//    towards black/white (via MUI's darken/lighten) rather than reusing a flat neutral gray,
//    so e.g. "Ocean Calm" still reads distinctly blue-ish in dark mode instead of every
//    theme collapsing to the same dark gray.
const groupForMode = (group: MuiColorGroup, mode: ThemeModeName) =>
  mode === "light"
    ? group
    : {
        main: group.light,
        light: lighten(group.light, 0.2),
        dark: group.main,
      };

// Builds a full theme for the given mode, genuinely splicing the active color theme's
// palette into MUI's own palette object (not a CSS-variable overlay layered on top) — every
// component override below reads from `pal`/`colors`, which are themselves derived from
// `activeThemePalette`, so picking a different preset actually changes the theme MUI's
// component library renders from. `activeThemePalette` defaults to the backend's own
// default preset when the caller hasn't loaded (or picked) one yet.
export const buildTheme = (mode: ThemeModeName, activeThemePalette?: ActiveThemePalette | null): Theme => {
  const colors = activeThemePalette ?? defaultColorThemePalette;
  const isLight = mode === "light";
  const shadows = buildShadows(mode);

  const primaryGroup = groupForMode(colors.primary, mode);
  const secondaryGroup = groupForMode(colors.secondary, mode);
  const errorGroup = groupForMode(colors.error, mode);
  const warningGroup = groupForMode(colors.warning, mode);
  const infoGroup = groupForMode(colors.info, mode);
  const successGroup = groupForMode(colors.success, mode);

  const backgroundDefault = isLight ? colors.background.default : darken(colors.text.primary, 0.82);
  const backgroundPaper = isLight ? colors.background.paper : darken(colors.text.primary, 0.72);
  const textPrimary = isLight ? colors.text.primary : lighten(colors.text.primary, 0.86);
  const textSecondary = isLight ? colors.text.secondary : lighten(colors.text.secondary, 0.72);
  // Table headers etc. want a shade between the primary and secondary text tones — derived
  // rather than a third hardcoded neutral.
  const textTertiary = isLight ? darken(colors.text.secondary, 0.25) : lighten(colors.text.secondary, 0.85);
  // Borders/dividers/input outlines — a low-alpha wash of the primary text color reads as a
  // faint neutral line against any of this theme's surfaces, in either mode.
  const hairline = alpha(textPrimary, isLight ? 0.14 : 0.16);

  // Flat convenience ramp so every `components` override below stays exactly as readable as
  // before, just fed by the derived (theme + mode)-aware values above instead of a single
  // hardcoded palette object.
  const pal = {
    primary: primaryGroup.main,
    primaryDark: primaryGroup.dark,
    primaryLight: primaryGroup.light,
    accent: secondaryGroup.main,
    accentDark: secondaryGroup.dark,
    accentLight: secondaryGroup.light,
    neutral900: textPrimary,
    neutral700: textTertiary,
    neutral500: textSecondary,
    neutral300: hairline,
    neutral100: backgroundDefault,
    neutral0: backgroundPaper,
    danger: errorGroup.main,
    success: successGroup.main,
    warning: warningGroup.main,
    info: infoGroup.main,
  };

  return createTheme({
    palette: {
      mode,
      primary: primaryGroup,
      secondary: secondaryGroup,
      error: errorGroup,
      warning: warningGroup,
      info: infoGroup,
      success: successGroup,
      background: { default: backgroundDefault, paper: backgroundPaper },
      text: { primary: textPrimary, secondary: textSecondary },
      divider: hairline,
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

// Default (light, default color theme) — kept as the module's default export for anywhere
// that still wants a static theme (e.g. tests/tooling); the app itself renders through
// `ThemeModeProvider`, which calls `buildTheme(mode, activeThemePalette)` for the live theme.
const theme = buildTheme("light");

export default theme;
