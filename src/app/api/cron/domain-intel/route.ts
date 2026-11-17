import crypto from "node:crypto";
import { jsonError, jsonOk, route } from "@/server/http";
import { resolveProviderKeys } from "@/server/integrations";
import { revalidateDomains, runJob, syncThreatFeeds } from "@/server/domain-intel/service";

export const maxDuration = 300;

// Scheduled entry point (system cron, Vercel Cron, Kubernetes CronJob):
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/domain-intel?job=feeds"
export const POST = route(async (req) => {
  const secret = process.env.CRON_SECRET ?? "";
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (secret.length < 24 || given.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return jsonError(401, "UNAUTHORIZED", "Invalid cron secret.");
  }
  const job = new URL(req.url).searchParams.get("job") ?? "all";
  const out: Record<string, unknown> = {};
  if (job === "feeds" || job === "all") out.feeds = await runJob("threat-feed-sync", "cron", async () => syncThreatFeeds({ urlhaus: (await resolveProviderKeys()).urlhaus }));
  if (job === "revalidate" || job === "all") out.revalidate = await runJob("domain-revalidation", "cron", () => revalidateDomains());
  return jsonOk(out);
});
