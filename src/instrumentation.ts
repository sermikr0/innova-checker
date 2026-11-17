// Optional in-process scheduler for self-hosted deployments (ENABLE_INTERNAL_SCHEDULER=true).
// Serverless deployments should call POST /api/cron/domain-intel from an external cron instead.

const FEEDS_EVERY_MS = 6 * 3600_000;
const REVALIDATE_EVERY_MS = 24 * 3600_000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.ENABLE_INTERNAL_SCHEDULER !== "true") return;
  const { prisma } = await import("./server/db");
  const { revalidateDomains, runJob, syncThreatFeeds } = await import("./server/domain-intel/service");

  const due = async (name: string, every: number) => {
    const last = await prisma.jobRun.findFirst({ where: { name, status: "SUCCESS" }, orderBy: { startedAt: "desc" } });
    return !last || Date.now() - last.startedAt.getTime() > every;
  };
  const tick = async () => {
    try {
      if (await due("threat-feed-sync", FEEDS_EVERY_MS)) await runJob("threat-feed-sync", "scheduler", async () => syncThreatFeeds({ urlhaus: (await (await import("./server/integrations")).resolveProviderKeys()).urlhaus }));
      if (await due("domain-revalidation", REVALIDATE_EVERY_MS)) await runJob("domain-revalidation", "scheduler", () => revalidateDomains());
    } catch (e) {
      console.error("[scheduler] job failed", e);
    }
  };
  setTimeout(tick, 60_000);
  setInterval(tick, 15 * 60_000).unref?.();
  console.info("[scheduler] internal domain-intelligence scheduler enabled");
}
