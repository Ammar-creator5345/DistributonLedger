import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NavUser } from "@/components/layout/nav-user";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const settings = await getSettings();

  return (
    <SidebarProvider className="h-svh w-full flex-col overflow-hidden">
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <BrandLogo className="h-8 w-10 shrink-0" />
        <div className="min-w-0">
          <div className="truncate font-heading text-sm font-semibold">{settings.businessName}</div>
          <div className="truncate text-xs text-muted-foreground">{settings.subtitle ?? "Ledger"}</div>
        </div>
        <div className="flex-1" />
        <ThemeToggle />
        <NavUser email={session.user.email ?? ""} />
        <SidebarTrigger />
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
