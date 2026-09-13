import { createTheme, type Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

/**
 * Palette values are copied literally from the CSS custom properties in app/globals.css
 * (the ledger's forest/gold/paper identity) rather than re-derived, so MUI components and the
 * existing Tailwind-styled markup always agree on color regardless of which one renders a
 * given pixel.
 */
const fontSans = "var(--font-sans)";
const fontHeading = "var(--font-heading)";
const fontMono = "var(--font-mono)";

const radius = 8; // matches --radius: 0.5rem

function buildTheme(mode: "light" | "dark"): Theme {
  const isDark = mode === "dark";

  const palette = isDark
    ? {
        mode: "dark" as const,
        background: { default: "#141f19", paper: "#1a2620" },
        primary: { main: "#5a9268", contrastText: "#101a13" },
        secondary: { main: "#d6a952", contrastText: "#1f3a28" },
        error: { main: "#c17877" },
        success: { main: "#6fae7d" },
        warning: { main: "#e9c77b" },
        text: { primary: "#ede7d6", secondary: "#a7a38c" },
        divider: "rgba(237, 231, 214, 0.12)",
      }
    : {
        mode: "light" as const,
        background: { default: "#f7f6f2", paper: "#ffffff" },
        primary: { main: "#1f3a28", contrastText: "#f5f2e6" },
        secondary: { main: "#b8863b", contrastText: "#1f3a28" },
        error: { main: "#a13d3d" },
        success: { main: "#2c6b3f" },
        warning: { main: "#d6a952" },
        text: { primary: "#1c2a22", secondary: "#75705f" },
        divider: "#eeeeee",
      };

  return createTheme({
    cssVariables: false,
    palette,
    shape: { borderRadius: radius },
    typography: {
      fontFamily: fontSans,
      fontSize: 14,
      button: { textTransform: "none", fontWeight: 600 },
      h1: { fontFamily: fontHeading },
      h2: { fontFamily: fontHeading },
      h3: { fontFamily: fontHeading },
      h4: { fontFamily: fontHeading },
      h5: { fontFamily: fontHeading },
      h6: { fontFamily: fontHeading },
      body1: { fontSize: "0.875rem" },
      body2: { fontSize: "0.8125rem" },
    },
    shadows: Array(25).fill("none") as Theme["shadows"],
    components: {
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: radius, fontWeight: 600, boxShadow: "none" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: palette.divider },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: palette.secondary.main },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.secondary.main,
              borderWidth: 1.5,
            },
          },
          // Fixed 45px height on every size="small" outlined field (TextField, Select,
          // DatePicker all render this) so it matches the plain <input> primitive exactly.
          sizeSmall: { height: 45, minHeight: 45, maxHeight: 45, boxSizing: "border-box" },
          input: {
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: "0.875rem",
            height: "100%",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
          },
          // MUI draws the outline via a <fieldset> offset -5px above the root (reserved for a
          // floating label's notch) — since none of our fields use a floating label, that offset
          // just makes the visible border ~5px taller than the box we sized to 45px. Zeroing it
          // makes the drawn border match the root exactly, which a height override alone can't fix.
          // The fieldset's <legend> child is the other half of this: even with top pinned to 0,
          // browsers reserve vertical space around the border for the legend's own height (11px
          // by default, used for the floating-label notch), which visibly pushes the painted
          // border down a few px regardless of the fieldset's actual box position — verified
          // against a real rendered page (a Select's border started ~5px lower than a plain
          // Input's despite both boxes measuring the same 45px via getBoundingClientRect).
          // Hiding the legend removes that reservation entirely.
          notchedOutline: { top: 0, "& legend": { display: "none" } },
        },
      },
      MuiSelect: {
        defaultProps: {
          MenuProps: { slotProps: { paper: { sx: { mt: 0.5 } }, list: { sx: { py: 0 } } } },
        },
      },
      MuiList: {
        styleOverrides: {
          root: { paddingTop: 0, paddingBottom: 0 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { minHeight: 36 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: radius,
            border: `1px solid ${palette.divider}`,
            boxShadow: isDark
              ? "0 12px 32px rgba(0,0,0,0.45)"
              : "0 8px 24px rgba(0, 0, 0, 0.10)",
          },
          list: { paddingTop: 0, paddingBottom: 0 },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: radius,
            border: `1px solid ${palette.divider}`,
            boxShadow: isDark
              ? "0 12px 32px rgba(0,0,0,0.45)"
              : "0 8px 24px rgba(0, 0, 0, 0.10)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            border: `1px solid ${palette.divider}`,
            boxShadow: isDark
              ? "0 12px 32px rgba(0,0,0,0.45)"
              : "0 8px 24px rgba(0, 0, 0, 0.10)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { border: "none" },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: {
            height: 3,
            borderRadius: 3,
            backgroundColor: palette.secondary.main,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            minHeight: 40,
            padding: "8px 16px",
            color: palette.text.secondary,
            transition: "color 150ms ease",
            "&:hover": { color: palette.text.primary },
            "&.Mui-selected": { color: palette.primary.main },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: palette.text.primary,
            color: palette.background.default,
            fontSize: "0.72rem",
            borderRadius: 6,
            padding: "6px 10px",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: palette.divider, fontFamily: fontMono, fontSize: "0.8rem" },
          head: { fontFamily: fontSans, fontWeight: 600, color: palette.primary.main },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: radius } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: radius } },
      },
      MuiSnackbarContent: {
        styleOverrides: { root: { borderRadius: radius } },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(palette.text.secondary, 0.1),
            borderRadius: radius,
            padding: 2,
            gap: 2,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            border: "none",
            borderRadius: radius - 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.75rem",
            padding: "4px 12px",
            color: palette.text.secondary,
            "&.Mui-selected, &.Mui-selected:hover": {
              backgroundColor: palette.primary.main,
              color: palette.primary.contrastText,
            },
          },
        },
      },
    },
  });
}

export const muiLightTheme = buildTheme("light");
export const muiDarkTheme = buildTheme("dark");
