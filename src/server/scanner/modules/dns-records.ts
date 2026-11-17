import { promises as dnsp } from "node:dns";
import type { Finding } from "../types";
import { isPublicIp } from "../net/ip-policy";
import { FREE_HOSTING_SUFFIXES } from "../data/defaults";
import { domainParts, makeFinding, userContentPlatform } from "../util";

export interface DnsData {
  host: string;
  zone: string | null;
  a: { address: string; ttl: number }[];
  aaaa: { address: string; ttl: number }[];
  cname: string[];
  mx: { exchange: string; priority: number }[];
  ns: string[];
  txt: string[];
  spf: string | null;
  dmarc: string | null;
  caa: string[];
  soa: { nsname: string; hostmaster: string; serial: number } | null;
  nxdomain: boolean;
  privateAddresses: string[];
  errors: Record<string, string>;
}

const FREE_DNS_PROVIDERS = ["afraid.org", "duckdns.org", "no-ip.com", "dynu.com", "changeip.com", "noip.com", "freedns", "1984.is"];
const NO_DATA = new Set(["ENODATA", "ENOTFOUND", "ENONAME", "NOTFOUND"]);

// A stale or broken local resolver must not turn a live site into a "dead link",
// so NXDOMAIN is confirmed against public resolvers before it is reported. They
// are asked over HTTPS (DoH): many networks block outbound UDP/53 but not 443.
const PUBLIC_RESOLVERS: [string, string][] = [
  ["https://cloudflare-dns.com/dns-query", "Cloudflare 1.1.1.1"],
  ["https://dns.google/resolve", "Google 8.8.8.8"],
];

async function confirmNxdomain(host: string, timeoutMs: number): Promise<{ confirmedBy: string[]; resolvedBy: string | null }> {
  const answers = await Promise.all(
    PUBLIC_RESOLVERS.map(async ([endpoint, name]) => {
      try {
        const res = await fetch(`${endpoint}?name=${encodeURIComponent(host)}&type=A`, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(Math.min(3000, timeoutMs)) });
        if (!res.ok) return { name, exists: null };
        const j = (await res.json()) as { Status?: number; Answer?: { type: number }[] };
        // Status 3 = NXDOMAIN; only an explicit answer counts either way.
        if (j.Status === 3) return { name, exists: false };
        return { name, exists: j.Status === 0 && (j.Answer ?? []).some((a) => a.type === 1) ? true : null };
      } catch {
        return { name, exists: null };
      }
    }),
  );
  return { confirmedBy: answers.filter((a) => a.exists === false).map((a) => a.name), resolvedBy: answers.find((a) => a.exists === true)?.name ?? null };
}

