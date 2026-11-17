import { z } from "zod";
import { hmac } from "../crypto";
import { ApiError } from "../http";
import { DEVICE_HEADER } from "@/lib/device-fingerprint";

// Server side of the browser device fingerprint (src/lib/device-fingerprint.ts).
// The traits are validated strictly and reduced to an HMAC, so raw hardware
// details are never stored and the hash cannot be correlated across installs.

const Traits = z
  .object({
    v: z.literal(1),
    browser: z.string().max(20),
    os: z.string().max(20),
    platform: z.string().max(40),
    cores: z.number().int().min(0).max(1024),
    memory: z.number().min(0).max(1024),
    touch: z.number().int().min(0).max(64),
    tz: z.string().max(64),
    lang: z.string().max(120),
    color: z.number().int().min(0).max(64),
    glVendor: z.string().max(120),
    glRenderer: z.string().max(200),
    glMaxTexture: z.number().int().min(0).max(1 << 20),
    fonts: z.string().max(1000),
  })
  .strict();

export type DeviceTraits = z.infer<typeof Traits>;

export function readFingerprint(headers: Headers): { hash: string; traits: DeviceTraits } | null {
  const raw = headers.get(DEVICE_HEADER);
  if (!raw || raw.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  try {
    const parsed = Traits.safeParse(JSON.parse(Buffer.from(raw, "base64url").toString("utf8")));
    if (!parsed.success) return null;
    const t = parsed.data;
    const canonical = [t.browser, t.os, t.platform, t.cores, t.memory, t.touch, t.tz, t.lang, t.color, t.glVendor, t.glRenderer, t.glMaxTexture, t.fonts].join("|");
    return { hash: hmac(`device:v1:${canonical}`), traits: t };
  } catch {
    return null;
  }
}

/** Sign-in, registration, payments and anonymous scans all need the fingerprint. */
export function requireFingerprint(headers: Headers): { hash: string; traits: DeviceTraits } {
  const fp = readFingerprint(headers);
  if (!fp) throw new ApiError(400, "DEVICE_CHECK_REQUIRED", "Your browser did not pass the device check. Enable JavaScript, reload the page and try again.");
  return fp;
}
