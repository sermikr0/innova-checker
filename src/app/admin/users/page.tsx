import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/common/app-shell";
import { Pagination } from "@/components/dashboard/scan-table";
import { CreateUserDialog } from "@/components/admin/user-forms";
import { prisma } from "@/server/db";
import { formatDate, timeAgo } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";

const SIZE = 25;

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
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
      <PageHeader eyebrow="Accounts" title="Users" description={`${total} user(s)`} actions={<CreateUserDialog />} />
      <form method="get" className="surface mb-5 grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative"><span className="sr-only">Search</span><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" /><input name="q" defaultValue={q} placeholder="Search name, e-mail or company" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-9 text-sm text-white outline-none focus:border-orange/60" /></label>
        <select name="role" defaultValue={role} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label="Role"><option value="">All roles</option><option value="USER">Users</option><option value="UNLIMITED">Unlimited users</option><option value="SUPER_ADMIN">Super Admins</option></select>
        <select name="status" defaultValue={status} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label="Status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Deactivated</option></select>
        <button type="submit" className="btn-orange h-10 rounded-xl px-4 text-sm font-semibold">Filter</button>
      </form>
      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3.5 font-medium">User</th><th className="px-4 py-3.5 font-medium">Company</th><th className="px-4 py-3.5 font-medium">Role</th><th className="px-4 py-3.5 font-medium">Subscription</th><th className="px-4 py-3.5 font-medium">Scans</th><th className="px-4 py-3.5 font-medium">Last login</th><th className="px-4 py-3.5 font-medium">Joined</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015]">
                <td className="px-5 py-3.5"><Link href={`/admin/users/${u.id}`} className="font-medium text-white hover:text-orange">{u.fullName}</Link><span className="block text-xs text-muted-foreground">{u.email}{!u.isActive && <span className="ml-2 text-v-malicious">deactivated</span>}</span></td>
                <td className="px-4 py-3.5 text-white/75">{u.companyName}</td>
                <td className="px-4 py-3.5"><span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${u.role === "SUPER_ADMIN" ? "text-orange ring-orange/30 bg-orange/10" : u.role === "UNLIMITED" ? "text-v-trusted ring-v-trusted/30 bg-v-trusted/10" : "text-white/70 ring-white/10 bg-white/5"}`}>{ROLE_LABELS[u.role]}</span></td>
                <td className="px-4 py-3.5 text-[13px] text-white/75">{u.role !== "USER" ? <span className="text-v-trusted">Unlimited</span> : u.subscriptions[0] ? `${u.subscriptions[0].plan.name} · ${u.subscriptions[0].status.toLowerCase()}` : "—"}</td>
                <td className="px-4 py-3.5 font-mono text-[13px] text-white/80">{u._count.scans}</td>
                <td className="px-4 py-3.5 text-[13px] text-white/70">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "never"}</td>
                <td className="px-4 py-3.5 text-[13px] text-white/70">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / SIZE)} makeHref={(p) => `/admin/users?${qs(p)}`} />
    </>
  );
}
