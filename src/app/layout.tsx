import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { JetBrains_Mono, Onest, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/i18n/client";
import { INTL_LOCALE } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin", "latin-ext"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "cyrillic"], display: "swap" });
// Outfit has no Cyrillic. Onest is loaded for Cyrillic only (its @font-face rules
// carry a Cyrillic unicode-range) and comes first in the stack, so Russian text
// uses Onest and everything else still uses Outfit.
const cyrillic = Onest({ variable: "--font-onest", subsets: ["cyrillic", "cyrillic-ext"], display: "swap", adjustFontFallback: false });

export const metadata: Metadata = {
  title: { default: "Innova Checker — URL security intelligence", template: "%s · Innova Checker" },
  description:
    "Advanced URL security intelligence to detect phishing, scams, malicious websites, and suspicious links before they become a threat. Built for logistics teams by Innova Networks.",
  applicationName: "Innova Checker",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading request headers keeps every page dynamically rendered, which the
  // per-request CSP nonce (src/proxy.ts) requires.
  await headers();
  const locale = await getLocale();
  return (
    <html lang={INTL_LOCALE[locale]} data-scroll-behavior="smooth" className={`dark ${outfit.variable} ${cyrillic.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <LocaleProvider locale={locale}>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </LocaleProvider>
        <Toaster position="top-right" richColors={false} closeButton />
      </body>
    </html>
  );
}
