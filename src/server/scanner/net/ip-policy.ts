import ipaddr from "ipaddr.js";
import net from "node:net";

// SSRF policy: the scanner may only talk to globally routable unicast addresses.
// Everything else (loopback, RFC1918, link-local / cloud metadata, CGNAT, multicast,
// documentation ranges, IPv6 ULA, NAT64/6to4/Teredo wrappers, ...) is refused.

export class BlockedDestinationError extends Error {
  readonly code = "BLOCKED_DESTINATION";
  constructor(
    message: string,
    readonly detail: { host?: string; ip?: string; reason: string },
  ) {
    super(message);
    this.name = "BlockedDestinationError";
  }
}

// Extra ranges ipaddr.js may report as plain "unicast" but that must never be reached.
const EXTRA_BLOCKED_CIDRS = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.88.99.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4",
  "240.0.0.0/4",
  "255.255.255.255/32",
  "::/128",
  "::1/128",
  "::ffff:0:0/96",
  "64:ff9b::/96",
  "64:ff9b:1::/48",
  "100::/64",
  "2001::/32",
  "2001:db8::/32",
  "2002::/16",
  "fc00::/7",
  "fe80::/10",
  "fec0::/10",
  "ff00::/8",
].map((c) => ipaddr.parseCIDR(c));

const GLOBAL_UNICAST_V6 = ipaddr.parseCIDR("2000::/3");

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home.arpa",
  ".corp",
  ".private",
  ".localdomain",
  ".in-addr.arpa",
  ".ip6.arpa",
];

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "instance-data",
  "kubernetes",
  "kubernetes.default",
]);

export function isPublicIp(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  let addr = ipaddr.parse(address);
  if (addr.kind() === "ipv6") {
    const v6 = addr as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      addr = v6.toIPv4Address();
    } else if (!v6.match(GLOBAL_UNICAST_V6)) {
      return false;
    }
  }
  if (addr.range() !== "unicast") return false;
  for (const [range, bits] of EXTRA_BLOCKED_CIDRS) {
    if (range.kind() === addr.kind() && addr.match(range, bits)) return false;
  }
  return true;
}

/** Strips IPv6 brackets and a trailing dot, lower-cases. */
export function bareHost(hostname: string): string {
  let h = hostname.trim().toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1);
  if (h.endsWith(".")) h = h.slice(0, -1);
  return h;
}

/**
 * Hostname-level policy, evaluated before any DNS lookup. IP literals are checked
 * directly because Node skips the lookup hook for them.
 */
export function assertHostAllowed(hostname: string): void {
  const host = bareHost(hostname);
  if (!host) throw new BlockedDestinationError("Empty host", { reason: "empty-host" });
  if (net.isIP(host)) {
    if (!isPublicIp(host)) {
      throw new BlockedDestinationError(`Destination ${host} is not a public address`, {
        host,
        ip: host,
        reason: "non-public-ip",
      });
    }
    return;
  }
  if (BLOCKED_HOSTS.has(host) || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new BlockedDestinationError(`Host ${host} refers to an internal name`, {
      host,
      reason: "internal-hostname",
    });
  }
  if (!host.includes(".")) {
    throw new BlockedDestinationError(`Single-label host ${host} is not allowed`, {
      host,
      reason: "single-label-host",
    });
  }
}

/** Ports the fetcher is allowed to connect to (prevents use as a port scanner). */
export const ALLOWED_PORTS = new Set([80, 443, 8080, 8443, 8000, 8888]);

export function effectivePort(url: URL): number {
  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}
