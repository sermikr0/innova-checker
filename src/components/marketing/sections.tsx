import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ClipboardPaste,
  Cpu,
  FileDown,
  FileSearch,
  Fingerprint,
  Globe2,
  Lock,
  Network,
  Radar,
  Route,
  ScanSearch,
  ScrollText,
  ServerCog,
  ShieldCheck,
  ShieldHalf,
  Ship,
  Truck,
  Receipt,
  KeyRound,
  Landmark,
  FileWarning,
  type LucideIcon,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getSiteAccess } from "@/server/settings";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber } from "@/lib/format";
import { homeSectionsText, type ModuleKey, type StepKey } from "@/i18n/messages/home-sections";

const en = homeSectionsText.en;

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: { eyebrow: string; title: React.ReactNode; subtitle?: string; align?: "center" | "left" }) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <span className="inline-flex items-center gap-2 rounded-full border border-orange/25 bg-orange/[0.08] px-3 py-1 text-xs font-medium tracking-wide text-orange">
        <span className="size-1.5 rounded-full bg-orange" /> {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-[42px] sm:leading-[1.1]">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>}
    </div>
  );
}

const MODULE_ICONS: { key: ModuleKey; icon: LucideIcon }[] = [
  { key: "url", icon: ScanSearch },
  { key: "domain", icon: Globe2 },
  { key: "dns", icon: Network },
  { key: "ssl", icon: Lock },
  { key: "redirects", icon: Route },
  { key: "content", icon: ScrollText },
  { key: "files", icon: FileDown },
  { key: "intel", icon: Fingerprint },
];

/** English feature list (kept for compatibility; components render the current language). */
export const MODULE_FEATURES = MODULE_ICONS.map((m) => ({ icon: m.icon, ...en.modules[m.key] }));

