import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ClipboardPaste,
  Cpu,
  FileDown,
  FileSearch,
  Fingerprint,
  Globe2,
  Lock,
  Network,
  Radar,
  Route,
  ScanSearch,
  ScrollText,
  ServerCog,
  ShieldCheck,
  ShieldHalf,
  Ship,
  Truck,
  Receipt,
  KeyRound,
  Landmark,
  FileWarning,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getSiteAccess } from "@/server/settings";

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: { eyebrow: string; title: React.ReactNode; subtitle?: string; align?: "center" | "left" }) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <span className="inline-flex items-center gap-2 rounded-full border border-orange/25 bg-orange/[0.08] px-3 py-1 text-xs font-medium tracking-wide text-orange">
        <span className="size-1.5 rounded-full bg-orange" /> {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-[42px] sm:leading-[1.1]">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>}
    </div>
  );
}

export const MODULE_FEATURES = [
  { icon: ScanSearch, title: "URL analysis", text: "Structure, IP hosts, shorteners, homograph/IDN tricks, brand look-alikes, encoding anomalies, unusual ports and lure keywords.", points: ["Punycode & mixed-script detection", "Typo-squat matching against carrier brands"] },
  { icon: Globe2, title: "Domain intelligence", text: "Registrar, creation and expiry dates and domain age from RDAP, with WHOIS fallback for ccTLDs such as .uz.", points: ["Newly-registered domain alerts", "Admin-managed blocklist patterns"] },
  { icon: Network, title: "DNS records", text: "A, AAAA, CNAME, MX, NS, TXT, CAA, SOA, SPF and DMARC, plus fast-flux and internal-address rebinding indicators.", points: ["Free/dynamic DNS provider detection", "Mail-authentication posture"] },
  { icon: Lock, title: "SSL/TLS certificate", text: "Chain validity, expiry, hostname match, issuer, certificate age and negotiated protocol and cipher.", points: ["Self-signed & mismatched certs", "Fresh-certificate signal"] },
  { icon: Route, title: "Redirect analysis", text: "Every hop of HTTP and meta-refresh redirects, loops, downgrades and destinations hidden in page scripts.", points: ["Short links resolved safely", "Blocked hops into private networks"] },
  { icon: ScrollText, title: "Website content", text: "Static inspection of forms, scripts, iframes and external resources: no code from the page is ever executed.", points: ["Credential & card harvesting forms", "Telegram/Discord exfiltration in kits"] },
  { icon: FileDown, title: "File downloads", text: "File type by signature, double extensions, macro documents, disguised executables and SHA-256 fingerprints.", points: ["Never stored, opened or executed", "Hash lookups when intel is configured"] },
  { icon: Fingerprint, title: "Threat intelligence", text: "Google Safe Browsing, VirusTotal, URLhaus, PhishTank and AbuseIPDB adapters, each enabled independently.", points: ["Shows “Not configured” honestly", "No fabricated provider verdicts"] },
];

