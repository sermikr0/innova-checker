import { prisma } from "@/server/db";
import { jsonError, jsonOk, route } from "@/server/http";
import { getSession } from "@/server/auth/session";

export const GET = route(async () => {
  const s = await getSession();
  if (!s || s.user.role !== "SUPER_ADMIN") return jsonError(404, "NOT_FOUND", "Not found.");
  const runs = await prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 6 });
  return jsonOk({ runs: runs.map((r) => ({ id: r.id, name: r.name, status: r.status, trigger: r.trigger, summary: r.summary, error: r.error, startedAt: r.startedAt, finishedAt: r.finishedAt })) });
});
