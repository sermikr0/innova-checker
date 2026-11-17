import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { ReportPreview } from "@/components/marketing/report-preview";
import { FaqSection, FeatureGrid, FinalCta, HowItWorks, SectionHeading, StatsSection, WhyInnova } from "@/components/marketing/sections";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { getSession } from "@/server/auth/session";
import { getPublicPlans, platformStats } from "@/server/plans";
import { getPricingConfig, getSiteAccess } from "@/server/settings";
import { freePolicyLong, freePolicyShort } from "@/lib/site-access";
import { paymentsAvailable } from "@/server/payments/config";
import { getLocale, getT } from "@/i18n/server";
import { homeText } from "@/i18n/messages/home";

export default async function HomePage() {
  const [session, stats, plans, pricing, access, locale, { page: t }] = await Promise.all([getSession(), platformStats(), getPublicPlans(), getPricingConfig(), getSiteAccess(), getLocale(), getT(homeText)]);
  const preview = ["monthly", "annual", "quarterly"].map((s) => plans.find((p) => p.slug === s)).filter((p) => !!p);
  const previewPlans = preview.length === 3 ? preview : plans.slice(0, 3);

  return (
    <>
      <Hero signedIn={!!session} access={{ login: access.login, register: access.register, pricing: access.pricing, note: freePolicyShort(access, locale) }} />

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8" aria-label={t.exampleReportLabel}>
        <ReportPreview />
      </section>

      <StatsSection scans={stats.scans} threats={stats.threats} />

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <SectionHeading eyebrow={t.howItWorks.eyebrow} title={t.howItWorks.title} subtitle={t.howItWorks.subtitle} />
        <div className="mt-14">
          <HowItWorks />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t.detection.eyebrow} title={<>{t.detection.title.before}<span className="text-gradient-orange">{t.detection.title.highlight}</span></>} subtitle={t.detection.subtitle} />
        <div className="mt-14">
          <FeatureGrid />
        </div>
        <div className="mt-8 text-center">
          <Link href="/features" className="inline-flex items-center gap-1.5 text-sm font-medium text-orange hover:underline">
            {t.exploreFeatures} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <SectionHeading eyebrow={t.why.eyebrow} title={t.why.title} subtitle={t.why.subtitle} />
        <div className="mt-14">
          <WhyInnova />
        </div>
      </section>

      {access.pricing && (
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-orange/[0.12] blur-[120px]" />
        <SectionHeading eyebrow={t.pricing.eyebrow} title={t.pricing.title} subtitle={t.pricing.subtitle} />
        <div className="relative mt-14">
          <PricingCards plans={previewPlans} notice={pricing.paymentNotice} ctaLabel={pricing.ctaLabel} highlightLabel={pricing.highlightLabel} checkout={paymentsAvailable()} compact />
        </div>
        <div className="mt-8 text-center">
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-orange hover:underline">
            {t.compareAll(plans.length)} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <SectionHeading eyebrow={t.faqEyebrow} title={t.faqTitle} />
        <div className="mt-12">
          <FaqSection freeAnswer={freePolicyLong(access, locale)} />
        </div>
      </section>

      <FinalCta />
    </>
  );
}
