import { BlockedDestinationError, assertHostAllowed } from "./net/ip-policy";

export class InvalidUrlError extends Error {
  readonly code = "INVALID_URL";
  constructor(message: string) {
    super(message);
    this.name = "InvalidUrlError";
  }
}

export interface NormalizedUrl {
  url: URL;
  normalized: string;
  schemeAssumed: boolean;
  defanged: boolean;
  /** Host exactly as typed (before WHATWG canonicalisation), used to spot obfuscated IPs. */
  rawHost: string;
}

const MAX_URL_LENGTH = 2048;
const UNSUPPORTED_SCHEME = /^(javascript|data|vbscript|file|blob|about|mailto|ftp|ws|wss|chrome|ms-[a-z-]+):/i;

/**
 * Turns user input into a canonical http(s) URL. Accepts common "defanged" forms
 * used in security e-mails (hxxp://, example[.]com). Rejects non-web schemes and
 * internal destinations before anything is fetched.
 */
export function normalizeInputUrl(input: string): NormalizedUrl {
  let s = (input ?? "").trim();
  s = s.replace(/^[<"'(]+/, "").replace(/[>"')]+$/, "");
  const before = s;
  s = s
    .replace(/^hxxp(s?):\/\//i, "http$1://")
    .replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]/gi, ".")
    .replace(/\[:\]/g, ":");
  const defanged = s !== before;

  if (!s) throw new InvalidUrlError("Enter a URL to analyze.");
  if (s.length > MAX_URL_LENGTH) throw new InvalidUrlError(`URLs longer than ${MAX_URL_LENGTH} characters are not supported.`);
  if (/\s/.test(s)) throw new InvalidUrlError("The URL contains spaces. Paste a single link.");
  if (UNSUPPORTED_SCHEME.test(s)) throw new InvalidUrlError("Only http:// and https:// links can be analyzed.");

  let schemeAssumed = false;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    s = `https://${s.replace(/^\/+/, "")}`;
    schemeAssumed = true;
  }

  const rawHostMatch = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?(\[[^\]]*\]|[^/:?#]*)/i.exec(s);
  const rawHost = rawHostMatch?.[1] ?? "";

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new InvalidUrlError("This does not look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidUrlError("Only http:// and https:// links can be analyzed.");
  }
  if (!url.hostname) throw new InvalidUrlError("The URL has no host name.");

  try {
    assertHostAllowed(url.hostname);
  } catch (e) {
    if (e instanceof BlockedDestinationError) {
      throw new InvalidUrlError("Internal, private and loopback addresses cannot be scanned.");
    }
    throw e;
  }

  return { url, normalized: url.toString(), schemeAssumed, defanged, rawHost };
}
