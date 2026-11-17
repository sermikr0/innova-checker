import Link from "next/link";
import { BadgeCheck, Lock, ScanSearch } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 right-[10%] h-[900px] w-[220px] rotate-[16deg] bg-gradient-to-b from-transparent via-orange/35 to-orange/70 blur-[70px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-[100%] bg-orange/15 blur-[100px]" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            <span className="text-gradient-silver">Know before</span> <span className="text-gradient-orange">you click.</span>
          </h2>
          <p className="mt-4 text-white/65">One account for your scanner, scan history and reports, protected by device-bound sessions.</p>
          <ul className="mt-8 space-y-4 text-sm text-white/80">
            <li className="flex items-center gap-3"><ScanSearch className="size-5 text-orange" /> Eight analysis engines on every link</li>
            <li className="flex items-center gap-3"><BadgeCheck className="size-5 text-orange" /> Verified logistics domain database</li>
            <li className="flex items-center gap-3"><Lock className="size-5 text-orange" /> Argon2id passwords · device-limited licences</li>
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">© {new Date().getFullYear()} Innova Networks</p>
      </aside>
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="pointer-events-none absolute top-0 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-[100%] bg-orange/[0.08] blur-[90px] lg:hidden" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-white">← Back to Innova Checker</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
