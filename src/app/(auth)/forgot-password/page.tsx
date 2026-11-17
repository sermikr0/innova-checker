import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Reset your password</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">Enter your work e-mail and we will send you a one-time reset link valid for 30 minutes.</p>
      <ForgotPasswordForm />
    </>
  );
}
