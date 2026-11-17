import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "./env";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status, headers: { "cache-control": "no-store" } });
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "cache-control": "no-store", ...(init?.headers ?? {}) } });
}

/**
 * CSRF defence for state-changing requests: the browser-supplied Origin must match
 * the host the request was sent to (or APP_URL). Cookies are SameSite=Lax as well.
 */
export function assertSameOrigin(req: Request): void {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) {
    throw new ApiError(403, "CSRF", "Cross-site request rejected.");
  }
  const origin = req.headers.get("origin");
  if (!origin) throw new ApiError(403, "CSRF", "Missing Origin header.");
  let o: URL;
  try {
    o = new URL(origin);
  } catch {
    throw new ApiError(403, "CSRF", "Invalid Origin header.");
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const allowed = new Set<string>([new URL(env().APP_URL).host]);
  if (host) allowed.add(host);
  if (!allowed.has(o.host)) throw new ApiError(403, "CSRF", "Cross-origin request rejected.");
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 64 * 1024) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body too large.");
    body = text ? JSON.parse(text) : {};
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ApiError(400, "VALIDATION", first?.message ?? "Invalid input.", {
      fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
    });
  }
  return parsed.data;
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with uniform error handling. */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return jsonError(e.status, e.code, e.message, e.extra);
      console.error("[api] unhandled error", e);
      return jsonError(500, "INTERNAL", "Something went wrong. Please try again.");
    }
  };
}

/** Client IP honouring TRUSTED_PROXY_COUNT (see README: anonymous limits). */
export function clientIp(headers: Headers): string {
  // server.mjs overwrites this header with the socket address (or the address
  // its trusted proxies report), so it cannot be forged by the visitor.
  const marker = process.env.INNOVA_CLIENT_IP_HEADER;
  if (marker) return headers.get(marker) ?? "0.0.0.0";
  // Without server.mjs (next dev, or a platform such as Vercel that rewrites
  // X-Forwarded-For itself) fall back to the forwarded chain.
  const xff = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const trusted = env().TRUSTED_PROXY_COUNT;
  if (xff.length) {
    const idx = Math.max(0, xff.length - 1 - Math.max(0, trusted - 1));
    return trusted === 0 ? xff[xff.length - 1] : xff[idx];
  }
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

export function userAgent(headers: Headers): string {
  return (headers.get("user-agent") ?? "").slice(0, 400);
}
