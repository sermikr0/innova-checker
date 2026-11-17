import Link from "next/link";
import { PageHeader } from "@/components/common/app-shell";
import { Checkout } from "@/components/dashboard/checkout";
import { durationText } from "@/components/marketing/pricing-cards";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { providerStatus } from "@/server/payments/config";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/common/app-shell";
import { getSiteAccess } from "@/server/settings";

const STATUS_CLS: Record<string, string> = { PAID: "text-v-safe", PENDING: "text-sev-info", PREPARED: "text-sev-info", EXPIRED: "text-muted-foreground", CANCELLED: "text-muted-foreground", FAILED: "text-v-malicious" };

export default async function BillingPage(props: PageProps<"/dashboard/billing">) {
  const s = await requireUser("/dashboard/billing");
  const sp = await props.searchParams;
  const [plans, payments] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { priceUzs: "asc" }] }),
    prisma.paymentIntent.findMany({ where: { userId: s.user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { plan: { select: { name: true } } } }),
  ]);
  const initialPlan = typeof sp.plan === "string" ? sp.plan : undefined;
  const access = await getSiteAccess();
  return (
    <>
      <PageHeader eyebrow="Billing" title="Buy a subscription" description="Pay with Click in Uzbekistan or by Visa / Mastercard abroad. The plan is activated automatically on this device once the payment is confirmed." />
      {!access.pricing ? (
        <EmptyState icon="Wallet" title="Plans are not on sale right now" text="Online purchases are paused. Contact Innova Networks and an administrator can activate a plan for your account." action={<Link href="/contact" className="btn-orange inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold">Contact us</Link>} />
      ) : (
      <Checkout
        initialPlan={initialPlan}
        providers={providerStatus()}
        plans={plans.map((p) => ({ slug: p.slug, name: p.name, priceUzs: p.priceUzs, priceUsdCents: p.priceUsdCents, duration: durationText(p.durationValue, p.durationUnit), deviceLimit: p.deviceLimit, isRecommended: p.isRecommended }))}
      />
      )}
      {payments.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-[15px] font-semibold text-white">Recent payments</h2>
          <ol className="surface divide-y divide-white/[0.05] rounded-2xl text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <span className="text-white">#{p.number} · {p.plan.name} · {p.currency === "USD" ? `$${(p.amount / 100).toFixed(2)}` : `${new Intl.NumberFormat("en-US").format(p.amount)} UZS`} · {p.provider === "CLICK" ? "Click" : "Card"}{p.mock ? " (test)" : ""}</span>
                <span className="flex items-center gap-4">
                  <span className={`text-xs font-semibold ${STATUS_CLS[p.status] ?? ""}`}>{p.status}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(p.createdAt)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
