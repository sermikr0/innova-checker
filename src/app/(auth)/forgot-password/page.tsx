import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { getT } from "@/i18n/server";
import { authText } from "@/i18n/messages/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getT(authText)).forgot;
  return { title: t.metaTitle };
}

export default async function ForgotPasswordPage() {
  const t = (await getT(authText)).forgot;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">{t.title}</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">{t.subtitle}</p>
      <ForgotPasswordForm />
    </>
  );
}
