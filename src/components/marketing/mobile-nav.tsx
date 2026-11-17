"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { useT } from "@/i18n/client";
import { marketingNavText } from "@/i18n/messages/marketing-nav";

export function MobileNav({ links, signedIn, home, showLogin, showRegister }: { links: { href: string; label: string }[]; signedIn: boolean; home: string; showLogin: boolean; showRegister: boolean }) {
  const [open, setOpen] = useState(false);
  const t = useT(marketingNavText);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 text-white md:hidden" aria-label={t.mobile.openMenu}>
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] border-white/10 bg-[#0e0e11]">
        <SheetHeader>
          <SheetTitle className="sr-only">{t.mobile.menuTitle}</SheetTitle>
          <Logo />
        </SheetHeader>
        <nav className="mt-2 flex flex-col gap-1 px-4" aria-label={t.mobile.navLabel}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[15px] text-white/80 hover:bg-white/5 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 p-4">
          {signedIn ? (
            <Link href={home} onClick={() => setOpen(false)} className="btn-orange inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold">
              {t.mobile.openDashboard}
            </Link>
          ) : (
            <>
              {showLogin && (
                <Link href="/login" onClick={() => setOpen(false)} className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-medium">
                  {t.logIn}
                </Link>
              )}
              <Link href={showRegister ? "/register" : "/#scan"} onClick={() => setOpen(false)} className="btn-orange inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold">
                {showRegister ? t.mobile.createFreeAccount : t.checkLink}
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
