import type { Metadata } from "next";
import { Building2, Target, Users } from "lucide-react";
import { InnovaNetworksLogo } from "@/components/brand/logo";
import { FinalCta, PageHero } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "About", description: "Innova Checker is built by Innova Networks for logistics companies." };

const VALUES = [
  { icon: Target, title: "Our mission", text: "Give every person in a logistics company a fast, trustworthy way to check a link before they click it, so a single message can no longer compromise a business." },
  { icon: Users, title: "Who we serve", text: "Freight forwarders, trucking and dispatch companies, customs brokers and the accounting and sales teams that work with them, in Uzbekistan and abroad." },
  { icon: Building2, title: "Who we are", text: "Innova Networks is a Tashkent-based technology and security company. Innova Checker grew out of the protection we build for logistics offices every day." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title={<>Security built by people who <span className="text-gradient-orange">know logistics</span></>} subtitle="Phishing aimed at freight teams is relentless: fake tracking pages, poisoned waybills, customs-fee scams and stolen load-board accounts. We built Innova Checker to stop it." />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {VALUES.map((v) => (
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
            Innova Checker is designed with the same rules we apply to our own infrastructure: least privilege, isolation of untrusted content, full audit trails and honest reporting. We never present a check as done when it was not.
          </p>
        </div>
      </section>
      <div className="mt-24">
        <FinalCta />
      </div>
    </>
  );
}
