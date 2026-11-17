import type { Metadata } from "next";
import { Check, Info, Minus } from "lucide-react";
import { PricingCards, PricingFootnote, approxDays, durationText } from "@/components/marketing/pricing-cards";
import { FinalCta, PageHero } from "@/components/marketing/sections";
import { getPublicPlans } from "@/server/plans";
import { getPricingConfig } from "@/server/settings";
import { formatUzs } from "@/lib/format";
import { paymentsAvailable } from "@/server/payments/config";

export const metadata: Metadata = { title: "Pricing", description: "Innova Checker subscription plans in Uzbekistani so'm. Every plan includes full URL analysis." };

const FEATURE_ROWS = [
  "URL structure & homograph analysis",
  "Domain intelligence (RDAP / WHOIS)",
  "DNS records & mail authentication",
  "SSL/TLS certificate inspection",
  "Redirect-chain tracing",
  "Website content & login-form analysis",
  "File download inspection (SHA-256)",
  "Threat-intelligence lookups*",
  "PDF reports & copyable summaries",
  "Personal scan history",
];

export default async function PricingPage() {
  const [plans, pricing] = await Promise.all([getPublicPlans(), getPricingConfig()]);
  return (
    <>
      <PageHero eyebrow="Pricing" title={<>Full protection, <span className="text-gradient-orange">every plan</span></>} subtitle="All plans include the complete Innova Checker analysis engine. Choose the duration and number of devices that fit your team." />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-start gap-3 rounded-2xl border border-orange/25 bg-orange/[0.06] p-4 text-sm text-white/85">
          <Info className="mt-0.5 size-5 shrink-0 text-orange" />
          <p>
            <strong className="text-white">{pricing.paymentNotice}</strong> Until then, an Innova Networks administrator can activate a plan for your company on request.
          </p>
        </div>
        <PricingCards plans={plans} notice={pricing.paymentNotice} ctaLabel={pricing.ctaLabel} highlightLabel={pricing.highlightLabel} checkout={paymentsAvailable()} />
        <PricingFootnote />
      </section>

      {pricing.showComparison && plans.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-white">Compare plans</h2>
          <p className="mt-3 text-center text-muted-foreground">Same engine, different duration and device allowance.</p>
          <div className="surface mt-10 overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="sticky left-0 bg-card px-5 py-4 font-medium text-muted-foreground">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="px-4 py-4 text-center font-semibold text-white">
                      {p.name.replace(" Full Scan", "")}
                      {p.isRecommended && <span className="mt-1 block text-[10px] font-semibold tracking-wide text-orange uppercase">{pricing.highlightLabel}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/[0.04]">
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">Duration</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center text-white">{durationText(p.durationValue, p.durationUnit)}</td>)}
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">Price</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center font-semibold whitespace-nowrap text-white">{formatUzs(p.priceUzs)}</td>)}
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">Approx. price per day</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center whitespace-nowrap text-white/75">{formatUzs(Math.round(p.priceUzs / approxDays(p.durationValue, p.durationUnit)))}</td>)}
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">Allowed devices</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center font-semibold text-orange">{p.deviceLimit}</td>)}
                </tr>
                {FEATURE_ROWS.map((f) => (
                  <tr key={f} className="border-b border-white/[0.04] last:border-0">
                    <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">{f}</td>
                    {plans.map((p) => (
                      <td key={p.id} className="px-4 py-3.5 text-center">
                        {p.isActive ? <Check className="mx-auto size-4 text-orange" aria-label="Included" /> : <Minus className="mx-auto size-4 text-muted-foreground" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">* Threat-intelligence providers are queried when the operator has configured their API keys. Reports always state which providers were consulted.</p>
        </section>
      )}
      <div className="mt-24">
        <FinalCta />
      </div>
    </>
  );
}
