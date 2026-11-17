"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { changePasswordSchema, profileSchema } from "@/lib/validation";
import type { Preferences } from "@/lib/preferences";
import { changePasswordAction, deleteAccountAction, updatePreferencesAction, updateProfileAction } from "@/app/dashboard/actions";

export function ProfileForm({ defaults, email }: { defaults: z.input<typeof profileSchema>; email: string }) {
  const { run, pending } = useAction();
  const form = useForm<z.input<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  return (
    <form onSubmit={form.handleSubmit((v) => run(() => updateProfileAction(v)))} noValidate className="space-y-4">
      <Field label="Work e-mail" value={email} disabled readOnly hint="Contact your administrator to change your e-mail address." />
      <Field label="Full name" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
      <Field label="Company name" {...form.register("companyName")} error={form.formState.errors.companyName?.message} />
      <button type="submit" disabled={pending} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />} Save profile</button>
    </form>
  );
}

export function PasswordForm({ action = changePasswordAction }: { action?: typeof changePasswordAction }) {
  const { run, pending } = useAction();
  const form = useForm<z.input<typeof changePasswordSchema>>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        const r = await run(() => action(v));
        if (r.ok) form.reset();
        else for (const [k, m] of Object.entries(r.fields ?? {})) form.setError(k as keyof typeof v, { message: m });
      })}
      noValidate
      className="space-y-4"
    >
      <Field label="Current password" type="password" autoComplete="current-password" {...form.register("currentPassword")} error={form.formState.errors.currentPassword?.message} />
      <Field label="New password" type="password" autoComplete="new-password" {...form.register("newPassword")} error={form.formState.errors.newPassword?.message} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" {...form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />
      <button type="submit" disabled={pending} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />} Change password</button>
    </form>
  );
}

export function PreferencesForm({ prefs }: { prefs: Preferences }) {
  const { run, pending } = useAction();
  const [p, setP] = useState(prefs);
  const row = "flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] py-4 last:border-0";
  return (
    <div>
      <div className={row}>
        <div><p className="text-sm font-medium text-white">Report detail</p><p className="text-xs text-muted-foreground">Show every check expanded when you open a report.</p></div>
        <select value={p.reportDetail} onChange={(e) => setP({ ...p, reportDetail: e.target.value as Preferences["reportDetail"] })} className="h-9 rounded-lg border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label="Report detail">
          <option value="summary">Summary (collapsed)</option>
          <option value="full">Full analysis (expanded)</option>
        </select>
      </div>
      <div className={row}>
        <div><p className="text-sm font-medium text-white">History page size</p><p className="text-xs text-muted-foreground">Scans shown per page in Scan History.</p></div>
        <select value={p.historyPageSize} onChange={(e) => setP({ ...p, historyPageSize: Number(e.target.value) as Preferences["historyPageSize"] })} className="h-9 rounded-lg border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label="History page size">
          {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className={row}>
        <div><p className="text-sm font-medium text-white">Open report automatically</p><p className="text-xs text-muted-foreground">Jump to the report when a scan finishes in the scanner.</p></div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={p.autoOpenReport} onChange={(e) => setP({ ...p, autoOpenReport: e.target.checked })} className="size-4 accent-[#ff6b00]" /> Enabled
        </label>
      </div>
      <button type="button" disabled={pending} onClick={() => run(() => updatePreferencesAction(p))} className="btn-orange mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />} Save preferences</button>
    </div>
  );
}

export function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const { run, pending } = useAction();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1"><Field label="Confirm with your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <button type="button" disabled={pending || !password} onClick={() => run(() => deleteAccountAction(password), { refresh: false, onSuccess: () => window.location.replace("/") })} className="inline-flex h-11 items-center gap-2 rounded-xl bg-v-malicious px-4 text-sm font-semibold text-white disabled:opacity-50">
        {pending && <Loader2 className="size-4 animate-spin" />} Delete my account
      </button>
    </div>
  );
}
