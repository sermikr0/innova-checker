import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clientIp } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { hmac } from "@/server/crypto";
import { handleClickCallback } from "@/server/payments/click";

// Click SHOP API callback (Prepare and Complete). Configure this URL, or the
// /prepare and /complete aliases, in the Click merchant cabinet. Requests are
// authenticated by Click's signature, not by session or origin.
export async function POST(req: Request) {
  const ip = clientIp(await headers());
  const rl = await hitRateLimit(`click:cb:${hmac(ip)}`, 300, 60);
  if (!rl.ok) return NextResponse.json({ error: -8, error_note: "Too many requests" }, { status: 429 });
  const text = (await req.text()).slice(0, 8192);
  const ct = req.headers.get("content-type") ?? "";
  let params: Record<string, string>;
  try {
    params = ct.includes("application/json") ? Object.fromEntries(Object.entries(JSON.parse(text) as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")])) : Object.fromEntries(new URLSearchParams(text));
  } catch {
    return NextResponse.json({ error: -8, error_note: "Error in request from click" });
  }
  const response = await handleClickCallback(params, { ip });
  return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
}
