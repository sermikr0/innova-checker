"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, TextArea } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { reportDomainAction } from "@/app/dashboard/actions";
import { useT } from "@/i18n/client";
import { dashboardText } from "@/i18n/messages/dashboard";

export function ReportDomainButton({ domain }: { domain: string }) {
  const [open, setOpen] = useState(false);
  const [listType, setListType] = useState<"BLACKLIST" | "SUSPICIOUS" | "WHITELIST">("SUSPICIOUS");
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const { run, pending } = useAction();
  const t = useT(dashboardText).report;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">
          <Flag className="size-4" /> {t.button}
        </button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#121216] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t.title(domain)}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(["BLACKLIST", "SUSPICIOUS", "WHITELIST"] as const).map((lt) => (
              <button key={lt} type="button" onClick={() => setListType(lt)} className={`rounded-xl border px-2 py-2 text-xs font-medium ${listType === lt ? "border-orange/50 bg-orange/10 text-white" : "border-white/10 text-white/70 hover:bg-white/5"}`}>
                {t.types[lt]}
              </button>
            ))}
          </div>
          <TextArea label={t.why} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.whyPlaceholder} />
          <Field label={t.evidence} value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder={t.evidencePlaceholder} />
        </div>
        <DialogFooter>
          <button type="button" disabled={pending} onClick={() => run(() => reportDomainAction({ domain, listType, reason, evidenceUrl }), { onSuccess: () => setOpen(false), refresh: false })} className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">
            {pending && <Loader2 className="size-4 animate-spin" />} {t.submit}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
