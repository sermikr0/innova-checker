"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowRight, Crown, Link2, Loader2, LogIn, ScanSearch, ShieldAlert, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VERDICTS, labelFor, type VerdictKey } from "@/lib/verdict";
import { VerdictNotice } from "./verdict";
import { deviceHeaders } from "@/lib/device-fingerprint";
import { cn } from "@/lib/utils";
import { ScanProgress } from "./scan-progress";

type Phase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "scanning"; id: string; url: string; stages: string[]; status: string }
  | { kind: "done"; id: string; verdict: VerdictKey | null; score: number | null; deadLink: boolean; blacklisted: boolean };

/** Which website areas are open (Admin → Site controls) and the free-allowance line. */
export type ScanAccess = { login: boolean; register: boolean; pricing: boolean; note: string };
const OPEN: ScanAccess = { login: true, register: true, pricing: true, note: "1 free scan" };

type Modal = null | { kind: "free-used"; message: string } | { kind: "subscription"; message: string } | { kind: "device"; message: string };

function looksLikeUrl(v: string) {
  const s = v.trim();
  return s.length > 3 && /[.:]/.test(s) && !/\s/.test(s);
}

export function ScanBox({ variant = "hero", signedIn = false, reportBase = "/scan", autoOpen = true, access = OPEN }: { variant?: "hero" | "dashboard"; signedIn?: boolean; reportBase?: string; autoOpen?: boolean; access?: ScanAccess }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  const poll = useCallback(
    (id: string, url: string) => {
      const tick = async () => {
        try {
          const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, { cache: "no-store" });
          if (!res.ok) throw new Error("Lost track of the scan. Please try again.");
          const j = (await res.json()) as { status: string; stages: string[]; verdict: VerdictKey | null; riskScore: number | null; deadLink?: boolean; blacklisted?: boolean; error: string | null };
          if (j.status === "COMPLETED") {
            setPhase({ kind: "done", id, verdict: j.verdict, score: j.riskScore, deadLink: !!j.deadLink, blacklisted: !!j.blacklisted });
            if (autoOpen) setTimeout(() => router.push(`${reportBase}/${id}`), 900);
            else router.refresh();
            return;
          }
          if (j.status === "FAILED") {
            setPhase({ kind: "idle" });
            setError(j.error ?? "The scan failed. Please try again.");
            return;
          }
          setPhase({ kind: "scanning", id, url, stages: j.stages, status: j.status });
          pollRef.current = setTimeout(tick, 700);
        } catch (e) {
          setPhase({ kind: "idle" });
          setError((e as Error).message);
        }
      };
      tick();
    },
    [router, reportBase, autoOpen],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!looksLikeUrl(value)) {
      setError("Enter a full link, for example https://example.com/track");
      return;
    }
    setPhase({ kind: "submitting" });
    try {
      const res = await fetch("/api/scans", { method: "POST", headers: { "content-type": "application/json", ...deviceHeaders() }, body: JSON.stringify({ url: value.trim() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = j?.error?.code as string | undefined;
        const message = (j?.error?.message as string) ?? "The scan could not be started.";
        setPhase({ kind: "idle" });
        if (code === "FREE_SCAN_USED") setModal({ kind: "free-used", message });
        else if (code === "SUBSCRIPTION_REQUIRED") setModal({ kind: "subscription", message });
        else if (code === "DEVICE_LIMIT_EXCEEDED" || code === "DEVICE_REQUIRED") setModal({ kind: "device", message });
        else setError(message);
        return;
      }
      setPhase({ kind: "scanning", id: j.id, url: value.trim(), stages: [], status: "PENDING" });
      poll(j.id, value.trim());
    } catch {
      setPhase({ kind: "idle" });
      setError("Network error. Check your connection and try again.");
    }
  }

  const busy = phase.kind === "submitting" || phase.kind === "scanning" || phase.kind === "done";
  const hero = variant === "hero";

  return (
    <div className="w-full">
      <form onSubmit={submit} className="relative" noValidate>
        <div className={cn("group relative flex flex-col gap-2 rounded-2xl p-2 transition-shadow sm:flex-row sm:items-center", hero ? "surface-raised glow-ring" : "surface-raised", busy && "opacity-90")}>
          <label htmlFor={`scan-url-${variant}`} className="sr-only">URL to analyze</label>
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
            <Link2 className="size-5 shrink-0 text-orange" aria-hidden />
            <input
              id={`scan-url-${variant}`}
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste a suspicious URL here..."
              value={value}
              disabled={busy}
              onChange={(e) => setValue(e.target.value)}
              className={cn("h-12 w-full min-w-0 bg-transparent font-mono text-white placeholder:font-sans placeholder:text-white/35 focus:outline-none disabled:cursor-not-allowed", hero ? "text-[15px] sm:h-14 sm:text-base" : "text-sm")}
              aria-invalid={!!error}
              aria-describedby={error ? `scan-error-${variant}` : undefined}
            />
          </div>
          <button type="submit" disabled={busy} className={cn("btn-orange inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 font-semibold transition disabled:cursor-not-allowed disabled:opacity-70", hero ? "h-12 text-[15px] sm:h-14" : "h-11 text-sm")}>
            {phase.kind === "submitting" ? <Loader2 className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
            Analyze URL
          </button>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p id={`scan-error-${variant}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-sm text-v-malicious" role="alert">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      {hero && phase.kind === "idle" && !error && (
        <p className="mt-4 text-center text-xs text-muted-foreground sm:text-sm">
          {signedIn ? "Scans are included in your subscription." : `${access.note} · No account needed · Results in seconds`}
        </p>
      )}

      <AnimatePresence mode="wait">
        {phase.kind === "scanning" && (
          <motion.div key="progress" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6">
            <ScanProgress url={phase.url} stages={phase.stages} status={phase.status} />
          </motion.div>
        )}
        {phase.kind === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="surface-raised mt-6 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={cn("rounded-full px-3 py-1 text-sm font-semibold ring-1", phase.verdict ? `${VERDICTS[phase.verdict].text} ${VERDICTS[phase.verdict].bg} ${VERDICTS[phase.verdict].ring}` : "text-white")}>
                {phase.verdict ? labelFor(phase.verdict, phase.blacklisted) : "Done"}
              </span>
              <span className="text-sm text-white/80">Analysis complete{phase.score !== null ? ` · risk score ${phase.score}/100` : ""}</span>
            </div>
            {autoOpen ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-orange">Opening report <Loader2 className="size-4 animate-spin" /></span>
            ) : (
              <span className="flex items-center gap-2">
                <Link href={`${reportBase}/${phase.id}`} className="btn-orange inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold">View report <ArrowRight className="size-4" /></Link>
                <button type="button" onClick={() => { setPhase({ kind: "idle" }); setValue(""); }} className="h-9 rounded-lg border border-white/10 px-3 text-sm text-white hover:bg-white/5">New scan</button>
              </span>
            )}
            </div>
            {phase.verdict && <VerdictNotice verdict={phase.verdict} deadLink={phase.deadLink} blacklisted={phase.blacklisted} className="mt-4 border-t border-white/[0.06] pt-4" />}
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="border-white/10 bg-[#121216] sm:max-w-md">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-orange to-transparent" />
          <DialogHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-orange/12 ring-1 ring-orange/30">
              {modal?.kind === "free-used" ? <Crown className="size-6 text-orange" /> : <ShieldAlert className="size-6 text-orange" />}
            </div>
            <DialogTitle className="text-xl text-white">
              {modal?.kind === "free-used" ? "Your free checks have been used" : modal?.kind === "device" ? "Device limit reached" : "Active subscription required"}
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground">
              {modal?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
            {modal?.kind === "free-used" ? (
              <>
                {access.register && (
                  <Link href="/register" className="btn-orange inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold">
                    <UserPlus className="size-4" /> Create Free Account
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {access.pricing && <Link href="/pricing" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5">View Pricing</Link>}
                  {access.login && (
                    <Link href="/login" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5">
                      <LogIn className="size-4" /> Log In
                    </Link>
                  )}
                  {!access.pricing && !access.login && <Link href="/contact" className="col-span-2 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5">Contact us</Link>}
                </div>
              </>
            ) : modal?.kind === "device" ? (
              <Link href="/dashboard/devices" className="btn-orange inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold">
                Manage devices <ArrowRight className="size-4" />
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href={access.pricing ? "/pricing" : "/contact"} className="btn-orange inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold">{access.pricing ? "View Pricing" : "Contact us"}</Link>
                <Link href="/dashboard/subscription" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5">My subscription</Link>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
