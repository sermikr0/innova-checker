"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LogOut } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { signOutAllClientsAction, updateSiteControlsAction } from "@/app/admin/actions";
import { freePolicyLong, type FreeScanModeKey } from "@/lib/site-access";
import { useLocale, useT } from "@/i18n/client";
import { siteControlsText } from "@/i18n/messages/admin-site-controls";
import { cn } from "@/lib/utils";
import { PrimaryButton, SelectField } from "./controls";

export type SiteControlsForm = {
  loginEnabled: boolean;
  registrationEnabled: boolean;
  pricingVisible: boolean;
  consentRequired: boolean;
  consentEmailVerification: boolean;
  freeScanMode: FreeScanModeKey;
  freeScanLimit: number;
  anonymousIpDailyLimit: number;
};

type SwitchKey = "loginEnabled" | "registrationEnabled" | "pricingVisible" | "consentRequired" | "consentEmailVerification";

function Switch({ title, description, on, onLabel, offLabel, note, disabled, onChange }: { title: string; description: string; on: boolean; onLabel: string; offLabel: string; note?: string; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <div>
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
          {title}
          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ring-1", on ? "bg-v-safe/10 text-v-safe ring-v-safe/25" : "bg-v-malicious/10 text-v-malicious ring-v-malicious/25")}>{on ? onLabel : offLabel}</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        {note && <p className="mt-1.5 text-xs font-medium text-v-suspicious">{note}</p>}
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label={title} disabled={disabled} onClick={() => onChange(!on)} className={cn("relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:outline-none disabled:opacity-50", on ? "bg-orange" : "bg-white/10")}>
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform", on && "translate-x-5")} />
      </button>
    </div>
  );
}

export function SiteControlsPanel({ initial, today, smtpReady }: { initial: SiteControlsForm; today: { devices: number; exhausted: number }; smtpReady: boolean }) {
  const t = useT(siteControlsText);
  const locale = useLocale();
  const [f, setF] = useState(initial);
  const { run, pending } = useAction();

  // Switches save on their own; on failure the switch flips back.
  const flip = (key: SwitchKey) => async (v: boolean) => {
    setF((p) => ({ ...p, [key]: v }));
    const r = await run(() => updateSiteControlsAction({ [key]: v }));
    if (!r.ok) setF((p) => ({ ...p, [key]: !v }));
  };
  const presets: { label: string; mode: FreeScanModeKey; limit: number }[] = [
    { label: t.presets.unlimited, mode: "UNLIMITED", limit: 1 },
    { label: t.presets.perDay(1), mode: "DAILY", limit: 1 },
    { label: t.presets.perDay(2), mode: "DAILY", limit: 2 },
    { label: t.presets.perDay(3), mode: "DAILY", limit: 3 },
    { label: t.presets.oneTotal, mode: "TOTAL", limit: 1 },
    { label: t.presets.paidOnly, mode: "TOTAL", limit: 0 },
  ];
  const policy = { freeMode: f.freeScanMode, freeLimit: f.freeScanLimit };
  const section = "surface rounded-2xl p-6";

  return (
    <div className="space-y-5">
      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">{t.accessTitle}</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">{t.accessHint}</p>
        <div className="space-y-3">
          <Switch title={t.loginTitle} on={f.loginEnabled} onLabel={t.open} offLabel={t.closed} disabled={pending} description={t.loginDesc} onChange={flip("loginEnabled")} />
          <Switch title={t.registrationTitle} on={f.registrationEnabled} onLabel={t.open} offLabel={t.closed} disabled={pending} description={t.registrationDesc} note={f.registrationEnabled && !f.loginEnabled ? t.registrationNote : undefined} onChange={flip("registrationEnabled")} />
          <Switch title={t.pricingTitle} on={f.pricingVisible} onLabel={t.visible} offLabel={t.hidden} disabled={pending} description={t.pricingDesc} onChange={flip("pricingVisible")} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3">
          <p className="text-xs text-muted-foreground">{t.signOutHint}</p>
          <ConfirmButton action={signOutAllClientsAction} title={t.signOutTitle} description={t.signOutDesc} confirmLabel={t.signOutConfirm} destructive className="h-9 border border-v-malicious/40 px-3 text-v-malicious hover:bg-v-malicious/10">
            <LogOut className="size-4" /> {t.signOutButton}
          </ConfirmButton>
        </div>
      </section>

      <section className={section}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-white">{t.consentTitle}</h2>
            <p className="mt-1 mb-4 max-w-2xl text-xs text-muted-foreground">{t.consentHint}</p>
          </div>
          <Link href="/admin/consents" className="inline-flex items-center gap-1.5 text-sm font-medium text-orange hover:underline">{t.viewAcceptances} <ArrowRight className="size-4" /></Link>
        </div>
        <div className="space-y-3">
          <Switch title={t.consentRequiredTitle} on={f.consentRequired} onLabel={t.on} offLabel={t.off} disabled={pending} description={t.consentRequiredDesc} onChange={flip("consentRequired")} />
          <Switch title={t.verifyTitle} on={f.consentEmailVerification} onLabel={t.on} offLabel={t.off} disabled={pending} description={t.verifyDesc} note={f.consentEmailVerification && !smtpReady ? t.smtpMissing : undefined} onChange={flip("consentEmailVerification")} />
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">{t.freeTitle}</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">{t.freeHint}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = f.freeScanMode === p.mode && (p.mode === "UNLIMITED" || f.freeScanLimit === p.limit);
            return (
              <button key={p.label} type="button" onClick={() => setF({ ...f, freeScanMode: p.mode, freeScanLimit: p.mode === "UNLIMITED" ? f.freeScanLimit : p.limit })} className={cn("h-9 rounded-xl border px-3.5 text-sm transition-colors", active ? "border-orange/60 bg-orange/15 font-medium text-white" : "border-white/10 text-white/75 hover:bg-white/5")}>
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label={t.mode}
            value={f.freeScanMode}
            onChange={(v) => setF({ ...f, freeScanMode: v as FreeScanModeKey })}
            options={[
              { value: "UNLIMITED", label: t.modeUnlimited },
              { value: "DAILY", label: t.modeDaily },
              { value: "TOTAL", label: t.modeTotal },
            ]}
          />
          <Field id="free-scan-limit" label={f.freeScanMode === "DAILY" ? t.limitPerDay : t.limitTotal} type="number" min={0} max={100} disabled={f.freeScanMode === "UNLIMITED"} value={f.freeScanLimit} onChange={(e) => setF({ ...f, freeScanLimit: Number(e.target.value) })} hint={t.limitHint} />
          <Field id="ip-daily-limit" label={t.networkLimit} type="number" min={1} value={f.anonymousIpDailyLimit} onChange={(e) => setF({ ...f, anonymousIpDailyLimit: Number(e.target.value) })} hint={f.freeScanMode === "UNLIMITED" ? t.networkHintUnlimited : t.networkHint} />
        </div>
        <p className="mt-4 rounded-xl border border-orange/25 bg-orange/[0.06] px-4 py-3 text-sm text-white/85">
          <span className="font-medium text-white">{t.visitorsSee}</span>
          {freePolicyLong(policy, locale)}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{f.freeScanMode === "DAILY" ? t.todayStats(today.devices, today.exhausted) : t.totalStats(today.devices, today.exhausted)}</p>
          <PrimaryButton pending={pending} onClick={() => run(() => updateSiteControlsAction({ freeScanMode: f.freeScanMode, freeScanLimit: f.freeScanLimit, anonymousIpDailyLimit: f.anonymousIpDailyLimit }))}>{t.saveFree}</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
