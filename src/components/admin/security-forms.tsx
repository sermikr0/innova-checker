"use client";

import { ConfirmButton } from "@/components/common/confirm-button";
import { unblockIpAction } from "@/app/admin/actions";

export function UnblockIpButton({ id, ip }: { id: string; ip: string }) {
  return (
    <ConfirmButton action={unblockIpAction.bind(null, id)} title={`Unblock ${ip}?`} description="Sign-ins and scans from this address are allowed again and its failed-attempt counter is reset." confirmLabel="Unblock" className="h-8 border border-white/10 px-3 text-xs text-white hover:bg-white/5">
      Unblock
    </ConfirmButton>
  );
}
