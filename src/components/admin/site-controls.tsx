"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { signOutAllClientsAction, updateSiteControlsAction } from "@/app/admin/actions";
import { freePolicyLong, type FreeScanModeKey } from "@/lib/site-access";
import { cn } from "@/lib/utils";
import { PrimaryButton, SelectField } from "./controls";

export type SiteControlsForm = {
  loginEnabled: boolean;
  registrationEnabled: boolean;
  pricingVisible: boolean;
  freeScanMode: FreeScanModeKey;
  freeScanLimit: number;
  anonymousIpDailyLimit: number;
};

const PRESETS: { label: string; mode: FreeScanModeKey; limit: number }[] = [
  { label: "Unlimited", mode: "UNLIMITED", limit: 1 },
  { label: "1 per day", mode: "DAILY", limit: 1 },
  { label: "2 per day", mode: "DAILY", limit: 2 },
  { label: "3 per day", mode: "DAILY", limit: 3 },
  { label: "1 total, then paid", mode: "TOTAL", limit: 1 },
  { label: "Paid only", mode: "TOTAL", limit: 0 },
];

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

export function SiteControlsPanel({ initial, today }: { initial: SiteControlsForm; today: { devices: number; exhausted: number } }) {
  const [f, setF] = useState(initial);
  const { run, pending } = useAction();

  // Switches save on their own; on failure the switch flips back.
  const flip = (key: "loginEnabled" | "registrationEnabled" | "pricingVisible") => async (v: boolean) => {
    setF((p) => ({ ...p, [key]: v }));
    const r = await run(() => updateSiteControlsAction({ [key]: v }));
    if (!r.ok) setF((p) => ({ ...p, [key]: !v }));
  };
  const policy = { freeMode: f.freeScanMode, freeLimit: f.freeScanLimit };
  const section = "surface rounded-2xl p-6";

  return (
    <div className="space-y-5">
      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">Website access</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">Each switch applies immediately to the live website.</p>
        <div className="space-y-3">
          <Switch
            title="Client sign-in"
            on={f.loginEnabled}
            onLabel="Open"
            offLabel="Closed"
            disabled={pending}
            description="Off: the Log in and Register buttons disappear from the website and clients cannot sign in. Super Admins can always sign in at /login. Clients who are already signed in stay signed in unless you sign them out below."
            onChange={flip("loginEnabled")}
          />
          <Switch
            title="Registration (new clients)"
            on={f.registrationEnabled}
            onLabel="Open"
            offLabel="Closed"
            disabled={pending}
            description="Off: new accounts cannot be created and the Register / Get started buttons are hidden. On: anyone can create an account."
            note={f.registrationEnabled && !f.loginEnabled ? "Registration is closed while client sign-in is off." : undefined}
            onChange={flip("registrationEnabled")}
          />
          <Switch
            title="Pricing section"
            on={f.pricingVisible}
            onLabel="Visible"
            offLabel="Hidden"
            disabled={pending}
            description="Off: the Pricing page returns 404, plans disappear from the home page and the menu, View plans links are removed and online checkout is closed. You can still preview /pricing as Super Admin."
            onChange={flip("pricingVisible")}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3">
          <p className="text-xs text-muted-foreground">Sign out every client right now (Super Admin sessions are kept).</p>
          <ConfirmButton action={signOutAllClientsAction} title="Sign out all clients?" description="Every active session of non-admin accounts ends now. Clients can sign in again only while client sign-in is open." confirmLabel="Sign out all" destructive className="h-9 border border-v-malicious/40 px-3 text-v-malicious hover:bg-v-malicious/10">
            <LogOut className="size-4" /> Sign out all clients
          </ConfirmButton>
        </div>
      </section>

      <section className={section}>
        <h2 className="text-[15px] font-semibold text-white">Free checks without a subscription</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">Applies to visitors and to signed-in users without a plan, counted per device (private windows and new accounts on the same device share it). Subscribers and Unlimited users are not affected.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => {
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
            label="Mode"
            value={f.freeScanMode}
            onChange={(v) => setF({ ...f, freeScanMode: v as FreeScanModeKey })}
            options={[
              { value: "UNLIMITED", label: "Unlimited (free for everyone)" },
              { value: "DAILY", label: "Daily allowance (renews 00:00)" },
              { value: "TOTAL", label: "One-time allowance, then paid" },
            ]}
          />
          <Field id="free-scan-limit" label={f.freeScanMode === "DAILY" ? "Free checks per day" : "Free checks in total"} type="number" min={0} max={100} disabled={f.freeScanMode === "UNLIMITED"} value={f.freeScanLimit} onChange={(e) => setF({ ...f, freeScanLimit: Number(e.target.value) })} hint="0 = subscription required" />
          <Field id="ip-daily-limit" label="Visitor checks per network per day" type="number" min={1} value={f.anonymousIpDailyLimit} onChange={(e) => setF({ ...f, anonymousIpDailyLimit: Number(e.target.value) })} hint={f.freeScanMode === "UNLIMITED" ? "Unlimited mode uses at least 1000 (anti-abuse)." : "Offices behind one IP share this ceiling."} />
        </div>
        <p className="mt-4 rounded-xl border border-orange/25 bg-orange/[0.06] px-4 py-3 text-sm text-white/85">
          <span className="font-medium text-white">Visitors will see: </span>
          {freePolicyLong(policy)}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {f.freeScanMode === "DAILY" ? `Today: ${today.devices} device${today.devices === 1 ? "" : "s"} used free checks, ${today.exhausted} reached the limit.` : `So far: ${today.devices} device${today.devices === 1 ? "" : "s"} used free checks, ${today.exhausted} reached the limit.`}
          </p>
          <PrimaryButton pending={pending} onClick={() => run(() => updateSiteControlsAction({ freeScanMode: f.freeScanMode, freeScanLimit: f.freeScanLimit, anonymousIpDailyLimit: f.anonymousIpDailyLimit }))}>Save free-check policy</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
