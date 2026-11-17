import crypto from "node:crypto";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import zlib from "node:zlib";
import "../../net-defaults";
import {
  ALLOWED_PORTS,
  BlockedDestinationError,
  assertHostAllowed,
  bareHost,
  effectivePort,
  isPublicIp,
} from "./ip-policy";

// Hardened HTTP(S) client for fetching untrusted URLs.
//
// * Every connection resolves the host through `guardedLookup`, which rejects the
//   whole answer if any resolved address is non-public. Because validation happens
//   in the lookup hook of the socket that is actually opened, the validated IP is
//   the connected IP, which closes the DNS-rebinding (TOCTOU) window.
// * IP literals skip Node's lookup hook, so they are checked up front.
// * No connection reuse (agent: false), no automatic redirects, strict size caps on
//   both compressed and decompressed bytes, hard timeouts.
// * Response bodies are only buffered in memory; nothing is written to disk and
//   nothing is executed.

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number,
) => void;

export function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: LookupCallback,
): void {
  try {
    assertHostAllowed(hostname);
  } catch (err) {
    callback(err as NodeJS.ErrnoException, "", 0);
    return;
  }
  dns.lookup(hostname, { all: true, verbatim: true, family: options.family ?? 0 }, (err, addresses) => {
    if (err) {
      callback(err, "", 0);
      return;
    }
    const blocked = addresses.find((a) => !isPublicIp(a.address));
    if (blocked || addresses.length === 0) {
      const e = new BlockedDestinationError(
        blocked
          ? `${hostname} resolves to non-public address ${blocked.address}`
          : `${hostname} did not resolve`,
        { host: hostname, ip: blocked?.address, reason: "resolves-to-non-public-ip" },
      );
      callback(e as unknown as NodeJS.ErrnoException, "", 0);
      return;
    }
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  });
}

export interface CertSummary {
  subject: string;
  subjectCN: string | null;
  issuer: string;
  issuerOrg: string | null;
  issuerCN: string | null;
  validFrom: string;
  validTo: string;
  san: string[];
  serialNumber: string;
  fingerprint256: string;
  selfSigned: boolean;
}

export interface TlsDetails {
  host: string;
  port: number;
  ip: string | null;
  protocol: string | null;
  cipher: string | null;
  alpn: string | null;
  authorized: boolean;
  authorizationError: string | null;
  hostnameMatches: boolean;
  hostnameError: string | null;
  cert: CertSummary | null;
  chain: CertSummary[];
}

