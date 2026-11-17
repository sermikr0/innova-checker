import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/common/app-shell";
import { Pagination } from "@/components/dashboard/scan-table";
import { prisma } from "@/server/db";
import { formatDateTime } from "@/lib/format";
import { getLocale, getT } from "@/i18n/server";
import { adminText } from "@/i18n/messages/admin";

const SIZE = 50;

export default async function AuditLogs({ searchParams }: PageProps<"/admin/audit-logs">) {
  const sp = await searchParams;
  const { audit: t, filter } = await getT(adminText);
  const locale = await getLocale();
  const action = typeof sp.action === "string" ? sp.action : "";
  const actor = typeof sp.actor === "string" ? sp.actor.trim().slice(0, 200) : "";
  const from = typeof sp.from === "string" && sp.from ? new Date(`${sp.from}T00:00:00Z`) : null;
  const to = typeof sp.to === "string" && sp.to ? new Date(`${sp.to}T23:59:59Z`) : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
    ...(from || to ? { createdAt: { ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}), ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}) } } : {}),
  };
  const [total, logs, actions] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);
  const qs = (p: number) => new URLSearchParams({ ...(action ? { action } : {}), ...(actor ? { actor } : {}), ...(typeof sp.from === "string" && sp.from ? { from: sp.from } : {}), ...(typeof sp.to === "string" && sp.to ? { to: sp.to } : {}), page: String(p) }).toString();
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description(total)} />
      <form method="get" className="surface mb-5 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-[220px_1fr_160px_160px_auto]">
        <select name="action" defaultValue={action} aria-label={t.action} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white"><option value="">{t.allActions}</option>{actions.map((a) => <option key={a.action} value={a.action}>{a.action}</option>)}</select>
        <input name="actor" defaultValue={actor} placeholder={t.actorEmail} className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white" />
        <input type="date" name="from" defaultValue={typeof sp.from === "string" ? sp.from : ""} aria-label={t.from} className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white [color-scheme:dark]" />
        <input type="date" name="to" defaultValue={typeof sp.to === "string" ? sp.to : ""} aria-label={t.to} className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white [color-scheme:dark]" />
        <button type="submit" className="btn-orange h-10 rounded-xl px-4 text-sm font-semibold">{filter}</button>
      </form>
      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3.5 font-medium">{t.time}</th><th className="px-4 py-3.5 font-medium">{t.actor}</th><th className="px-4 py-3.5 font-medium">{t.action}</th><th className="px-4 py-3.5 font-medium">{t.target}</th><th className="px-4 py-3.5 font-medium">{t.metadata}</th><th className="px-4 py-3.5 font-medium">{t.ip}</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-white/[0.04] align-top last:border-0">
                <td className="px-5 py-3 text-xs whitespace-nowrap text-white/70">{formatDateTime(l.createdAt, locale)}</td>
                <td className="px-4 py-3 text-[13px] text-white/85">{l.actorEmail ?? t.systemAnonymous}</td>
                <td className="px-4 py-3"><span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-orange">{l.action}</span></td>
                <td className="px-4 py-3 text-[13px] text-white/75">{l.targetType ?? "—"}<span className="block text-xs break-all text-muted-foreground">{l.targetLabel ?? l.targetId ?? ""}</span></td>
                <td className="max-w-[320px] px-4 py-3"><pre className="max-h-24 overflow-auto font-mono text-[10.5px] whitespace-pre-wrap break-all text-white/60">{l.metadata ? JSON.stringify(l.metadata) : "—"}</pre></td>
                <td className="px-4 py-3 font-mono text-xs text-white/60">{l.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / SIZE)} makeHref={(p) => `/admin/audit-logs?${qs(p)}`} />
    </>
  );
}
