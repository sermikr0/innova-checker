import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { getSession } from "@/server/auth/session";
import { safeNextPath } from "@/server/auth/redirect";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeNextPath(sp.next, "") : "";
  const session = await getSession();
  if (session) redirect(safeNextPath(next, session.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">Log in to scan links and view your reports.</p>
      <LoginForm next={next || undefined} notice={sp.reset ? "Password updated. Log in with your new password." : null} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Innova Checker? <Link href="/register" className="text-orange hover:underline">Create an account</Link>
      </p>
    </>
  );
}
