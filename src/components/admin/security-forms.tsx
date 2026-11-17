"use client";

import { ConfirmButton } from "@/components/common/confirm-button";
import { unblockIpAction } from "@/app/admin/actions";
import { useT } from "@/i18n/client";
import { adminSettingsText } from "@/i18n/messages/admin-settings";

export function UnblockIpButton({ id, ip }: { id: string; ip: string }) {
  const t = useT(adminSettingsText).unblock;
  return (
    <ConfirmButton action={unblockIpAction.bind(null, id)} title={t.title(ip)} description={t.text} confirmLabel={t.button} className="h-8 border border-white/10 px-3 text-xs text-white hover:bg-white/5">
      {t.button}
    </ConfirmButton>
  );
}
