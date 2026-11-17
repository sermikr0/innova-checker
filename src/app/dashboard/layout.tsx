import type { Metadata } from "next";
import { AppShell, type NavItem } from "@/components/common/app-shell";
import { LogoutNavButton } from "@/components/dashboard/logout-button";
import { MaintenanceBanner } from "@/components/common/maintenance-banner";
import { requireUser } from "@/server/auth/session";
import { getSiteAccess } from "@/server/settings";
import { getT } from "@/i18n/server";
import { dashboardText } from "@/i18n/messages/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(dashboardText);
  return { title: t.nav.metaTitle, robots: { index: false, follow: false } };
}

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const s = await requireUser("/dashboard");
  const access = await getSiteAccess();
  const { nav } = await getT(dashboardText);
  const items: NavItem[] = [
    { href: "/dashboard", label: nav.overview, icon: "LayoutDashboard", exact: true },
    { href: "/dashboard/scanner", label: nav.scanner, icon: "ScanSearch" },
    { href: "/dashboard/history", label: nav.history, icon: "History" },
    { href: "/dashboard/subscription", label: nav.subscription, icon: "CreditCard" },
    ...(access.pricing ? [{ href: "/dashboard/billing", label: nav.billing, icon: "Wallet" } as NavItem] : []),
    { href: "/dashboard/devices", label: nav.devices, icon: "MonitorSmartphone" },
    { href: "/dashboard/profile", label: nav.profile, icon: "User" },
    { href: "/dashboard/settings", label: nav.settings, icon: "Settings" },
    ...(s.user.role === "SUPER_ADMIN" ? [{ href: "/admin", label: nav.admin, icon: "ShieldCheck" } as NavItem] : []),
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
