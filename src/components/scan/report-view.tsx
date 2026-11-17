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
import { reportToText } from "@/lib/report-text";
import { VERDICTS, isBlacklisted, isDeadLink, labelFor, taglineFor, type VerdictKey } from "@/lib/verdict";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { reportText } from "@/i18n/messages/report";
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
type ReportT = (typeof reportText)["en"];

/** Translated label from a keyed message map, or undefined for unknown keys. */
function lookup(map: object, key: string): string | undefined {
  return (map as Record<string, string | undefined>)[key];
}

function v(x: unknown, fallback = "—"): string {
  if (x === null || x === undefined || x === "") return fallback;
  if (Array.isArray(x)) return x.length ? x.join(", ") : fallback;
  return String(x);
}

function shortDate(s: string | null | undefined) {
  return s ? new Date(s).toISOString().slice(0, 10) : "—";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function factsFor(module: string, r: ReportDTO, t: ReportT["facts"], locale: Locale): Fact[] {
  const d = r.data;
  switch (module) {
    case "url": {
      const u = d.urlAnalysis as any;
      if (!u) return [];
      return [
        [t.scheme, v(u.scheme).toUpperCase()],
        [t.host, u.isPunycode ? `${u.hostUnicode} (${u.host})` : v(u.host)],
        [t.registrableDomain, v(u.tenantDomain ?? u.registrableDomain)],
        [t.subdomainDepth, v(u.subdomainDepth)],
        [t.port, v(u.port, t.portDefault)],
        [t.queryParams, v(u.paramCount)],
        [t.lureKeywords, v(u.matchedKeywords, t.none)],
        [t.brandsReferenced, v(u.brandsReferenced, t.none)],
        [t.hostingPlatform, v(u.hostingPlatform, t.notFreeHosting)],
        [t.urlShortener, u.shortener ? t.yes : t.no],
      ];
    }
    case "domain": {
      const x = d.domainInfo as any;
      if (!x) return [];
      return [
        [t.domain, v(x.domain)],
        [t.registrar, v(x.registrar)],
        [t.created, shortDate(x.createdAt)],
        [t.domainAge, x.ageDays != null ? t.days(x.ageDays) : "—"],
        [t.expires, shortDate(x.expiresAt)],
        [t.lastChanged, shortDate(x.updatedAt)],
        [t.registryStatus, v(x.status)],
        [t.nameservers, v(x.nameservers)],
        [t.dataSource, x.source ? `${x.source} · ${x.sourceServer}` : t.unavailable],
      ];
    }
    case "tls": {
      const tls = d.tlsInfo as any;
      if (!tls) return [];
      const c = tls.details?.cert;
      return [
        [t.httpsAvailable, tls.available ? t.yesPort(String(tls.probedPort)) : t.no],
        [t.protocolCipher, tls.details ? `${v(tls.details.protocol)} · ${v(tls.details.cipher)}` : "—"],
        [t.subject, v(c?.subjectCN)],
        [t.issuer, v(c?.issuerOrg ?? c?.issuerCN)],
        [t.validFrom, shortDate(c?.validFrom)],
        [t.validUntil, shortDate(c?.validTo)],
        [t.daysToExpiry, v(tls.daysToExpiry)],
        [t.chainTrusted, tls.details ? (tls.details.authorized ? t.yes : t.noBecause(v(tls.details.authorizationError))) : "—"],
        [t.subjectAltNames, c?.san ? `${c.san.slice(0, 6).join(", ")}${c.san.length > 6 ? ` +${c.san.length - 6}` : ""}` : "—"],
        [t.sha256Fingerprint, <span key="fp" className="font-mono text-[11px] break-all">{v(c?.fingerprint256)}</span>],
      ];
    }
    case "dns": {
      const x = d.dnsRecords as any;
      if (!x) return [];
      return [
        ["A", v(x.a?.map((r: any) => r.address), t.none)],
        ["AAAA", v(x.aaaa?.map((r: any) => r.address), t.none)],
        ["CNAME", v(x.cname, t.none)],
        ["MX", v(x.mx?.map((m: any) => `${m.priority} ${m.exchange}`), t.none)],
        ["NS", v(x.ns, t.none)],
        ["SPF", v(x.spf, t.none)],
        ["DMARC", v(x.dmarc, t.none)],
        ["CAA", v(x.caa, t.none)],
      ];
    }
    case "content": {
      const x = d.content as any;
      if (!x || !x.analyzed) return x?.reason ? [[t.status, x.reason]] : [];
      const bytes = Number(x.bytes ?? 0);
      return [
        [t.pageTitle, v(x.title)],
        [t.description, v(x.metaDescription)],
        [t.httpStatus, v(x.status)],
        [t.contentType, `${v(x.contentType)} · ${v(x.charset)}`],
        [t.sizeAnalyzed, `${t.bytes(bytes, formatNumber(bytes, locale))}${x.truncated ? t.truncated : ""}`],
        [t.forms, x.forms?.length ? t.formsWithPassword(x.forms.length, x.forms.filter((f: any) => f.hasPassword).length) : t.none],
        [t.scripts, t.scriptsCount(v(x.inlineScriptCount), x.externalScripts?.length ?? 0)],
        [t.iframes, v(x.iframes?.length, "0")],
        [t.externalDomains, v(x.externalDomains?.length, "0")],
        [t.serverHeader, v(x.server)],
      ];
    }
    case "download": {
      const x = d.download as any;
      if (!x) return [];
      if (!x.isDownload) return [[t.download, t.opensWebPage]];
      return [
        [t.fileName, v(x.filename)],
        [t.detectedType, v(x.detectedType, t.unrecognized)],
        [t.category, v(x.category)],
        [t.declaredMime, v(x.declaredMime)],
        [t.bytesAnalyzed, `${formatNumber(Number(x.bytesAnalyzed ?? 0), locale)}${x.truncated ? t.sizeLimitReached : ""}`],
        ["SHA-256", <span key="sha" className="font-mono text-[11px] break-all">{v(x.sha256, t.notAvailable)}</span>],
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
  const t = useT(reportText);
  const locale = useLocale();
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
            <div><dt className="inline">{t.finding.source}</dt><dd className="inline text-white/70">{f.source}</dd></div>
            <div><dt className="inline">{t.finding.checked}</dt><dd className="inline text-white/70">{formatDateTime(f.checkedAt, locale)}</dd></div>
            <div><dt className="inline">{t.finding.checkId}</dt><dd className="inline font-mono text-white/70">{f.code}</dd></div>
          </dl>
        </div>
      )}
    </li>
  );
}

function ModuleSection({ module, report, expandAll, index }: { module: string; report: ReportDTO; expandAll: boolean; index: number }) {
  const t = useT(reportText);
  const locale = useLocale();
  const fs = report.findings.filter((f) => f.module === module);
  const c = counts(fs);
  const [open, setOpen] = useState(true);
  const Icon = MODULE_ICONS[module] ?? Info;
  const facts = factsFor(module, report, t.facts, locale);
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
              {lookup(t.modules, module) ?? MODULE_LABELS[module]}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {run ? `${run.status === "ok" ? t.run.completed : run.status === "disabled" ? t.run.disabled : run.status === "skipped" ? t.run.skipped : run.status === "partial" ? t.run.partial : run.status === "unavailable" ? t.run.unavailable : t.run.failed} · ${formatDuration(run.durationMs, locale)}` : "—"}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {c.fail > 0 && <span className="rounded-md bg-v-malicious/10 px-2 py-0.5 text-[11px] font-medium text-v-malicious ring-1 ring-v-malicious/25">{t.badges.fail(c.fail)}</span>}
          {c.warn > 0 && <span className="rounded-md bg-v-suspicious/10 px-2 py-0.5 text-[11px] font-medium text-v-suspicious ring-1 ring-v-suspicious/25">{t.badges.warn(c.warn)}</span>}
          {c.pass > 0 && <span className="hidden rounded-md bg-v-safe/10 px-2 py-0.5 text-[11px] font-medium text-v-safe ring-1 ring-v-safe/25 sm:inline">{t.badges.pass(c.pass)}</span>}
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
                    {h.kind === "meta-refresh" ? "META" : h.kind === "blocked" ? t.redirectBlocked : h.kind === "error" ? t.redirectError : h.status ?? "—"}
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
                    <th className="py-2 pr-4 font-medium">{t.intel.provider}</th>
                    <th className="py-2 pr-4 font-medium">{t.intel.status}</th>
                    <th className="py-2 pr-4 font-medium">{t.intel.result}</th>
                    <th className="py-2 text-right font-medium">{t.intel.checked}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.intel.map((i) => (
                    <tr key={i.provider} className="border-t border-white/[0.05]">
                      <td className="py-3 pr-4 font-medium text-white">{i.providerName}</td>
                      <td className="py-3 pr-4"><IntelChip status={i.status} /></td>
                      <td className="py-3 pr-4 text-white/70">{i.summary}{i.latencyMs != null ? <span className="text-muted-foreground"> · {t.intel.ms(i.latencyMs)}</span> : null}</td>
                      <td className="py-3 text-right text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(i.checkedAt, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.intel.every((i) => i.status === "NOT_CONFIGURED" || i.status === "DISABLED") && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[12.5px] text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0 text-sev-info" /> {t.intel.noProviders}
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


// Labels live in reportText.db.decision (same keys).
const DB_STYLE: Record<string, { cls: string }> = {
  BLACKLIST: { cls: "border-v-malicious/35 bg-v-malicious/[0.06]" },
  SUSPICIOUS: { cls: "border-v-high/35 bg-v-high/[0.06]" },
  IMPERSONATION: { cls: "border-v-high/35 bg-v-high/[0.06]" },
  WHITELIST: { cls: "border-v-trusted/35 bg-v-trusted/[0.06]" },
  WHITELIST_OVERRIDDEN: { cls: "border-v-suspicious/35 bg-v-suspicious/[0.06]" },
  NONE: { cls: "border-white/[0.08] bg-white/[0.02]" },
  UNAVAILABLE: { cls: "border-white/[0.08] bg-white/[0.02]" },
};

const LIST_CHIP: Record<string, string> = {
  WHITELIST: "text-v-trusted bg-v-trusted/10 ring-v-trusted/30",
  BLACKLIST: "text-v-malicious bg-v-malicious/10 ring-v-malicious/30",
  SUSPICIOUS: "text-v-high bg-v-high/10 ring-v-high/30",
};

function DomainDbCard({ db }: { db: NonNullable<ReportDTO["domainDb"]> }) {
  const t = useT(reportText);
  const locale = useLocale();
  const decision = DB_STYLE[db.decision] ? db.decision : "NONE";
  const st = DB_STYLE[decision];
  return (
    <section className={cn("mt-5 rounded-2xl border p-5 sm:p-6", st.cls)} aria-label={t.db.title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-[15px] font-semibold text-white">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
            <Database className="size-4.5 text-orange" />
          </span>
          {t.db.title}
        </h2>
        <span className="text-xs font-semibold tracking-wide text-white/80 uppercase">{lookup(t.db.decision, decision)}</span>
      </div>
      <p className="mt-3 text-sm text-white/80">{db.reason}</p>
      {db.impersonates && (
        <p className="mt-2 text-[13px] text-white/70">
          {t.db.imitatesBefore}<strong className="text-white">{db.impersonates.brand}</strong>{t.db.imitatesAfter}<span className="font-mono text-v-trusted">{db.impersonates.officialDomains.join(", ")}</span>
        </p>
      )}
      {db.matches.length > 0 && (
        <ul className="mt-4 space-y-3">
          {db.matches.map((m) => (
            <li key={`${m.record.id}-${m.host}`} className="rounded-xl border border-white/[0.07] bg-black/25 p-4 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1", LIST_CHIP[m.record.listType])}>{lookup(t.db.listType, m.record.listType) ?? m.record.listType}</span>
                <span className="font-mono text-white">{m.record.domain}</span>
                <span className="text-muted-foreground">{t.db.matched(m.host, lookup(t.db.matchType, m.matchType) ?? m.matchType)}</span>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {m.record.platformName && <div><dt className="inline text-muted-foreground">{t.db.platform}</dt><dd className="inline text-white/85">{m.record.platformName}</dd></div>}
                {m.record.companyName && <div><dt className="inline text-muted-foreground">{t.db.company}</dt><dd className="inline text-white/85">{m.record.companyName}</dd></div>}
                {m.record.category && <div><dt className="inline text-muted-foreground">{t.db.category}</dt><dd className="inline text-white/85">{m.record.category}</dd></div>}
                <div><dt className="inline text-muted-foreground">{t.db.trustStatus}</dt><dd className="inline text-white/85">{lookup(t.db.trust, m.record.trustStatus) ?? m.record.trustStatus.replace(/_/g, " ").toLowerCase()}</dd></div>
                <div className="sm:col-span-2"><dt className="inline text-muted-foreground">{t.db.verificationSource}</dt><dd className="inline break-words text-white/85">{m.record.verificationSource ?? "—"}</dd></div>
                <div><dt className="inline text-muted-foreground">{t.db.verified}</dt><dd className="inline text-white/85">{formatDateTime(m.record.verifiedAt, locale)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReportView({ report, backHref, scanAgainHref, defaultExpanded = false, extraActions }: { report: ReportDTO; backHref: string; scanAgainHref: string; defaultExpanded?: boolean; extraActions?: React.ReactNode }) {
  const t = useT(reportText);
  const locale = useLocale();
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
      await navigator.clipboard.writeText(reportToText(report, locale));
      toast.success(t.copied);
    } catch {
      toast.error(t.copyFailed);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <Link href={backHref} className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white" aria-label={t.back}>
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-orange">{t.eyebrow}</p>
            <h1 className="mt-1 font-mono text-lg break-all text-white sm:text-xl">{report.domain}</h1>
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{t.scanId} <span className="font-mono">{report.id}</span></span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3" /> {formatDateTime(report.completedAt ?? report.createdAt, locale)}</span>
              <span>{t.duration} {formatDuration(report.durationMs, locale)}</span>
              <span>{t.status} <span className="text-v-safe">{t.completed}</span></span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/scans/${report.id}/pdf`} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <Download className="size-4" /> {t.downloadPdf}
          </a>
          <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">
            <Copy className="size-4" /> {t.copyReport}
          </button>
          <button type="button" onClick={() => setExpandAll((e) => !e)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]" aria-pressed={expandAll}>
            {expandAll ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />} {expandAll ? t.collapse : t.expand}
          </button>
          <Link href={scanAgainHref} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">
            <ScanSearch className="size-4" /> {t.scanAnother}
          </Link>
          {extraActions}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr_1fr]">
        <div className="surface relative flex flex-col items-center overflow-hidden rounded-2xl p-6">
          <div className="pointer-events-none absolute -top-16 h-40 w-40 rounded-full blur-3xl" style={{ background: meta.color, opacity: 0.18 }} />
          <RiskGauge score={report.riskScore ?? 0} verdict={verdict} size={184} />
          <VerdictBadge verdict={verdict} size="lg" className="mt-3" label={labelFor(verdict, blacklisted, locale)} />
          <p className="mt-3 text-sm text-white/80">{taglineFor(verdict, deadLink, blacklisted, locale)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.riskLevel} <span className="text-white/80">{report.riskLevel != null ? (lookup(t.riskLevels, report.riskLevel) ?? report.riskLevel) : "—"}</span></p>
        </div>

        <div className="surface rounded-2xl p-6">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{t.target}</h2>
          <dl className="mt-4 space-y-3.5 text-[13px]">
            <div>
              <dt className="text-muted-foreground">{t.scannedUrl}</dt>
              <dd className="mt-1 font-mono text-[12.5px] break-all text-white">{report.normalizedUrl}</dd>
            </div>
            {report.finalUrl && report.finalUrl !== report.normalizedUrl && (
              <div>
                <dt className="text-muted-foreground">{t.finalDestination}</dt>
                <dd className="mt-1 font-mono text-[12.5px] break-all text-orange">{report.finalUrl}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">{t.domain}</dt>
                <dd className="mt-1 break-all text-white">{report.registrableDomain ?? report.domain}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.scanDate}</dt>
                <dd className="mt-1 text-white">{formatDateTime(report.completedAt ?? report.createdAt, locale)}</dd>
              </div>
            </div>
          </dl>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t.coverage}</span>
              <span className="font-medium text-white">{report.confidence ?? 0}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-soft to-orange" style={{ width: `${report.confidence ?? 0}%` }} />
            </div>
            {cov && (
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                {t.modulesCompleted(cov.modulesOk, cov.modulesEnabled)}{deadLink ? t.restNeedLiveSite : ""} · {t.providersConsulted(cov.providersRun, report.intel.length || 5)}
              </p>
            )}
          </div>
        </div>

        <div className="surface rounded-2xl p-6">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{t.verdictSummary}</h2>
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
            <p className="mt-4 text-[13px] text-muted-foreground">{t.noFindings}</p>
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
              <span><span className="mr-2 text-muted-foreground">9.</span>{t.recommendations}</span>
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
            <p><strong className="text-white">{t.disclaimerTitle}</strong> {t.disclaimer}</p>
          </div>
        </div>

        <aside className="hidden lg:block">
          <nav className="surface sticky top-24 rounded-2xl p-4" aria-label={t.sectionsAria}>
            <p className="px-2 pb-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{t.sections}</p>
            <ul className="space-y-0.5">
              {sections.map((m, i) => {
                const c = counts(report.findings.filter((f) => f.module === m));
                const Icon = MODULE_ICONS[m];
                return (
                  <li key={m}>
                    <a href={`#section-${m}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white">
                      <span className="flex items-center gap-2"><Icon className="size-3.5 text-orange" /> {i + 1}. {lookup(t.modules, m) ?? MODULE_LABELS[m]}</span>
                      {c.fail + c.warn > 0 ? <span className={cn("size-2 rounded-full", c.fail ? "bg-v-malicious" : "bg-v-suspicious")} /> : <span className="size-2 rounded-full bg-v-safe/70" />}
                    </a>
                  </li>
                );
              })}
              <li>
                <a href="#section-recommendations" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white">
                  <Lightbulb className="size-3.5 text-orange" /> 9. {t.navRecommendations}
                </a>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
