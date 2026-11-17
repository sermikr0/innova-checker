import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getSession } from "@/server/auth/session";
import { getSystemSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const [session, settings] = await Promise.all([getSession(), getSystemSettings()]);
  if (session) redirect("/dashboard");
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Create your account</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">Free to create. Scanning requires an active subscription.</p>
      {settings.registrationEnabled ? (
        <RegisterForm minLength={settings.passwordMinLength} />
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">Self-registration is currently disabled. <Link href="/contact" className="text-orange hover:underline">Contact Innova Networks</Link> to request an account.</p>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-orange hover:underline">Log in</Link>
      </p>
    </>
  );
}
