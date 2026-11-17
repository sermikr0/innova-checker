"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Field, TextArea } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { resetScannerDefaultsAction, updateScannerConfigAction, updateSystemSettingsAction } from "@/app/admin/actions";
import { LinesField, PrimaryButton, Toggle } from "./controls";
import { useT } from "@/i18n/client";
import { adminSettingsText } from "@/i18n/messages/admin-settings";

export type ScannerForm = {
  modules: Record<string, boolean>;
  providers: Record<string, boolean>;
  weights: Record<string, number>;
  suspiciousKeywords: string[];
  suspiciousTlds: string[];
  urlShorteners: string[];
  suspiciousDomainPatterns: string[];
  trustedDomains: string[];
  requestTimeoutMs: number;
  scanTimeoutMs: number;
  maxRedirects: number;
  maxResponseBytes: number;
  maxDownloadBytes: number;
  userAgent: string;
  virusTotalSubmitUnknown: boolean;
};

const MODULE_KEYS = ["url", "domain", "dns", "tls", "redirects", "content", "download", "intel"] as const;

export function ScannerConfigForm({ initial, providers }: { initial: ScannerForm; providers: { id: string; name: string; scope: string; configured: boolean }[] }) {
  const [f, setF] = useState(initial);
  const { run, pending } = useAction();
  const txt = useT(adminSettingsText);
  const t = txt.scanner;
  const section = "surface rounded-2xl p-6";
  return (
    <div className="space-y-5">
      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">{t.modulesTitle}</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">{t.modulesText}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {MODULE_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm text-white">
                <input type="checkbox" checked={f.modules[k] ?? true} onChange={(e) => setF({ ...f, modules: { ...f.modules, [k]: e.target.checked } })} className="size-4 accent-[#ff6b00]" />
                {t.modules[k]}
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                {t.weight}
                <input type="number" step="0.1" min={0} max={5} value={f.weights[k] ?? 1} onChange={(e) => setF({ ...f, weights: { ...f.weights, [k]: Number(e.target.value) } })} className="h-8 w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white" />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">{t.providersTitle}</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">{t.providersText}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {providers.map((p) => (
            <Toggle key={p.id} label={`${p.name} ${p.configured ? t.keyConfigured : t.notConfigured}`} description={txt.providerScope[p.id] ?? p.scope} checked={f.providers[p.id] ?? true} onChange={(v) => setF({ ...f, providers: { ...f.providers, [p.id]: v } })} />
          ))}
          <Toggle label={t.vtSubmit} description={t.vtSubmitText} checked={f.virusTotalSubmitUnknown} onChange={(v) => setF({ ...f, virusTotalSubmitUnknown: v })} />
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">{t.indicators}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <LinesField label={t.keywords} value={f.suspiciousKeywords} onChange={(v) => setF({ ...f, suspiciousKeywords: v })} />
          <LinesField label={t.tlds} value={f.suspiciousTlds} onChange={(v) => setF({ ...f, suspiciousTlds: v })} />
          <LinesField label={t.shorteners} value={f.urlShorteners} onChange={(v) => setF({ ...f, urlShorteners: v })} />
          <LinesField label={t.patterns} hint={t.patternsHint} value={f.suspiciousDomainPatterns} onChange={(v) => setF({ ...f, suspiciousDomainPatterns: v })} />
          <LinesField label={t.trusted} hint={t.trustedHint} value={f.trustedDomains} onChange={(v) => setF({ ...f, trustedDomains: v })} />
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">{t.limits}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t.requestTimeout} type="number" value={f.requestTimeoutMs} onChange={(e) => setF({ ...f, requestTimeoutMs: Number(e.target.value) })} />
          <Field label={t.scanTimeout} type="number" value={f.scanTimeoutMs} onChange={(e) => setF({ ...f, scanTimeoutMs: Number(e.target.value) })} />
          <Field label={t.maxRedirects} type="number" value={f.maxRedirects} onChange={(e) => setF({ ...f, maxRedirects: Number(e.target.value) })} />
          <Field label={t.maxPage} type="number" value={f.maxResponseBytes} onChange={(e) => setF({ ...f, maxResponseBytes: Number(e.target.value) })} />
          <Field label={t.maxDownload} type="number" value={f.maxDownloadBytes} onChange={(e) => setF({ ...f, maxDownloadBytes: Number(e.target.value) })} />
        </div>
        <div className="mt-3"><TextArea label={t.userAgent} value={f.userAgent} onChange={(e) => setF({ ...f, userAgent: e.target.value })} className="[&_textarea]:min-h-[70px]" /></div>
      </section>

      <div className="flex flex-wrap gap-2">
        <PrimaryButton pending={pending} onClick={() => run(() => updateScannerConfigAction(f))}>{t.save}</PrimaryButton>
        <ConfirmButton action={resetScannerDefaultsAction} onDone={() => window.location.reload()} title={t.resetTitle} description={t.resetText} confirmLabel={t.resetConfirm} destructive className="h-10 border border-white/10 px-4 text-white hover:bg-white/5"><RotateCcw className="size-4" /> {t.resetButton}</ConfirmButton>
      </div>
    </div>
  );
}

export type SystemForm = {
  siteName: string;
  supportEmail: string;
  sessionTtlHours: number;
  loginMaxAttempts: number;
  loginLockoutMinutes: number;
  ipBlockMinutes: number;
  paymentWindowSeconds: number;
  passwordMinLength: number;
  deviceRemovalsPer30Days: number;
  allowUserDeviceRemoval: boolean;
  noSubscriptionDeviceLimit: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

export function SystemSettingsForm({ initial }: { initial: SystemForm }) {
  const [f, setF] = useState(initial);
  const { run, pending } = useAction();
  const t = useT(adminSettingsText).system;
  const num = (k: keyof SystemForm) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  const section = "surface rounded-2xl p-6";
  return (
    <div className="space-y-5">
      <section className={section}>
        <h2 className="mb-4 text-[15px] font-semibold text-white">{t.website}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.siteName} value={f.siteName} onChange={(e) => setF({ ...f, siteName: e.target.value })} />
          <Field label={t.supportEmail} type="email" value={f.supportEmail} onChange={(e) => setF({ ...f, supportEmail: e.target.value })} />
        </div>
      </section>
      <section className={section}>
        <h2 className="mb-4 text-[15px] font-semibold text-white">{t.security}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t.sessionTtl} type="number" value={f.sessionTtlHours} onChange={num("sessionTtlHours")} />
          <Field label={t.loginMax} type="number" value={f.loginMaxAttempts} onChange={num("loginMaxAttempts")} />
          <Field label={t.loginWindow} type="number" value={f.loginLockoutMinutes} onChange={num("loginLockoutMinutes")} />
          <Field label={t.ipBlock} type="number" value={f.ipBlockMinutes} onChange={num("ipBlockMinutes")} />
          <Field label={t.paymentWindow} type="number" value={f.paymentWindowSeconds} onChange={num("paymentWindowSeconds")} />
          <Field label={t.passwordMin} type="number" value={f.passwordMinLength} onChange={num("passwordMinLength")} />
          <Field label={t.deviceRemovals} type="number" value={f.deviceRemovalsPer30Days} onChange={num("deviceRemovalsPer30Days")} />
          <Field label={t.noSubDevices} type="number" value={f.noSubscriptionDeviceLimit} onChange={num("noSubscriptionDeviceLimit")} />
        </div>
        <div className="mt-3"><Toggle label={t.allowRemoval} checked={f.allowUserDeviceRemoval} onChange={(v) => setF({ ...f, allowUserDeviceRemoval: v })} /></div>
      </section>
      <section className={section}>
        <h2 className="mb-4 text-[15px] font-semibold text-white">{t.maintenance}</h2>
        <Toggle label={t.maintenance} description={t.maintenanceText} checked={f.maintenanceMode} onChange={(v) => setF({ ...f, maintenanceMode: v })} />
        <div className="mt-3"><TextArea label={t.maintenanceMessage} value={f.maintenanceMessage} onChange={(e) => setF({ ...f, maintenanceMessage: e.target.value })} className="[&_textarea]:min-h-[80px]" /></div>
      </section>
      <PrimaryButton pending={pending} onClick={() => run(() => updateSystemSettingsAction(f))}>{t.save}</PrimaryButton>
    </div>
  );
}