export function FeatureGrid({ limit }: { limit?: number }) {
  const items = limit ? MODULE_FEATURES.slice(0, limit) : MODULE_FEATURES;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((f) => (
        <div key={f.title} className="surface group relative overflow-hidden rounded-2xl p-6 transition-colors hover:border-orange/30">
          <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-orange/0 blur-3xl transition-colors duration-500 group-hover:bg-orange/20" />
          <div className="relative">
            <span className="flex size-11 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25">
              <f.icon className="size-5 text-orange" />
            </span>
            <h3 className="mt-5 text-[17px] font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            <ul className="mt-4 space-y-1.5">
              {f.points.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[13px] text-white/75">
                  <BadgeCheck className="size-3.5 shrink-0 text-orange" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSection({ scans, threats }: { scans: number; threats: number }) {
  const stats = [
    { value: "8", label: "Analysis modules", sub: "run in parallel on every scan" },
    { value: "70+", label: "Individual checks", sub: "each with evidence and source" },
    { value: "5", label: "Threat-intel integrations", sub: "enabled per deployment" },
    { value: new Intl.NumberFormat("en-US").format(scans), label: "URLs analyzed", sub: `${new Intl.NumberFormat("en-US").format(threats)} flagged as risky · live count` },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="surface grid overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("relative p-7", i > 0 && "border-t border-white/[0.06] sm:border-t-0 sm:border-l", i === 2 && "sm:border-l-0 lg:border-l", i >= 2 && "sm:border-t lg:border-t-0")}>
            <p className="text-4xl font-semibold tracking-tight text-white tabular-nums sm:text-5xl">{s.value}</p>
            <p className="mt-2 text-sm font-medium text-white/85">{s.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const STEPS = [
  { icon: ClipboardPaste, title: "Paste the link", text: "Copy the suspicious link from an e-mail, Telegram or WhatsApp message and paste it into Innova Checker. Defanged links like hxxp://example[.]com work too." },
  { icon: ServerCog, title: "We analyze it in isolation", text: "Our server-side scanner resolves, fetches and inspects the destination behind strict network policies. Your browser never opens the link and no page code is executed." },
  { icon: ShieldCheck, title: "Get a clear verdict", text: "Receive a 0–100 risk score, a verdict from Safe to Malicious, every check with its evidence and source, and practical next steps for your team." },
];

export function HowItWorks() {
  return (
    <div className="relative grid gap-5 lg:grid-cols-3">
      <div className="pointer-events-none absolute top-[52px] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-orange/0 via-orange/50 to-orange/0 lg:block" />
      {STEPS.map((s, i) => (
        <div key={s.title} className="surface relative rounded-2xl p-7">
          <div className="flex items-center gap-4">
            <span className="relative flex size-[52px] items-center justify-center rounded-2xl bg-[#18120e] ring-1 ring-orange/35">
              <s.icon className="size-6 text-orange" />
              <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-orange text-[11px] font-semibold text-white">{i + 1}</span>
            </span>
            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

const THREATS = [
  { icon: Truck, title: "Fake shipment tracking pages", text: "Look-alike DHL, FedEx, UPS and Maersk pages that steal logins or ask for redelivery fees." },
  { icon: FileWarning, title: "Malicious waybills & invoices", text: "“Bill of lading” or “invoice” links that deliver ISO, LNK, macro or disguised executable files." },
  { icon: Landmark, title: "Customs-fee scams", text: "Urgent requests to pay clearance or duty fees by card before a parcel is released." },
  { icon: KeyRound, title: "Load-board & mailbox phishing", text: "Credential harvesting for Microsoft 365, load boards, TMS and carrier portals." },
  { icon: Receipt, title: "Payment-redirection fraud", text: "Messages with links to “updated bank details” documents from look-alike partner domains." },
  { icon: Ship, title: "Shipping-line impersonation", text: "Booking-confirmation and container-release lures using shipping-line branding." },
];

const PRINCIPLES = [
  { icon: Cpu, title: "Isolated scanning engine", text: "SSRF-hardened fetcher: private, loopback and cloud-metadata addresses are blocked at DNS-resolution time, redirects are re-validated hop by hop, sizes and timeouts are capped." },
  { icon: ShieldHalf, title: "Transparent, never fabricated", text: "Every check shows its status, evidence, data source and timestamp. Providers without an API key are reported as “Not configured”, never as clean." },
  { icon: Boxes, title: "Licensed per device", text: "Subscriptions enforce device limits server-side, so a single-device plan really is one device. Administrators can revoke devices and sessions at any time." },
  { icon: Radar, title: "Tuned for logistics", text: "Built-in knowledge of carrier, shipping-line, customs and payment brands that attackers impersonate to reach freight and dispatch teams." },
];

export function WhyInnova() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h3 className="text-xl font-semibold text-white">Threats your team actually receives</h3>
        <p className="mt-2 text-sm text-muted-foreground">Logistics staff open more external links than almost any other role. These are the lures we are built to catch.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {THREATS.map((t) => (
            <div key={t.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <t.icon className="size-5 text-orange" />
              <p className="mt-3 text-sm font-semibold text-white">{t.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">Security by design</h3>
        <p className="mt-2 text-sm text-muted-foreground">A security tool must be secure itself. Innova Checker was engineered by the security team at Innova Networks.</p>
        <div className="mt-6 space-y-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="surface flex gap-4 rounded-2xl p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25">
                <p.icon className="size-5 text-orange" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-white">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const FAQ = [
  { q: "Is it safe to paste a suspicious link into Innova Checker?", a: "Yes. The link is never opened in your browser. Our server fetches it inside an isolated scanner that blocks internal addresses, never executes page scripts and never runs or stores downloaded files." },
  { q: "What exactly does a scan check?", a: "Eight modules run on every scan: URL structure, domain registration and reputation, DNS records, SSL/TLS certificate, redirect chain, page content, file downloads and threat intelligence. The report lists every check with its result, evidence and source." },
  { q: "Can a “Safe” verdict be wrong?", a: "Yes. No automated scanner can guarantee that a website is 100% safe. Attackers serve different content to different visitors and use brand-new infrastructure. Treat the verdict as strong evidence, not a guarantee, and follow your company's security policy." },
  { q: "Which threat-intelligence sources are used?", a: "Innova Checker integrates Google Safe Browsing, VirusTotal, URLhaus, PhishTank and AbuseIPDB. Each provider is used only when its API key is configured by the operator. Reports clearly mark providers that were not consulted." },
  { q: "How many free checks do I get?", a: "The free allowance lets you try the full analysis. Continuous use requires a subscription so we can keep the scanning infrastructure and intelligence feeds running. Free-scan limits are enforced on the server, not just in your browser." },
  { q: "How do device limits work?", a: "Each plan allows a set number of devices (1 to 50). A device is registered when you sign in on a new browser. When the limit is reached, remove an old device from your dashboard or ask your administrator." },
  { q: "How can I buy a subscription?", a: "Online payments are not available yet; purchases will be enabled soon. Until then, contact Innova Networks and an administrator can activate a plan for your account." },
];

/** `freeAnswer` replaces the free-allowance answer with the policy currently configured. */
export function FaqSection({ freeAnswer }: { freeAnswer?: string }) {
  const items = FAQ.map((f) => (freeAnswer && f.q === "How many free checks do I get?" ? { ...f, a: `${freeAnswer} Free-scan limits are enforced on the server, not just in your browser.` } : f));
  return (
    <Accordion type="single" collapsible className="mx-auto max-w-3xl space-y-3">
      {items.map((f, i) => (
        <AccordionItem key={f.q} value={`q${i}`} className="surface rounded-2xl border-b-0 px-5">
          <AccordionTrigger className="py-5 text-left text-[15px] font-medium text-white hover:no-underline">{f.q}</AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export async function FinalCta() {
  const access = await getSiteAccess();
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[32px] border border-orange/30 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(255,107,0,0.35)_0%,rgba(255,107,0,0.08)_35%,#0e0e11_70%)] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-2xl">
          <FileSearch className="mx-auto size-10 text-orange" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Stop phishing before it reaches your freight desk.</h2>
          <p className="mt-4 text-base text-white/70 sm:text-lg">Give every dispatcher, broker and accountant a fast, trustworthy way to check a link before they click it.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/#scan" className="btn-orange inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold">
              <ScanSearch className="size-4" /> {access.freeMode === "UNLIMITED" || access.freeLimit > 0 ? "Run a free scan" : "Check a link"}
            </Link>
            {access.register && (
              <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-[15px] font-medium text-white hover:bg-white/[0.08]">
                Create an account <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-[380px] w-[900px] -translate-x-1/2 rounded-[100%] bg-orange/[0.16] blur-[110px]" />
      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-14 sm:px-6 sm:pt-28 lg:px-8">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </div>
    </section>
  );
}
