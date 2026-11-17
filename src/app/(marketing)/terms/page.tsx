import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Terms of service" };

const SECTIONS = [
  ["The service", "Innova Checker analyzes URLs and reports indicators of risk. Results are produced by automated heuristics and, where configured, third-party intelligence. No automated scanner can guarantee that a website is 100% safe, and reports are provided as decision support, not as a warranty."],
  ["Acceptable use", "Use the service only to check links you have a legitimate reason to assess. Do not use it to attack, probe or overload third-party systems, to circumvent limits, or to submit content you are not permitted to share."],
  ["Accounts and devices", "Keep your credentials confidential. Subscriptions are licensed for the number of devices in your plan; sharing accounts beyond that limit is not permitted. Administrators may revoke devices or suspend accounts that breach these terms."],
  ["Subscriptions and payments", "Plan prices are shown in Uzbekistani so'm. Online payments are not yet available; subscriptions are currently activated by Innova Networks administrators. Terms for paid purchases will be published when payments are enabled."],
  ["Liability", "To the extent permitted by law, Innova Networks is not liable for losses arising from reliance on scan results or from links you choose to open."],
  ["Contact", "Questions about these terms: support@innovanetworks.uz."],
];

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of service" subtitle="The rules for using Innova Checker." />
      <article className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">
        {SECTIONS.map(([h, t]) => (
          <section key={h}>
            <h2 className="text-lg font-semibold text-white">{h}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">{t}</p>
          </section>
        ))}
        <p className="text-xs text-muted-foreground">Last updated: November 2026.</p>
      </article>
    </>
  );
}
