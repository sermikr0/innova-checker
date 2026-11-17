"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Result = { ok: true; message?: string; data?: unknown } | { ok: false; error: string; fields?: Record<string, string> };

/** Runs a Server Action, shows a toast, and refreshes server components on success. */
export function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, opts: { success?: string; onSuccess?: (r: Result & { ok: true }) => void; refresh?: boolean } = {}) =>
    new Promise<Result>((resolve) => {
      start(async () => {
        const r = await fn();
        if (r.ok) {
          toast.success(r.message ?? opts.success ?? "Saved");
          opts.onSuccess?.(r);
          if (opts.refresh !== false) router.refresh();
        } else {
          toast.error(r.error);
        }
        resolve(r);
      });
    });
  return { run, pending };
}
