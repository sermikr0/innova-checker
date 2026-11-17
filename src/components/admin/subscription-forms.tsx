"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { assignSubscriptionAction, changePlanAction, extendSubscriptionAction, setExpiryAction, setSubscriptionStatusAction, updateDeviceLimitAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton, SelectField, Toggle } from "./controls";
import { useT } from "@/i18n/client";
import { adminBillingText } from "@/i18n/messages/admin-billing";

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
  const t = useT(adminBillingText).assign;
  return (
    <Modal open={open} onOpenChange={setOpen} title={t.title} description={t.description} trigger={<PrimaryButton><CalendarPlus className="size-4" /> {t.title}</PrimaryButton>}>
      <div className="space-y-3">
        {fixedUser ? <Field label={t.user} value={fixedUser.email} disabled readOnly /> : <SelectField label={t.user} value={userId} onChange={setUserId} options={(users ?? []).map((u) => ({ value: u.id, label: u.email }))} />}
        <SelectField label={t.plan} value={planId} onChange={setPlanId} options={plans.map((p) => ({ value: p.id, label: t.planOption(p.name, p.deviceLimit) }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.start} type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="[&_input]:[color-scheme:dark]" />
          <Field label={t.expiry} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="[&_input]:[color-scheme:dark]" />
        </div>
        <Field label={t.deviceLimit} type="number" min={1} value={deviceLimit} onChange={(e) => setDeviceLimit(e.target.value)} />
        <Field label={t.note} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePlaceholder} />
        <PrimaryButton pending={pending} onClick={() => run(() => assignSubscriptionAction({ userId, planId, startsAt: startsAt || undefined, expiresAt: expiresAt ? `${expiresAt}T23:59:59Z` : undefined, deviceLimit: deviceLimit || undefined, note: note || undefined }), { onSuccess: () => setOpen(false) })}>{t.assign}</PrimaryButton>
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
  const { manage: t, units } = useT(adminBillingText);
  const box = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className={box}>
        <p className="text-sm font-medium text-white">{t.changePlan}</p>
        <SelectField label={t.plan} value={planId} onChange={setPlanId} options={plans.map((p) => ({ value: p.id, label: p.name }))} />
        <Toggle label={t.restart} checked={recompute} onChange={setRecompute} />
        <PrimaryButton pending={pending} onClick={() => run(() => changePlanAction(sub.id, planId, recompute))}>{t.changePlan}</PrimaryButton>
      </div>
      <div className={box}>
        <p className="text-sm font-medium text-white">{t.extend}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.amount} type="number" min={1} value={extVal} onChange={(e) => setExtVal(e.target.value)} />
          <SelectField label={t.unit} value={extUnit} onChange={(v) => setExtUnit(v as "DAY")} options={[{ value: "DAY", label: units.DAY }, { value: "MONTH", label: units.MONTH }, { value: "YEAR", label: units.YEAR }]} />
        </div>
        <PrimaryButton pending={pending} onClick={() => run(() => extendSubscriptionAction(sub.id, Number(extVal), extUnit))}>{t.extend}</PrimaryButton>
      </div>
      <div className={box}>
        <p className="text-sm font-medium text-white">{t.customExpiry}</p>
        <Field label={t.expiresOn} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="[&_input]:[color-scheme:dark]" />
        <PrimaryButton pending={pending} onClick={() => run(() => setExpiryAction(sub.id, `${expiry}T23:59:59Z`))}>{t.setExpiry}</PrimaryButton>
      </div>
      <div className={box}>
        <p className="text-sm font-medium text-white">{t.deviceLimit}</p>
        <Field label={t.allowedDevices} type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)} />
        <PrimaryButton pending={pending} onClick={() => run(() => updateDeviceLimitAction(sub.id, Number(limit)))}>{t.updateLimit}</PrimaryButton>
      </div>
      <div className={`${box} md:col-span-2`}>
        <p className="text-sm font-medium text-white">{t.status}</p>
        <div className="flex flex-wrap gap-2">
          {sub.status !== "ACTIVE" && <ConfirmButton action={setSubscriptionStatusAction.bind(null, sub.id, "ACTIVE")} title={t.activateTitle} description={t.activateText} confirmLabel={t.activate} className="h-10 border border-v-safe/30 px-4 text-v-safe hover:bg-v-safe/10">{t.activate}</ConfirmButton>}
          {sub.status === "ACTIVE" && <ConfirmButton action={setSubscriptionStatusAction.bind(null, sub.id, "SUSPENDED")} title={t.suspendTitle} description={t.suspendText} confirmLabel={t.suspend} className="h-10 border border-v-suspicious/30 px-4 text-v-suspicious hover:bg-v-suspicious/10">{t.suspend}</ConfirmButton>}
          {sub.status !== "CANCELLED" && <ConfirmButton action={setSubscriptionStatusAction.bind(null, sub.id, "CANCELLED")} title={t.deactivateTitle} description={t.deactivateText} confirmLabel={t.deactivate} destructive className="h-10 border border-v-malicious/30 px-4 text-v-malicious hover:bg-v-malicious/10">{t.deactivate}</ConfirmButton>}
          <GhostButton disabled>{sub.status}</GhostButton>
        </div>
      </div>
    </div>
  );
}
