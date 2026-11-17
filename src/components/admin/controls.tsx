"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function Modal({ trigger, title, description, children, open, onOpenChange, wide = false }: { trigger: React.ReactNode; title: string; description?: string; children: React.ReactNode; open: boolean; onOpenChange: (o: boolean) => void; wide?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto border-white/10 bg-[#121216]", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function SelectField({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-[13px] font-medium text-white/85">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white outline-none focus:border-orange/60">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-orange peer-focus-visible:ring-2 peer-focus-visible:ring-orange/50" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function PrimaryButton({ children, pending, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  return (
    <button type="button" disabled={pending || rest.disabled} className={cn("btn-orange inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60", className)} {...rest}>
      {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07] disabled:opacity-50", className)} {...rest}>
      {children}
    </button>
  );
}

/** Textarea editing a string[] as one value per line. */
export function LinesField({ label, hint, value, onChange, rows = 6 }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between text-[13px] font-medium text-white/85">
        {label} <span className="text-xs font-normal text-muted-foreground">{value.length} entries</span>
      </span>
      <textarea rows={rows} value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 font-mono text-[12.5px] text-white outline-none focus:border-orange/60" spellCheck={false} />
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
