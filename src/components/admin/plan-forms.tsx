"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Field, TextArea } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { createPlanAction, updatePlanAction, updatePricingConfigAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton, SelectField, Toggle } from "./controls";

export type PlanForm = { id?: string; name: string; slug: string; description: string; durationValue: number; durationUnit: "DAY" | "MONTH" | "YEAR"; priceUzs: number; priceUsdCents: number; deviceLimit: number; features: string[]; isActive: boolean; isRecommended: boolean; sortOrder: number };

const EMPTY: PlanForm = { name: "", slug: "", description: "", durationValue: 1, durationUnit: "MONTH", priceUzs: 0, priceUsdCents: 0, deviceLimit: 1, features: [], isActive: true, isRecommended: false, sortOrder: 10 };

export function PlanDialog({ plan }: { plan?: PlanForm }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<PlanForm>(plan ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useAction();
  return (
    <Modal open={open} onOpenChange={setOpen} wide title={plan ? `Edit ${plan.name}` : "Create plan"} description="Changes apply to new subscriptions. Existing subscriptions keep their device limit and dates." trigger={plan ? <GhostButton className="h-9 px-3"><Pencil className="size-4" /> Edit</GhostButton> : <PrimaryButton><Plus className="size-4" /> New plan</PrimaryButton>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} />
        <Field label="Slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} error={errors.slug} />
        <div className="sm:col-span-2"><TextArea label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} error={errors.description} /></div>
        <Field label="Price (UZS)" type="number" min={0} value={f.priceUzs} onChange={(e) => setF({ ...f, priceUzs: Number(e.target.value) })} error={errors.priceUzs} />
        <Field label="Card price (USD cents, 0 = not sold by card)" type="number" min={0} value={f.priceUsdCents} onChange={(e) => setF({ ...f, priceUsdCents: Number(e.target.value) })} error={errors.priceUsdCents} />
        <Field label="Device limit" type="number" min={1} value={f.deviceLimit} onChange={(e) => setF({ ...f, deviceLimit: Number(e.target.value) })} error={errors.deviceLimit} />
        <Field label="Duration" type="number" min={1} value={f.durationValue} onChange={(e) => setF({ ...f, durationValue: Number(e.target.value) })} error={errors.durationValue} />
        <SelectField label="Duration unit" value={f.durationUnit} onChange={(v) => setF({ ...f, durationUnit: v as PlanForm["durationUnit"] })} options={[{ value: "DAY", label: "Days" }, { value: "MONTH", label: "Months" }, { value: "YEAR", label: "Years" }]} />
        <Field label="Sort order" type="number" min={0} value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} />
        <div className="sm:col-span-2">
          <TextArea label="Features (one per line)" value={f.features.join("\n")} onChange={(e) => setF({ ...f, features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
        </div>
        <Toggle label="Enabled" description="Visible on the pricing page and assignable." checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} />
        <Toggle label="Recommended" description="Highlighted on the pricing page (only one plan)." checked={f.isRecommended} onChange={(v) => setF({ ...f, isRecommended: v })} />
        <div className="sm:col-span-2">
          <PrimaryButton pending={pending} onClick={async () => {
            const { id, ...data } = f;
            const r = await run(() => (id ? updatePlanAction(id, data) : createPlanAction(data)), { onSuccess: () => { setOpen(false); if (!plan) setF(EMPTY); } });
            setErrors(r.ok ? {} : r.fields ?? {});
          }}>{plan ? "Save plan" : "Create plan"}</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export function PricingConfigForm({ config }: { config: { paymentNotice: string; ctaLabel: string; highlightLabel: string; showComparison: boolean } }) {
  const [f, setF] = useState(config);
  const { run, pending } = useAction();
  return (
    <div className="space-y-3">
      <Field label="Payment notice on every card" value={f.paymentNotice} onChange={(e) => setF({ ...f, paymentNotice: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button label" value={f.ctaLabel} onChange={(e) => setF({ ...f, ctaLabel: e.target.value })} />
        <Field label="Recommended badge" value={f.highlightLabel} onChange={(e) => setF({ ...f, highlightLabel: e.target.value })} />
      </div>
      <Toggle label="Show comparison table" checked={f.showComparison} onChange={(v) => setF({ ...f, showComparison: v })} />
      <p className="text-xs text-muted-foreground">No payment provider is integrated, so purchase buttons stay disabled regardless of these labels.</p>
      <PrimaryButton pending={pending} onClick={() => run(() => updatePricingConfigAction(f))}>Save pricing settings</PrimaryButton>
    </div>
  );
}
