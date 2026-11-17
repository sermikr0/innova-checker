import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Choose a new password</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">Signing in with the new password will sign you out of all other devices.</p>
      {token ? <ResetPasswordForm token={token} /> : <p className="text-sm text-white/80">This link is missing its token. <Link href="/forgot-password" className="text-orange hover:underline">Request a new link</Link>.</p>}
    </>
  );
}
