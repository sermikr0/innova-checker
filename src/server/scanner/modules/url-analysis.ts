import { domainToUnicode } from "node:url";
import net from "node:net";
import type { NormalizedUrl } from "../normalize";
import type { Finding, ScannerSettings } from "../types";
import { FREE_HOSTING_SUFFIXES } from "../data/defaults";
import {
  asciiSkeleton,
  brandsMentionedInTokens,
  domainParts,
  editDistance,
  hostMatchesDomain,
  looksRandom,
  makeFinding,
  officialBrandFor,
  ownedHostPart,
  scriptsIn,
  userContentPlatform,
  tokenize,
  tokenMatchesKeyword,
  unicodeSkeleton,
} from "../util";
import { bareHost } from "../net/ip-policy";

export interface UrlAnalysisData {
  url: string;
  scheme: string;
  host: string;
  hostUnicode: string;
  port: number | null;
  path: string;
  paramCount: number;
  length: number;
  registrableDomain: string | null;
  tenantDomain: string | null;
  publicSuffix: string | null;
  subdomain: string;
  subdomainDepth: number;
  isIp: boolean;
  isPunycode: boolean;
  scripts: string[];
  shortener: boolean;
  hostingPlatform: string | null;
  matchedKeywords: string[];
  brandsReferenced: string[];
  officialBrand: string | null;
  trusted: boolean;
  schemeAssumed: boolean;
  defanged: boolean;
}

const STANDARD_PORTS = new Set([80, 443]);
const SOFT_PORTS = new Set([8080, 8443]);

