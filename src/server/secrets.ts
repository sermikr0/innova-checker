import crypto from "node:crypto";
import { env } from "./env";

// AES-256-GCM for secrets stored in the database (provider API keys).
// Key: SECRETS_ENCRYPTION_KEY, or an HKDF derivation of IP_HASH_SECRET as fallback.

function key(): Buffer {
  const e = env();
  if (e.SECRETS_ENCRYPTION_KEY) return Buffer.from(e.SECRETS_ENCRYPTION_KEY, "hex");
  return Buffer.from(crypto.hkdfSync("sha256", e.IP_HASH_SECRET, "innova-checker", "provider-credentials", 32));
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64")}`;
}

export function decryptSecret(blob: string): string {
  const raw = Buffer.from(blob.replace(/^v1:/, ""), "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}

export function keyHint(k: string): string {
  return k.length > 8 ? k.slice(-4) : "••••";
}
