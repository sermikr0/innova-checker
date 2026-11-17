"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { deviceHeaders } from "@/lib/device-fingerprint";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Labelled input with error text, styled for the dark UI. */
export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, error, hint, id, className, type, ...rest }, ref) {
  const [show, setShow] = useState(false);
  const inputId = id ?? rest.name;
  const isPassword = type === "password";
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="block text-[13px] font-medium text-white/85">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "h-11 w-full rounded-xl border bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 transition-colors outline-none focus:border-orange/60 focus:bg-white/[0.05] focus:ring-3 focus:ring-orange/15 disabled:opacity-60",
            error ? "border-v-malicious/60" : "border-white/10",
            isPassword && "pr-11",
          )}
          {...rest}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 hover:text-white" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-v-malicious">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }>(function TextArea({ label, error, id, className, ...rest }, ref) {
  const inputId = id ?? rest.name;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="block text-[13px] font-medium text-white/85">{label}</label>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn("min-h-[140px] w-full rounded-xl border bg-white/[0.03] px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange/60 focus:ring-3 focus:ring-orange/15", error ? "border-v-malicious/60" : "border-white/10")}
        {...rest}
      />
      {error && <p className="text-xs text-v-malicious">{error}</p>}
    </div>
  );
});

/** Posts JSON to an API route and returns the parsed body or a normalised error. */
export async function postJson<T = unknown>(url: string, body: unknown, method = "POST"): Promise<{ ok: true; data: T } | { ok: false; code: string; message: string; fields?: Record<string, string>; extra?: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { method, headers: { "content-type": "application/json", ...deviceHeaders() }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: j as T };
    return { ok: false, code: j?.error?.code ?? "ERROR", message: j?.error?.message ?? "Request failed.", fields: j?.error?.fields, extra: j?.error };
  } catch {
    return { ok: false, code: "NETWORK", message: "Network error. Check your connection and try again." };
  }
}
