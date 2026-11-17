"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Field, postJson } from "@/components/common/field";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation";

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-v-malicious/30 bg-v-malicious/[0.08] px-3.5 py-3 text-sm text-v-malicious" role="alert">
      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {message}
    </div>
  );
}

function Submit({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="btn-orange inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-70">
      {busy && <Loader2 className="size-4 animate-spin" />} {children}
    </button>
  );
}

function applyFieldErrors<T extends FieldValues>(setError: UseFormSetError<T>, fields?: Record<string, string>) {
  for (const [k, v] of Object.entries(fields ?? {})) setError(k as Path<T>, { message: v });
}

export function LoginForm({ next, notice }: { next?: string; notice?: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const r = await postJson<{ redirect: string }>("/api/auth/login", { ...values, next });
    if (!r.ok) {
      setError(r.message);
      applyFieldErrors(form.setError, r.fields);
      return;
    }
    window.location.assign(r.data.redirect);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {notice && <p className="flex items-center gap-2 rounded-xl border border-v-safe/30 bg-v-safe/[0.08] px-3.5 py-3 text-sm text-v-safe"><CheckCircle2 className="size-4" /> {notice}</p>}
      <FormError message={error} />
      <Field label="Work e-mail" type="email" autoComplete="email" {...form.register("email")} error={form.formState.errors.email?.message} />
      <Field label="Password" type="password" autoComplete="current-password" {...form.register("password")} error={form.formState.errors.password?.message} />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-[13px] text-orange hover:underline">Forgot password?</Link>
      </div>
      <Submit busy={form.formState.isSubmitting}>Log in</Submit>
    </form>
  );
}

export function RegisterForm({ minLength }: { minLength: number }) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof registerSchema>>({ resolver: zodResolver(registerSchema), defaultValues: { fullName: "", email: "", companyName: "", password: "", confirmPassword: "" } });
  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const r = await postJson<{ redirect: string }>("/api/auth/register", values);
    if (!r.ok) {
      setError(r.message);
      applyFieldErrors(form.setError, r.fields);
      return;
    }
    window.location.assign(r.data.redirect);
  });
  const e = form.formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={error} />
      <Field label="Full name" autoComplete="name" {...form.register("fullName")} error={e.fullName?.message} />
      <Field label="Work e-mail" type="email" autoComplete="email" {...form.register("email")} error={e.email?.message} />
      <Field label="Company name" autoComplete="organization" {...form.register("companyName")} error={e.companyName?.message} />
      <Field label="Password" type="password" autoComplete="new-password" hint={minLength > 1 ? `At least ${minLength} characters.` : undefined} {...form.register("password")} error={e.password?.message} />
      <Field label="Confirm password" type="password" autoComplete="new-password" {...form.register("confirmPassword")} error={e.confirmPassword?.message} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        By creating an account you agree to the <Link href="/terms" className="text-orange hover:underline">Terms</Link> and <Link href="/privacy" className="text-orange hover:underline">Privacy policy</Link>.
      </p>
      <Submit busy={form.formState.isSubmitting}>Create account</Submit>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [done, setDone] = useState<{ message: string; devResetUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const r = await postJson<{ message: string; devResetUrl?: string }>("/api/auth/forgot-password", values);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setDone(r.data);
  });
  if (done) {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-xl border border-v-safe/30 bg-v-safe/[0.08] px-3.5 py-3 text-sm text-v-safe"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {done.message}</p>
        {done.devResetUrl && (
          <div className="rounded-xl border border-v-suspicious/30 bg-v-suspicious/[0.06] p-3.5 text-xs text-white/80">
            <p className="font-semibold text-v-suspicious">Development mode: SMTP is not configured</p>
            <p className="mt-1">The reset link is shown here only in local development:</p>
            <a href={done.devResetUrl} className="mt-2 block font-mono break-all text-orange hover:underline">{done.devResetUrl}</a>
          </div>
        )}
        <Link href="/login" className="block text-center text-sm text-orange hover:underline">Back to log in</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={error} />
      <Field label="Work e-mail" type="email" autoComplete="email" {...form.register("email")} error={form.formState.errors.email?.message} />
      <Submit busy={form.formState.isSubmitting}>Send reset link</Submit>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof resetPasswordSchema>>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token, password: "", confirmPassword: "" } });
  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const r = await postJson<{ redirect: string }>("/api/auth/reset-password", values);
    if (!r.ok) {
      setError(r.message);
      applyFieldErrors(form.setError, r.fields);
      return;
    }
    window.location.assign(r.data.redirect);
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={error ?? (form.formState.errors.token ? "This reset link is invalid. Request a new one." : null)} />
      <input type="hidden" {...form.register("token")} />
      <Field label="New password" type="password" autoComplete="new-password" {...form.register("password")} error={form.formState.errors.password?.message} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" {...form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />
      <Submit busy={form.formState.isSubmitting}>Set new password</Submit>
    </form>
  );
}
