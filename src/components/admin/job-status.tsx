"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { adminDomainsText } from "@/i18n/messages/admin-domains";

type Run = { id: string; name: string; status: string; trigger: string; summary: Record<string, unknown> | null; error: string | null; startedAt: string; finishedAt: string | null };

type JobsText = (typeof adminDomainsText)["en"]["jobs"];

function describe(r: Run, t: JobsText) {
  const s = r.summary ?? {};
  if (r.status === "RUNNING") {
    const done = Number(s.checked ?? s.done ?? 0);
    const total = Number(s.total ?? 0);
    return { text: total ? `${String(s.phase ?? t.running)} · ${done}/${total}` : String(s.phase ?? t.starting), pct: total ? Math.round((done / total) * 100) : 5 };
  }
  if (r.status === "FAILED") return { text: r.error ?? t.failed, pct: 100 };
  const parts = Object.entries(s).filter(([k]) => !["phase"].includes(k)).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
  return { text: parts.join(" · ").slice(0, 220), pct: 100 };
}

/** Live status of background domain-intelligence jobs (polls while one is running). */
export function JobStatus({ initial }: { initial: Run[] }) {
  const router = useRouter();
  const t = useT(adminDomainsText).jobs;
  const locale = useLocale();
  const [runs, setRuns] = useState(initial);
  const seenRunning = useRef(new Set(initial.filter((r) => r.status === "RUNNING").map((r) => r.id)));
  const running = runs.some((r) => r.status === "RUNNING");

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(async () => {
      const res = await fetch("/api/admin/jobs", { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return;
      const j = (await res.json()) as { runs: Run[] };
      setRuns(j.runs);
      for (const r of j.runs) {
        if (seenRunning.current.has(r.id) && r.status !== "RUNNING") {
          seenRunning.current.delete(r.id);
          if (r.status === "SUCCESS") toast.success(t.finishedToast(t.labels[r.name] ?? r.name));
          else toast.error(t.failedToast(t.labels[r.name] ?? r.name, r.error ?? ""));
          router.refresh();
        }
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [running, router, t]);

  const latest = runs.filter((r, i, a) => a.findIndex((x) => x.name === r.name) === i).slice(0, 2);
  if (!latest.length) return <p className="mb-4 text-xs text-muted-foreground">{t.noJobs}</p>;
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2">
      {latest.map((r) => {
        const d = describe(r, t);
        return (
          <div key={r.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <span className="flex items-center gap-2 font-medium text-white">
                {r.status === "RUNNING" ? <Loader2 className="size-4 animate-spin text-orange" /> : r.status === "SUCCESS" ? <CheckCircle2 className="size-4 text-v-safe" /> : <XCircle className="size-4 text-v-malicious" />}
                {t.labels[r.name] ?? r.name}
              </span>
              <span className="text-[11px] text-muted-foreground">{new Date(r.startedAt).toLocaleString(INTL_LOCALE[locale], { timeZone: "Asia/Tashkent", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            {r.status === "RUNNING" && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-orange-soft to-orange transition-all" style={{ width: `${d.pct}%` }} /></div>
            )}
            <p className="mt-1.5 truncate text-[11.5px] text-muted-foreground" title={d.text}>{d.text}</p>
          </div>
        );
      })}
    </div>
  );
}
