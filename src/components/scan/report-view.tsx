"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Database,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  FileDown,
  Fingerprint,
  Globe2,
  Info,
  Lightbulb,
  Link2,
  Lock,
  Maximize2,
  Minimize2,
  Network,
  Route,
  ScanSearch,
  ScrollText,
  TriangleAlert,
} from "lucide-react";
import { MODULE_LABELS, MODULE_ORDER, type FindingDTO, type ReportDTO } from "@/lib/report-types";
import { REPORT_DISCLAIMER, reportToText } from "@/lib/report-text";
import { VERDICTS, isBlacklisted, isDeadLink, labelFor, taglineFor, type VerdictKey } from "@/lib/verdict";
import { formatDateTime, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IntelChip, RiskGauge, SeverityChip, StatusChip, VerdictBadge, VerdictNotice } from "./verdict";

const MODULE_ICONS: Record<string, typeof Link2> = {
  url: Link2,
  domain: Globe2,
  tls: Lock,
  dns: Network,
  redirects: Route,
  content: ScrollText,
  download: FileDown,
  intel: Fingerprint,
};

type Fact = [string, React.ReactNode];

function v(x: unknown, fallback = "—"): string {
  if (x === null || x === undefined || x === "") return fallback;
  if (Array.isArray(x)) return x.length ? x.join(", ") : fallback;
  return String(x);
}

