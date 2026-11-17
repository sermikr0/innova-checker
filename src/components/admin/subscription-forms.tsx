"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { assignSubscriptionAction, changePlanAction, extendSubscriptionAction, setExpiryAction, setSubscriptionStatusAction, updateDeviceLimitAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton, SelectField, Toggle } from "./controls";

type PlanOpt = { id: string; name: string; deviceLimit: number };

export function AssignSubscriptionDialog({ plans, users, fixedUser }: { plans: PlanOpt[]; users?: { id: string; email: string }[]; fixedUser?: { id: string; email: string } }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(fixedUser?.id ?? users?.[0]?.id ?? "");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [deviceLimit, setDeviceLimit] = useState("");
  const [note, setNote] = useState("");
  const { run, pending } = useAction();
  return (
    <Modal open={open} onOpenChange={setOpen} title="Assign subscription" description="Replaces any current subscription of this user. Leave dates empty to start now with the plan's duration." trigger={<PrimaryButton><CalendarPlus className="size-4" /> Assign subscription</PrimaryButton>}>
      <div className="space-y-3">
        {fixedUser ? <Field label="User" value={fixedUser.email} disabled readOnly /> : <SelectField label="User" value={userId} onChange={setUserId} options={(users ?? []).map((u) => ({ value: u.id, label: u.email }))} />}
        <SelectField label="Plan" value={planId} onChange={setPlanId} options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${p.deviceLimit} device(s)` }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start (optional)" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="[&_input]:[color-scheme:dark]" />
          <Field label="Custom expiry (optional)" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="[&_input]:[color-scheme:dark]" />
        </div>
        <Field label="Device limit override (optional)" type="number" min={1} value={deviceLimit} onChange={(e) => setDeviceLimit(e.target.value)} />
        <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid by bank transfer, invoice #123" />
        <PrimaryButton pending={pending} onClick={() => run(() => assignSubscriptionAction({ userId, planId, startsAt: startsAt || undefined, expiresAt: expiresAt ? `${expiresAt}T23:59:59Z` : undefined, deviceLimit: deviceLimit || undefined, note: note || undefined }), { onSuccess: () => setOpen(false) })}>Assign</PrimaryButton>
      </div>
    </Modal>
  );
}

export function ManageSubscription({ sub, plans }: { sub: { id: string; status: string; planId: string; deviceLimit: number; expiresAt: string }; plans: PlanOpt[] }) {
  const { run, pending } = useAction();
  const [planId, setPlanId] = useState(sub.planId);
  const [recompute, setRecompute] = useState(false);
  const [extVal, setExtVal] = useState("1");
  const [extUnit, setExtUnit] = useState<"DAY" | "MONTH" | "YEAR">("MONTH");
  const [expiry, setExpiry] = useState(sub.expiresAt.slice(0, 10));
  const [limit, setLimit] = useState(String(sub.deviceLimit));
  const box = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className={box}>
        <p className="text-sm font-medium text-white">Change plan</p>
        <SelectField label="Plan" value={planId} onChange={setPlanId} options={plans.map((p) => ({ value: p.id, label: p.name }))} />
        <Toggle label="Restart duration from today" checked={recompute} onChange={setRecompute} />
        <PrimaryButton pending={pending} onClick={() => run(() => changePlanAction(sub.id, planId, recompute))}>Change plan</PrimaryButton>
      </div>
      <div className={box}>
        <p className="text-sm font-medium text-white">Extend</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount" type="number" min={1} value={extVal} onChange={(e) => setExtVal(e.target.value)} />
          <SelectField label="Unit" value={extUnit} onChange={(v) => setExtUnit(v as "DAY")} options={[{ value: "DAY", label: "Days" }, { value: "MONTH", label: "Months" }, { value: "YEAR", label: "Years" }]} />
        </div>
        <PrimaryButton pending={pending} onClick={() => run(() => extendSubscriptionAction(sub.id, Number(extVal), extUnit))}>Extend</PrimaryButton>
      </div>
      <div className={box}>
        <p className="text-sm font-medium text-white">Custom expiration date</p>
        <Field label="Expires on" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="[&_input]:[color-scheme:dark]" />
        <PrimaryButton pending={pending} onClick={() => run(() => setExpiryAction(sub.id, `${expiry}T23:59:59Z`))}>Set expiry</PrimaryButton>
      </div>
      <div className={box}>
        <p className="text-sm font-medium text-white">Device limit</p>
        <Field label="Allowed devices" type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)} />
        <PrimaryButton pending={pending} onClick={() => run(() => updateDeviceLimitAction(sub.id, Number(limit)))}>Update limit</PrimaryButton>
      </div>
      <div className={`${box} md:col-span-2`}>
        <p className="text-sm font-medium text-white">Status</p>
        <div className="flex flex-wrap gap-2">
          {sub.status !== "ACTIVE" && <ConfirmButton action={setSubscriptionStatusAction.bind(null, sub.id, "ACTIVE")} title="Activate subscription?" description="The user will be able to scan until the expiration date." confirmLabel="Activate" className="h-10 border border-v-safe/30 px-4 text-v-safe hover:bg-v-safe/10">Activate</ConfirmButton>}
          {sub.status === "ACTIVE" && <ConfirmButton action={setSubscriptionStatusAction.bind(null, sub.id, "SUSPENDED")} title="Suspend subscription?" description="Scanning is blocked until the subscription is activated again." confirmLabel="Suspend" className="h-10 border border-v-suspicious/30 px-4 text-v-suspicious hover:bg-v-suspicious/10">Suspend</ConfirmButton>}
          {sub.status !== "CANCELLED" && <ConfirmButton action={setSubscriptionStatusAction.bind(null, sub.id, "CANCELLED")} title="Deactivate subscription?" description="The subscription is cancelled. Assign a new one to restore access." confirmLabel="Deactivate" destructive className="h-10 border border-v-malicious/30 px-4 text-v-malicious hover:bg-v-malicious/10">Deactivate</ConfirmButton>}
          <GhostButton disabled>{sub.status}</GhostButton>
        </div>
      </div>
    </div>
  );
}
