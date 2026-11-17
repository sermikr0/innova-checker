import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EyeOff } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { Check, Info, Minus } from "lucide-react";
import { PricingCards, PricingFootnote, approxDays, durationText } from "@/components/marketing/pricing-cards";
import { FinalCta, PageHero } from "@/components/marketing/sections";
import { getPublicPlans } from "@/server/plans";
import { getPricingConfig, getSiteAccess } from "@/server/settings";
import { formatUzs } from "@/lib/format";
import { paymentsAvailable } from "@/server/payments/config";
import { getLocale, getT } from "@/i18n/server";
import { pricingText } from "@/i18n/messages/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const { page: t } = await getT(pricingText);
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function PricingPage() {
  const [plans, pricing, access, session, locale, { page: t }] = await Promise.all([getPublicPlans(), getPricingConfig(), getSiteAccess(), getSession(), getLocale(), getT(pricingText)]);
  // Hidden in Admin → Site controls: visitors get a 404, administrators a preview.
  if (!access.pricing && session?.user.role !== "SUPER_ADMIN") notFound();
  return (
    <>
      {!access.pricing && (
        <div className="border-b border-v-suspicious/30 bg-v-suspicious/10 px-4 py-2.5 text-center text-sm text-v-suspicious" role="status">
          <EyeOff className="mr-2 inline size-4 align-[-3px]" />
          {t.hiddenBanner}
        </div>
      )}
      <PageHero eyebrow={t.heroEyebrow} title={<>{t.heroTitle.before}<span className="text-gradient-orange">{t.heroTitle.highlight}</span></>} subtitle={t.heroSubtitle} />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-start gap-3 rounded-2xl border border-orange/25 bg-orange/[0.06] p-4 text-sm text-white/85">
          <Info className="mt-0.5 size-5 shrink-0 text-orange" />
          <p>
            <strong className="text-white">{pricing.paymentNotice}</strong> {t.noticeSuffix}
          </p>
        </div>
        <PricingCards plans={plans} notice={pricing.paymentNotice} ctaLabel={pricing.ctaLabel} highlightLabel={pricing.highlightLabel} checkout={paymentsAvailable()} />
        <PricingFootnote />
      </section>

      {pricing.showComparison && plans.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-white">{t.compareTitle}</h2>
          <p className="mt-3 text-center text-muted-foreground">{t.compareSubtitle}</p>
          <div className="surface mt-10 overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="sticky left-0 bg-card px-5 py-4 font-medium text-muted-foreground">{t.table.feature}</th>
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
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">{t.table.duration}</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center text-white">{durationText(p.durationValue, p.durationUnit, locale)}</td>)}
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">{t.table.price}</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center font-semibold whitespace-nowrap text-white">{formatUzs(p.priceUzs, locale)}</td>)}
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">{t.table.perDay}</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center whitespace-nowrap text-white/75">{formatUzs(Math.round(p.priceUzs / approxDays(p.durationValue, p.durationUnit)), locale)}</td>)}
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">{t.table.devices}</td>
                  {plans.map((p) => <td key={p.id} className="px-4 py-3.5 text-center font-semibold text-orange">{p.deviceLimit}</td>)}
                </tr>
                {t.featureRows.map((f) => (
                  <tr key={f} className="border-b border-white/[0.04] last:border-0">
                    <td className="sticky left-0 bg-card px-5 py-3.5 text-white/80">{f}</td>
                    {plans.map((p) => (
                      <td key={p.id} className="px-4 py-3.5 text-center">
                        {p.isActive ? <Check className="mx-auto size-4 text-orange" aria-label={t.table.included} /> : <Minus className="mx-auto size-4 text-muted-foreground" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t.intelFootnote}</p>
        </section>
      )}
      <div className="mt-24">
        <FinalCta />
      </div>
    </>
  );
}
