import type { Metadata } from "next";
import { Building2, Target, Users } from "lucide-react";
import { InnovaNetworksLogo } from "@/components/brand/logo";
import { FinalCta, PageHero } from "@/components/marketing/sections";
import { aboutText } from "@/i18n/messages/pages";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(aboutText);
  return { title: t.metaTitle, description: t.metaDescription };
}

/** Icons for t.values, in the same order. */
const VALUE_ICONS = [Target, Users, Building2];

export default async function AboutPage() {
  const t = await getT(aboutText);
  const values = t.values.map((v, i) => ({ ...v, icon: VALUE_ICONS[i] }));
  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={<>{t.heroTitle.before}<span className="text-gradient-orange">{t.heroTitle.highlight}</span>{t.heroTitle.after}</>} subtitle={t.heroSubtitle} />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="surface rounded-2xl p-7">
              <v.icon className="size-6 text-orange" />
              <h2 className="mt-4 text-lg font-semibold text-white">{v.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
        <div className="surface mt-10 flex flex-col items-center gap-6 rounded-3xl p-10 text-center">
          <InnovaNetworksLogo className="h-14" />
          <p className="max-w-2xl text-[15px] leading-relaxed text-white/75">
            {t.closing}
          </p>
        </div>
      </section>
      <div className="mt-24">
        <FinalCta />
      </div>
    </>
  );
}
