import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/app-shell";
import { RefreshQuotaButton, RemoveKeyButton, ReplaceKeyDialog } from "@/components/admin/integration-forms";
import { prisma } from "@/server/db";
import { msAgo } from "@/server/dashboard";
import { listIntegrations, quotaPressure, refreshVirusTotalQuota, type QuotaLine } from "@/server/integrations";
import { PROVIDERS } from "@/server/scanner/intel/providers";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function QuotaBar({ label, q }: { label: string; q: QuotaLine | null }) {
  if (!q) return null;
  const pct = q.allowed ? Math.min(100, Math.round((q.used / q.allowed) * 100)) : 0;
  const tone = pct >= 95 ? "from-v-malicious to-v-malicious" : pct >= 80 ? "from-v-suspicious to-v-high" : "from-orange-soft to-orange";
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm"><span className="text-white/80">{label}</span><span className="font-mono text-white tabular-nums">{q.used.toLocaleString("en-US")} / {q.allowed.toLocaleString("en-US")} <span className="text-muted-foreground">({pct}%)</span></span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={cn("h-full rounded-full bg-gradient-to-r", tone)} style={{ width: `${Math.max(pct, 1)}%` }} /></div>
    </div>
  );
}

export default async function IntegrationsPage() {
  const [items, vtCallsToday] = await Promise.all([listIntegrations(), prisma.threatIntelligenceResult.count({ where: { provider: "virusTotal", status: { in: ["CLEAN", "MALICIOUS", "SUSPICIOUS", "UNKNOWN"] }, checkedAt: { gte: msAgo(24 * 3600_000) } } })]);
  let quota = null;
  let quotaError: string | null = null;
  try {
    quota = await refreshVirusTotalQuota(60_000);
  } catch (e) {
    quotaError = (e as Error).message;
  }
  const pressure = quotaPressure(quota);
  const vt = items.find((i) => i.id === "virusTotal");
  return (
    <>
      <PageHeader eyebrow="Threat intelligence" title="Integrations & API keys" description="Keys saved here are encrypted (AES-256-GCM) and override environment variables. They are never sent to the browser." />

      <section className={cn("surface mb-6 rounded-2xl p-6", pressure.level === "critical" && "border-v-malicious/40", pressure.level === "warn" && "border-v-suspicious/40")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-white">VirusTotal quota</h2>
            <p className="mt-1 text-xs text-muted-foreground">{vt?.source === "none" ? "No VirusTotal key configured." : `Key ••••${vt?.hint} (${vt?.source})${quota?.user ? ` · account ${quota.user}` : ""} · ${quota?.perMinute ?? 4} requests/minute enforced by Innova Checker · ${vtCallsToday} scan lookup(s) in the last 24 h (repeat URLs are served from a 6-hour cache)`}</p>
          </div>
          <span className="flex gap-2">{vt && vt.source !== "none" && <RefreshQuotaButton />}{vt && <ReplaceKeyDialog provider="virusTotal" name="VirusTotal" hasKey={vt.source !== "none"} />}</span>
        </div>
        {pressure.level !== "ok" && (
          <p className={cn("mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold", pressure.level === "critical" ? "bg-v-malicious/10 text-v-malicious" : "bg-v-suspicious/10 text-v-suspicious")}>
            <AlertTriangle className="size-4" /> {pressure.level === "critical" ? "VirusTotal quota is almost exhausted. Replace the API key now to keep threat-intelligence lookups working." : "VirusTotal quota is above 80%. Prepare a replacement API key."}
          </p>
        )}
        {quotaError && <p className="mt-4 text-sm text-v-malicious">Quota check failed: {quotaError}</p>}
        {quota && (
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <QuotaBar label="Today (daily)" q={quota.daily} />
            <QuotaBar label="This hour" q={quota.hourly} />
            <QuotaBar label="This month" q={quota.monthly} />
          </div>
        )}
        {vt?.quotaCheckedAt && <p className="mt-4 text-[11px] text-muted-foreground">Quota reported by VirusTotal · checked {formatDateTime(vt.quotaCheckedAt)}</p>}
      </section>

      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3.5 font-medium">Provider</th><th className="px-4 py-3.5 font-medium">Used for</th><th className="px-4 py-3.5 font-medium">Key</th><th className="px-4 py-3.5 font-medium">Source</th><th className="px-4 py-3.5" /></tr></thead>
          <tbody>
            {items.map((i) => {
              const meta = PROVIDERS.find((p) => p.id === i.id);
              return (
                <tr key={i.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3.5 font-medium text-white">{meta?.name ?? i.id}</td>
                  <td className="px-4 py-3.5 text-[13px] text-white/70">{meta?.scope}</td>
                  <td className="px-4 py-3.5 font-mono text-[13px] text-white/85">{i.hint ? `••••${i.hint}` : "—"}</td>
                  <td className={cn("px-4 py-3.5 text-xs font-semibold", i.source === "none" ? "text-muted-foreground" : "text-v-safe")}>{i.source === "database" ? `admin panel · ${formatDateTime(i.updatedAt)}` : i.source === "environment" ? "environment variable" : "not configured"}</td>
                  <td className="px-4 py-3.5"><span className="flex justify-end gap-2"><ReplaceKeyDialog provider={i.id} name={meta?.name ?? i.id} hasKey={i.source !== "none"} />{i.source === "database" && <RemoveKeyButton provider={i.id} name={meta?.name ?? i.id} />}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