export async function FeatureGrid({ limit }: { limit?: number }) {
  const t = await getT(homeSectionsText);
  const all = MODULE_ICONS.map((m) => ({ icon: m.icon, ...t.modules[m.key] }));
  const items = limit ? all.slice(0, limit) : all;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((f) => (
        <div key={f.title} className="surface group relative overflow-hidden rounded-2xl p-6 transition-colors hover:border-orange/30">
          <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-orange/0 blur-3xl transition-colors duration-500 group-hover:bg-orange/20" />
          <div className="relative">
            <span className="flex size-11 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25">
              <f.icon className="size-5 text-orange" />
            </span>
            <h3 className="mt-5 text-[17px] font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            <ul className="mt-4 space-y-1.5">
              {f.points.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[13px] text-white/75">
                  <BadgeCheck className="size-3.5 shrink-0 text-orange" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function StatsSection({ scans, threats }: { scans: number; threats: number }) {
  const [{ stats: t }, locale] = await Promise.all([getT(homeSectionsText), getLocale()]);
  const stats = [
    { value: "8", label: t.modules.label, sub: t.modules.sub },
    { value: "70+", label: t.checks.label, sub: t.checks.sub },
    { value: "5", label: t.intel.label, sub: t.intel.sub },
    { value: formatNumber(scans, locale), label: t.scans.label, sub: t.scans.sub(formatNumber(threats, locale)) },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="surface grid overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("relative p-7", i > 0 && "border-t border-white/[0.06] sm:border-t-0 sm:border-l", i === 2 && "sm:border-l-0 lg:border-l", i >= 2 && "sm:border-t lg:border-t-0")}>
            <p className="text-4xl font-semibold tracking-tight text-white tabular-nums sm:text-5xl">{s.value}</p>
            <p className="mt-2 text-sm font-medium text-white/85">{s.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEP_ICONS: { key: StepKey; icon: LucideIcon }[] = [
  { key: "paste", icon: ClipboardPaste },
  { key: "analyze", icon: ServerCog },
  { key: "verdict", icon: ShieldCheck },
];

/** English steps (kept for compatibility; components render the current language). */
export const STEPS = STEP_ICONS.map((s) => ({ icon: s.icon, ...en.steps[s.key] }));

export async function HowItWorks() {
  const t = await getT(homeSectionsText);
  const steps = STEP_ICONS.map((s) => ({ icon: s.icon, ...t.steps[s.key] }));
  return (
    <div className="relative grid gap-5 lg:grid-cols-3">
      <div className="pointer-events-none absolute top-[52px] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-orange/0 via-orange/50 to-orange/0 lg:block" />
      {steps.map((s, i) => (
        <div key={s.title} className="surface relative rounded-2xl p-7">
          <div className="flex items-center gap-4">
            <span className="relative flex size-[52px] items-center justify-center rounded-2xl bg-[#18120e] ring-1 ring-orange/35">
              <s.icon className="size-6 text-orange" />
              <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-orange text-[11px] font-semibold text-white">{i + 1}</span>
            </span>
            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

const THREATS = [
  { key: "tracking", icon: Truck },
  { key: "waybills", icon: FileWarning },
  { key: "customs", icon: Landmark },
  { key: "loadBoard", icon: KeyRound },
  { key: "payment", icon: Receipt },
  { key: "shippingLine", icon: Ship },
] as const;

const PRINCIPLES = [
  { key: "isolated", icon: Cpu },
  { key: "transparent", icon: ShieldHalf },
  { key: "licensed", icon: Boxes },
  { key: "logistics", icon: Radar },
] as const;

export async function WhyInnova() {
  const { why: t } = await getT(homeSectionsText);
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h3 className="text-xl font-semibold text-white">{t.threatsTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t.threatsText}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {THREATS.map((th) => (
            <div key={th.key} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <th.icon className="size-5 text-orange" />
              <p className="mt-3 text-sm font-semibold text-white">{t.threats[th.key].title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t.threats[th.key].text}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">{t.designTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t.designText}</p>
        <div className="mt-6 space-y-3">
          {PRINCIPLES.map((p) => (
            <div key={p.key} className="surface flex gap-4 rounded-2xl p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25">
                <p.icon className="size-5 text-orange" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-white">{t.principles[p.key].title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.principles[p.key].text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** English FAQ (kept for compatibility; FaqSection renders the current language). Items carry a stable `id`. */
export const FAQ = en.faq;

/** `freeAnswer` replaces the free-allowance answer (id "free") with the policy currently configured. */
export async function FaqSection({ freeAnswer }: { freeAnswer?: string }) {
  const t = await getT(homeSectionsText);
  const items = t.faq.map((f) => (freeAnswer && f.id === "free" ? { ...f, a: `${freeAnswer} ${t.faqFreeSuffix}` } : f));
  return (
    <Accordion type="single" collapsible className="mx-auto max-w-3xl space-y-3">
      {items.map((f, i) => (
        <AccordionItem key={f.id} value={`q${i}`} className="surface rounded-2xl border-b-0 px-5">
          <AccordionTrigger className="py-5 text-left text-[15px] font-medium text-white hover:no-underline">{f.q}</AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export async function FinalCta() {
  const [access, { cta: t }] = await Promise.all([getSiteAccess(), getT(homeSectionsText)]);
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[32px] border border-orange/30 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(255,107,0,0.35)_0%,rgba(255,107,0,0.08)_35%,#0e0e11_70%)] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-2xl">
          <FileSearch className="mx-auto size-10 text-orange" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{t.title}</h2>
          <p className="mt-4 text-base text-white/70 sm:text-lg">{t.text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/#scan" className="btn-orange inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold">
              <ScanSearch className="size-4" /> {access.freeMode === "UNLIMITED" || access.freeLimit > 0 ? t.freeScan : t.checkLink}
            </Link>
            {access.register && (
              <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-[15px] font-medium text-white hover:bg-white/[0.08]">
                {t.createAccount} <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-[380px] w-[900px] -translate-x-1/2 rounded-[100%] bg-orange/[0.16] blur-[110px]" />
      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-14 sm:px-6 sm:pt-28 lg:px-8">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </div>
    </section>
  );
}
