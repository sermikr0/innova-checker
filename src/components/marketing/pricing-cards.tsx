import Link from "next/link";
import { Check, Clock3, MonitorSmartphone, Sparkles, Zap } from "lucide-react";
import type { DurationUnit } from "@/generated/prisma/enums";
import { formatUzs } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PlanCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationValue: number;
  durationUnit: DurationUnit;
  priceUzs: number;
  deviceLimit: number;
  features: unknown;
  isRecommended: boolean;
};

export function durationText(value: number, unit: DurationUnit) {
  const u = unit === "DAY" ? "day" : unit === "MONTH" ? "month" : "year";
  return `${value} ${u}${value === 1 ? "" : "s"}`;
}

export function approxDays(value: number, unit: DurationUnit) {
  return unit === "DAY" ? value : unit === "MONTH" ? value * 30 : value * 365;
}

export function PricingCards({ plans, notice, ctaLabel, highlightLabel, compact = false, checkout = false }: { plans: PlanCardData[]; notice: string; ctaLabel: string; highlightLabel: string; compact?: boolean; checkout?: boolean }) {
  return (
    <div className={cn("grid gap-6", plans.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
      {plans.map((p) => {
        const features = Array.isArray(p.features) ? (p.features as string[]) : [];
        const perDay = Math.round(p.priceUzs / approxDays(p.durationValue, p.durationUnit));
        const rec = p.isRecommended;
        return (
          <article
            key={p.id}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-3xl border p-7 transition-transform duration-300 hover:-translate-y-1",
              rec ? "border-orange/50 bg-[linear-gradient(160deg,#2a1406_0%,#140b06_45%,#0d0b0a_100%)] shadow-[0_30px_80px_-30px_rgba(255,107,0,0.55)]" : "border-white/[0.08] bg-[linear-gradient(160deg,#1a120d_0%,#111013_40%,#0e0e10_100%)]",
            )}
          >
            <div className={cn("pointer-events-none absolute -top-20 -right-16 size-56 rounded-full blur-3xl", rec ? "bg-orange/40" : "bg-orange/[0.14]")} />
            {rec && (
              <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase shadow-[0_0_20px_rgba(255,107,0,0.6)]">
                <Sparkles className="size-3" /> {highlightLabel}
              </span>
            )}
            <div className="relative">
              <h3 className="text-lg font-semibold text-white">{p.name}</h3>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock3 className="size-3.5 text-orange" /> {durationText(p.durationValue, p.durationUnit)} of access
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-white tabular-nums">{new Intl.NumberFormat("en-US").format(p.priceUzs)}</span>
                <span className="text-base text-white/70">UZS</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">≈ {formatUzs(perDay)} per day</p>
              {!compact && <p className="mt-4 min-h-[44px] text-sm leading-relaxed text-white/70">{p.description}</p>}

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 px-3.5 py-2.5 text-sm text-white">
                <MonitorSmartphone className="size-4 text-orange" />
                <span>
                  Up to <strong className="font-semibold">{p.deviceLimit}</strong> device{p.deviceLimit === 1 ? "" : "s"}
                </span>
              </div>

              {checkout ? (
                <Link href={`/dashboard/billing?plan=${encodeURIComponent(p.slug)}`} className={cn("mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold", rec ? "btn-orange" : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]")}>
                  <Zap className="size-4" /> Choose plan
                </Link>
              ) : (
                <button type="button" disabled aria-disabled="true" className={cn("mt-5 inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl text-sm font-semibold", rec ? "btn-orange opacity-90" : "border border-white/10 bg-white/[0.06] text-white/80")}>
                  <Zap className="size-4" /> {ctaLabel}
                </button>
              )}
              <p className="mt-3 text-center text-[11.5px] leading-snug text-muted-foreground">{checkout ? "Pay with Click (UZS) or Visa / Mastercard. Activated instantly on your device." : notice}</p>

              {!compact && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-white/10" /> Included <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <ul className="space-y-2.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                        <Check className="mt-0.5 size-4 shrink-0 text-orange" /> {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PricingFootnote() {
  return (
    <p className="mt-8 text-center text-sm text-muted-foreground">
      Need access now? <Link href="/contact" className="text-orange hover:underline">Contact Innova Networks</Link> and an administrator can activate a plan for your company.
    </p>
  );
}
