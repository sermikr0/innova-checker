import { Check, Fingerprint, Globe2, KeyRound, Link2, Lock, Radar, ScrollText, ShieldAlert, Siren } from "lucide-react";
import { RiskGauge } from "@/components/scan/verdict";
import { severityLabel } from "@/lib/verdict";
import { getLocale, getT } from "@/i18n/server";
import { homeText } from "@/i18n/messages/home";

// Illustrative report used on the landing page. Clearly labelled as an example; it
// does not represent a real scan.

const FINDINGS = [
  { key: "credentials", sev: "CRITICAL", cls: "text-sev-critical bg-sev-critical/12 ring-sev-critical/25" },
  { key: "telegram", sev: "CRITICAL", cls: "text-sev-critical bg-sev-critical/12 ring-sev-critical/25" },
  { key: "newDomain", sev: "HIGH", cls: "text-sev-high bg-sev-high/12 ring-sev-high/25" },
  { key: "brand", sev: "HIGH", cls: "text-sev-high bg-sev-high/12 ring-sev-high/25" },
  { key: "language", sev: "MEDIUM", cls: "text-sev-medium bg-sev-medium/12 ring-sev-medium/25" },
] as const;

const MODULES = [
  { icon: Link2, key: "url" },
  { icon: Globe2, key: "domain" },
  { icon: Radar, key: "dns" },
  { icon: Lock, key: "ssl" },
  { icon: ScrollText, key: "content" },
  { icon: Fingerprint, key: "intel" },
] as const;

export async function ReportPreview() {
  const [t, locale] = await Promise.all([getT(homeText).then((m) => m.report), getLocale()]);
  return (
    <div className="relative mx-auto max-w-6xl">
      {/* fire-like edge light */}
      <div className="pointer-events-none absolute -inset-x-6 -top-8 h-32 rounded-[50%] bg-orange/40 blur-[60px]" />
      <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-orange-soft to-transparent" />
      <div className="relative overflow-hidden rounded-[28px] border border-orange/30 bg-[#0d0d10] shadow-[0_0_0_1px_rgba(255,107,0,0.12),0_40px_120px_-40px_rgba(255,107,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 hidden font-mono text-xs text-muted-foreground sm:inline">innova-checker / security-report</span>
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10.5px] tracking-wide text-muted-foreground uppercase">{t.exampleLabel}</span>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[300px_1fr] lg:p-7">
          <div className="surface flex flex-col items-center rounded-2xl p-6">
            <RiskGauge score={96} verdict="MALICIOUS" size={176} />
            <span className="mt-4 rounded-full bg-v-malicious/12 px-3 py-1 text-xs font-semibold tracking-wide text-v-malicious uppercase ring-1 ring-v-malicious/30">{t.verdict}</span>
            <p className="mt-4 text-center font-mono text-[11.5px] break-all text-white/70">https://dhl-parcel-redelivery.top/track?id=UZ8841…</p>
            <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
              {[
                [t.stats.domainAgeValue, t.stats.domainAge],
                ["2", t.stats.redirects],
                ["2/5", t.stats.intelHits],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2.5">
                  <p className="text-sm font-semibold text-white">{v}</p>
                  <p className="text-[10.5px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="surface rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <Siren className="size-4 text-orange" /> {t.keyFindings}
                </h3>
                <span className="text-xs text-muted-foreground">{t.flaggedCount}</span>
              </div>
              <ul className="mt-4 divide-y divide-white/[0.05]">
                {FINDINGS.map((f) => (
                  <li key={f.key} className="flex items-center gap-3 py-2.5">
                    <span className={`w-[70px] shrink-0 rounded-md px-2 py-0.5 text-center text-[11px] font-medium ring-1 ${f.cls}`}>{severityLabel(f.sev, locale)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{t.findings[f.key].title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t.findings[f.key].detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="surface rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <ShieldAlert className="size-4 text-orange" /> {t.modulesTitle}
                </h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {MODULES.map((m) => (
                    <div key={m.key} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3">
                      <m.icon className="size-4 text-white/70" />
                      <span className="text-[11px] text-white/80">{t.modules[m.key]}</span>
                      <Check className="size-3 text-v-safe" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="surface rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <KeyRound className="size-4 text-orange" /> {t.recommendationTitle}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{t.recommendation.before}<span className="font-mono text-orange">dhl.com</span>{t.recommendation.after}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
