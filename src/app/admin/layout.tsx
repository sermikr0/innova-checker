import type { Metadata } from "next";
import { AppShell, type NavItem } from "@/components/common/app-shell";
import { LogoutNavButton } from "@/components/dashboard/logout-button";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { getT } from "@/i18n/server";
import { adminText } from "@/i18n/messages/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(adminText);
  return { title: t.metaTitle, robots: { index: false, follow: false } };
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const s = await requireAdmin();
  const t = (await getT(adminText)).nav;
  const [pending, messages] = await Promise.all([prisma.domainRecord.count({ where: { status: "PENDING" } }), prisma.contactMessage.count({ where: { handledAt: null } })]);
  const items: NavItem[] = [
    { href: "/admin", label: t.overview, icon: "LayoutDashboard", exact: true },
    { href: "/admin/analytics", label: t.analytics, icon: "BarChart3" },
    { href: "/admin/site-controls", label: t.siteControls, icon: "ToggleRight" },
    { href: "/admin/consents", label: t.consents, icon: "FileClock" },
    { href: "/admin/users", label: t.users, icon: "Users" },
    { href: "/admin/subscriptions", label: t.subscriptions, icon: "CreditCard" },
    { href: "/admin/plans", label: t.plans, icon: "Tags" },
    { href: "/admin/payments", label: t.payments, icon: "Wallet" },
    { href: "/admin/domains", label: t.domains, icon: "Database", badge: pending },
    { href: "/admin/scanner", label: t.scanner, icon: "Sliders" },
    { href: "/admin/integrations", label: t.integrations, icon: "Activity" },
    { href: "/admin/security", label: t.security, icon: "ShieldBan" },
    { href: "/admin/settings", label: t.settings, icon: "Settings" },
    { href: "/admin/audit-logs", label: t.auditLogs, icon: "FileClock" },
    { href: "/admin/api-docs", label: t.apiDocs, icon: "FileClock" },
    { href: "/admin/messages", label: t.messages, icon: "Activity", badge: messages },
    { href: "/dashboard", label: t.myDashboard, icon: "User", exact: true },
  ];
  return <AppShell items={items} user={s.user} area="admin" footer={<LogoutNavButton />}>{children}</AppShell>;
}
