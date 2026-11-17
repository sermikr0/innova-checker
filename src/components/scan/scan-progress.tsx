"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, Lock, ServerCog, ShieldCheck } from "lucide-react";
import { SCAN_STAGES } from "@/lib/verdict";
import { cn } from "@/lib/utils";

type LogLine = { t: number; text: string };

const STAGE_LOG: Record<string, string> = {
  validate: "URL parsed, normalized and checked against SSRF policy",
  domain: "DNS records resolved (A, AAAA, MX, NS, TXT, CAA)",
  reputation: "Registration data and reputation lists evaluated",
  redirects: "Redirect chain followed in isolated fetcher",
  ssl: "TLS handshake completed, certificate inspected",
  content: "Page content and downloads analyzed statically",
  intel: "Threat-intelligence providers consulted",
};

export function ScanProgress({ url, stages, status, className }: { url: string; stages: string[]; status: string; className?: string }) {
  const startRef = useRef<number>(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const start = Date.now();
    startRef.current = start;
    const t = setInterval(() => setElapsedSec((Date.now() - start) / 1000), 100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fresh = stages.filter((s) => !seen.current.has(s));
    if (!fresh.length) return;
    fresh.forEach((s) => seen.current.add(s));
    const t = startRef.current ? (Date.now() - startRef.current) / 1000 : 0;
    setLog((l) => [...l, ...fresh.map((s) => ({ t, text: STAGE_LOG[s] ?? s }))].slice(-6));
  }, [stages]);

  const done = useMemo(() => new Set(stages), [stages]);
  const pct = Math.round((done.size / SCAN_STAGES.length) * 100);
  const elapsed = elapsedSec.toFixed(1);
  const queued = status === "PENDING";

  return (
    <div className={cn("surface-raised relative overflow-hidden rounded-3xl p-5 text-left sm:p-7", className)} role="status" aria-live="polite">
      <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-orange/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-orange" />
          </span>
          <span className="text-sm font-medium text-white">{queued ? "Queued for analysis" : "Analyzing"}</span>
          <span className="truncate font-mono text-xs text-muted-foreground sm:text-sm">{url}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{elapsed}s</span>
      </div>

      <div className="relative mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Radar */}
        <div className="relative mx-auto aspect-square w-48 md:w-full">
          <div className="absolute inset-0 rounded-full border border-orange/20 bg-[radial-gradient(circle,rgba(255,107,0,0.10)_0%,transparent_70%)]" />
          <div className="absolute inset-[16%] rounded-full border border-white/[0.07]" />
          <div className="absolute inset-[33%] rounded-full border border-white/[0.07]" />
          <div className="absolute inset-0 animate-scan-sweep rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(255,107,0,0.55), rgba(255,107,0,0) 70deg, transparent 360deg)", maskImage: "radial-gradient(circle, #000 69%, transparent 70%)" }} />
          <div className="absolute inset-x-1/2 inset-y-0 w-px -translate-x-1/2 bg-white/[0.06]" />
          <div className="absolute inset-x-0 inset-y-1/2 h-px -translate-y-1/2 bg-white/[0.06]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold tabular-nums text-white">{pct}%</span>
            <span className="mt-1 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">complete</span>
          </div>
        </div>

        {/* Stages */}
        <ul className="space-y-1.5">
          {SCAN_STAGES.map((s, i) => {
            const isDone = done.has(s.key);
            const running = !isDone && !queued && (s.key !== "validate" || !done.size);
            return (
              <motion.li key={s.key} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={cn("flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors", isDone ? "border-orange/25 bg-orange/[0.06]" : "border-white/[0.06] bg-white/[0.02]")}>
                <span className="flex items-center gap-3">
                  <span className={cn("flex size-6 items-center justify-center rounded-full", isDone ? "bg-orange text-white" : "bg-white/[0.06] text-muted-foreground")}>
                    {isDone ? <Check className="size-3.5" strokeWidth={3} /> : running ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  <span className={cn("text-sm", isDone ? "text-white" : "text-white/70")}>{s.label}</span>
                </span>
                <span className={cn("text-[11px] font-medium tracking-wide uppercase", isDone ? "text-orange" : "text-muted-foreground")}>{isDone ? "Done" : running ? "Running" : "Queued"}</span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      {/* Progress bar */}
      <div className="relative mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-soft to-orange" initial={{ width: "4%" }} animate={{ width: `${Math.max(4, pct)}%` }} transition={{ type: "spring", stiffness: 60, damping: 18 }} />
      </div>

      {/* Log */}
      <div className="relative mt-4 h-[104px] overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 p-3 font-mono text-[11.5px] leading-5">
        <AnimatePresence initial={false}>
          {log.length === 0 && <p className="text-muted-foreground">$ innova-scan --isolated {queued ? "(waiting for a free worker)" : "…"}</p>}
          {log.map((l, i) => (
            <motion.p key={`${l.text}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="truncate text-white/75">
              <span className="text-orange/80">[+{l.t.toFixed(1)}s]</span> <span className="text-v-safe">✓</span> {l.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ServerCog className="size-3.5 text-orange" /> Isolated server-side scan</span>
        <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5 text-orange" /> No scripts executed</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-orange" /> Your browser never opens the link</span>
      </div>
    </div>
  );
}
