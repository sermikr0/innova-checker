import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { FinalCta, HowItWorks, PageHero, SectionHeading } from "@/components/marketing/sections";
import { SCAN_STAGES } from "@/lib/verdict";

export const metadata: Metadata = { title: "How it works", description: "What happens when you submit a link to Innova Checker." };

const STAGE_DETAILS: Record<string, string> = {
  validate: "The link is parsed and normalised. Defanged links are restored, non-web schemes are refused and internal or private destinations are rejected before any network activity.",
  domain: "DNS is queried for A, AAAA, CNAME, MX, NS, TXT, CAA and SOA records, including SPF and DMARC. Addresses pointing into private networks are flagged.",
  reputation: "Registration data is fetched over RDAP (WHOIS for ccTLDs without RDAP). Domain age, registry holds and administrator-defined suspicious patterns are evaluated.",
  redirects: "The isolated fetcher follows HTTP and meta-refresh redirects one hop at a time, re-checking every destination against the network policy and size/time limits.",
  ssl: "A separate TLS handshake reads the certificate chain, expiry, hostname coverage, issuer and negotiated protocol.",
  content: "The final page is parsed statically for forms, scripts, iframes, brand claims and exfiltration endpoints. File downloads are fingerprinted and classified by signature.",
  intel: "Configured threat-intelligence providers are queried with the URL, final destination, server IPs and file hash. Results are combined into the score and verdict.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="Three steps for your team, seven stages for our engine" subtitle="You paste a link. Innova Checker does the risky part on its own infrastructure and returns a transparent, evidence-backed report." />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HowItWorks />
      </section>
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Inside a scan" title="The analysis pipeline" />
        <ol className="relative mt-12 space-y-4 border-l border-orange/25 pl-8">
          {SCAN_STAGES.map((s, i) => (
            <li key={s.key} className="relative">
              <span className="absolute top-5 -left-[45px] flex size-7 items-center justify-center rounded-full bg-orange text-xs font-semibold text-white ring-4 ring-background">{i + 1}</span>
              <div className="surface rounded-2xl p-5">
                <h3 className="flex items-center gap-2 font-semibold text-white"><CheckCircle2 className="size-4 text-orange" /> {s.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{STAGE_DETAILS[s.key]}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <FinalCta />
    </>
  );
}
