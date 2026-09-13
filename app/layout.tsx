import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { themeInitScript } from "@/lib/theme-script";
import { MuiProviders } from "@/components/layout/mui-providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "HAJI M SHAFFI AND SON",
    template: "%s · HAJI M SHAFFI AND SON",
  },
  description: "Distribution and inventory ledger",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(${themeInitScript.toString()})();` }}
        />
        <ThemeProvider>
          <MuiProviders>{children}</MuiProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
