import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { getSession } from "@/server/auth/session";
import { safeNextPath } from "@/server/auth/redirect";
import { getSiteAccess } from "@/server/settings";
import { getT } from "@/i18n/server";
import { authText } from "@/i18n/messages/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getT(authText)).login;
  return { title: t.metaTitle };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeNextPath(sp.next, "") : "";
  const [session, access, { login: t }] = await Promise.all([getSession(), getSiteAccess(), getT(authText)]);
  if (session) redirect(safeNextPath(next, session.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">{t.title}</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">{t.subtitle}</p>
      {!access.login && <p className="mb-6 rounded-xl border border-v-suspicious/30 bg-v-suspicious/[0.06] p-4 text-sm text-white/85">{t.clientLoginDisabled}</p>}
      <LoginForm next={next || undefined} notice={sp.reset ? t.resetNotice : null} />
      {access.register && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.newHere} <Link href="/register" className="text-orange hover:underline">{t.createAccount}</Link>
        </p>
      )}
    </>
  );
}
