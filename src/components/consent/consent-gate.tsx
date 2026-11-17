"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, postJson } from "@/components/common/field";
import { useT } from "@/i18n/client";
import { consentText } from "@/i18n/messages/consent";
import { TERMS_VERSION } from "@/i18n/messages/legal-types";
import { cn } from "@/lib/utils";
import { TermsCheckbox } from "./terms-checkbox";

/** Details sent by the scan API with CONSENT_REQUIRED. */
export type ConsentRequest = { step: "terms" | "verify"; email?: string; signedIn?: boolean; fullName?: string; accountEmail?: string };

type Step = { kind: "terms" } | { kind: "verify"; email: string; resendAt: number } | { kind: "done" };

/**
 * One-time step before the first check: accept the Terms of Use, give first and
 * last name and e-mail, and confirm the e-mail with a code. Calls onDone once
 * the server has recorded a valid acceptance.
 */
export function ConsentGate({ request, onDone, onClose }: { request: ConsentRequest | null; onDone: () => void; onClose: () => void }) {
  // A new request (from a refused scan) starts the dialog afresh.
  return request ? <GateDialog key={JSON.stringify(request)} request={request} onDone={onDone} onClose={onClose} /> : null;
}

function GateDialog({ request, onDone, onClose }: { request: ConsentRequest; onDone: () => void; onClose: () => void }) {
  const t = useT(consentText);
  const [step, setStep] = useState<Step>(() => (request.step === "verify" && request.email ? { kind: "verify", email: request.email, resendAt: 0 } : { kind: "terms" }));
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState(request.fullName ?? "");
  const [email, setEmail] = useState(request.accountEmail ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step.kind !== "verify") return;
    codeRef.current?.focus();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step.kind]);

  const finish = () => {
    setStep({ kind: "done" });
    setTimeout(onDone, 700);
  };

  const fail = (r: { message: string; fields?: Record<string, string> }) => {
    setError(r.fields && Object.keys(r.fields).length ? null : r.message);
    setFields(r.fields ?? {});
  };

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    if (!accepted) {
      setFields({ accept: t.errors.acceptRequired });
      return;
    }
    setBusy(true);
    const r = await postJson<{ step: "verify"; email: string; resendIn: number } | { step: "done" }>("/api/consent/start", { fullName, email, accept: true, termsVersion: TERMS_VERSION });
    setBusy(false);
    if (!r.ok) return fail(r.code === "NETWORK" ? { message: t.errors.network } : r);
    if (r.data.step === "done") return finish();
    setStep({ kind: "verify", email: r.data.email, resendAt: Date.now() + r.data.resendIn * 1000 });
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await postJson<{ step: "done" }>("/api/consent/verify", { code });
    setBusy(false);
    if (!r.ok) {
      setCode("");
      return fail(r.code === "NETWORK" ? { message: t.errors.network } : r);
    }
    finish();
  }

  async function resend() {
    setError(null);
    setBusy(true);
    const r = await postJson<{ step: "verify"; email: string; resendIn: number } | { step: "done" }>("/api/consent/resend", {});
    setBusy(false);
    if (!r.ok) return fail(r.code === "NETWORK" ? { message: t.errors.network } : r);
    if (r.data.step === "done") return finish();
    setStep({ kind: "verify", email: r.data.email, resendAt: Date.now() + r.data.resendIn * 1000 });
  }

  const active = step.kind === "terms" ? 0 : step.kind === "verify" ? 2 : 3;
  const resendIn = step.kind === "verify" ? Math.max(0, Math.ceil((step.resendAt - now) / 1000)) : 0;

  return (
    <Dialog open onOpenChange={(o) => !o && step.kind !== "done" && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#121216] sm:max-w-lg">
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-orange to-transparent" />
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-orange/12 ring-1 ring-orange/30">
            {step.kind === "verify" ? <MailCheck className="size-5 text-orange" /> : step.kind === "done" ? <CheckCircle2 className="size-5 text-v-safe" /> : <ShieldCheck className="size-5 text-orange" />}
          </div>
          <DialogTitle className="text-xl text-white">{step.kind === "verify" ? t.codeTitle : step.kind === "done" ? t.doneTitle : t.title}</DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed text-muted-foreground">
            {step.kind === "verify" ? t.codeSent(step.email) : step.kind === "done" ? t.doneText : t.intro}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex gap-2" aria-label={t.title}>
          {t.steps.map((label, i) => (
            <li key={label} className={cn("flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11.5px]", i < active ? "border-v-safe/30 text-v-safe" : i === active || (i === 1 && active === 0) ? "border-orange/40 text-white" : "border-white/10 text-white/45")}>
              <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", i < active ? "bg-v-safe/20" : "bg-white/10")}>{i + 1}</span>
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ol>

        {error && <p className="rounded-xl border border-v-malicious/40 bg-v-malicious/[0.07] px-3.5 py-2.5 text-sm text-v-malicious" role="alert">{error}</p>}

        {step.kind === "terms" && (
          <form onSubmit={submitDetails} noValidate className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[13px] font-semibold text-white">{t.keyPointsTitle}</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12.5px] leading-relaxed text-white/75 marker:text-orange">
                {t.keyPoints.map((k) => <li key={k}>{k}</li>)}
              </ul>
              <a href="/terms" target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-orange hover:underline">
                <FileText className="size-3.5" /> {t.readFull}
              </a>
            </section>
            <Field id="consent-name" label={t.fullName} placeholder={t.fullNamePlaceholder} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={fields.fullName} required />
            <Field id="consent-email" label={t.email} type="email" placeholder={t.emailPlaceholder} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} readOnly={!!request.signedIn} hint={request.signedIn ? t.emailLocked : undefined} required />
            <TermsCheckbox id="consent-accept" checked={accepted} onChange={(v) => { setAccepted(v); setFields((f) => ({ ...f, accept: "" })); }} error={fields.accept || null} />
            <button type="submit" disabled={busy} className="btn-orange inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />} {t.continue}
            </button>
          </form>
        )}

        {step.kind === "verify" && (
          <form onSubmit={submitCode} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="consent-code" className="block text-[13px] font-medium text-white/85">{t.codeLabel}</label>
              <input
                ref={codeRef}
                id="consent-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.03] text-center font-mono text-2xl tracking-[0.6em] text-white outline-none focus:border-orange/60"
              />
            </div>
            <button type="submit" disabled={busy || code.length !== 6} className="btn-orange inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />} {t.verify}
            </button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <button type="button" disabled={busy || resendIn > 0} onClick={resend} className="text-orange hover:underline disabled:cursor-not-allowed disabled:text-white/40 disabled:no-underline">
                {resendIn > 0 ? t.resendIn(resendIn) : t.resend}
              </button>
              {!request.signedIn && (
                <button type="button" onClick={() => { setError(null); setStep({ kind: "terms" }); }} className="text-white/60 hover:text-white">{t.changeEmail}</button>
              )}
            </div>
          </form>
        )}

        {step.kind === "done" && (
          <div className="flex items-center justify-center py-4"><Loader2 className="size-6 animate-spin text-orange" /></div>
        )}
      </DialogContent>
    </Dialog>
  );
}
