import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/common/app-shell";
import { Pagination } from "@/components/dashboard/scan-table";
import { CreateUserDialog } from "@/components/admin/user-forms";
import { prisma } from "@/server/db";
import { formatDate, timeAgo } from "@/lib/format";
import { getLocale, getT } from "@/i18n/server";
import { adminUsersText } from "@/i18n/messages/admin-users";

const SIZE = 25;

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const txt = await getT(adminUsersText);
  const t = txt.list;
  const locale = await getLocale();
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const role = sp.role === "SUPER_ADMIN" || sp.role === "USER" || sp.role === "UNLIMITED" ? sp.role : "";
  const status = sp.status === "active" || sp.status === "inactive" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { fullName: { contains: q, mode: "insensitive" } }, { companyName: { contains: q, mode: "insensitive" } }] } : {}),
    ...(role ? { role } : {}),
    ...(status ? { isActive: status === "active" } : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, include: { subscriptions: { where: { status: { in: ["ACTIVE", "SUSPENDED", "PENDING"] } }, include: { plan: true }, take: 1 }, _count: { select: { scans: true } } } }),
  ]);
  const qs = (p: number) => new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), ...(status ? { status } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString();
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.count(total)} actions={<CreateUserDialog />} />
      <form method="get" className="surface mb-5 grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative"><span className="sr-only">{txt.search}</span><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" /><input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-9 text-sm text-white outline-none focus:border-orange/60" /></label>
        <select name="role" defaultValue={role} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label={t.role}><option value="">{t.allRoles}</option><option value="USER">{t.roleUsers}</option><option value="UNLIMITED">{t.roleUnlimited}</option><option value="SUPER_ADMIN">{t.roleAdmins}</option></select>
        <select name="status" defaultValue={status} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label={t.status}><option value="">{t.allStatuses}</option><option value="active">{t.active}</option><option value="inactive">{t.deactivated}</option></select>
        <button type="submit" className="btn-orange h-10 rounded-xl px-4 text-sm font-semibold">{txt.filter}</button>
      </form>
      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3.5 font-medium">{t.user}</th><th className="px-4 py-3.5 font-medium">{t.company}</th><th className="px-4 py-3.5 font-medium">{t.role}</th><th className="px-4 py-3.5 font-medium">{t.subscription}</th><th className="px-4 py-3.5 font-medium">{t.scans}</th><th className="px-4 py-3.5 font-medium">{t.lastLogin}</th><th className="px-4 py-3.5 font-medium">{t.joined}</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015]">
                <td className="px-5 py-3.5"><Link href={`/admin/users/${u.id}`} className="font-medium text-white hover:text-orange">{u.fullName}</Link><span className="block text-xs text-muted-foreground">{u.email}{!u.isActive && <span className="ml-2 text-v-malicious">{t.deactivatedBadge}</span>}</span></td>
                <td className="px-4 py-3.5 text-white/75">{u.companyName}</td>
                <td className="px-4 py-3.5"><span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${u.role === "SUPER_ADMIN" ? "text-orange ring-orange/30 bg-orange/10" : u.role === "UNLIMITED" ? "text-v-trusted ring-v-trusted/30 bg-v-trusted/10" : "text-white/70 ring-white/10 bg-white/5"}`}>{txt.roles[u.role]}</span></td>
                <td className="px-4 py-3.5 text-[13px] text-white/75">{u.role !== "USER" ? <span className="text-v-trusted">{t.unlimited}</span> : u.subscriptions[0] ? `${u.subscriptions[0].plan.name} · ${u.subscriptions[0].status.toLowerCase()}` : "—"}</td>
                <td className="px-4 py-3.5 font-mono text-[13px] text-white/80">{u._count.scans}</td>
                <td className="px-4 py-3.5 text-[13px] text-white/70">{u.lastLoginAt ? timeAgo(u.lastLoginAt, locale) : txt.never}</td>
                <td className="px-4 py-3.5 text-[13px] text-white/70">{formatDate(u.createdAt, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / SIZE)} makeHref={(p) => `/admin/users?${qs(p)}`} />
    </>
  );
}
