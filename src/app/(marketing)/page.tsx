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

export default async function HomePage() {
  const [session, stats, plans, pricing, access] = await Promise.all([getSession(), platformStats(), getPublicPlans(), getPricingConfig(), getSiteAccess()]);
  const preview = ["monthly", "annual", "quarterly"].map((s) => plans.find((p) => p.slug === s)).filter((p) => !!p);
  const previewPlans = preview.length === 3 ? preview : plans.slice(0, 3);

  return (
    <>
      <Hero signedIn={!!session} access={{ login: access.login, register: access.register, pricing: access.pricing, note: freePolicyShort(access) }} />

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8" aria-label="Example report">
        <ReportPreview />
      </section>

      <StatsSection scans={stats.scans} threats={stats.threats} />

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <SectionHeading eyebrow="How it works" title="From suspicious link to clear answer in seconds" subtitle="No installation, no browser extension, no risk of opening the page yourself." />
        <div className="mt-14">
          <HowItWorks />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Advanced detection" title={<>Eight engines. <span className="text-gradient-orange">One verdict.</span></>} subtitle="Every scan runs the full analysis pipeline and shows exactly which checks fired, why, and where the data came from." />
        <div className="mt-14">
          <FeatureGrid />
        </div>
        <div className="mt-8 text-center">
          <Link href="/features" className="inline-flex items-center gap-1.5 text-sm font-medium text-orange hover:underline">
            Explore all detection features <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <SectionHeading eyebrow="Why Innova Checker" title="Made for the people who open freight links all day" subtitle="Generic URL scanners are built for researchers. Innova Checker is built for dispatchers, brokers, forwarders and accountants." />
        <div className="mt-14">
          <WhyInnova />
        </div>
      </section>

      {access.pricing && (
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-orange/[0.12] blur-[120px]" />
        <SectionHeading eyebrow="Pricing" title="Simple plans in Uzbekistani so'm" subtitle="Every plan includes the full analysis engine. Plans differ only in duration and the number of devices." />
        <div className="relative mt-14">
          <PricingCards plans={previewPlans} notice={pricing.paymentNotice} ctaLabel={pricing.ctaLabel} highlightLabel={pricing.highlightLabel} checkout={paymentsAvailable()} compact />
        </div>
        <div className="mt-8 text-center">
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-orange hover:underline">
            Compare all {plans.length} plans <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12">
          <FaqSection freeAnswer={freePolicyLong(access)} />
        </div>
      </section>

      <FinalCta />
    </>
  );
}
