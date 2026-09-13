import { ForceLightMuiTheme } from "@/components/layout/force-light-mui-theme";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-light flex min-h-svh items-center justify-center bg-background px-4">
      <ForceLightMuiTheme>{children}</ForceLightMuiTheme>
    </div>
  );
}