function isObfuscatedIp(rawHost: string, host: string): boolean {
  if (!net.isIPv4(host)) return false;
  // WHATWG URL turns 0x7f.1, 2130706433, 0177.0.0.1 into dotted quads; the raw form differs.
  return rawHost.toLowerCase() !== host && !/^\[/.test(rawHost);
}

function encodingAnomalies(u: URL): string[] {
  const out: string[] = [];
  const raw = `${u.pathname}${u.search}`;
  if (/%25[0-9a-f]{2}/i.test(raw)) out.push("double percent-encoding (%25xx)");
  if (/%2f|%5c/i.test(u.pathname)) out.push("encoded path separators (%2F / %5C)");
  if (/%2e%2e|%2e\./i.test(raw)) out.push("encoded dot segments");
  if (/%00/.test(raw)) out.push("encoded NUL byte");
  if (/%e2%80%ae|%e2%80%8b|%e2%81%a6/i.test(raw)) out.push("invisible / bidi-override characters");
  if (/%c0%ae|%c0%af|%c1%9c/i.test(raw)) out.push("overlong UTF-8 sequences");
  const encoded = (u.pathname.match(/%[0-9a-f]{2}/gi) ?? []).length;
  if (u.pathname.length > 30 && (encoded * 3) / u.pathname.length > 0.4) out.push("path is mostly percent-encoded");
  if (/\/\/[^/]*@/.test(u.pathname)) out.push("embedded URL with credentials in path");
  return out;
}

export function analyzeUrl(
  n: NormalizedUrl,
  settings: ScannerSettings,
  opts: { prefix?: string; titlePrefix?: string; onlyIssues?: boolean } = {},
): { data: UrlAnalysisData; findings: Finding[] } {
  const u = n.url;
  const host = bareHost(u.hostname);
  const parts = domainParts(host);
  const hostUnicode = parts.isIp ? host : domainToUnicode(host) || host;
  const labels = host.split(".");
  const isPunycode = labels.some((l) => l.startsWith("xn--"));
  const subdomainLabels = parts.subdomain ? parts.subdomain.split(".").filter(Boolean) : [];
  const hostingPlatform = parts.isIp ? null : userContentPlatform(host, FREE_HOSTING_SUFFIXES);
  const official = officialBrandFor(host, settings, FREE_HOSTING_SUFFIXES);
  const trusted = !hostingPlatform && (official !== null || settings.trustedDomains.some((d) => hostMatchesDomain(host, d)));
  const port = u.port ? Number(u.port) : null;
  const params = [...u.searchParams.keys()];
  const shortener = settings.urlShorteners.some((s) => hostMatchesDomain(host, s));

  // Brand/keyword checks only look at the part of the host its owner chose, so a
  // bucket on amazonaws.com is not mistaken for "Amazon".
  const ownedPart = parts.isIp ? host : ownedHostPart(host);
  const hostTokens = tokenize(ownedPart);
  const pathTokens = tokenize(decodeURIComponentSafe(`${u.pathname} ${u.search}`));
  const keywordSet = new Set(settings.suspiciousKeywords.map((k) => k.toLowerCase()));
  const matchedKeywords = [
    ...new Set(
      [...hostTokens, ...pathTokens].filter(
        (t) => keywordSet.has(t) || [...keywordSet].some((k) => k.length >= 6 && t.includes(k.replace(/-/g, ""))),
      ),
    ),
  ].slice(0, 20);

  const brandsInHost = official ? [] : brandsMentionedInTokens(hostTokens, settings);
  const brandsInPath = official ? [] : brandsMentionedInTokens(pathTokens, settings);

  const findings: Finding[] = [];
  const prefix = opts.prefix ?? "";
  const tp = opts.titlePrefix ?? "";
  const push = (f: Parameters<typeof makeFinding>[1]) => {
    if (opts.onlyIssues && (f.status === "PASS" || (f.weight ?? 0) === 0)) return;
    findings.push(makeFinding("url", { ...f, code: `${prefix}${f.code}`, title: `${tp}${f.title}` }));
  };

  // Scheme
  if (u.protocol === "https:") {
    push({ code: "URL_SCHEME", title: "Transport scheme", status: "PASS", result: "HTTPS", explanation: "The link uses HTTPS, so traffic to the site is encrypted in transit. HTTPS alone does not prove a site is legitimate." });
  } else {
    push({ code: "URL_SCHEME", title: "Transport scheme", status: "WARN", severity: "LOW", weight: 8, result: "Unencrypted HTTP", explanation: "The link uses plain HTTP. Anything typed into the page can be read or altered in transit, and legitimate business portals almost always use HTTPS." });
  }

  // Embedded credentials / @-obfuscation
  if (u.username || u.password) {
    push({ code: "URL_CREDENTIALS", title: "Embedded credentials or @ obfuscation", status: "FAIL", severity: "HIGH", weight: 35, result: `Text before "@" is ignored by browsers`, explanation: `Everything before the "@" in the authority section is treated as a username, so a link like https://www.dhl.com@evil.example actually opens ${host}. This trick is used to disguise the real destination.`, evidence: { userinfo: decodeURIComponentSafe(u.username) + (u.password ? ":***" : ""), realHost: host } });
  } else {
    push({ code: "URL_CREDENTIALS", title: "Embedded credentials or @ obfuscation", status: "PASS", result: "Not present", explanation: "The link does not hide its real host behind an @ sign." });
  }

  // IP host
  if (parts.isIp) {
    const obf = isObfuscatedIp(n.rawHost, host);
    push({ code: "URL_IP_HOST", title: "IP address instead of domain name", status: "FAIL", severity: obf ? "HIGH" : "MEDIUM", weight: obf ? 35 : 25, result: obf ? `Obfuscated IP (${n.rawHost} → ${host})` : host, explanation: obf ? "The host is an IP address written in an unusual notation (decimal, hex or octal) that browsers silently convert. Legitimate services do not do this; it is used to evade filters." : "The link points to a raw IP address. Legitimate companies publish links using their domain name; IP links are common in malware delivery and phishing.", evidence: { host, rawHost: n.rawHost } });
  } else {
    push({ code: "URL_IP_HOST", title: "IP address instead of domain name", status: "PASS", result: "Domain name used", explanation: "The link uses a domain name rather than a raw IP address." });
  }

  // IDN / homograph
  const scripts = [...new Set(hostUnicode.split(".").flatMap((l) => scriptsIn(l)))];
  if (isPunycode) {
    const skeleton = unicodeSkeleton(hostUnicode);
    const impersonated = settings.brandDomains.find(
      (b) =>
        b.domains.some((d) => skeleton === d || skeleton.endsWith(`.${d}`)) ||
        tokenize(skeleton).some((t) => b.keywords.some((k) => k.length >= 3 && t === k.replace(/[^a-z0-9]/g, ""))),
    );
    const mixed = hostUnicode.split(".").some((l) => scriptsIn(l).length > 1);
    if (impersonated) {
      push({ code: "URL_HOMOGRAPH", title: "Homograph (look-alike characters) attack", status: "FAIL", severity: "CRITICAL", weight: 60, result: `"${hostUnicode}" imitates ${impersonated.brand}`, explanation: `The domain uses non-Latin characters that look identical to Latin letters. Displayed as "${hostUnicode}", it reads like ${impersonated.brand} but is a different domain (${host}).`, evidence: { punycode: host, unicode: hostUnicode, skeleton, scripts } });
    } else if (mixed) {
      push({ code: "URL_HOMOGRAPH", title: "Homograph (look-alike characters) attack", status: "FAIL", severity: "HIGH", weight: 40, result: "Mixed character scripts in one label", explanation: "A single part of the domain mixes alphabets (for example Latin and Cyrillic). This is almost never legitimate and is a classic look-alike technique.", evidence: { punycode: host, unicode: hostUnicode, scripts } });
    } else {
      // A name written entirely in the script of its own extension (кремль.рф,
      // 例子.中国) cannot pass for a Latin brand, so it is not scored.
      const labels = hostUnicode.split(".");
      const tldScript = scriptsIn(labels[labels.length - 1]);
      const native = tldScript.length === 1 && tldScript[0] !== "Latin" && labels.every((l) => l === "www" || scriptsIn(l).every((sc) => sc === tldScript[0]));
      push({ code: "URL_HOMOGRAPH", title: "Homograph (look-alike characters) attack", status: "INFO", severity: native ? "NONE" : "LOW", weight: native ? 0 : 6, result: native ? `Native-script domain (${hostUnicode})` : `Internationalized domain (${hostUnicode})`, explanation: native ? `The whole name, including the extension, is written in ${tldScript[0]}. This is a normal national-language domain and cannot imitate a Latin-alphabet brand.` : "The domain uses non-ASCII characters (IDN). This is normal for many languages, but check the spelling carefully.", evidence: { punycode: host, unicode: hostUnicode, scripts } });
    }
  } else {
    push({ code: "URL_HOMOGRAPH", title: "Homograph (look-alike characters) attack", status: "PASS", result: "ASCII-only domain", explanation: "The domain contains only standard ASCII characters." });
  }

  // Brand impersonation in the host
  if (official) {
    push({ code: "URL_BRAND", title: "Brand impersonation in domain", status: "INFO", result: `Official ${official.brand} domain`, explanation: `${host} belongs to a domain listed as official for ${official.brand}.`, evidence: { brand: official.brand } });
  } else if (!parts.isIp) {
    const subTokens = hostingPlatform ? [] : tokenize(subdomainLabels.join("."));
    const sldLabel = (parts.tenant ?? parts.registrable ?? host).split(".")[0];
    const inSub = brandsMentionedInTokens(subTokens, settings);
    const typo = !trusted && !hostingPlatform ? findTyposquat(sldLabel, settings) : null;
    if (inSub.length) {
      const b = inSub[0];
      push({ code: "URL_BRAND", title: "Brand impersonation in domain", status: "FAIL", severity: "HIGH", weight: 40, result: `"${b.brand}" used in subdomain of ${parts.tenant ?? parts.registrable}`, explanation: `The link starts with ${b.brand}'s name, but the real domain is ${parts.tenant ?? parts.registrable}. Official ${b.brand} links use ${b.domains.slice(0, 2).join(" or ")}.`, evidence: { brand: b.brand, officialDomains: b.domains, realDomain: parts.tenant ?? parts.registrable } });
    } else if (brandsInHost.length) {
      const b = brandsInHost[0];
      push({ code: "URL_BRAND", title: "Brand impersonation in domain", status: "FAIL", severity: "HIGH", weight: 35, result: `Contains "${b.brand}" but is not an official ${b.brand} domain`, explanation: `The domain name includes ${b.brand}, yet ${b.brand}'s official domains are ${b.domains.slice(0, 3).join(", ")}. Look-alike domains built from a brand name plus words like "track" or "secure" are a common phishing pattern.`, evidence: { brand: b.brand, officialDomains: b.domains, realDomain: parts.tenant ?? parts.registrable } });
    } else if (typo) {
      push({ code: "URL_BRAND", title: "Brand impersonation in domain", status: "FAIL", severity: "HIGH", weight: 45, result: `"${sldLabel}" is a misspelling of ${typo.domain}`, explanation: `The domain differs from ${typo.brand}'s official ${typo.domain} by only ${typo.distance} character(s). Typo-squatted domains are registered to catch mistyped or misread links.`, evidence: { brand: typo.brand, officialDomain: typo.domain, distance: typo.distance } });
    } else {
      push({ code: "URL_BRAND", title: "Brand impersonation in domain", status: "PASS", result: "No impersonation pattern", explanation: "The domain does not contain a known brand name or a close misspelling of one." });
    }
  }

  if (brandsInPath.length && !brandsInHost.length) {
    const b = brandsInPath[0];
    push({ code: "URL_BRAND_PATH", title: "Brand name in link path", status: "WARN", severity: "MEDIUM", weight: 14, result: `Path references ${b.brand} on an unrelated domain`, explanation: `The page path mentions ${b.brand}, but the site is not one of ${b.brand}'s domains. Phishing kits are often uploaded to compromised sites under folders named after the target brand.`, evidence: { brand: b.brand, path: u.pathname } });
  }

  // Recipient e-mail address carried in the link (plain or base64)
  const victimEmail = findEmbeddedEmail(u);
  if (victimEmail && !trusted) {
    push({ code: "URL_RECIPIENT_EMAIL", title: "Recipient e-mail address in link", status: "FAIL", severity: "HIGH", weight: 30, result: `Carries ${victimEmail.email}${victimEmail.encoded ? " (base64-encoded)" : ""}`, explanation: "The link contains an e-mail address, often base64-encoded so it is not obvious. Phishing kits use it to pre-fill the victim's login and to track who clicked. Legitimate tracking or document links rarely embed your address this way.", evidence: { email: victimEmail.email, encoded: victimEmail.encoded, parameter: victimEmail.where } });
  }

  // Machine-generated host names
  if (!parts.isIp && !trusted && looksRandom(ownedPart)) {
    push({ code: "URL_RANDOM_HOST", title: "Random-looking host name", status: "WARN", severity: hostingPlatform ? "MEDIUM" : "LOW", weight: hostingPlatform ? 15 : 8, result: ownedPart, explanation: "The host name looks machine-generated. Throw-away buckets and domains created in bulk for phishing campaigns typically have names like this." });
  }

  // Shortener
  if (shortener) {
    push({ code: "URL_SHORTENER", title: "URL shortener", status: "WARN", severity: "LOW", weight: 12, result: host, explanation: "Short links hide the real destination. The redirect analysis below shows where this link actually leads." });
  } else {
    push({ code: "URL_SHORTENER", title: "URL shortener", status: "PASS", result: "Not a known shortener", explanation: "The link is not on a known URL-shortening service." });
  }

  // Free hosting platforms
  if (hostingPlatform) {
    const branded = brandsInHost.length > 0;
    push({ code: "URL_HOSTING", title: "Free website-hosting platform", status: "WARN", severity: branded ? "MEDIUM" : "LOW", weight: branded ? 20 : 10, result: `Hosted on ${hostingPlatform}`, explanation: `The page lives on a subdomain of ${hostingPlatform}, a platform anyone can publish to for free. Such platforms are heavily abused for phishing because pages inherit the platform's good reputation and HTTPS certificate.`, evidence: { platform: hostingPlatform } });
  }

  // Subdomain depth
  if (subdomainLabels.length >= 4) {
    push({ code: "URL_SUBDOMAINS", title: "Subdomain depth", status: "WARN", severity: "MEDIUM", weight: 12, result: `${subdomainLabels.length} subdomain levels`, explanation: "Very deep subdomains are used to push the real domain out of view on narrow screens (for example login.microsoft.com.account.secure.example.top).", evidence: { subdomain: parts.subdomain } });
  } else {
    push({ code: "URL_SUBDOMAINS", title: "Subdomain depth", status: "PASS", result: `${subdomainLabels.length} level(s)`, explanation: "The number of subdomain levels is normal." });
  }

  // Port
  if (port !== null && !STANDARD_PORTS.has(port)) {
    const soft = SOFT_PORTS.has(port);
    push({ code: "URL_PORT", title: "Non-standard port", status: "WARN", severity: soft ? "LOW" : "MEDIUM", weight: soft ? 6 : 15, result: `Port ${port}`, explanation: "Public websites normally use the default ports 80/443. Links to unusual ports often point to ad-hoc servers or compromised machines." });
  } else {
    push({ code: "URL_PORT", title: "Non-standard port", status: "PASS", result: "Default port", explanation: "The link uses the standard web port." });
  }

  // Parameters
  if (params.length > 10 || u.search.length > 512) {
    push({ code: "URL_PARAMS", title: "Query parameters", status: "WARN", severity: "LOW", weight: 6, result: `${params.length} parameters, ${u.search.length} characters`, explanation: "An unusually long query string can carry tracking IDs, encoded victim e-mail addresses or an embedded redirect target.", evidence: { sample: params.slice(0, 15) } });
  } else {
    push({ code: "URL_PARAMS", title: "Query parameters", status: "PASS", result: `${params.length} parameter(s)`, explanation: "The query string length is normal." });
  }
  const embeddedUrl = [...u.searchParams.values()].find((v) => /^(https?:)?\/\//i.test(v) || /^https?%3a/i.test(v));
  if (embeddedUrl) {
    push({ code: "URL_EMBEDDED_REDIRECT", title: "Embedded destination URL", status: "WARN", severity: "MEDIUM", weight: 12, result: "A parameter contains another URL", explanation: "A query parameter carries a second URL, a typical open-redirect pattern used to bounce victims through a trusted domain to a malicious one.", evidence: { value: embeddedUrl.slice(0, 300) } });
  }

  // Keywords
  if (matchedKeywords.length === 0) {
    push({ code: "URL_KEYWORDS", title: "Suspicious keywords", status: "PASS", result: "None found", explanation: "The link does not contain common phishing lure words." });
  } else if (trusted) {
    push({ code: "URL_KEYWORDS", title: "Suspicious keywords", status: "INFO", result: matchedKeywords.join(", "), explanation: "Lure-type words appear in the link, but the domain is on the trusted/official list, so they are not scored." });
  } else {
    const n2 = matchedKeywords.length;
    push({ code: "URL_KEYWORDS", title: "Suspicious keywords", status: n2 >= 2 ? "WARN" : "INFO", severity: n2 >= 4 ? "MEDIUM" : "LOW", weight: n2 >= 4 ? 16 : n2 >= 2 ? 9 : 4, result: matchedKeywords.join(", "), explanation: "Words like login, verify, invoice, tracking or customs are frequently used in phishing links aimed at logistics staff. On their own they are a weak signal.", evidence: { keywords: matchedKeywords } });
  }

  // Encoding anomalies
  const anomalies = encodingAnomalies(u);
  if (anomalies.length) {
    push({ code: "URL_ENCODING", title: "URL encoding anomalies", status: "WARN", severity: "MEDIUM", weight: Math.min(25, 10 + anomalies.length * 5), result: anomalies.join("; "), explanation: "Unusual percent-encoding is used to evade link filters and hide the real path.", evidence: { anomalies } });
  } else {
    push({ code: "URL_ENCODING", title: "URL encoding anomalies", status: "PASS", result: "None", explanation: "No unusual encoding was found in the link." });
  }

  // TLD
  const tld = parts.tld;
  if (tld && settings.suspiciousTlds.includes(tld)) {
    push({ code: "URL_TLD", title: "Top-level domain reputation", status: "WARN", severity: "LOW", weight: 10, result: `.${tld}`, explanation: `The .${tld} extension is cheap or free to register and is statistically over-represented in phishing and malware campaigns.` });
  } else if (tld) {
    push({ code: "URL_TLD", title: "Top-level domain reputation", status: "PASS", result: `.${tld}`, explanation: "The domain extension is not on the high-abuse list." });
  }

  // Structural oddities
  const odd: string[] = [];
  const sldRaw = (parts.registrable ?? "").split(".")[0] ?? "";
  // Only punycode needs decoding: domainToUnicode reads an all-digit label as an IPv4 number.
  const sld = sldRaw.startsWith("xn--") ? domainToUnicode(sldRaw) || sldRaw : sldRaw;
  if (host.length > 50) odd.push(`long host name (${host.length} characters)`);
  if ((sld.match(/-/g) ?? []).length >= 3) odd.push("many hyphens in the domain name");
  if (/^\d{4,}$/.test(sld)) odd.push("domain name made only of digits");
  else if (/\d{4,}/.test(sld)) odd.push("long digit run in the domain name");
  if (labels.some((l) => /^(https?|www)[-0-9]/.test(l) || /-(com|net|org)$/.test(l))) odd.push("protocol or TLD text embedded in a label");
  if (odd.length) {
    push({ code: "URL_STRUCTURE", title: "Domain structure", status: "WARN", severity: "LOW", weight: Math.min(16, odd.length * 7), result: odd.join("; "), explanation: "These structural traits are common in throw-away phishing domains (for example www-dhl-com.secure-delivery.top).", evidence: { traits: odd } });
  } else {
    push({ code: "URL_STRUCTURE", title: "Domain structure", status: "PASS", result: "Normal", explanation: "The host name has an ordinary structure." });
  }

  return {
    data: {
      url: u.toString(),
      scheme: u.protocol.replace(":", ""),
      host,
      hostUnicode,
      port,
      path: u.pathname,
      paramCount: params.length,
      length: u.toString().length,
      registrableDomain: parts.registrable,
      tenantDomain: parts.tenant,
      publicSuffix: parts.publicSuffix,
      subdomain: parts.subdomain,
      subdomainDepth: subdomainLabels.length,
      isIp: parts.isIp,
      isPunycode,
      scripts,
      shortener,
      hostingPlatform,
      matchedKeywords,
      brandsReferenced: [...new Set([...brandsInHost, ...brandsInPath].map((b) => b.brand))],
      officialBrand: official?.brand ?? null,
      trusted,
      schemeAssumed: n.schemeAssumed,
      defanged: n.defanged,
    },
    findings,
  };
}

function findTyposquat(label: string, settings: ScannerSettings): { brand: string; domain: string; distance: number } | null {
  if (label.length < 4) return null;
  const folded = asciiSkeleton(label);
  for (const b of settings.brandDomains) {
    for (const d of b.domains) {
      const officialLabel = d.split(".")[0];
      if (officialLabel.length < 5 || officialLabel === label) continue;
      if (folded === officialLabel) return { brand: b.brand, domain: d, distance: 1 };
      const dist = editDistance(label, officialLabel, 2);
      if (dist === 0) continue;
      if (officialLabel.length === 5) {
        // Five-letter names collide with real words (gmail/email), so only count
        // swapped letters (fedxe, appel), not substitutions.
        const sameLetters = [...label].sort().join("") === [...officialLabel].sort().join("");
        if (dist === 1 && sameLetters) return { brand: b.brand, domain: d, distance: 1 };
        continue;
      }
      const limit = officialLabel.length >= 9 ? 2 : 1;
      if (dist <= limit) return { brand: b.brand, domain: d, distance: dist };
    }
  }
  return null;
}

const EMAIL_RE = /[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,253}\.[a-z]{2,24}/i;

function findEmbeddedEmail(u: URL): { email: string; encoded: boolean; where: string } | null {
  const candidates: [string, string][] = [];
  for (const [k, val] of u.searchParams) candidates.push([`?${k}`, val]);
  if (u.hash) candidates.push(["#fragment", u.hash.slice(1)]);
  for (const seg of u.pathname.split("/")) if (seg.length >= 12) candidates.push(["path", seg]);
  for (const [where, raw] of candidates) {
    const plain = EMAIL_RE.exec(decodeURIComponentSafe(raw));
    if (plain) return { email: plain[0], encoded: false, where };
    for (const piece of raw.split(/[.&=:/]/)) {
      if (piece.length < 12 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(piece)) continue;
      try {
        const decoded = Buffer.from(piece.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
        const m = EMAIL_RE.exec(decoded);
        if (m && /^[\x20-\x7e]+$/.test(decoded)) return { email: m[0], encoded: true, where };
      } catch {
        /* not base64 */
      }
    }
  }
  return null;
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export { tokenMatchesKeyword };
