import type { Metadata } from "next";
import { Clock, Mail, MapPin, ShieldQuestion } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { PageHero } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Contact", description: "Contact Innova Networks about Innova Checker subscriptions and support." };

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to Innova Networks" subtitle="Questions about plans, activating a subscription for your company, or a suspicious link you need help with? Send us a message." />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div className="space-y-4">
          {[
            { icon: Mail, title: "E-mail", text: "support@innovanetworks.uz", href: "mailto:support@innovanetworks.uz" },
            { icon: MapPin, title: "Office", text: "Tashkent, Uzbekistan" },
            { icon: Clock, title: "Response time", text: "Within one business day" },
            { icon: ShieldQuestion, title: "Urgent incident?", text: "If someone already entered credentials on a suspicious site, reset the password and contact your IT team immediately." },
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
