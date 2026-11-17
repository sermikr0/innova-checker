import type { Metadata } from "next";
import { Ban, Eye, FileLock2, Gauge, Layers, ShieldCheck } from "lucide-react";
import { FeatureGrid, FinalCta, PageHero, SectionHeading } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Features", description: "Eight analysis engines, transparent evidence and a hardened scanning sandbox." };

const PLATFORM = [
  { icon: Gauge, title: "0–100 risk score", text: "Findings are weighted and combined into a single score and a verdict: Safe, Low Risk, Suspicious, High Risk, Malicious or Inconclusive." },
  { icon: Eye, title: "Evidence for every check", text: "Each check records its status, result, explanation, raw evidence, data source and timestamp, so analysts can verify every conclusion." },
  { icon: Ban, title: "SSRF-hardened sandbox", text: "Private, loopback, link-local and cloud-metadata addresses are refused at DNS resolution; redirects are validated hop by hop." },
  { icon: FileLock2, title: "Downloads never executed", text: "Files are streamed through SHA-256 and signature checks in memory only, never written to disk, opened or run." },
  { icon: Layers, title: "Modular provider adapters", text: "Threat-intelligence providers plug in through adapters and can be enabled or disabled independently by administrators." },
  { icon: ShieldCheck, title: "Honest about coverage", text: "Unavailable or unconfigured checks are labelled as such and reduce the coverage figure; they are never reported as clean." },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title={<>Detection depth of a <span className="text-gradient-orange">security team</span></>} subtitle="Innova Checker runs eight specialised engines on every link and explains exactly what it found." />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeatureGrid />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Platform" title="Built to be trusted by security teams" />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORM.map((p) => (
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
