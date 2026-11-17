import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin", "latin-ext"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

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
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`dark ${outfit.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        <Toaster position="top-right" richColors={false} closeButton />
      </body>
    </html>
  );
}
