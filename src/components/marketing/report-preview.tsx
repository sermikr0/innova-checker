import { Check, Fingerprint, Globe2, KeyRound, Link2, Lock, Radar, ScrollText, ShieldAlert, Siren } from "lucide-react";
import { RiskGauge } from "@/components/scan/verdict";

// Illustrative report used on the landing page. Clearly labelled as an example; it
// does not represent a real scan.

const FINDINGS = [
  { sev: "Critical", cls: "text-sev-critical bg-sev-critical/12 ring-sev-critical/25", title: "Credential harvesting page", detail: "Password form branded as DHL on a non-DHL domain" },
  { sev: "Critical", cls: "text-sev-critical bg-sev-critical/12 ring-sev-critical/25", title: "Data exfiltration to Telegram", detail: "api.telegram.org/bot… found in page code" },
  { sev: "High", cls: "text-sev-high bg-sev-high/12 ring-sev-high/25", title: "Domain registered 3 days ago", detail: "RDAP creation date · registrar NameSilo" },
  { sev: "High", cls: "text-sev-high bg-sev-high/12 ring-sev-high/25", title: "Brand impersonation in domain", detail: "“dhl” + “redelivery” on .top" },
  { sev: "Medium", cls: "text-sev-medium bg-sev-medium/12 ring-sev-medium/25", title: "Social-engineering language", detail: "“redelivery fee”, “within 24 hours”" },
];

const MODULES = [
  { icon: Link2, label: "URL" },
  { icon: Globe2, label: "Domain" },
  { icon: Radar, label: "DNS" },
  { icon: Lock, label: "SSL/TLS" },
  { icon: ScrollText, label: "Content" },
  { icon: Fingerprint, label: "Intel" },
];

export function ReportPreview() {
  return (
    <div className="relative mx-auto max-w-6xl">
      {/* fire-like edge light */}
      <div className="pointer-events-none absolute -inset-x-6 -top-8 h-32 rounded-[50%] bg-orange/40 blur-[60px]" />
      <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-orange-soft to-transparent" />
      <div className="relative overflow-hidden rounded-[28px] border border-orange/30 bg-[#0d0d10] shadow-[0_0_0_1px_rgba(255,107,0,0.12),0_40px_120px_-40px_rgba(255,107,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 hidden font-mono text-xs text-muted-foreground sm:inline">innova-checker / security-report</span>
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10.5px] tracking-wide text-muted-foreground uppercase">Example report · illustrative data</span>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[300px_1fr] lg:p-7">
          <div className="surface flex flex-col items-center rounded-2xl p-6">
            <RiskGauge score={96} verdict="MALICIOUS" size={176} />
            <span className="mt-4 rounded-full bg-v-malicious/12 px-3 py-1 text-xs font-semibold tracking-wide text-v-malicious uppercase ring-1 ring-v-malicious/30">Malicious</span>
            <p className="mt-4 text-center font-mono text-[11.5px] break-all text-white/70">https://dhl-parcel-redelivery.top/track?id=UZ8841…</p>
            <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
              {[
                ["3 days", "Domain age"],
                ["2", "Redirects"],
                ["2/5", "Intel hits"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2.5">
                  <p className="text-sm font-semibold text-white">{v}</p>
                  <p className="text-[10.5px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="surface rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <Siren className="size-4 text-orange" /> Key findings
                </h3>
                <span className="text-xs text-muted-foreground">5 of 71 checks flagged</span>
              </div>
              <ul className="mt-4 divide-y divide-white/[0.05]">
                {FINDINGS.map((f) => (
                  <li key={f.title} className="flex items-center gap-3 py-2.5">
                    <span className={`w-[70px] shrink-0 rounded-md px-2 py-0.5 text-center text-[11px] font-medium ring-1 ${f.cls}`}>{f.sev}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{f.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{f.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="surface rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <ShieldAlert className="size-4 text-orange" /> Analysis modules
                </h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {MODULES.map((m) => (
                    <div key={m.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3">
                      <m.icon className="size-4 text-white/70" />
                      <span className="text-[11px] text-white/80">{m.label}</span>
                      <Check className="size-3 text-v-safe" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="surface rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <KeyRound className="size-4 text-orange" /> Recommendation
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">Do not open this link. To check a DHL shipment, type <span className="font-mono text-orange">dhl.com</span> into the address bar yourself. If you entered a password, change it now.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
