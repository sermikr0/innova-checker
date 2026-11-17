import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { getT } from "@/i18n/server";
import { authText } from "@/i18n/messages/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getT(authText)).reset;
  return { title: t.metaTitle, robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const t = (await getT(authText)).reset;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">{t.title}</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">{t.subtitle}</p>
      {token ? <ResetPasswordForm token={token} /> : <p className="text-sm text-white/80">{t.missingTokenBefore}<Link href="/forgot-password" className="text-orange hover:underline">{t.missingTokenLink}</Link>{t.missingTokenAfter}</p>}
    </>
  );
}
