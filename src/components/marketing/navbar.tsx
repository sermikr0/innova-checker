import Link from "next/link";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSession } from "@/server/auth/session";
import { MobileNav } from "./mobile-nav";

export const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const session = await getSession();
  const home = session?.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <Link href={home} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition">
              {session.user.role === "SUPER_ADMIN" ? <ShieldCheck className="size-4" /> : <LayoutDashboard className="size-4" />}
              {session.user.role === "SUPER_ADMIN" ? "Admin panel" : "Dashboard"}
            </Link>
          ) : (
            <>
              <Link href="/login" className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.05] hover:text-white">
                Log in
              </Link>
              <Link href="/register" className="btn-orange inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition">
                Get started
              </Link>
            </>
          )}
        </div>
        <MobileNav links={NAV_LINKS} signedIn={!!session} home={home} />
      </div>
    </header>
  );
}
