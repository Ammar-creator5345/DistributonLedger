"use client";

import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { muiLightTheme } from "@/lib/mui-theme";

/**
 * Pins MUI-rendered components (Card, Input, Button, etc.) to the light palette for whatever
 * it wraps, overriding the app-wide dark/light MuiThemeProvider from MuiProviders — used on the
 * sign-in page, which should always render light regardless of the visitor's stored theme
 * preference. Nesting a MuiThemeProvider like this is the standard MUI pattern for scoping a
 * theme to part of the tree.
 */
export function ForceLightMuiTheme({ children }: { children: React.ReactNode }) {
  return <MuiThemeProvider theme={muiLightTheme}>{children}</MuiThemeProvider>;
}
