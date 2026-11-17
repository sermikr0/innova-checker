"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { changePasswordSchema, localizeValidation, profileSchema } from "@/lib/validation";
import { useLocale, useT } from "@/i18n/client";
import { dashboardText } from "@/i18n/messages/dashboard";
import type { Preferences } from "@/lib/preferences";
import { changePasswordAction, deleteAccountAction, updatePreferencesAction, updateProfileAction } from "@/app/dashboard/actions";

export function ProfileForm({ defaults, email }: { defaults: z.input<typeof profileSchema>; email: string }) {
  const { run, pending } = useAction();
  const t = useT(dashboardText).forms;
  const locale = useLocale();
  const form = useForm<z.input<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  return (
    <form onSubmit={form.handleSubmit((v) => run(() => updateProfileAction(v)))} noValidate className="space-y-4">
      <Field label={t.workEmail} value={email} disabled readOnly hint={t.emailHint} />
      <Field label={t.fullName} {...form.register("fullName")} error={localizeValidation(form.formState.errors.fullName?.message, locale)} />
      <Field label={t.companyName} {...form.register("companyName")} error={localizeValidation(form.formState.errors.companyName?.message, locale)} />
      <button type="submit" disabled={pending} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />} {t.saveProfile}</button>
    </form>
  );
}

export function PasswordForm({ action = changePasswordAction }: { action?: typeof changePasswordAction }) {
  const { run, pending } = useAction();
  const d = useT(dashboardText);
  const locale = useLocale();
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
      <Field label={d.forms.currentPassword} type="password" autoComplete="current-password" {...form.register("currentPassword")} error={localizeValidation(form.formState.errors.currentPassword?.message, locale)} />
      <Field label={d.forms.newPassword} type="password" autoComplete="new-password" {...form.register("newPassword")} error={localizeValidation(form.formState.errors.newPassword?.message, locale)} />
      <Field label={d.forms.confirmPassword} type="password" autoComplete="new-password" {...form.register("confirmPassword")} error={localizeValidation(form.formState.errors.confirmPassword?.message, locale)} />
      <button type="submit" disabled={pending} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />} {d.changePassword}</button>
    </form>
  );
}

export function PreferencesForm({ prefs }: { prefs: Preferences }) {
  const { run, pending } = useAction();
  const [p, setP] = useState(prefs);
  const t = useT(dashboardText).forms;
  const row = "flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] py-4 last:border-0";
  return (
    <div>
      <div className={row}>
        <div><p className="text-sm font-medium text-white">{t.reportDetail}</p><p className="text-xs text-muted-foreground">{t.reportDetailHint}</p></div>
        <select value={p.reportDetail} onChange={(e) => setP({ ...p, reportDetail: e.target.value as Preferences["reportDetail"] })} className="h-9 rounded-lg border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label={t.reportDetail}>
          <option value="summary">{t.reportSummary}</option>
          <option value="full">{t.reportFull}</option>
        </select>
      </div>
      <div className={row}>
        <div><p className="text-sm font-medium text-white">{t.pageSize}</p><p className="text-xs text-muted-foreground">{t.pageSizeHint}</p></div>
        <select value={p.historyPageSize} onChange={(e) => setP({ ...p, historyPageSize: Number(e.target.value) as Preferences["historyPageSize"] })} className="h-9 rounded-lg border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label={t.pageSize}>
          {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className={row}>
        <div><p className="text-sm font-medium text-white">{t.autoOpen}</p><p className="text-xs text-muted-foreground">{t.autoOpenHint}</p></div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={p.autoOpenReport} onChange={(e) => setP({ ...p, autoOpenReport: e.target.checked })} className="size-4 accent-[#ff6b00]" /> {t.enabled}
        </label>
      </div>
      <button type="button" disabled={pending} onClick={() => run(() => updatePreferencesAction(p))} className="btn-orange mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />} {t.savePreferences}</button>
    </div>
  );
}

export function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const { run, pending } = useAction();
  const t = useT(dashboardText).forms;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1"><Field label={t.confirmWithPassword} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <button type="button" disabled={pending || !password} onClick={() => run(() => deleteAccountAction(password), { refresh: false, onSuccess: () => window.location.replace("/") })} className="inline-flex h-11 items-center gap-2 rounded-xl bg-v-malicious px-4 text-sm font-semibold text-white disabled:opacity-50">
        {pending && <Loader2 className="size-4 animate-spin" />} {t.deleteMyAccount}
      </button>
    </div>
  );
}
