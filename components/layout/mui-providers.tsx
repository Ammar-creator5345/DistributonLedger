"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useTheme } from "@/components/layout/theme-provider";
import { muiLightTheme, muiDarkTheme } from "@/lib/mui-theme";
import { ToastProvider } from "@/lib/toast";

/**
 * Bridges the app's existing hand-rolled light/dark ThemeProvider (CSS-variable based, no
 * next-themes) into MUI: MUI's own theme object is picked per render from `resolvedTheme`, so
 * both systems always agree on which mode is active.
 */
export function MuiProviders({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const muiTheme = resolvedTheme === "dark" ? muiDarkTheme : muiLightTheme;

  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: false }}>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={muiTheme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ToastProvider>{children}</ToastProvider>
          </LocalizationProvider>
        </MuiThemeProvider>
      </StyledEngineProvider>
    </AppRouterCacheProvider>
  );
}
