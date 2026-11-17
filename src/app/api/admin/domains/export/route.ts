import type { DomainListType } from "@/generated/prisma/client";
import { jsonError, route } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { exportCsv } from "@/server/domain-intel/service";

export const GET = route(async (req) => {
  const s = await getSession();
  if (!s || s.user.role !== "SUPER_ADMIN") return jsonError(404, "NOT_FOUND", "Not found.");
  const sp = new URL(req.url).searchParams;
  const list = sp.get("list");
  const csv = await exportCsv({
    ...(list && ["WHITELIST", "BLACKLIST", "SUSPICIOUS"].includes(list) ? { listType: list as DomainListType } : {}),
    ...(sp.get("status") === "PENDING" ? { status: "PENDING" } : {}),
  });
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="innova-domains-${(list ?? sp.get("status") ?? "all").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
});
