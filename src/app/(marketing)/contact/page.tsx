import type { Metadata } from "next";
import { Clock, Mail, MapPin, ShieldQuestion } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { PageHero } from "@/components/marketing/sections";
import { contactText } from "@/i18n/messages/contact";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(contactText);
  return { title: t.page.metaTitle, description: t.page.metaDescription };
}

export default async function ContactPage() {
  const { page: t } = await getT(contactText);
  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} subtitle={t.heroSubtitle} />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div className="space-y-4">
          {[
            { icon: Mail, title: t.emailTitle, text: "support@innovanetworks.uz", href: "mailto:support@innovanetworks.uz" },
            { icon: MapPin, title: t.officeTitle, text: t.officeText },
            { icon: Clock, title: t.responseTitle, text: t.responseText },
            { icon: ShieldQuestion, title: t.urgentTitle, text: t.urgentText },
          ].map((c) => (
            <div key={c.title} className="surface flex gap-4 rounded-2xl p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25"><c.icon className="size-5 text-orange" /></span>
              <div>
                <p className="text-sm font-semibold text-white">{c.title}</p>
                {c.href ? <a href={c.href} className="text-sm text-orange hover:underline">{c.text}</a> : <p className="text-sm text-muted-foreground">{c.text}</p>}
              </div>
            </div>
          ))}
        </div>
        <ContactForm />
      </section>
    </>
  );
}
