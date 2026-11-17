import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getSession } from "@/server/auth/session";
import { getSiteAccess, getSystemSettings } from "@/server/settings";
import { freePolicyLong } from "@/lib/site-access";
import { getLocale, getT } from "@/i18n/server";
import { authText } from "@/i18n/messages/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getT(authText)).register;
  return { title: t.metaTitle };
}

export default async function RegisterPage() {
  const [session, settings, access, locale, { register: t }] = await Promise.all([getSession(), getSystemSettings(), getSiteAccess(), getLocale(), getT(authText)]);
  if (session) redirect("/dashboard");
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">{t.title}</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">{t.freeToCreate} {freePolicyLong(access, locale)}</p>
      {access.register ? (
        <RegisterForm minLength={settings.passwordMinLength} />
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">{t.disabledBefore}<Link href="/contact" className="text-orange hover:underline">{t.disabledLink}</Link>{t.disabledAfter}</p>
      )}
      {access.login && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.haveAccount} <Link href="/login" className="text-orange hover:underline">{t.logIn}</Link>
        </p>
      )}
    </>
  );
}
