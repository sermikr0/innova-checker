import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { InnovaNetworksLogo } from "@/components/brand/logo";
import { getSiteAccess } from "@/server/settings";

const COLUMNS = [
  { title: "Product", links: [{ href: "/#scan", label: "URL Scanner" }, { href: "/features", label: "Features" }, { href: "/how-it-works", label: "How it works" }, { href: "/pricing", label: "Pricing" }] },
  { title: "Company", links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }, { href: "/register", label: "Create account" }, { href: "/login", label: "Log in" }] },
  { title: "Legal", links: [{ href: "/privacy", label: "Privacy policy" }, { href: "/terms", label: "Terms of service" }] },
];

export async function Footer() {
  const access = await getSiteAccess();
  const hidden = new Set([!access.pricing && "/pricing", !access.register && "/register", !access.login && "/login"].filter(Boolean));
  const columns = COLUMNS.map((c) => ({ ...c, links: c.links.filter((l) => !hidden.has(l.href)) }));
  return (
    <footer className="relative mt-24 border-t border-white/[0.06] bg-[#09090b]">
      <div className="hairline absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_2fr] lg:px-8">
        <div className="max-w-sm">
          <InnovaNetworksLogo />
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Innova Checker is a URL security intelligence service by Innova Networks, built for logistics companies, freight forwarders and the teams who open their links.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <a href="mailto:support@innovanetworks.uz" className="flex items-center gap-2 hover:text-white">
              <Mail className="size-4 text-orange" /> support@innovanetworks.uz
            </a>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-orange" /> Tashkent, Uzbekistan
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">{c.title}</h3>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/75 transition-colors hover:text-orange">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Innova Networks. All rights reserved.</p>
          <p>No automated scanner can guarantee a website is 100% safe.</p>
        </div>
      </div>
    </footer>
  );
}
