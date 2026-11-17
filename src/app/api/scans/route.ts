import { after } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonOk, readJson, route } from "@/server/http";
import { executeScan, startScan } from "@/server/scans/service";

export const maxDuration = 60;

const Body = z.object({ url: z.string().trim().min(1, "Enter a URL to analyze.").max(2048, "URL is too long.") });

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const { url } = await readJson(req, Body);
  const { id } = await startScan(url);
  after(() => executeScan(id));
  return jsonOk({ id }, { status: 202 });
});
