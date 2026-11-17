import crypto from "node:crypto";
import { env } from "./env";

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Keyed hash for IPs and other identifiers we must not store in clear text. */
export function hmac(value: string): string {
  return crypto.createHmac("sha256", env().IP_HASH_SECRET).update(value).digest("hex");
}

/** 128-bit random id for scans (unguessable, URL-safe). */
export function newScanId(): string {
  return crypto.randomBytes(16).toString("base64url");
}
