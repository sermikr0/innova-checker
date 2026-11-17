"use client";

import { useState } from "react";
import { KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { refreshVtQuotaAction, removeProviderKeyAction, saveProviderKeyAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton } from "./controls";

export function ReplaceKeyDialog({ provider, name, hasKey }: { provider: string; name: string; hasKey: boolean }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const { run, pending } = useAction();
  return (
    <Modal open={open} onOpenChange={(o) => { setOpen(o); if (!o) setKey(""); }} title={`${hasKey ? "Replace" : "Add"} ${name} API key`} description={provider === "virusTotal" ? "The key is checked with VirusTotal before it is saved. It is stored encrypted and never shown again." : "The key is stored encrypted and never shown again."} trigger={<PrimaryButton className="h-9 px-3"><KeyRound className="size-4" /> {hasKey ? "Replace key" : "Add key"}</PrimaryButton>}>
      <div className="space-y-3">
        <Field label="API key" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} />
        <PrimaryButton pending={pending} disabled={!key.trim()} onClick={() => run(() => saveProviderKeyAction(provider, key), { onSuccess: () => { setOpen(false); setKey(""); } })}>Save key</PrimaryButton>
      </div>
    </Modal>
  );
}

export function RemoveKeyButton({ provider, name }: { provider: string; name: string }) {
  return (
    <ConfirmButton action={removeProviderKeyAction.bind(null, provider)} title={`Remove the stored ${name} key?`} description="Scans fall back to the environment variable, or report the provider as Not configured." confirmLabel="Remove" destructive className="h-9 border border-v-malicious/30 px-3 text-v-malicious hover:bg-v-malicious/10"><Trash2 className="size-4" /></ConfirmButton>
  );
}

export function RefreshQuotaButton() {
  const { run, pending } = useAction();
  return <GhostButton disabled={pending} onClick={() => run(refreshVtQuotaAction)} className="h-9 px-3"><RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} /> Refresh quota</GhostButton>;
}
