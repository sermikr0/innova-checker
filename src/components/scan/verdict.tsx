"use client";

import { BadgeCheck, CircleAlert, TriangleAlert, CircleCheck, CircleHelp, OctagonAlert, ShieldAlert, ShieldCheck } from "lucide-react";
import { CHECK_STATUS, INTEL_STATUS, SEVERITY, VERDICTS, checkStatusLabel, intelStatusLabel, labelFor, noticeFor, severityLabel, type CheckStatusKey, type SeverityKey, type VerdictKey } from "@/lib/verdict";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n/client";
import { scanText } from "@/i18n/messages/report-scan";

export function RiskGauge({ score, verdict, size = 168 }: { score: number; verdict: VerdictKey; size?: number }) {
  const t = useT(scanText);
  const locale = useLocale();
  const stroke = Math.max(8, Math.round(size / 15));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = 0.78; // open ring, like a speedometer
  const filled = c * arc * Math.min(1, Math.max(0, score / 100));
  const color = VERDICTS[verdict].color;
  const id = `g-${verdict}-${size}`;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={t.gaugeLabel(score, labelFor(verdict, false, locale))}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[129.6deg]">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} strokeDasharray={`${c * arc} ${c}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeDasharray={`${filled} ${c}`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold tracking-tight text-white tabular-nums" style={{ fontSize: size * 0.27 }}>
          {score}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: Math.max(11, size * 0.075) }}>
          /100
        </span>
      </div>
    </div>
  );
}

const VERDICT_ICON: Record<VerdictKey, typeof ShieldCheck> = {
  TRUSTED: BadgeCheck,
  SAFE: ShieldCheck,
  LOW_RISK: CircleCheck,
  SUSPICIOUS: CircleAlert,
  HIGH_RISK: ShieldAlert,
  MALICIOUS: OctagonAlert,
  INCONCLUSIVE: CircleHelp,
};

export function VerdictBadge({ verdict, size = "md", className, label }: { verdict: VerdictKey; size?: "sm" | "md" | "lg"; className?: string; label?: string }) {
  const locale = useLocale();
  const v = VERDICTS[verdict];
  const Icon = VERDICT_ICON[verdict];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold ring-1", v.text, v.bg, v.ring, size === "sm" && "px-2 py-0.5 text-[11px]", size === "md" && "px-3 py-1 text-xs", size === "lg" && "px-4 py-1.5 text-sm tracking-wide uppercase", className)}>
      <Icon className={size === "lg" ? "size-4" : "size-3.5"} />
      {label ?? labelFor(verdict, false, locale)}
    </span>
  );
}

export function StatusChip({ status }: { status: string }) {
  const locale = useLocale();
  const key = CHECK_STATUS[status as CheckStatusKey] ? status : "INFO";
  const s = CHECK_STATUS[key as CheckStatusKey];
  return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1", s.cls)}>{checkStatusLabel(key, locale)}</span>;
}

export function SeverityChip({ severity }: { severity: string }) {
  const locale = useLocale();
  const key = SEVERITY[severity as SeverityKey] ? severity : "NONE";
  const s = SEVERITY[key as SeverityKey];
  return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1", s.cls)}>{severityLabel(key, locale)}</span>;
}

export function IntelChip({ status }: { status: string }) {
  const locale = useLocale();
  const key = INTEL_STATUS[status] ? status : "UNKNOWN";
  const s = INTEL_STATUS[key];
  return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1", s.cls)}>{intelStatusLabel(key, locale)}</span>;
}

/** The short red notice shown under every result. */
export function VerdictNotice({ verdict, deadLink = false, blacklisted = false, className }: { verdict: VerdictKey; deadLink?: boolean; blacklisted?: boolean; className?: string }) {
  const locale = useLocale();
  return (
    <p className={cn("flex items-start gap-2 text-sm leading-snug font-bold text-v-malicious", className)} role="note">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{noticeFor(verdict, deadLink, blacklisted, locale)}</span>
    </p>
  );
}
