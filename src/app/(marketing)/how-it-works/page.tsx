import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { FinalCta, HowItWorks, PageHero, SectionHeading } from "@/components/marketing/sections";
import { getLocale, getT } from "@/i18n/server";
import { howItWorksText } from "@/i18n/messages/pages";
import { SCAN_STAGES, stageLabel } from "@/lib/verdict";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(howItWorksText);
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function HowItWorksPage() {
  const t = await getT(howItWorksText);
  const locale = await getLocale();
  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} subtitle={t.heroSubtitle} />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HowItWorks />
      </section>
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t.pipelineEyebrow} title={t.pipelineTitle} />
        <ol className="relative mt-12 space-y-4 border-l border-orange/25 pl-8">
          {SCAN_STAGES.map((s, i) => (
            <li key={s.key} className="relative">
              <span className="absolute top-5 -left-[45px] flex size-7 items-center justify-center rounded-full bg-orange text-xs font-semibold text-white ring-4 ring-background">{i + 1}</span>
              <div className="surface rounded-2xl p-5">
                <h3 className="flex items-center gap-2 font-semibold text-white"><CheckCircle2 className="size-4 text-orange" /> {stageLabel(s.key, locale)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.stageDetails[s.key]}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <FinalCta />
    </>
  );
}
