import type { Metadata } from "next";
import { Ban, Eye, FileLock2, Gauge, Layers, ShieldCheck } from "lucide-react";
import { FeatureGrid, FinalCta, PageHero, SectionHeading } from "@/components/marketing/sections";
import { featuresText } from "@/i18n/messages/pages";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(featuresText);
  return { title: t.metaTitle, description: t.metaDescription };
}

/** Icons for t.platform, in the same order. */
const PLATFORM_ICONS = [Gauge, Eye, Ban, FileLock2, Layers, ShieldCheck];

export default async function FeaturesPage() {
  const t = await getT(featuresText);
  const platform = t.platform.map((p, i) => ({ ...p, icon: PLATFORM_ICONS[i] }));
  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={<>{t.heroTitle.before}<span className="text-gradient-orange">{t.heroTitle.highlight}</span>{t.heroTitle.after}</>} subtitle={t.heroSubtitle} />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeatureGrid />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t.platformEyebrow} title={t.platformTitle} />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platform.map((p) => (
            <div key={p.title} className="surface rounded-2xl p-6">
              <p.icon className="size-6 text-orange" />
              <h3 className="mt-4 text-[17px] font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
