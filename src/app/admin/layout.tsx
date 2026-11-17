import type { Metadata } from "next";
import { AppShell, type NavItem } from "@/components/common/app-shell";
import { LogoutNavButton } from "@/components/dashboard/logout-button";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const s = await requireAdmin();
  const [pending, messages] = await Promise.all([prisma.domainRecord.count({ where: { status: "PENDING" } }), prisma.contactMessage.count({ where: { handledAt: null } })]);
  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "LayoutDashboard", exact: true },
    { href: "/admin/analytics", label: "Link analytics", icon: "BarChart3" },
    { href: "/admin/site-controls", label: "Site controls", icon: "ToggleRight" },
    { href: "/admin/users", label: "Users", icon: "Users" },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: "CreditCard" },
    { href: "/admin/plans", label: "Plans & pricing", icon: "Tags" },
    { href: "/admin/payments", label: "Payments", icon: "Wallet" },
    { href: "/admin/domains", label: "Domain intelligence", icon: "Database", badge: pending },
    { href: "/admin/scanner", label: "Scanner", icon: "Sliders" },
    { href: "/admin/integrations", label: "Integrations", icon: "Activity" },
    { href: "/admin/security", label: "Security", icon: "ShieldBan" },
    { href: "/admin/settings", label: "Settings", icon: "Settings" },
    { href: "/admin/audit-logs", label: "Audit logs", icon: "FileClock" },
    { href: "/admin/api-docs", label: "API docs", icon: "FileClock" },
    { href: "/admin/messages", label: "Messages", icon: "Activity", badge: messages },
    { href: "/dashboard", label: "My dashboard", icon: "User", exact: true },
  ];
  return <AppShell items={items} user={s.user} area="admin" footer={<LogoutNavButton />}>{children}</AppShell>;
}
