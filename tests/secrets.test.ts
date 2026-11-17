import { describe, expect, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://x@localhost/x";
process.env.IP_HASH_SECRET ??= "test-secret-test-secret-test-secret-1234";
process.env.SECRETS_ENCRYPTION_KEY ??= "a".repeat(64);

describe("provider key encryption", () => {
  it("round-trips and does not leak the plaintext", async () => {
    const { decryptSecret, encryptSecret, keyHint } = await import("@/server/secrets");
    const key = "f".repeat(60) + "b1bb";
    const blob = encryptSecret(key);
    expect(blob.startsWith("v1:")).toBe(true);
    expect(blob).not.toContain(key);
    expect(decryptSecret(blob)).toBe(key);
    expect(encryptSecret(key)).not.toBe(blob);
    expect(keyHint(key)).toBe("b1bb");
  });
  it("rejects tampered ciphertext", async () => {
    const { decryptSecret, encryptSecret } = await import("@/server/secrets");
    const blob = encryptSecret("some-api-key-value-123");
    const raw = Buffer.from(blob.slice(3), "base64");
    raw[raw.length - 1] ^= 1;
    expect(() => decryptSecret(`v1:${raw.toString("base64")}`)).toThrow();
  });
});
