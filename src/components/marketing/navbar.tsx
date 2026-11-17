import Link from "next/link";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSession } from "@/server/auth/session";
import { getSiteAccess } from "@/server/settings";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { getT } from "@/i18n/server";
import { marketingNavText } from "@/i18n/messages/marketing-nav";

export const NAV_LINKS = [
  { href: "/features", key: "features" },
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/pricing", key: "pricing" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export async function Navbar() {
  const [session, access, t] = await Promise.all([getSession(), getSiteAccess(), getT(marketingNavText)]);
  const links = NAV_LINKS.filter((l) => l.href !== "/pricing" || access.pricing).map((l) => ({ href: l.href, label: t.links[l.key] }));
  const home = session?.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label={t.mainNavLabel}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {session ? (
            <Link href={home} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition">
              {session.user.role === "SUPER_ADMIN" ? <ShieldCheck className="size-4" /> : <LayoutDashboard className="size-4" />}
              {session.user.role === "SUPER_ADMIN" ? t.adminPanel : t.dashboard}
            </Link>
          ) : (
            <>
              {access.login && (
                <Link href="/login" className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.05] hover:text-white">
                  {t.logIn}
                </Link>
              )}
              <Link href={access.register ? "/register" : "/#scan"} className="btn-orange inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition">
                {access.register ? t.getStarted : t.checkLink}
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher size="sm" />
          <MobileNav links={links} signedIn={!!session} home={home} showLogin={access.login} showRegister={access.register} />
        </div>
      </div>
    </header>
  );
}
