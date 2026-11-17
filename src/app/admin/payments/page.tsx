import { PageHeader, EmptyState } from "@/components/common/app-shell";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { providerStatus } from "@/server/payments/config";
import { formatDateTime } from "@/lib/format";

const STATUS_CLS: Record<string, string> = { PAID: "text-v-safe", PENDING: "text-sev-info", PREPARED: "text-sev-info", EXPIRED: "text-muted-foreground", CANCELLED: "text-muted-foreground", FAILED: "text-v-malicious" };

export default async function PaymentsPage() {
  await requireAdmin();
  const [intents, paidUzs, paidUsd] = await Promise.all([
    prisma.paymentIntent.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true } }, plan: { select: { name: true } } } }),
    prisma.paymentIntent.aggregate({ where: { status: "PAID", currency: "UZS", mock: false }, _sum: { amount: true }, _count: true }),
    prisma.paymentIntent.aggregate({ where: { status: "PAID", currency: "USD", mock: false }, _sum: { amount: true }, _count: true }),
  ]);
  const providers = providerStatus();
  return (
    <>
      <PageHeader eyebrow="Payments" title="Payments" description="Every payment QR code issued, with its outcome. Subscriptions are activated only by verified provider callbacks." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {providers.map((p) => (
          <div key={p.id} className="surface rounded-2xl p-5">
            <p className="text-xs text-muted-foreground">{p.label} · {p.region}</p>
            <p className={`mt-1 text-lg font-semibold ${p.live ? "text-v-safe" : p.available ? "text-v-suspicious" : "text-muted-foreground"}`}>{p.live ? "Live" : p.available ? "Test mode" : "Not configured"}</p>
          </div>
        ))}
        <div className="surface rounded-2xl p-5"><p className="text-xs text-muted-foreground">Paid via Click</p><p className="mt-1 text-lg font-semibold text-white">{new Intl.NumberFormat("en-US").format(paidUzs._sum.amount ?? 0)} UZS · {paidUzs._count}</p></div>
        <div className="surface rounded-2xl p-5"><p className="text-xs text-muted-foreground">Paid by card</p><p className="mt-1 text-lg font-semibold text-white">${((paidUsd._sum.amount ?? 0) / 100).toFixed(2)} · {paidUsd._count}</p></div>
      </div>
      {intents.length === 0 ? (
        <EmptyState icon="CreditCard" title="No payments yet" text="Payments appear here as soon as users generate a payment QR code." />
      ) : (
        <div className="surface overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {intents.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-mono text-white/80">{i.number}</td>
                  <td className="px-4 py-3 text-white">{i.user.email}</td>
                  <td className="px-4 py-3 text-white/75">{i.plan.name}</td>
                  <td className="px-4 py-3 text-white/75">{i.currency === "USD" ? `$${(i.amount / 100).toFixed(2)}` : `${new Intl.NumberFormat("en-US").format(i.amount)} UZS`}</td>
                  <td className="px-4 py-3 text-white/75">{i.provider === "CLICK" ? "Click" : "Card"}{i.mock ? " (test)" : ""}</td>
                  <td className={`px-4 py-3 text-xs font-semibold ${STATUS_CLS[i.status] ?? ""}`}>{i.status}{i.failureReason ? <span className="block font-normal text-muted-foreground">{i.failureReason}</span> : null}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(i.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
