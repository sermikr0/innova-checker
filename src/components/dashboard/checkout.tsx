"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, QrCode, RefreshCw, TimerOff, X } from "lucide-react";
import { toast } from "sonner";
import { postJson } from "@/components/common/field";
import { cn } from "@/lib/utils";
import { formatUzs } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { billingText } from "@/i18n/messages/billing";

export type CheckoutPlan = { slug: string; name: string; priceUzs: number; priceUsdCents: number; duration: string; deviceLimit: number; isRecommended: boolean };
export type CheckoutProvider = { id: "CLICK" | "CARD"; label: string; region: string; currency: "UZS" | "USD"; available: boolean; live: boolean };

type Intent = { id: string; number: number; status: string; amount: number; currency: string; mock: boolean; plan: { name: string }; expiresAt: string; serverNow: string; payUrl: string; qrSvg: string };

const money = (amount: number, currency: string, locale: Locale) => (currency === "USD" ? `$${(amount / 100).toFixed(2)}` : formatUzs(amount, locale));

export function Checkout({ plans, providers, initialPlan }: { plans: CheckoutPlan[]; providers: CheckoutProvider[]; initialPlan?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const tx = useT(billingText).checkout;
  const [plan, setPlan] = useState(plans.find((p) => p.slug === initialPlan)?.slug ?? plans.find((p) => p.isRecommended)?.slug ?? plans[0]?.slug);
  const defaultProvider = providers.find((p) => p.available && (Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Tashkent" ? p.id === "CLICK" : p.id === "CARD")) ?? providers.find((p) => p.available);
  const [provider, setProvider] = useState<CheckoutProvider["id"] | undefined>(defaultProvider?.id);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [status, setStatus] = useState<string>("IDLE");
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const skew = useRef(0);

  const selected = plans.find((p) => p.slug === plan);
  const prov = providers.find((p) => p.id === provider);
  const price = selected && prov ? (prov.currency === "UZS" ? selected.priceUzs : selected.priceUsdCents) : 0;

  const start = useCallback(async () => {
    if (!plan || !provider) return;
    setBusy(true);
    const r = await postJson<Intent>("/api/payments/intents", { plan, provider });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    skew.current = new Date(r.data.serverNow).getTime() - Date.now();
    setIntent(r.data);
    setStatus("PENDING");
  }, [plan, provider]);

  // Countdown against the server clock.
  useEffect(() => {
    if (!intent || (status !== "PENDING" && status !== "PREPARED")) return;
    const tick = () => {
      const ms = new Date(intent.expiresAt).getTime() - (Date.now() + skew.current);
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0 && status === "PENDING") setStatus("EXPIRED");
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [intent, status]);

  // Payment status, confirmed only by the provider's server callback.
  useEffect(() => {
    if (!intent || !["PENDING", "PREPARED", "EXPIRED"].includes(status)) return;
    let stop = false;
    const poll = async () => {
      const res = await fetch(`/api/payments/intents/${intent.id}`, { cache: "no-store" }).catch(() => null);
      const j = res?.ok ? ((await res.json()) as { status: string }) : null;
      if (stop || !j) return;
      if (j.status !== status) setStatus(j.status);
      if (j.status === "PAID") {
        toast.success(tx.paidToast);
        router.refresh();
      }
    };
    const t = setInterval(poll, 2000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [intent, status, router, tx.paidToast]);

  async function cancel() {
    if (intent && status === "PENDING") await postJson(`/api/payments/intents/${intent.id}/cancel`, {});
    setIntent(null);
    setStatus("IDLE");
  }

  if (!plans.length) return <p className="text-sm text-muted-foreground">{tx.noPlans}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-white">{tx.choosePlan}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => (
              <button key={p.slug} type="button" disabled={!!intent && status !== "IDLE"} onClick={() => setPlan(p.slug)} className={cn("rounded-2xl border p-4 text-left transition-colors disabled:opacity-60", plan === p.slug ? "border-orange/60 bg-orange/[0.08]" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]")}>
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{p.name}</span>
                  {p.isRecommended && <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-semibold text-white uppercase">{tx.best}</span>}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{p.duration} · {tx.upTo(p.deviceLimit)}</span>
                <span className="mt-3 block text-lg font-semibold text-white tabular-nums">{money(p.priceUzs, "UZS", locale)}</span>
                {p.priceUsdCents > 0 && <span className="block text-xs text-muted-foreground">{tx.orByCard(money(p.priceUsdCents, "USD", locale))}</span>}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-white">{tx.paymentMethod}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {providers.map((p) => (
              <button key={p.id} type="button" disabled={!p.available || (!!intent && status !== "IDLE")} onClick={() => setProvider(p.id)} className={cn("flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50", provider === p.id ? "border-orange/60 bg-orange/[0.08]" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]")}>
                {p.id === "CLICK" ? <QrCode className="size-5 text-orange" /> : <CreditCard className="size-5 text-orange" />}
                <span>
                  <span className="block font-semibold text-white">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{tx.regions[p.id]} · {p.currency}{!p.available ? ` · ${tx.comingSoon}` : !p.live ? ` · ${tx.testMode}` : ""}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="surface rounded-3xl p-6">
        {!intent || status === "IDLE" ? (
          <>
            <p className="text-sm text-muted-foreground">{tx.youPay}</p>
            <p className="mt-1 text-3xl font-semibold text-white tabular-nums">{prov && price > 0 ? money(price, prov.currency, locale) : "—"}</p>
            <p className="mt-2 text-sm text-white/70">{tx.summary(selected?.name, selected?.duration)}</p>
            <button type="button" onClick={start} disabled={busy || !prov?.available || price <= 0} className="btn-orange mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />} {tx.generateQr}
            </button>
            {prov && price <= 0 && <p className="mt-3 text-xs text-muted-foreground">{tx.notSoldWith(prov.label)}</p>}
          </>
        ) : status === "PAID" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-14 text-v-safe" />
            <p className="mt-3 text-xl font-semibold text-white">{tx.paymentReceived}</p>
            <p className="mt-1 text-sm text-white/70">{tx.activeOnDevice(intent.plan.name)}</p>
            <button type="button" onClick={() => router.push("/dashboard/scanner")} className="btn-orange mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold">{tx.startScanning}</button>
          </div>
        ) : status === "EXPIRED" || status === "CANCELLED" || status === "FAILED" ? (
          <div className="text-center">
            <TimerOff className="mx-auto size-12 text-v-suspicious" />
            <p className="mt-3 text-lg font-semibold text-white">{status === "EXPIRED" ? tx.qrExpired : tx.notCompleted}</p>
            <p className="mt-1 text-sm text-white/70">{status === "EXPIRED" ? tx.expiredText : tx.notCompletedText}</p>
            <button type="button" onClick={start} disabled={busy} className="btn-orange mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold">
              <RefreshCw className="size-4" /> {tx.newQr}
            </button>
            <button type="button" onClick={cancel} className="mt-2 h-10 w-full rounded-xl text-sm text-muted-foreground hover:text-white">{tx.backToPlans}</button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{tx.scanWith(prov?.id === "CLICK")}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/svg+xml;base64,${btoa(intent.qrSvg)}`} alt={tx.qrAlt} className={cn("mx-auto mt-4 size-56 rounded-2xl bg-white p-2 transition-opacity", left <= 10 && "opacity-70")} />
            <p className={cn("mt-4 font-mono text-3xl font-semibold tabular-nums", left <= 30 ? "text-v-malicious" : "text-white")}>
              {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{status === "PREPARED" ? tx.inProgress : tx.payBeforeTimer}</p>
            <p className="mt-4 text-lg font-semibold text-white">{money(intent.amount, intent.currency, locale)}</p>
            <p className="text-xs text-muted-foreground">{intent.plan.name} · {tx.paymentNo(intent.number)}{intent.mock ? ` · ${tx.testMode}` : ""}</p>
            <a href={intent.payUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white hover:bg-white/[0.08]">
              <ExternalLink className="size-4" /> {tx.openOnDevice}
            </a>
            <button type="button" onClick={cancel} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm text-muted-foreground hover:text-white">
              <X className="size-4" /> {tx.cancel}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
