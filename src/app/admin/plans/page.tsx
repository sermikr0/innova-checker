import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/app-shell";
import { ConfirmButton } from "@/components/common/confirm-button";
import { PlanDialog, PricingConfigForm } from "@/components/admin/plan-forms";
import { prisma } from "@/server/db";
import { getPricingConfig } from "@/server/settings";
import { formatUzs } from "@/lib/format";
import { deletePlanAction } from "../actions";

export default async function AdminPlans() {
  const [plans, pricing] = await Promise.all([prisma.subscriptionPlan.findMany({ orderBy: [{ sortOrder: "asc" }], include: { _count: { select: { subscriptions: true } } } }), getPricingConfig()]);
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Plans & pricing" description="Prices, durations and device limits are read from the database by the pricing page and by subscription assignment." actions={<PlanDialog />} />
      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3.5 font-medium">Plan</th><th className="px-4 py-3.5 font-medium">Duration</th><th className="px-4 py-3.5 font-medium">Price</th><th className="px-4 py-3.5 font-medium">Devices</th><th className="px-4 py-3.5 font-medium">Status</th><th className="px-4 py-3.5 font-medium">In use</th><th className="px-4 py-3.5" /></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-5 py-3.5"><span className="font-medium text-white">{p.name}</span>{p.isRecommended && <span className="ml-2 rounded-full bg-orange/15 px-2 py-0.5 text-[10.5px] font-semibold text-orange">Recommended</span>}<span className="block font-mono text-xs text-muted-foreground">{p.slug}</span></td>
                <td className="px-4 py-3.5 text-white/80">{p.durationValue} {p.durationUnit.toLowerCase()}{p.durationValue === 1 ? "" : "s"}</td>
                <td className="px-4 py-3.5 font-medium text-white">{formatUzs(p.priceUzs)}</td>
                <td className="px-4 py-3.5 text-white/80">{p.deviceLimit}</td>
                <td className={`px-4 py-3.5 text-xs font-semibold ${p.isActive ? "text-v-safe" : "text-muted-foreground"}`}>{p.isActive ? "enabled" : "disabled"}</td>
                <td className="px-4 py-3.5 text-white/70">{p._count.subscriptions}</td>
                <td className="px-4 py-3.5">
                  <span className="flex justify-end gap-2">
                    <PlanDialog plan={{ id: p.id, name: p.name, slug: p.slug, description: p.description, durationValue: p.durationValue, durationUnit: p.durationUnit, priceUzs: p.priceUzs, priceUsdCents: p.priceUsdCents, deviceLimit: p.deviceLimit, features: Array.isArray(p.features) ? (p.features as string[]) : [], isActive: p.isActive, isRecommended: p.isRecommended, sortOrder: p.sortOrder }} />
                    <ConfirmButton action={deletePlanAction.bind(null, p.id)} title={`Delete ${p.name}?`} description="Plans that are used by subscriptions cannot be deleted; disable them instead." confirmLabel="Delete" destructive className="h-9 border border-v-malicious/30 px-3 text-v-malicious hover:bg-v-malicious/10"><Trash2 className="size-4" /></ConfirmButton>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="surface mt-6 max-w-3xl rounded-2xl p-6"><h2 className="mb-4 text-[15px] font-semibold text-white">Pricing page settings</h2><PricingConfigForm config={{ paymentNotice: pricing.paymentNotice, ctaLabel: pricing.ctaLabel, highlightLabel: pricing.highlightLabel, showComparison: pricing.showComparison }} /></section>
    </>
  );
}
