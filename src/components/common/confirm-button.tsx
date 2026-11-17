"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAction } from "./use-action";
import { cn } from "@/lib/utils";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Button that asks for confirmation, then runs a Server Action. */
export function ConfirmButton({ action, title, description, confirmLabel = "Confirm", children, className, destructive = false, onDone }: { action: () => Promise<Result>; title: string; description: string; confirmLabel?: string; children: React.ReactNode; className?: string; destructive?: boolean; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const { run, pending } = useAction();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors", className)}>{children}</button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-[#121216]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              run(action, { onSuccess: () => { setOpen(false); onDone?.(); } }).then((r) => { if (!r.ok) setOpen(false); });
            }}
            className={destructive ? "bg-v-malicious text-white hover:bg-v-malicious/85" : "btn-orange"}
          >
            {pending && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
