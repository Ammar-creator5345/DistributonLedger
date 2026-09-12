/**
 * Runs before hydration (via next/script strategy="beforeInteractive") to set the theme class on
 * <html> synchronously, avoiding a flash of the wrong theme. Kept as a plain function — its source
 * is inlined into a <script> tag via .toString(), so it must not close over anything outside itself.
 */
export function themeInitScript() {
  try {
    const stored = localStorage.getItem("theme");
    const theme = stored === "light" || stored === "dark" ? stored : "system";
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    const root = document.documentElement;
    if (resolved === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = resolved;
  } catch {
    // localStorage or matchMedia unavailable — fall back to the default light theme.
  }
}