export async function analyzeDns(ctx: { host: string; timeoutMs: number }): Promise<{ data: DnsData; findings: Finding[]; status: "ok" | "partial" | "skipped" }> {
  const { host } = ctx;
  const parts = domainParts(host);
  const zone = parts.registrable;
  const data: DnsData = { host, zone, a: [], aaaa: [], cname: [], mx: [], ns: [], txt: [], spf: null, dmarc: null, caa: [], soa: null, nxdomain: false, privateAddresses: [], errors: {} };
  const findings: Finding[] = [];
  const source = "DNS (scanner resolver)";

  if (parts.isIp) {
    findings.push(makeFinding("dns", { code: "DNS_RESOLUTION", title: "DNS resolution", status: "SKIPPED", result: "Link uses an IP address", explanation: "No DNS lookup is needed for an IP address link.", source }));
    return { data, findings, status: "skipped" };
  }

  const resolver = new dnsp.Resolver({ timeout: Math.min(4000, ctx.timeoutMs), tries: 2 });
  const run = async <T>(key: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code ?? "ERROR";
      if (key === "a" && code === "ENOTFOUND") data.nxdomain = true;
      if (!NO_DATA.has(code)) data.errors[key] = code;
      return fallback;
    }
  };

  const [a, aaaa, cname] = await Promise.all([
    run("a", () => resolver.resolve4(host, { ttl: true }), []),
    run("aaaa", () => resolver.resolve6(host, { ttl: true }), []),
    run("cname", () => resolver.resolveCname(host), []),
  ]);
  data.a = a;
  data.aaaa = aaaa;
  data.cname = cname;

  let confirmedBy: string[] = [];
  let resolverMismatch: string | null = null;
  if (data.nxdomain) {
    const check = await confirmNxdomain(host, ctx.timeoutMs);
    confirmedBy = check.confirmedBy;
    if (check.resolvedBy) {
      data.nxdomain = false;
      resolverMismatch = check.resolvedBy;
      data.errors.a = "LOCAL_NXDOMAIN";
    }
  }

  if (zone) {
    const [mx, ns, txt, caa, soa, dmarc] = await Promise.all([
      run("mx", () => resolver.resolveMx(zone), []),
      run("ns", () => resolver.resolveNs(zone), []),
      run("txt", () => resolver.resolveTxt(zone), [] as string[][]),
      run("caa", () => resolver.resolveCaa(zone), []),
      run("soa", () => resolver.resolveSoa(zone), null),
      run("dmarc", () => resolver.resolveTxt(`_dmarc.${zone}`), [] as string[][]),
    ]);
    data.mx = mx.sort((x, y) => x.priority - y.priority);
    data.ns = ns.map((n) => n.toLowerCase());
    data.txt = txt.map((t) => t.join("")).slice(0, 30);
    data.spf = data.txt.find((t) => t.toLowerCase().startsWith("v=spf1")) ?? null;
    data.dmarc = dmarc.map((t) => t.join("")).find((t) => t.toLowerCase().startsWith("v=dmarc1")) ?? null;
    data.caa = caa.map((c) => Object.entries(c).map(([k, v]) => `${k}=${String(v)}`).join(" "));
    data.soa = soa ? { nsname: soa.nsname, hostmaster: soa.hostmaster, serial: soa.serial } : null;
  }

  const addresses = [...data.a.map((x) => x.address), ...data.aaaa.map((x) => x.address)];
  data.privateAddresses = addresses.filter((ip) => !isPublicIp(ip));

  if (data.nxdomain) {
    const zoneExists = !!zone && zone !== host && (data.ns.length > 0 || !!data.soa);
    const confirmed = confirmedBy.length ? ` Confirmed by ${confirmedBy.join(" and ")}.` : "";
    findings.push(makeFinding("dns", {
      code: "DNS_RESOLUTION",
      title: "DNS resolution",
      status: "FAIL",
      severity: "MEDIUM",
      weight: 12,
      result: zoneExists ? "NXDOMAIN: this host does not exist" : "NXDOMAIN: the domain does not exist",
      explanation: zoneExists
        ? `${zone} exists, but ${host} has no DNS record: the address was never set up, was removed, or is mistyped. There is no website at this link to open or analyze.${confirmed}`
        : `No DNS record exists for ${zone ?? host}: it is not registered, has expired or was taken down. The link is dead or mistyped.${confirmed}`,
      evidence: { nxdomain: true, host, zone, zoneExists, confirmedBy },
      source: confirmedBy.length ? `DNS (scanner resolver, ${confirmedBy.join(", ")})` : source,
    }));
  } else if (resolverMismatch) {
    findings.push(makeFinding("dns", { code: "DNS_RESOLUTION", title: "DNS resolution", status: "ERROR", result: "Scanner resolver disagrees with public DNS", explanation: `The scanner's resolver says the host does not exist, but ${resolverMismatch} resolves it. The record is probably brand new and the scanner still has the old negative answer cached; scan again in a few minutes.`, evidence: { resolvedBy: resolverMismatch }, source }));
  } else if (addresses.length === 0 && [data.errors.a, data.errors.aaaa].some((c) => c && c !== "LOCAL_NXDOMAIN")) {
    findings.push(makeFinding("dns", { code: "DNS_RESOLUTION", title: "DNS resolution", status: "UNAVAILABLE", result: `DNS lookup failed (${data.errors.a ?? data.errors.aaaa})`, explanation: "The scanner's resolver did not answer for this host. This is a lookup failure, not proof that the host has no address; networks that filter certain sites behave this way.", evidence: { errors: data.errors }, source }));
  } else if (addresses.length === 0) {
    findings.push(makeFinding("dns", { code: "DNS_RESOLUTION", title: "DNS resolution", status: "WARN", severity: "LOW", weight: 6, result: "No A/AAAA records", explanation: "The host exists in DNS but has no web server address.", evidence: { errors: data.errors }, source }));
  } else if (data.privateAddresses.length) {
    findings.push(makeFinding("dns", { code: "DNS_RESOLUTION", title: "DNS resolution", status: "FAIL", severity: "HIGH", weight: 25, result: `Resolves to internal address ${data.privateAddresses[0]}`, explanation: "A public domain that points at a private or loopback address is used for DNS-rebinding attacks or to target internal systems. The scanner did not connect to it.", evidence: { addresses }, source }));
  } else {
    findings.push(makeFinding("dns", { code: "DNS_RESOLUTION", title: "DNS resolution", status: "PASS", result: addresses.slice(0, 4).join(", "), explanation: "The host resolves to public IP addresses.", evidence: { a: data.a, aaaa: data.aaaa, cname: data.cname }, source }));
  }

  const minTtl = Math.min(...data.a.map((x) => x.ttl), Number.POSITIVE_INFINITY);
  if (Number.isFinite(minTtl) && minTtl < 60 && data.a.length >= 3 && !userContentPlatform(host, FREE_HOSTING_SUFFIXES)) {
    findings.push(makeFinding("dns", { code: "DNS_TTL", title: "Fast-flux indicators", status: "INFO", severity: "NONE", weight: 0, result: `${data.a.length} A records with TTL ${minTtl}s`, explanation: "Many addresses with a very short TTL is a fast-flux pattern used by botnet-hosted phishing. CDNs look identical, so this is shown for context and not scored.", source }));
  }

  const freeNs = data.ns.find((n) => FREE_DNS_PROVIDERS.some((p) => n.includes(p)));
  if (freeNs) {
    findings.push(makeFinding("dns", { code: "DNS_NS", title: "Nameservers", status: "WARN", severity: "LOW", weight: 8, result: `Free/dynamic DNS provider (${freeNs})`, explanation: "Free and dynamic DNS services are popular with attackers because they need no verified identity.", evidence: { ns: data.ns }, source }));
  } else if (data.ns.length) {
    findings.push(makeFinding("dns", { code: "DNS_NS", title: "Nameservers", status: "INFO", result: data.ns.slice(0, 4).join(", "), explanation: "Authoritative nameservers for the domain.", evidence: { ns: data.ns }, source }));
  }

  if (zone) {
    const mail = [data.mx.length ? "MX" : null, data.spf ? "SPF" : null, data.dmarc ? "DMARC" : null].filter(Boolean);
    findings.push(makeFinding("dns", { code: "DNS_MAIL", title: "E-mail authentication records", status: mail.length === 3 ? "PASS" : "INFO", result: mail.length ? `Present: ${mail.join(", ")}` : "No MX, SPF or DMARC", explanation: mail.length === 3 ? "The domain publishes mail routing and anti-spoofing records, typical of an operated business domain." : "Missing SPF/DMARC means e-mail can be spoofed from this domain, and missing records are common for throw-away domains. Not scored on its own.", evidence: { mx: data.mx, spf: data.spf, dmarc: data.dmarc }, source }));
  }

  return { data, findings, status: Object.keys(data.errors).length ? "partial" : "ok" };
}