function shortDate(s: string | null | undefined) {
  return s ? new Date(s).toISOString().slice(0, 10) : "—";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function factsFor(module: string, r: ReportDTO): Fact[] {
  const d = r.data;
  switch (module) {
    case "url": {
      const u = d.urlAnalysis as any;
      if (!u) return [];
      return [
        ["Scheme", v(u.scheme).toUpperCase()],
        ["Host", u.isPunycode ? `${u.hostUnicode} (${u.host})` : v(u.host)],
        ["Registrable domain", v(u.tenantDomain ?? u.registrableDomain)],
        ["Subdomain depth", v(u.subdomainDepth)],
        ["Port", v(u.port, "default")],
        ["Query parameters", v(u.paramCount)],
        ["Lure keywords", v(u.matchedKeywords, "none")],
        ["Brands referenced", v(u.brandsReferenced, "none")],
        ["Hosting platform", v(u.hostingPlatform, "not a free-hosting platform")],
        ["URL shortener", u.shortener ? "Yes" : "No"],
      ];
    }
    case "domain": {
      const x = d.domainInfo as any;
      if (!x) return [];
      return [
        ["Domain", v(x.domain)],
        ["Registrar", v(x.registrar)],
        ["Created", shortDate(x.createdAt)],
        ["Domain age", x.ageDays != null ? `${x.ageDays} days` : "—"],
        ["Expires", shortDate(x.expiresAt)],
        ["Last changed", shortDate(x.updatedAt)],
        ["Registry status", v(x.status)],
        ["Nameservers", v(x.nameservers)],
        ["Data source", x.source ? `${x.source} · ${x.sourceServer}` : "Unavailable"],
      ];
    }
    case "tls": {
      const t = d.tlsInfo as any;
      if (!t) return [];
      const c = t.details?.cert;
      return [
        ["HTTPS available", t.available ? `Yes (port ${t.probedPort})` : "No"],
        ["Protocol / cipher", t.details ? `${v(t.details.protocol)} · ${v(t.details.cipher)}` : "—"],
        ["Subject", v(c?.subjectCN)],
        ["Issuer", v(c?.issuerOrg ?? c?.issuerCN)],
        ["Valid from", shortDate(c?.validFrom)],
        ["Valid until", shortDate(c?.validTo)],
        ["Days to expiry", v(t.daysToExpiry)],
        ["Chain trusted", t.details ? (t.details.authorized ? "Yes" : `No (${v(t.details.authorizationError)})`) : "—"],
        ["Subject alt names", c?.san ? `${c.san.slice(0, 6).join(", ")}${c.san.length > 6 ? ` +${c.san.length - 6}` : ""}` : "—"],
        ["SHA-256 fingerprint", <span key="fp" className="font-mono text-[11px] break-all">{v(c?.fingerprint256)}</span>],
      ];
    }
    case "dns": {
      const x = d.dnsRecords as any;
      if (!x) return [];
      return [
        ["A", v(x.a?.map((r: any) => r.address), "none")],
        ["AAAA", v(x.aaaa?.map((r: any) => r.address), "none")],
        ["CNAME", v(x.cname, "none")],
        ["MX", v(x.mx?.map((m: any) => `${m.priority} ${m.exchange}`), "none")],
        ["NS", v(x.ns, "none")],
        ["SPF", v(x.spf, "none")],
        ["DMARC", v(x.dmarc, "none")],
        ["CAA", v(x.caa, "none")],
      ];
    }
    case "content": {
      const x = d.content as any;
      if (!x || !x.analyzed) return x?.reason ? [["Status", x.reason]] : [];
      return [
        ["Page title", v(x.title)],
        ["Description", v(x.metaDescription)],
        ["HTTP status", v(x.status)],
        ["Content type", `${v(x.contentType)} · ${v(x.charset)}`],
        ["Size analyzed", `${Number(x.bytes ?? 0).toLocaleString("en-US")} bytes${x.truncated ? " (truncated)" : ""}`],
        ["Forms", x.forms?.length ? `${x.forms.length} (${x.forms.filter((f: any) => f.hasPassword).length} with password)` : "none"],
        ["Scripts", `${v(x.inlineScriptCount)} inline · ${x.externalScripts?.length ?? 0} external`],
        ["Iframes", v(x.iframes?.length, "0")],
        ["External domains", v(x.externalDomains?.length, "0")],
        ["Server header", v(x.server)],
      ];
    }
    case "download": {
      const x = d.download as any;
      if (!x) return [];
      if (!x.isDownload) return [["Download", "The link opens a web page, not a file"]];
      return [
        ["File name", v(x.filename)],
        ["Detected type", v(x.detectedType, "unrecognized")],
        ["Category", v(x.category)],
        ["Declared MIME", v(x.declaredMime)],
        ["Bytes analyzed", `${Number(x.bytesAnalyzed ?? 0).toLocaleString("en-US")}${x.truncated ? " (size limit reached)" : ""}`],
        ["SHA-256", <span key="sha" className="font-mono text-[11px] break-all">{v(x.sha256, "not available")}</span>],
      ];
    }
    default:
      return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function counts(fs: FindingDTO[]) {
  return {
    fail: fs.filter((f) => f.status === "FAIL" || f.status === "ERROR").length,
    warn: fs.filter((f) => f.status === "WARN").length,
    pass: fs.filter((f) => f.status === "PASS").length,
    na: fs.filter((f) => ["UNAVAILABLE", "NOT_CONFIGURED", "SKIPPED"].includes(f.status)).length,
  };
}

function FindingRow({ f, forceOpen }: { f: FindingDTO; forceOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;
  const hasEvidence = !!f.evidence && typeof f.evidence === "object" && Object.keys(f.evidence as object).length > 0;
  return (
    <li className="border-b border-white/[0.05] last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-white/[0.015]" aria-expanded={isOpen}>
        <span className="mt-0.5 w-[104px] shrink-0">
          <StatusChip status={f.status} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-white">{f.title}</span>
          <span className="mt-0.5 block text-[13px] break-words text-white/60">{f.result}</span>
        </span>
        {f.weight > 0 && (
          <span className="hidden shrink-0 items-center gap-2 sm:flex">
            <SeverityChip severity={f.severity} />
            <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">+{f.weight}</span>
          </span>
        )}
        <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="mb-3 ml-1 rounded-xl border border-white/[0.06] bg-black/30 p-4 text-[13px] sm:ml-[116px]">
          <p className="leading-relaxed text-white/80">{f.explanation}</p>
          {hasEvidence && (
            <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black/50 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all text-white/70">{JSON.stringify(f.evidence, null, 2)}</pre>
          )}
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-[12px] text-muted-foreground sm:grid-cols-3">
            <div><dt className="inline">Source: </dt><dd className="inline text-white/70">{f.source}</dd></div>
            <div><dt className="inline">Checked: </dt><dd className="inline text-white/70">{formatDateTime(f.checkedAt)}</dd></div>
            <div><dt className="inline">Check ID: </dt><dd className="inline font-mono text-white/70">{f.code}</dd></div>
          </dl>
        </div>
      )}
    </li>
  );
}

function ModuleSection({ module, report, expandAll, index }: { module: string; report: ReportDTO; expandAll: boolean; index: number }) {
  const fs = report.findings.filter((f) => f.module === module);
  const c = counts(fs);
  const [open, setOpen] = useState(true);
  const Icon = MODULE_ICONS[module] ?? Info;
  const facts = factsFor(module, report);
  const run = report.modules.find((m) => m.key === module);
  const isOpen = expandAll || open;
  const redirects = module === "redirects" ? (report.data.redirects as { chain?: { url: string; status?: number; kind: string; ip?: string; note?: string }[]; hiddenDestinations?: string[] } | null) : null;

  return (
    <section id={`section-${module}`} className="surface scroll-mt-24 overflow-hidden rounded-2xl">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6" aria-expanded={isOpen}>
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25">
            <Icon className="size-4.5 text-orange" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-white">
              <span className="mr-2 text-muted-foreground tabular-nums">{index}.</span>
              {MODULE_LABELS[module]}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {run ? `${run.status === "ok" ? "Completed" : run.status === "disabled" ? "Disabled" : run.status === "skipped" ? "Skipped" : run.status === "partial" ? "Partially completed" : run.status === "unavailable" ? "Unavailable" : "Failed"} · ${formatDuration(run.durationMs)}` : "—"}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {c.fail > 0 && <span className="rounded-md bg-v-malicious/10 px-2 py-0.5 text-[11px] font-medium text-v-malicious ring-1 ring-v-malicious/25">{c.fail} fail</span>}
          {c.warn > 0 && <span className="rounded-md bg-v-suspicious/10 px-2 py-0.5 text-[11px] font-medium text-v-suspicious ring-1 ring-v-suspicious/25">{c.warn} warn</span>}
          {c.pass > 0 && <span className="hidden rounded-md bg-v-safe/10 px-2 py-0.5 text-[11px] font-medium text-v-safe ring-1 ring-v-safe/25 sm:inline">{c.pass} pass</span>}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-white/[0.05] px-5 pb-4 sm:px-6">
          {facts.length > 0 && (
            <dl className="grid gap-x-8 gap-y-2.5 border-b border-white/[0.05] py-4 sm:grid-cols-2">
              {facts.map(([k, val]) => (
                <div key={k} className="flex min-w-0 justify-between gap-4 text-[13px]">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 text-right break-words text-white/85">{val}</dd>
                </div>
              ))}
            </dl>
          )}

          {redirects?.chain && redirects.chain.length > 0 && (
            <ol className="space-y-2 border-b border-white/[0.05] py-4">
              {redirects.chain.map((h, i) => (
                <li key={`${h.url}-${i}`} className="flex items-start gap-3 text-[13px]">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] text-white/70">{i + 1}</span>
                  <span className={cn("mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] ring-1", h.kind === "blocked" || h.kind === "error" ? "text-v-malicious ring-v-malicious/30" : h.kind === "final" ? "text-v-safe ring-v-safe/30" : "text-orange ring-orange/30")}>
                    {h.kind === "meta-refresh" ? "META" : h.kind === "blocked" ? "BLOCKED" : h.kind === "error" ? "ERROR" : h.status ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[12px] break-all text-white/85">{h.url}</span>
                    {(h.ip || h.note) && <span className="block text-[11.5px] text-muted-foreground">{[h.ip && `IP ${h.ip}`, h.note].filter(Boolean).join(" · ")}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {module === "intel" ? (
            <div className="overflow-x-auto py-3">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Provider</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Result</th>
                    <th className="py-2 text-right font-medium">Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {report.intel.map((i) => (
                    <tr key={i.provider} className="border-t border-white/[0.05]">
                      <td className="py-3 pr-4 font-medium text-white">{i.providerName}</td>
                      <td className="py-3 pr-4"><IntelChip status={i.status} /></td>
                      <td className="py-3 pr-4 text-white/70">{i.summary}{i.latencyMs != null ? <span className="text-muted-foreground"> · {i.latencyMs} ms</span> : null}</td>
                      <td className="py-3 text-right text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(i.checkedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.intel.every((i) => i.status === "NOT_CONFIGURED" || i.status === "DISABLED") && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[12.5px] text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0 text-sev-info" /> No threat-intelligence provider was consulted for this scan. The verdict is based on Innova Checker&apos;s own analysis modules only.
                </p>
              )}
            </div>
          ) : null}

          <ul className="mt-1">
            {fs.map((f) => (
              <FindingRow key={f.id} f={f} forceOpen={expandAll} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}


const DB_STYLE: Record<string, { label: string; cls: string }> = {
  BLACKLIST: { label: "Blacklist match", cls: "border-v-malicious/35 bg-v-malicious/[0.06]" },
  SUSPICIOUS: { label: "Suspicious-list match", cls: "border-v-high/35 bg-v-high/[0.06]" },
  IMPERSONATION: { label: "Impersonates a verified platform", cls: "border-v-high/35 bg-v-high/[0.06]" },
  WHITELIST: { label: "Verified official domain", cls: "border-v-trusted/35 bg-v-trusted/[0.06]" },
  WHITELIST_OVERRIDDEN: { label: "Official domain — trust withheld", cls: "border-v-suspicious/35 bg-v-suspicious/[0.06]" },
  NONE: { label: "No database match", cls: "border-white/[0.08] bg-white/[0.02]" },
  UNAVAILABLE: { label: "Database unavailable", cls: "border-white/[0.08] bg-white/[0.02]" },
};

const LIST_CHIP: Record<string, string> = {
  WHITELIST: "text-v-trusted bg-v-trusted/10 ring-v-trusted/30",
  BLACKLIST: "text-v-malicious bg-v-malicious/10 ring-v-malicious/30",
  SUSPICIOUS: "text-v-high bg-v-high/10 ring-v-high/30",
};

function DomainDbCard({ db }: { db: NonNullable<ReportDTO["domainDb"]> }) {
  const st = DB_STYLE[db.decision] ?? DB_STYLE.NONE;
  return (
    <section className={cn("mt-5 rounded-2xl border p-5 sm:p-6", st.cls)} aria-label="Domain intelligence database">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-[15px] font-semibold text-white">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
            <Database className="size-4.5 text-orange" />
          </span>
          Domain intelligence database
        </h2>
        <span className="text-xs font-semibold tracking-wide text-white/80 uppercase">{st.label}</span>
      </div>
      <p className="mt-3 text-sm text-white/80">{db.reason}</p>
      {db.impersonates && (
        <p className="mt-2 text-[13px] text-white/70">
          Imitates <strong className="text-white">{db.impersonates.brand}</strong>. Official domains: <span className="font-mono text-v-trusted">{db.impersonates.officialDomains.join(", ")}</span>
        </p>
      )}
      {db.matches.length > 0 && (
        <ul className="mt-4 space-y-3">
          {db.matches.map((m) => (
            <li key={`${m.record.id}-${m.host}`} className="rounded-xl border border-white/[0.07] bg-black/25 p-4 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1", LIST_CHIP[m.record.listType])}>{m.record.listType}</span>
                <span className="font-mono text-white">{m.record.domain}</span>
                <span className="text-muted-foreground">· matched {m.host} ({m.matchType})</span>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {m.record.platformName && <div><dt className="inline text-muted-foreground">Platform: </dt><dd className="inline text-white/85">{m.record.platformName}</dd></div>}
                {m.record.companyName && <div><dt className="inline text-muted-foreground">Company: </dt><dd className="inline text-white/85">{m.record.companyName}</dd></div>}
                {m.record.category && <div><dt className="inline text-muted-foreground">Category: </dt><dd className="inline text-white/85">{m.record.category}</dd></div>}
                <div><dt className="inline text-muted-foreground">Trust status: </dt><dd className="inline text-white/85">{m.record.trustStatus.replace(/_/g, " ").toLowerCase()}</dd></div>
                <div className="sm:col-span-2"><dt className="inline text-muted-foreground">Verification source: </dt><dd className="inline break-words text-white/85">{m.record.verificationSource ?? "—"}</dd></div>
                <div><dt className="inline text-muted-foreground">Verified: </dt><dd className="inline text-white/85">{formatDateTime(m.record.verifiedAt)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReportView({ report, backHref, scanAgainHref, defaultExpanded = false, extraActions }: { report: ReportDTO; backHref: string; scanAgainHref: string; defaultExpanded?: boolean; extraActions?: React.ReactNode }) {
  const [expandAll, setExpandAll] = useState(defaultExpanded);
  const verdict = (report.verdict ?? "INCONCLUSIVE") as VerdictKey;
  const meta = VERDICTS[verdict];
  const deadLink = isDeadLink(report);
  const blacklisted = isBlacklisted(report);
  const top = useMemo(() => report.findings.filter((f) => f.weight > 0).slice(0, 5), [report.findings]);
  const cov = report.scoring?.coverage;
  const sections = MODULE_ORDER.filter((m) => report.findings.some((f) => f.module === m) || m === "intel");

  async function copy() {
    try {
      await navigator.clipboard.writeText(reportToText(report));
      toast.success("Report copied to clipboard");
    } catch {
      toast.error("Copy failed. Your browser blocked clipboard access.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <Link href={backHref} className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white" aria-label="Back">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-orange">Security Report</p>
            <h1 className="mt-1 font-mono text-lg break-all text-white sm:text-xl">{report.domain}</h1>
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Scan ID: <span className="font-mono">{report.id}</span></span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3" /> {formatDateTime(report.completedAt ?? report.createdAt)}</span>
              <span>Duration: {formatDuration(report.durationMs)}</span>
              <span>Status: <span className="text-v-safe">completed</span></span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/scans/${report.id}/pdf`} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <Download className="size-4" /> Download PDF Report
          </a>
          <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">
            <Copy className="size-4" /> Copy Report
          </button>
          <button type="button" onClick={() => setExpandAll((e) => !e)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]" aria-pressed={expandAll}>
            {expandAll ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />} {expandAll ? "Collapse Analysis" : "View Full Analysis"}
          </button>
          <Link href={scanAgainHref} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">
            <ScanSearch className="size-4" /> Scan Another URL
          </Link>
          {extraActions}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr_1fr]">
        <div className="surface relative flex flex-col items-center overflow-hidden rounded-2xl p-6">
          <div className="pointer-events-none absolute -top-16 h-40 w-40 rounded-full blur-3xl" style={{ background: meta.color, opacity: 0.18 }} />
          <RiskGauge score={report.riskScore ?? 0} verdict={verdict} size={184} />
          <VerdictBadge verdict={verdict} size="lg" className="mt-3" label={labelFor(verdict, blacklisted)} />
          <p className="mt-3 text-sm text-white/80">{taglineFor(verdict, deadLink, blacklisted)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Risk level: <span className="text-white/80">{report.riskLevel ?? "—"}</span></p>
        </div>

        <div className="surface rounded-2xl p-6">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Target</h2>
          <dl className="mt-4 space-y-3.5 text-[13px]">
            <div>
              <dt className="text-muted-foreground">Scanned URL</dt>
              <dd className="mt-1 font-mono text-[12.5px] break-all text-white">{report.normalizedUrl}</dd>
            </div>
            {report.finalUrl && report.finalUrl !== report.normalizedUrl && (
              <div>
                <dt className="text-muted-foreground">Final destination</dt>
                <dd className="mt-1 font-mono text-[12.5px] break-all text-orange">{report.finalUrl}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">Domain</dt>
                <dd className="mt-1 break-all text-white">{report.registrableDomain ?? report.domain}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Scan date</dt>
                <dd className="mt-1 text-white">{formatDateTime(report.completedAt ?? report.createdAt)}</dd>
              </div>
            </div>
          </dl>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Analysis coverage</span>
              <span className="font-medium text-white">{report.confidence ?? 0}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-soft to-orange" style={{ width: `${report.confidence ?? 0}%` }} />
            </div>
            {cov && (
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                {cov.modulesOk}/{cov.modulesEnabled} analysis modules completed{deadLink ? " (the rest need a live website)" : ""} · {cov.providersRun}/{report.intel.length || 5} threat-intel providers consulted
              </p>
            )}
          </div>
        </div>

        <div className="surface rounded-2xl p-6">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Verdict summary</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-white/85">{report.summary}</p>
          {top.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {top.map((f) => (
                <li key={f.id}>
                  <a href={`#section-${f.module}`} className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-[13px] hover:bg-white/[0.03]">
                    <SeverityChip severity={f.severity} />
                    <span className="min-w-0 flex-1 truncate text-white/85">{f.title}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">+{f.weight}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[13px] text-muted-foreground">No risk-scoring findings were raised.</p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-v-malicious/30 bg-v-malicious/[0.06] px-5 py-4">
        <VerdictNotice verdict={verdict} deadLink={deadLink} blacklisted={blacklisted} />
      </div>

      {report.domainDb && <DomainDbCard db={report.domainDb} />}

      {/* Sections */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {sections.map((m, i) => (
            <ModuleSection key={m} module={m} report={report} expandAll={expandAll} index={i + 1} />
          ))}

          <section id="section-recommendations" className="surface scroll-mt-24 rounded-2xl p-5 sm:p-6">
            <h2 className="flex items-center gap-3 text-[15px] font-semibold text-white">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25">
                <Lightbulb className="size-4.5 text-orange" />
              </span>
              <span><span className="mr-2 text-muted-foreground">9.</span>Security Recommendations</span>
            </h2>
            <ol className="mt-4 space-y-3">
              {report.recommendations.map((r, i) => (
                <li key={r} className="flex gap-3 text-sm leading-relaxed text-white/85">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange/15 text-[12px] font-semibold text-orange">{i + 1}</span>
                  {r}
                </li>
              ))}
            </ol>
          </section>

          <VerdictNotice verdict={verdict} deadLink={deadLink} blacklisted={blacklisted} className="px-1" />

          <div className="flex gap-3 rounded-2xl border border-v-suspicious/20 bg-v-suspicious/[0.05] p-5 text-[13px] leading-relaxed text-white/75">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-v-suspicious" />
            <p><strong className="text-white">Disclaimer.</strong> {REPORT_DISCLAIMER}</p>
          </div>
        </div>

        <aside className="hidden lg:block">
          <nav className="surface sticky top-24 rounded-2xl p-4" aria-label="Report sections">
            <p className="px-2 pb-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Sections</p>
            <ul className="space-y-0.5">
              {sections.map((m, i) => {
                const c = counts(report.findings.filter((f) => f.module === m));
                const Icon = MODULE_ICONS[m];
                return (
                  <li key={m}>
                    <a href={`#section-${m}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white">
                      <span className="flex items-center gap-2"><Icon className="size-3.5 text-orange" /> {i + 1}. {MODULE_LABELS[m]}</span>
                      {c.fail + c.warn > 0 ? <span className={cn("size-2 rounded-full", c.fail ? "bg-v-malicious" : "bg-v-suspicious")} /> : <span className="size-2 rounded-full bg-v-safe/70" />}
                    </a>
                  </li>
                );
              })}
              <li>
                <a href="#section-recommendations" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white">
                  <Lightbulb className="size-3.5 text-orange" /> 9. Recommendations
                </a>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
