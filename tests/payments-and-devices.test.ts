import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://x@localhost/x";
process.env.IP_HASH_SECRET ??= "test-secret-test-secret-test-secret-1234";

const traits = { v: 1, browser: "Chrome", os: "Windows", platform: "Win32", cores: 8, memory: 8, touch: 0, tz: "Asia/Tashkent", lang: "uz-UZ,ru", color: 24, glVendor: "Google Inc. (NVIDIA)", glRenderer: "ANGLE (NVIDIA GeForce RTX 3060)", glMaxTexture: 16384, fonts: "Arial,Calibri,Segoe UI" };
const encode = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const headersWith = (fp: string) => new Headers({ "x-innova-device": fp });

describe("Click SHOP API signature", () => {
  it("matches Click's documented MD5 layout for Prepare and Complete", async () => {
    const { clickSign } = await import("@/server/payments/click");
    const p = { click_trans_id: "123", service_id: "77", merchant_trans_id: "15", amount: "50000", action: "0", sign_time: "2026-11-14 10:00:00" };
    expect(clickSign(p, "SECRET")).toBe(crypto.createHash("md5").update("12377SECRET15500000" + "2026-11-14 10:00:00").digest("hex"));
    const c = { ...p, action: "1", merchant_prepare_id: "15" };
    expect(clickSign(c, "SECRET")).toBe(crypto.createHash("md5").update("12377SECRET1515500001" + "2026-11-14 10:00:00").digest("hex"));
  });

  it("rejects a forged signature before touching any order", async () => {
    const { handleClickCallback, mockClickSecret } = await import("@/server/payments/click");
    const r = await handleClickCallback({ click_trans_id: "1", service_id: "mock", merchant_trans_id: "1", amount: "1", action: "0", sign_time: "x", sign_string: "0".repeat(32) }, { secret: mockClickSecret() });
    expect(r.error).toBe(-1);
  });
});

describe("device fingerprint", () => {
  it("is stable for the same traits and differs for different hardware", async () => {
    const { readFingerprint } = await import("@/server/auth/fingerprint");
    const a = readFingerprint(headersWith(encode(traits)));
    const b = readFingerprint(headersWith(encode({ ...traits })));
    const c = readFingerprint(headersWith(encode({ ...traits, glRenderer: "ANGLE (Intel UHD 620)" })));
    expect(a?.hash).toBe(b?.hash);
    expect(a?.hash).not.toBe(c?.hash);
  });

  it("rejects missing, malformed or padded fingerprints", async () => {
    const { readFingerprint } = await import("@/server/auth/fingerprint");
    expect(readFingerprint(new Headers())).toBeNull();
    expect(readFingerprint(headersWith("not json!"))).toBeNull();
    expect(readFingerprint(headersWith(encode({ ...traits, extra: "x" })))).toBeNull();
    expect(readFingerprint(headersWith(encode({ ...traits, cores: -1 })))).toBeNull();
  });
});

describe("client IP", () => {
  it("ignores a forged X-Forwarded-For when server.mjs supplies the socket address", async () => {
    const { clientIp } = await import("@/server/http");
    process.env.INNOVA_CLIENT_IP_HEADER = "x-innova-client-ip";
    try {
      expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6", "x-innova-client-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    } finally {
      delete process.env.INNOVA_CLIENT_IP_HEADER;
    }
  });
});
