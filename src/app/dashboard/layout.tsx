import type { Metadata } from "next";
import { AppShell, type NavItem } from "@/components/common/app-shell";
import { LogoutNavButton } from "@/components/dashboard/logout-button";
import { MaintenanceBanner } from "@/components/common/maintenance-banner";
import { requireUser } from "@/server/auth/session";
import { getSiteAccess } from "@/server/settings";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const s = await requireUser("/dashboard");
  const access = await getSiteAccess();
  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "LayoutDashboard", exact: true },
    { href: "/dashboard/scanner", label: "URL Scanner", icon: "ScanSearch" },
    { href: "/dashboard/history", label: "Scan History", icon: "History" },
    { href: "/dashboard/subscription", label: "Subscription", icon: "CreditCard" },
    ...(access.pricing ? [{ href: "/dashboard/billing", label: "Buy / renew", icon: "Wallet" } as NavItem] : []),
    { href: "/dashboard/devices", label: "Devices", icon: "MonitorSmartphone" },
    { href: "/dashboard/profile", label: "Profile", icon: "User" },
    { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
    ...(s.user.role === "SUPER_ADMIN" ? [{ href: "/admin", label: "Admin panel", icon: "ShieldCheck" } as NavItem] : []),
  ];
  return (
    <>
      <MaintenanceBanner />
      <AppShell items={items} user={s.user} area="dashboard" footer={<LogoutNavButton />}>
        {children}
      </AppShell>
    </>
  );
}
