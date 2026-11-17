import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/app-shell";
import { prisma } from "@/server/db";
import { formatDateTime } from "@/lib/format";
import { getLocale, getT } from "@/i18n/server";
import { adminDomainsText } from "@/i18n/messages/admin-domains";

export default async function DomainHistoryPage({ params }: PageProps<"/admin/domains/[id]">) {
  const { id } = await params;
  const txt = await getT(adminDomainsText);
  const locale = await getLocale();
  const rec = await prisma.domainRecord.findUnique({ where: { id } });
  if (!rec) notFound();
  const history = await prisma.domainRecordHistory.findMany({ where: { OR: [{ recordId: id }, { domain: rec.domain }] }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader eyebrow={`${rec.listType.toLowerCase()} · ${rec.trustStatus.replace(/_/g, " ").toLowerCase()} · ${rec.status.toLowerCase()}`} title={rec.domain} description={rec.verificationSource ?? txt.detail.noSource} actions={<Link href={`/admin/domains?tab=${rec.status === "PENDING" ? "PENDING" : rec.listType}`} className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm text-white hover:bg-white/5">{txt.detail.back}</Link>} />
      <ol className="space-y-3">
        {history.map((h) => (
          <li key={h.id} className="surface rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold text-white">{h.action.toLowerCase()} <span className="font-normal text-muted-foreground">· {h.listType.toLowerCase()}</span></span><span className="text-xs text-muted-foreground">{h.actorEmail ?? txt.system} · {formatDateTime(h.createdAt, locale)}</span></div>
            {h.changes != null && <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] whitespace-pre-wrap break-all text-white/70">{JSON.stringify(h.changes, null, 2)}</pre>}
          </li>
        ))}
      </ol>
    </>
  );
}
