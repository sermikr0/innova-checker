import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-[100%] bg-orange/15 blur-[100px]" />
      <div className="relative text-center">
        <LogoMark size={56} className="mx-auto" />
        <p className="mt-8 font-mono text-sm text-orange">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">This page could not be found</h1>
        <p className="mt-3 text-muted-foreground">The link may be wrong, or you may not have access to it.</p>
        <Link href="/" className="btn-orange mt-8 inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold">Back to Innova Checker</Link>
      </div>
    </main>
  );
}
