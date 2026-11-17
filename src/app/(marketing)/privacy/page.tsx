import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Privacy policy" };

const SECTIONS = [
  ["What we collect", "Account details you provide (name, work e-mail, company), the URLs you submit and the resulting reports, registered device and session information (browser type, IP address, timestamps), and messages sent through the contact form. For visitors without an account we keep a random session identifier and a keyed hash of the IP address to enforce the free-scan limit."],
  ["How submitted URLs are processed", "Submitted URLs are fetched by our isolated scanner and, when configured by the operator, sent to third-party threat-intelligence providers (Google Safe Browsing, VirusTotal, URLhaus, PhishTank, AbuseIPDB) under their own terms. Do not submit links that contain confidential information you are not allowed to share."],
  ["How we use data", "To provide scans and reports, enforce subscription and device limits, protect the service against abuse, and maintain audit logs of administrative actions. We do not sell personal data."],
  ["Retention", "Scan history is kept for as long as your account exists or until you delete it from your dashboard. Security and audit logs are retained as required to operate and protect the service."],
  ["Security", "Passwords are hashed with Argon2id. Session and device tokens are stored only as hashes. Access to administrative functions is restricted and logged."],
  ["Your choices", "You can update your profile, delete your scan history, sign out of devices and request account deletion at any time. Contact support@innovanetworks.uz with privacy questions."],
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" subtitle="How Innova Checker handles personal data and submitted links." />
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
