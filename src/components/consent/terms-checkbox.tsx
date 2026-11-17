"use client";

import { useT } from "@/i18n/client";
import { consentText } from "@/i18n/messages/consent";
import { cn } from "@/lib/utils";

/** "I have read and accept the Terms of Use and the Privacy Policy" — required before using the service. */
export function TermsCheckbox({ checked, onChange, error, id = "accept-terms" }: { checked: boolean; onChange: (v: boolean) => void; error?: string | null; id?: string }) {
  const t = useT(consentText);
  return (
    <div>
      <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-[13.5px] leading-relaxed text-white/85", error ? "border-v-malicious/60 bg-v-malicious/[0.05]" : "border-white/10 bg-white/[0.02]")}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="mt-0.5 size-4 shrink-0 accent-[#ff6b00]" />
        <span>
          {t.checkboxBefore}
          <a href="/terms" target="_blank" rel="noopener" className="font-medium text-orange underline-offset-2 hover:underline">{t.termsLink}</a>
          {t.checkboxMiddle}
          <a href="/privacy" target="_blank" rel="noopener" className="font-medium text-orange underline-offset-2 hover:underline">{t.privacyLink}</a>
          {t.checkboxAfter}
        </span>
      </label>
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs text-v-malicious" role="alert">{error}</p>}
    </div>
  );
}
