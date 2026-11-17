"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Field, TextArea } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { resetScannerDefaultsAction, updateScannerConfigAction, updateSystemSettingsAction } from "@/app/admin/actions";
import { LinesField, PrimaryButton, Toggle } from "./controls";

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

const MODULE_LABELS: Record<string, string> = { url: "URL analysis", domain: "Domain intelligence", dns: "DNS records", tls: "SSL/TLS certificate", redirects: "Redirect analysis", content: "Website content", download: "File downloads", intel: "Threat intelligence" };

export function ScannerConfigForm({ initial, providers }: { initial: ScannerForm; providers: { id: string; name: string; scope: string; configured: boolean }[] }) {
  const [f, setF] = useState(initial);
  const { run, pending } = useAction();
  const section = "surface rounded-2xl p-6";
  return (
    <div className="space-y-5">
      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">Analysis modules & risk weights</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">Disabled modules are reported as skipped. Weights multiply the finding weights of each module (0 = ignore, 1 = default, up to 5).</p>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.keys(MODULE_LABELS).map((k) => (
            <div key={k} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm text-white">
                <input type="checkbox" checked={f.modules[k] ?? true} onChange={(e) => setF({ ...f, modules: { ...f.modules, [k]: e.target.checked } })} className="size-4 accent-[#ff6b00]" />
                {MODULE_LABELS[k]}
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                weight
                <input type="number" step="0.1" min={0} max={5} value={f.weights[k] ?? 1} onChange={(e) => setF({ ...f, weights: { ...f.weights, [k]: Number(e.target.value) } })} className="h-8 w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white" />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">Threat-intelligence providers</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">API keys are read from server environment variables and are never shown here.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {providers.map((p) => (
            <Toggle key={p.id} label={`${p.name} ${p.configured ? "· key configured" : "· not configured"}`} description={p.scope} checked={f.providers[p.id] ?? true} onChange={(v) => setF({ ...f, providers: { ...f.providers, [p.id]: v } })} />
          ))}
          <Toggle label="Submit unknown URLs to VirusTotal" description="Off by default: submitted URLs become visible to other VirusTotal users." checked={f.virusTotalSubmitUnknown} onChange={(v) => setF({ ...f, virusTotalSubmitUnknown: v })} />
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">Indicators</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <LinesField label="Suspicious keywords" value={f.suspiciousKeywords} onChange={(v) => setF({ ...f, suspiciousKeywords: v })} />
          <LinesField label="High-abuse TLDs (without dot)" value={f.suspiciousTlds} onChange={(v) => setF({ ...f, suspiciousTlds: v })} />
          <LinesField label="URL shorteners" value={f.urlShorteners} onChange={(v) => setF({ ...f, urlShorteners: v })} />
          <LinesField label="Suspicious domain patterns" hint="Glob patterns only (* and ?), matched against the host. No regular expressions or code." value={f.suspiciousDomainPatterns} onChange={(v) => setF({ ...f, suspiciousDomainPatterns: v })} />
          <LinesField label="Additional trusted domains" hint="Prefer the domain-intelligence whitelist; these only suppress heuristic checks." value={f.trustedDomains} onChange={(v) => setF({ ...f, trustedDomains: v })} />
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">Limits</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Request timeout (ms)" type="number" value={f.requestTimeoutMs} onChange={(e) => setF({ ...f, requestTimeoutMs: Number(e.target.value) })} />
          <Field label="Total scan timeout (ms)" type="number" value={f.scanTimeoutMs} onChange={(e) => setF({ ...f, scanTimeoutMs: Number(e.target.value) })} />
          <Field label="Maximum redirects" type="number" value={f.maxRedirects} onChange={(e) => setF({ ...f, maxRedirects: Number(e.target.value) })} />
          <Field label="Max page size (bytes)" type="number" value={f.maxResponseBytes} onChange={(e) => setF({ ...f, maxResponseBytes: Number(e.target.value) })} />
          <Field label="Max download hashed (bytes)" type="number" value={f.maxDownloadBytes} onChange={(e) => setF({ ...f, maxDownloadBytes: Number(e.target.value) })} />
        </div>
        <div className="mt-3"><TextArea label="Scanner User-Agent" value={f.userAgent} onChange={(e) => setF({ ...f, userAgent: e.target.value })} className="[&_textarea]:min-h-[70px]" /></div>
      </section>

      <div className="flex flex-wrap gap-2">
        <PrimaryButton pending={pending} onClick={() => run(() => updateScannerConfigAction(f))}>Save scanner configuration</PrimaryButton>
        <ConfirmButton action={resetScannerDefaultsAction} onDone={() => window.location.reload()} title="Reset scanner configuration?" description="Modules, providers, weights, indicator lists and limits return to the built-in defaults." confirmLabel="Reset" destructive className="h-10 border border-white/10 px-4 text-white hover:bg-white/5"><RotateCcw className="size-4" /> Reset to defaults</ConfirmButton>
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
  const num = (k: keyof SystemForm) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  const section = "surface rounded-2xl p-6";
  return (
    <div className="space-y-5">
      <section className={section}>
        <h2 className="mb-4 text-[15px] font-semibold text-white">Website & branding</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Site name" value={f.siteName} onChange={(e) => setF({ ...f, siteName: e.target.value })} />
          <Field label="Support e-mail (shown publicly)" type="email" value={f.supportEmail} onChange={(e) => setF({ ...f, supportEmail: e.target.value })} />
        </div>
      </section>
      <section className={section}>
        <h2 className="mb-4 text-[15px] font-semibold text-white">Security policies</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Session lifetime (hours)" type="number" value={f.sessionTtlHours} onChange={num("sessionTtlHours")} />
          <Field label="Failed logins before account lock / IP block" type="number" value={f.loginMaxAttempts} onChange={num("loginMaxAttempts")} />
          <Field label="Counting window (minutes)" type="number" value={f.loginLockoutMinutes} onChange={num("loginLockoutMinutes")} />
          <Field label="IP block duration (minutes)" type="number" value={f.ipBlockMinutes} onChange={num("ipBlockMinutes")} />
          <Field label="Payment QR validity (seconds)" type="number" value={f.paymentWindowSeconds} onChange={num("paymentWindowSeconds")} />
          <Field label="Minimum password length" type="number" value={f.passwordMinLength} onChange={num("passwordMinLength")} />
          <Field label="Device self-removals per 30 days" type="number" value={f.deviceRemovalsPer30Days} onChange={num("deviceRemovalsPer30Days")} />
          <Field label="Devices without a subscription" type="number" value={f.noSubscriptionDeviceLimit} onChange={num("noSubscriptionDeviceLimit")} />
        </div>
        <div className="mt-3"><Toggle label="Users may remove their own devices" checked={f.allowUserDeviceRemoval} onChange={(v) => setF({ ...f, allowUserDeviceRemoval: v })} /></div>
      </section>
      <section className={section}>
        <h2 className="mb-4 text-[15px] font-semibold text-white">Maintenance mode</h2>
        <Toggle label="Maintenance mode" description="Shows a banner and blocks scanning for everyone except Super Admins." checked={f.maintenanceMode} onChange={(v) => setF({ ...f, maintenanceMode: v })} />
        <div className="mt-3"><TextArea label="Maintenance message" value={f.maintenanceMessage} onChange={(e) => setF({ ...f, maintenanceMessage: e.target.value })} className="[&_textarea]:min-h-[80px]" /></div>
      </section>
      <PrimaryButton pending={pending} onClick={() => run(() => updateSystemSettingsAction(f))}>Save settings</PrimaryButton>
    </div>
  );
}
