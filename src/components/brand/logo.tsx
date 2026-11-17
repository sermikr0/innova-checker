import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return <Image src="/brand/innova-mark.png" alt="" width={size} height={size} priority className={cn("shrink-0", className)} />;
}

/** Product lock-up: Innova hexagon + "Innova Checker" wordmark. */
export function Logo({ href = "/", className, compact = false }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Innova Checker home">
      <LogoMark size={34} className="transition-transform duration-500 group-hover:rotate-[60deg]" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Innova <span className="text-orange">Checker</span>
          </span>
          <span className="mt-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">by Innova Networks</span>
        </span>
      )}
    </Link>
  );
}

/** Full corporate logo (white version) for footers and PDFs. */
export function InnovaNetworksLogo({ className }: { className?: string }) {
  return <Image src="/brand/innova-logo-white.png" alt="Innova Networks" width={781} height={315} className={cn("h-9 w-auto", className)} />;
}
