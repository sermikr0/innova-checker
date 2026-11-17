"use client";

import { useState } from "react";
import { KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { refreshVtQuotaAction, removeProviderKeyAction, saveProviderKeyAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton } from "./controls";
import { useT } from "@/i18n/client";
import { adminSettingsText } from "@/i18n/messages/admin-settings";

export function ReplaceKeyDialog({ provider, name, hasKey }: { provider: string; name: string; hasKey: boolean }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const { run, pending } = useAction();
  const t = useT(adminSettingsText).keys;
  return (
    <Modal open={open} onOpenChange={(o) => { setOpen(o); if (!o) setKey(""); }} title={t.title(hasKey, name)} description={provider === "virusTotal" ? t.vtText : t.text} trigger={<PrimaryButton className="h-9 px-3"><KeyRound className="size-4" /> {hasKey ? t.replace : t.add}</PrimaryButton>}>
      <div className="space-y-3">
        <Field label={t.apiKey} type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} />
        <PrimaryButton pending={pending} disabled={!key.trim()} onClick={() => run(() => saveProviderKeyAction(provider, key), { onSuccess: () => { setOpen(false); setKey(""); } })}>{t.save}</PrimaryButton>
      </div>
    </Modal>
  );
}

export function RemoveKeyButton({ provider, name }: { provider: string; name: string }) {
  const t = useT(adminSettingsText).keys;
  return (
    <ConfirmButton action={removeProviderKeyAction.bind(null, provider)} title={t.removeTitle(name)} description={t.removeText} confirmLabel={t.remove} destructive className="h-9 border border-v-malicious/30 px-3 text-v-malicious hover:bg-v-malicious/10"><Trash2 className="size-4" /></ConfirmButton>
  );
}

export function RefreshQuotaButton() {
  const { run, pending } = useAction();
  const t = useT(adminSettingsText).keys;
  return <GhostButton disabled={pending} onClick={() => run(refreshVtQuotaAction)} className="h-9 px-3"><RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} /> {t.refresh}</GhostButton>;
}
