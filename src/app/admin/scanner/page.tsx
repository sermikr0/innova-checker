import { PageHeader } from "@/components/common/app-shell";
import { ScannerConfigForm } from "@/components/admin/settings-forms";
import { prisma } from "@/server/db";
import { msAgo } from "@/server/dashboard";
import { resolveProviderKeys } from "@/server/integrations";
import { getScannerSettings } from "@/server/settings";
import { providerCatalog } from "@/server/scanner/intel/providers";

export default async function AdminScanner() {
  const since = msAgo(24 * 3600_000);
  const [settings, recent, failed, intel] = await Promise.all([
    getScannerSettings(),
    prisma.scan.findMany({ where: { status: "COMPLETED", createdAt: { gte: since } }, select: { durationMs: true, confidence: true } }),
    prisma.scan.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
    prisma.threatIntelligenceResult.groupBy({ by: ["provider", "status"], where: { checkedAt: { gte: since } }, _count: true }),
  ]);
  const providers = providerCatalog(await resolveProviderKeys());
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  return (
    <>
      <PageHeader eyebrow="Engine" title="Scanner configuration" description="Settings are stored in the database and apply to the next scan. Administrators can tune data and thresholds but cannot add executable code." />
      <section className="surface mb-5 rounded-2xl p-6">
        <h2 className="text-[15px] font-semibold text-white">Scanner health (last 24 hours)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div><p className="text-2xl font-semibold text-white">{recent.length}</p><p className="text-xs text-muted-foreground">completed scans</p></div>
          <div><p className="text-2xl font-semibold text-white">{failed}</p><p className="text-xs text-muted-foreground">failed scans</p></div>
          <div><p className="text-2xl font-semibold text-white">{(avg(recent.map((r) => r.durationMs ?? 0)) / 1000).toFixed(1)} s</p><p className="text-xs text-muted-foreground">average duration</p></div>
          <div><p className="text-2xl font-semibold text-white">{avg(recent.map((r) => r.confidence ?? 0))}%</p><p className="text-xs text-muted-foreground">average coverage</p></div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead><tr className="text-xs text-muted-foreground"><th className="py-2 pr-4 font-medium">Provider</th><th className="py-2 pr-4 font-medium">API key</th><th className="py-2 pr-4 font-medium">Enabled</th><th className="py-2 font-medium">Results (24h)</th></tr></thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-t border-white/[0.05]">
                  <td className="py-2.5 pr-4 text-white">{p.name}</td>
                  <td className={`py-2.5 pr-4 ${p.configured ? "text-v-safe" : "text-muted-foreground"}`}>{p.configured ? "configured" : "not configured"}</td>
                  <td className="py-2.5 pr-4 text-white/75">{settings.providers[p.id as keyof typeof settings.providers] ? "yes" : "no"}</td>
                  <td className="py-2.5 text-white/70">{intel.filter((i) => i.provider === p.id).map((i) => `${i.status.toLowerCase()} ${i._count}`).join(" · ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <ScannerConfigForm providers={providers} initial={{ modules: settings.modules, providers: settings.providers, weights: settings.weights, suspiciousKeywords: settings.suspiciousKeywords, suspiciousTlds: settings.suspiciousTlds, urlShorteners: settings.urlShorteners, suspiciousDomainPatterns: settings.suspiciousDomainPatterns, trustedDomains: settings.trustedDomains, requestTimeoutMs: settings.requestTimeoutMs, scanTimeoutMs: settings.scanTimeoutMs, maxRedirects: settings.maxRedirects, maxResponseBytes: settings.maxResponseBytes, maxDownloadBytes: settings.maxDownloadBytes, userAgent: settings.userAgent, virusTotalSubmitUnknown: settings.virusTotalSubmitUnknown }} />
    </>
  );
}
