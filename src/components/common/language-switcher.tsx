"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { cn } from "@/lib/utils";

function rememberLocale(l: Locale) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax${secure}`;
}

/** UZ / RU / EN buttons. The choice is kept for a year in the ic_lang cookie. */
export function LanguageSwitcher({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const current = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (l: Locale) => {
    if (l === current) return;
    rememberLocale(l);
    start(() => router.refresh());
  };
  return (
    <div role="group" aria-label="Language" className={cn("inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-0.5", pending && "opacity-70", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => choose(l)}
          aria-pressed={l === current}
          title={LOCALE_LABELS[l].name}
          className={cn("rounded-[10px] font-semibold tracking-wide transition-colors", size === "sm" ? "h-7 px-2 text-[11px]" : "h-8 px-2.5 text-xs", l === current ? "bg-orange text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white")}
        >
          {LOCALE_LABELS[l].short}
        </button>
      ))}
    </div>
  );
}
