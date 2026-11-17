"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Field, TextArea, postJson } from "@/components/common/field";
import { contactText } from "@/i18n/messages/contact";
import { useT } from "@/i18n/client";
import { contactSchema } from "@/lib/validation";

type Values = z.input<typeof contactSchema>;

export function ContactForm() {
  const { form: t } = useT(contactText);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<Values>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", company: "", subject: "", message: "", website: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const r = await postJson("/api/contact", values);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setSent(true);
    reset();
  });

  if (sent) {
    return (
      <div className="surface flex flex-col items-center rounded-3xl p-10 text-center">
        <CheckCircle2 className="size-12 text-v-safe" />
        <h3 className="mt-4 text-xl font-semibold text-white">{t.sentTitle}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t.sentText}</p>
        <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm text-orange hover:underline">{t.sendAnother}</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="surface space-y-4 rounded-3xl p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} autoComplete="name" {...register("name")} error={formState.errors.name?.message} />
        <Field label={t.email} type="email" autoComplete="email" {...register("email")} error={formState.errors.email?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.company} autoComplete="organization" {...register("company")} error={formState.errors.company?.message} />
        <Field label={t.subject} {...register("subject")} error={formState.errors.subject?.message} />
      </div>
      <TextArea label={t.message} {...register("message")} error={formState.errors.message?.message} placeholder={t.messagePlaceholder} />
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("website")} />
      {error && <p className="text-sm text-v-malicious" role="alert">{error}</p>}
      <button type="submit" disabled={formState.isSubmitting} className="btn-orange inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-70 sm:w-auto sm:px-6">
        {formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {t.submit}
      </button>
    </form>
  );
}
