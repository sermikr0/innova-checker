import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { hmac } from "@/server/crypto";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { contactSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const body = await readJson(req, contactSchema);
  const ipHash = hmac(clientIp(await headers()));
  const rl = await hitRateLimit(`contact:${ipHash}`, 5, 3600);
  if (!rl.ok) throw new ApiError(429, "RATE_LIMITED", "Too many messages. Please try again later.");
  // Honeypot field: real users never fill it.
  if (body.website) return jsonOk({ ok: true });
  await prisma.contactMessage.create({
    data: { name: body.name, email: body.email, company: body.company || null, subject: body.subject, message: body.message, ipHash },
  });
  return jsonOk({ ok: true });
});
