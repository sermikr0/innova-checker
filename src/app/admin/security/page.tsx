import { PageHeader, EmptyState } from "@/components/common/app-shell";
import { UnblockIpButton } from "@/components/admin/security-forms";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { getSystemSettings } from "@/server/settings";
import { formatDateTime } from "@/lib/format";
import { getLocale, getT } from "@/i18n/server";
import { adminText } from "@/i18n/messages/admin";

export default async function SecurityPage() {
  await requireAdmin();
  const t = (await getT(adminText)).security;
  const locale = await getLocale();
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 3600_000);
  const [settings, active, recent, failed24h] = await Promise.all([
    getSystemSettings(),
    prisma.ipBlock.findMany({ where: { blockedUntil: { gt: now } }, orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.ipBlock.findMany({ where: { blockedUntil: { lte: now } }, orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.auditLog.count({ where: { action: "USER_LOGIN_FAILED", createdAt: { gte: since } } }),
  ]);
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description(settings.ipBlockMinutes, settings.loginMaxAttempts, settings.loginLockoutMinutes)} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="surface rounded-2xl p-5"><p className="text-xs text-muted-foreground">{t.blockedNow}</p><p className="mt-1 text-3xl font-semibold text-white">{active.length}</p></div>
        <div className="surface rounded-2xl p-5"><p className="text-xs text-muted-foreground">{t.failed24h}</p><p className="mt-1 text-3xl font-semibold text-white">{failed24h}</p></div>
        <div className="surface rounded-2xl p-5"><p className="text-xs text-muted-foreground">{t.blockRule}</p><p className="mt-1 text-lg font-semibold text-white">{t.rule(settings.loginMaxAttempts, settings.ipBlockMinutes)}</p></div>
      </div>
      {active.length === 0 ? (
        <EmptyState icon="ShieldCheck" title={t.emptyTitle} text={t.emptyText} />
      ) : (
        <div className="surface overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">{t.ipAddress}</th><th className="px-4 py-3">{t.reason}</th><th className="px-4 py-3">{t.failures}</th><th className="px-4 py-3">{t.blockedUntil}</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {active.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-white">{b.ip}</td>
                  <td className="px-4 py-3 text-white/75">{b.reason}</td>
                  <td className="px-4 py-3 text-white/75">{b.failures}</td>
                  <td className="px-4 py-3 text-white/75">{formatDateTime(b.blockedUntil, locale)}</td>
                  <td className="px-4 py-3 text-right"><UnblockIpButton id={b.id} ip={b.ip} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recent.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-white">{t.recent}</h2>
          <ul className="surface divide-y divide-white/[0.05] rounded-2xl text-sm">
            {recent.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-3 px-5 py-3"><span className="font-mono text-white/80">{b.ip}</span><span className="text-xs text-muted-foreground">{b.unblockedById ? t.liftedByAdmin : t.expired} · {formatDateTime(b.updatedAt, locale)}</span></li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
