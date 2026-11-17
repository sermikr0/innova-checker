"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Field, TextArea } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { createPlanAction, updatePlanAction, updatePricingConfigAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton, SelectField, Toggle } from "./controls";
import { useT } from "@/i18n/client";
import { adminBillingText } from "@/i18n/messages/admin-billing";

export type PlanForm = { id?: string; name: string; slug: string; description: string; durationValue: number; durationUnit: "DAY" | "MONTH" | "YEAR"; priceUzs: number; priceUsdCents: number; deviceLimit: number; features: string[]; isActive: boolean; isRecommended: boolean; sortOrder: number };

const EMPTY: PlanForm = { name: "", slug: "", description: "", durationValue: 1, durationUnit: "MONTH", priceUzs: 0, priceUsdCents: 0, deviceLimit: 1, features: [], isActive: true, isRecommended: false, sortOrder: 10 };

export function PlanDialog({ plan }: { plan?: PlanForm }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<PlanForm>(plan ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useAction();
  const { planForm: t, units } = useT(adminBillingText);
  return (
    <Modal open={open} onOpenChange={setOpen} wide title={plan ? t.editTitle(plan.name) : t.createPlan} description={t.description} trigger={plan ? <GhostButton className="h-9 px-3"><Pencil className="size-4" /> {t.edit}</GhostButton> : <PrimaryButton><Plus className="size-4" /> {t.newPlan}</PrimaryButton>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.name} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} />
        <Field label={t.slug} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} error={errors.slug} />
        <div className="sm:col-span-2"><TextArea label={t.descriptionLabel} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} error={errors.description} /></div>
        <Field label={t.priceUzs} type="number" min={0} value={f.priceUzs} onChange={(e) => setF({ ...f, priceUzs: Number(e.target.value) })} error={errors.priceUzs} />
        <Field label={t.priceCard} type="number" min={0} value={f.priceUsdCents} onChange={(e) => setF({ ...f, priceUsdCents: Number(e.target.value) })} error={errors.priceUsdCents} />
        <Field label={t.deviceLimit} type="number" min={1} value={f.deviceLimit} onChange={(e) => setF({ ...f, deviceLimit: Number(e.target.value) })} error={errors.deviceLimit} />
        <Field label={t.duration} type="number" min={1} value={f.durationValue} onChange={(e) => setF({ ...f, durationValue: Number(e.target.value) })} error={errors.durationValue} />
        <SelectField label={t.durationUnit} value={f.durationUnit} onChange={(v) => setF({ ...f, durationUnit: v as PlanForm["durationUnit"] })} options={[{ value: "DAY", label: units.DAY }, { value: "MONTH", label: units.MONTH }, { value: "YEAR", label: units.YEAR }]} />
        <Field label={t.sortOrder} type="number" min={0} value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} />
        <div className="sm:col-span-2">
          <TextArea label={t.features} value={f.features.join("\n")} onChange={(e) => setF({ ...f, features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
        </div>
        <Toggle label={t.enabled} description={t.enabledText} checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} />
        <Toggle label={t.recommended} description={t.recommendedText} checked={f.isRecommended} onChange={(v) => setF({ ...f, isRecommended: v })} />
        <div className="sm:col-span-2">
          <PrimaryButton pending={pending} onClick={async () => {
            const { id, ...data } = f;
            const r = await run(() => (id ? updatePlanAction(id, data) : createPlanAction(data)), { onSuccess: () => { setOpen(false); if (!plan) setF(EMPTY); } });
            setErrors(r.ok ? {} : r.fields ?? {});
          }}>{plan ? t.savePlan : t.createPlan}</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export function PricingConfigForm({ config }: { config: { paymentNotice: string; ctaLabel: string; highlightLabel: string; showComparison: boolean } }) {
  const [f, setF] = useState(config);
  const { run, pending } = useAction();
  const t = useT(adminBillingText).planForm;
  return (
    <div className="space-y-3">
      <Field label={t.paymentNotice} value={f.paymentNotice} onChange={(e) => setF({ ...f, paymentNotice: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.buttonLabel} value={f.ctaLabel} onChange={(e) => setF({ ...f, ctaLabel: e.target.value })} />
        <Field label={t.recommendedBadge} value={f.highlightLabel} onChange={(e) => setF({ ...f, highlightLabel: e.target.value })} />
      </div>
      <Toggle label={t.showComparison} checked={f.showComparison} onChange={(v) => setF({ ...f, showComparison: v })} />
      <p className="text-xs text-muted-foreground">{t.noProvider}</p>
      <PrimaryButton pending={pending} onClick={() => run(() => updatePricingConfigAction(f))}>{t.savePricing}</PrimaryButton>
    </div>
  );
}