function dnToString(dn: unknown): string {
  if (!dn || typeof dn !== "object") return "";
  return Object.entries(dn as Record<string, string | string[]>)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join("+") : v}`)
    .join(", ");
}

function firstOf(v: unknown): string | null {
  if (Array.isArray(v)) return (v[0] as string) ?? null;
  return typeof v === "string" ? v : null;
}

function summarizeCert(c: tls.PeerCertificate): CertSummary {
  const san = (c.subjectaltname ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^DNS:/, "").replace(/^IP Address:/, ""));
  return {
    subject: dnToString(c.subject),
    subjectCN: firstOf(c.subject?.CN),
    issuer: dnToString(c.issuer),
    issuerOrg: firstOf(c.issuer?.O),
    issuerCN: firstOf(c.issuer?.CN),
    validFrom: new Date(c.valid_from).toISOString(),
    validTo: new Date(c.valid_to).toISOString(),
    san,
    serialNumber: c.serialNumber,
    fingerprint256: c.fingerprint256,
    selfSigned: dnToString(c.subject) === dnToString(c.issuer),
  };
}

export function readTlsDetails(socket: tls.TLSSocket, host: string, port: number): TlsDetails {
  const peer = socket.getPeerCertificate(true) as tls.DetailedPeerCertificate;
  const hasCert = peer && Object.keys(peer).length > 0;
  const chain: CertSummary[] = [];
  if (hasCert) {
    let cur: tls.DetailedPeerCertificate | undefined = peer;
    const seen = new Set<string>();
    while (cur && Object.keys(cur).length > 0 && !seen.has(cur.fingerprint256) && chain.length < 6) {
      seen.add(cur.fingerprint256);
      chain.push(summarizeCert(cur));
      cur = cur.issuerCertificate;
    }
  }
  let hostnameError: string | null = null;
  if (hasCert && !net.isIP(host)) {
    const err = tls.checkServerIdentity(host, peer);
    if (err) hostnameError = err.message;
  } else if (net.isIP(host)) {
    hostnameError = "Connection made to an IP address; certificate hostname cannot be validated";
  }
  const cipher = socket.getCipher();
  return {
    host,
    port,
    ip: socket.remoteAddress ?? null,
    protocol: socket.getProtocol() ?? null,
    cipher: cipher?.standardName ?? cipher?.name ?? null,
    alpn: typeof socket.alpnProtocol === "string" ? socket.alpnProtocol : null,
    authorized: socket.authorized,
    authorizationError: socket.authorizationError ? String(socket.authorizationError) : null,
    hostnameMatches: hasCert ? hostnameError === null : false,
    hostnameError,
    cert: chain[0] ?? null,
    chain,
  };
}

/** Opens a TLS connection only to read the certificate and negotiated parameters. */
export function tlsProbe(hostname: string, port: number, timeoutMs: number): Promise<TlsDetails> {
  const host = bareHost(hostname);
  return new Promise((resolve, reject) => {
    try {
      assertHostAllowed(host);
    } catch (e) {
      reject(e);
      return;
    }
    let settled = false;
    const socket = tls.connect({
      host,
      port,
      servername: net.isIP(host) ? undefined : host,
      rejectUnauthorized: false,
      ALPNProtocols: ["h2", "http/1.1"],
      lookup: guardedLookup as unknown as net.LookupFunction,
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(Object.assign(new Error(`TLS handshake with ${host}:${port} timed out`), { code: "ETIMEDOUT" }));
    }, timeoutMs);
    socket.once("secureConnect", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        resolve(readTlsDetails(socket, host, port));
      } catch (e) {
        reject(e);
      } finally {
        socket.end();
        socket.destroy();
      }
    });
    socket.once("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

export interface SafeRequestOptions {
  timeoutMs: number;
  /** Max decoded bytes kept for text-like responses. */
  maxTextBytes: number;
  /** Max decoded bytes read (and hashed) for binary responses. */
  maxDownloadBytes: number;
  /** Bytes of a binary response retained in memory for signature checks. */
  binaryKeepBytes?: number;
  userAgent: string;
  /** Cookie header collected earlier in the same redirect chain. */
  cookie?: string;
  signal?: AbortSignal;
}

export interface SafeResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  setCookies: string[];
  remoteAddress: string | null;
  tls: TlsDetails | null;
  contentType: string;
  bodyKind: "text" | "binary";
  body: Buffer;
  bytesRead: number;
  truncated: boolean;
  sha256: string | null;
  hashComplete: boolean;
  decodeError: string | null;
  elapsedMs: number;
}

const TEXT_TYPES = [
  "text/",
  "application/xhtml+xml",
  "application/xml",
  "application/json",
  "application/javascript",
  "application/ld+json",
  "image/svg+xml",
];

export function isTextContentType(ct: string): boolean {
  const t = ct.toLowerCase();
  return t === "" || TEXT_TYPES.some((p) => t.startsWith(p));
}

/** Performs a single GET request (no redirects followed) under the SSRF policy. */
export function safeRequest(target: URL, opts: SafeRequestOptions): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      reject(new BlockedDestinationError(`Scheme ${target.protocol} is not fetched`, { reason: "scheme" }));
      return;
    }
    const port = effectivePort(target);
    if (!ALLOWED_PORTS.has(port)) {
      reject(
        new BlockedDestinationError(`Port ${port} is outside the scanner's allowed ports`, {
          host: target.hostname,
          reason: "port-not-allowed",
        }),
      );
      return;
    }
    const host = bareHost(target.hostname);
    try {
      assertHostAllowed(host);
    } catch (e) {
      reject(e);
      return;
    }

    const isHttps = target.protocol === "https:";
    const started = Date.now();
    let settled = false;
    const keepBinary = opts.binaryKeepBytes ?? 64 * 1024;

    const requestOptions: https.RequestOptions = {
      protocol: target.protocol,
      hostname: host,
      port,
      path: `${target.pathname || "/"}${target.search}`,
      method: "GET",
      agent: false,
      lookup: guardedLookup as unknown as net.LookupFunction,
      // Some large sites (maersk.com) send more than Node's default 16 KB of headers.
      maxHeaderSize: 64 * 1024,
      headers: {
        "user-agent": opts.userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        connection: "close",
        ...(opts.cookie ? { cookie: opts.cookie } : {}),
      },
      ...(isHttps
        ? { servername: net.isIP(host) ? undefined : host, rejectUnauthorized: false }
        : {}),
    };

    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    };

    // Set once headers arrive: a slow server that is still streaming a large
    // page is analyzed on what arrived instead of being reported unreachable.
    let finishPartial: (() => void) | null = null;

    const req = (isHttps ? https : http).request(requestOptions, (res) => {
      const tlsInfo = isHttps ? readTlsDetails(res.socket as tls.TLSSocket, host, port) : null;
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(res.headers)) {
        if (v === undefined || k === "set-cookie") continue;
        headers[k] = Array.isArray(v) ? v.join(", ") : v;
      }
      const setCookies = res.headers["set-cookie"] ?? [];
      const contentType = (headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
      const disposition = headers["content-disposition"] ?? "";
      const bodyKind: "text" | "binary" =
        /attachment/i.test(disposition) || !isTextContentType(contentType) ? "binary" : "text";
      const cap = bodyKind === "text" ? opts.maxTextBytes : opts.maxDownloadBytes;
      const keep = bodyKind === "text" ? opts.maxTextBytes : keepBinary;

      const chunks: Buffer[] = [];
      let kept = 0;
      let decoded = 0;
      let raw = 0;
      let truncated = false;
      let decodeError: string | null = null;
      const hash = bodyKind === "binary" ? crypto.createHash("sha256") : null;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        res.destroy();
        resolve({
          url: target.toString(),
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? "",
          headers,
          setCookies,
          remoteAddress: res.socket?.remoteAddress ?? null,
          tls: tlsInfo,
          contentType,
          bodyKind,
          body: Buffer.concat(chunks),
          bytesRead: decoded,
          truncated,
          sha256: hash && !truncated && !decodeError ? hash.digest("hex") : null,
          hashComplete: !!hash && !truncated && !decodeError,
          decodeError,
          elapsedMs: Date.now() - started,
        });
      };

      finishPartial = () => {
        truncated = true;
        finish();
      };

      // Redirect responses: headers are all we need.
      if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400) {
        finish();
        return;
      }

      const encoding = (headers["content-encoding"] ?? "").toLowerCase().trim();
      let stream: NodeJS.ReadableStream = res;
      if (encoding === "gzip" || encoding === "x-gzip" || encoding === "deflate") {
        stream = res.pipe(zlib.createUnzip());
      } else if (encoding === "br") {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      if (stream !== res) {
        // Compressed-input cap, independent of the decoded-size cap below.
        res.on("data", (c: Buffer) => {
          raw += c.length;
          if (raw > cap) {
            truncated = true;
            finish();
          }
        });
      }

      const consume = (slice: Buffer) => {
        decoded += slice.length;
        hash?.update(slice);
        if (kept < keep) {
          const k = slice.subarray(0, keep - kept);
          chunks.push(Buffer.from(k));
          kept += k.length;
        }
      };

      stream.on("data", (chunk: Buffer) => {
        if (settled) return;
        const remaining = cap - decoded;
        if (chunk.length > remaining) {
          consume(chunk.subarray(0, remaining));
          truncated = true;
          finish();
          return;
        }
        consume(chunk);
      });
      stream.on("end", finish);
      stream.on("error", (err: Error) => {
        decodeError = err.message;
        finish();
      });
      res.on("aborted", () => {
        truncated = true;
        finish();
      });
    });

    const timer = setTimeout(() => {
      if (finishPartial) return finishPartial();
      req.destroy(Object.assign(new Error(`Request to ${host} timed out after ${opts.timeoutMs} ms`), { code: "ETIMEDOUT" }));
    }, opts.timeoutMs);

    if (opts.signal) {
      if (opts.signal.aborted) {
        req.destroy(new Error("Scan aborted"));
      } else {
        opts.signal.addEventListener("abort", () => req.destroy(new Error("Scan aborted")), { once: true });
      }
    }

    req.on("error", fail);
    req.end();
  });
}

/** Maps low-level network errors to short human-readable explanations. */
export function describeNetworkError(err: unknown): { code: string; message: string } {
  if (err instanceof BlockedDestinationError) {
    return { code: err.code, message: err.message };
  }
  const e = err as NodeJS.ErrnoException & { reason?: string };
  const code = e?.code ?? "ERROR";
  const map: Record<string, string> = {
    ENOTFOUND: "The domain name does not resolve (NXDOMAIN).",
    EAI_AGAIN: "DNS resolution failed temporarily.",
    ECONNREFUSED: "The server refused the connection.",
    ECONNRESET: "The connection was reset by the server.",
    ETIMEDOUT: "The server did not respond in time.",
    EHOSTUNREACH: "The host is unreachable.",
    ENETUNREACH: "The network is unreachable from the scanner.",
    EPROTO: "The TLS/HTTP protocol negotiation failed.",
    ERR_SSL_WRONG_VERSION_NUMBER: "The server does not speak TLS on this port.",
    HPE_INVALID_CONSTANT: "The server sent a malformed HTTP response.",
  };
  return { code, message: map[code] ?? e?.message ?? "Unknown network error" };
}
