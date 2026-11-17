"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, BarChart3, CreditCard, Database, FileClock, History, LayoutDashboard, LogOut, Menu, MonitorSmartphone, ScanSearch, Settings, ShieldBan, ShieldCheck, Sliders, Tags, User, Users, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const ICONS = { Activity, BarChart3, CreditCard, Database, FileClock, History, LayoutDashboard, MonitorSmartphone, ScanSearch, Settings, ShieldBan, ShieldCheck, Sliders, Tags, User, Users, Wallet } as const;
export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean; badge?: number };

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="space-y-1" aria-label="Sections">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`);
        const Icon = ICONS[it.icon];
        return (
          <Link key={it.href} href={it.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
            className={cn("group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors", active ? "bg-gradient-to-r from-orange/25 to-orange/[0.06] font-medium text-white ring-1 ring-orange/35" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
            <Icon className={cn("size-[18px]", active ? "text-orange" : "text-white/45 group-hover:text-white/80")} />
            <span className="flex-1">{it.label}</span>
            {!!it.badge && <span className="rounded-full bg-orange px-1.5 py-0.5 text-[10px] font-semibold text-white">{it.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.replace("/login");
}

export function AppShell({ items, user, area, footer, children }: { items: NavItem[]; user: { fullName: string; email: string; companyName: string; role: string }; area: "dashboard" | "admin"; footer?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-2">
        <Logo href={area === "admin" ? "/admin" : "/dashboard"} />
        {area === "admin" && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wider text-orange uppercase"><ShieldCheck className="size-3" /> Super Admin</span>}
        {area === "dashboard" && user.role === "UNLIMITED" && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-v-trusted/30 bg-v-trusted/10 px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wider text-v-trusted uppercase"><ShieldCheck className="size-3" /> Unlimited access</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavList items={items} onNavigate={onNavigate} />
        {footer}
      </div>
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange/15 text-sm font-semibold text-orange">{user.fullName.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{user.fullName}</span>
            <span className="block truncate text-[11.5px] text-muted-foreground">{user.companyName}</span>
          </span>
          <button type="button" onClick={logout} className="flex size-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white" aria-label="Log out" title="Log out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-white/[0.06] bg-sidebar lg:block">{sidebar()}</aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-background/80 px-4 backdrop-blur lg:hidden">
          <Logo compact href={area === "admin" ? "/admin" : "/dashboard"} />
          <button type="button" onClick={() => setOpen(true)} className="flex size-10 items-center justify-center rounded-xl border border-white/10" aria-label="Open navigation"><Menu className="size-5" /></button>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[280px] border-white/10 bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {sidebar(() => setOpen(false))}
          </SheetContent>
        </Sheet>
        <main className="relative">
          <div className="pointer-events-none absolute top-0 right-0 h-72 w-[520px] rounded-full bg-orange/[0.06] blur-[110px]" />
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-[13px] text-muted-foreground">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone = "default", highlight = false }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon: IconName; tone?: "default" | "safe" | "warn" | "danger" | "trusted"; highlight?: boolean }) {
  const Icon = ICONS[icon];
  const toneCls = { default: "bg-orange/12 text-orange ring-orange/25", safe: "bg-v-safe/12 text-v-safe ring-v-safe/25", warn: "bg-v-suspicious/12 text-v-suspicious ring-v-suspicious/25", danger: "bg-v-malicious/12 text-v-malicious ring-v-malicious/25", trusted: "bg-v-trusted/12 text-v-trusted ring-v-trusted/25" }[tone];
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-5", highlight ? "bg-gradient-to-br from-[#ff7a1a] to-[#e85d00] text-white shadow-[0_20px_60px_-25px_rgba(255,107,0,0.8)]" : "surface")}>
      <span className={cn("flex size-11 items-center justify-center rounded-xl ring-1", highlight ? "bg-white/20 text-white ring-white/30" : toneCls)}>
        <Icon className="size-5" />
      </span>
      <p className={cn("mt-5 text-3xl font-semibold tracking-tight tabular-nums", highlight ? "text-white" : "text-white")}>{value}</p>
      <p className={cn("mt-1 text-sm", highlight ? "text-white/90" : "text-white/70")}>{label}</p>
      {sub && <p className={cn("mt-1 text-xs", highlight ? "text-white/80" : "text-muted-foreground")}>{sub}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  const Icon = ICONS[icon];
  return (
    <div className="surface flex flex-col items-center rounded-2xl px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10"><Icon className="size-6 text-white/50" /></span>
      <p className="mt-4 font-medium text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
