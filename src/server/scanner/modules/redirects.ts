import type { Finding, RedirectHop, ScannerSettings } from "../types";
import { BlockedDestinationError } from "../net/ip-policy";
import { describeNetworkError, safeRequest, type SafeResponse } from "../net/safe-http";
import { domainParts, hostMatchesDomain, makeFinding } from "../util";

export interface RedirectData {
  chain: RedirectHop[];
  finalUrl: string | null;
  finalStatus: number | null;
  reachable: boolean;
  error: string | null;
  stoppedReason: string | null;
  hiddenDestinations: string[];
  responseHeaders: Record<string, string> | null;
}

const META_REFRESH = /<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*content\s*=\s*["']?\s*\d*\s*;?\s*url\s*=\s*['"]?([^"'>\s]+)/i;
const META_REFRESH_ALT = /<meta[^>]+content\s*=\s*["']?\s*\d*\s*;\s*url\s*=\s*['"]?([^"'>\s]+)[^>]*http-equiv\s*=\s*["']?refresh/i;
const JS_REDIRECTS = [
  /(?:window\.|document\.|top\.|self\.|parent\.)?location(?:\.href)?\s*=\s*["'`]([^"'`\s]{4,500})["'`]/gi,
  /location\.(?:replace|assign)\(\s*["'`]([^"'`\s]{4,500})["'`]/gi,
  /window\.open\(\s*["'`](https?:[^"'`\s]{4,500})["'`]/gi,
];

// Anti-bot front ends (Ozon, Wildberries, many CDNs) set a cookie and redirect
// to themselves until the browser sends it back. Without a jar the scanner
// loops until the redirect limit. Cookies live only for one chain, in memory,
// and follow browser scoping rules so one site can never set them for another.
interface JarCookie { name: string; value: string; domain: string; hostOnly: boolean; path: string; secure: boolean }

export class CookieJar {
  private cookies = new Map<string, JarCookie>();

  store(setCookies: string[], from: URL): void {
    const host = from.hostname.toLowerCase();
    const site = domainParts(host).registrable;
    for (const line of setCookies.slice(0, 30)) {
      const [pair, ...attrs] = line.split(";");
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!name || name.length + value.length > 4096) continue;
      let domain = host;
      let hostOnly = true;
      let path = "/";
      let secure = false;
      let expired = false;
      for (const a of attrs) {
        const [k, ...rest] = a.split("=");
        const key = k.trim().toLowerCase();
        const val = rest.join("=").trim();
        if (key === "domain" && val) {
          const d = val.replace(/^\./, "").toLowerCase();
          // Reject cookies for another site or for a public suffix (".com", ".co.uk").
          if (!site || !(d === site || d.endsWith(`.${site}`)) || !(host === d || host.endsWith(`.${d}`))) {
            expired = true;
            break;
          }
          domain = d;
          hostOnly = false;
        } else if (key === "path" && val.startsWith("/")) path = val;
        else if (key === "secure") secure = true;
        else if (key === "max-age" && Number(val) <= 0) expired = true;
        else if (key === "expires" && Date.parse(val) < Date.now()) expired = true;
      }
      const id = `${domain}|${path}|${name}`;
      if (expired) this.cookies.delete(id);
      else if (this.cookies.size < 50 || this.cookies.has(id)) this.cookies.set(id, { name, value, domain, hostOnly, path, secure });
    }
  }

  header(to: URL): string | undefined {
    const host = to.hostname.toLowerCase();
    const path = to.pathname || "/";
    const out = [...this.cookies.values()]
      .filter((c) => (c.hostOnly ? host === c.domain : host === c.domain || host.endsWith(`.${c.domain}`)))
      .filter((c) => path === c.path || path.startsWith(c.path.endsWith("/") ? c.path : `${c.path}/`))
      .filter((c) => !c.secure || to.protocol === "https:")
      .map((c) => `${c.name}=${c.value}`);
    return out.length ? out.join("; ") : undefined;
  }
}

function stripHash(u: URL): string {
  const c = new URL(u.toString());
  c.hash = "";
  return c.toString();
}

export function extractJsRedirects(html: string, base: URL): string[] {
  const out = new Set<string>();
  for (const re of JS_REDIRECTS) {
    for (const m of html.matchAll(re)) {
      try {
        const target = new URL(m[1], base);
        if (target.protocol === "http:" || target.protocol === "https:") out.add(target.toString());
      } catch {
        /* ignore unparsable */
      }
      if (out.size >= 8) break;
    }
  }
  return [...out];
}

export async function followRedirects(ctx: {
  url: URL;
  settings: ScannerSettings;
  signal?: AbortSignal;
}): Promise<{ data: RedirectData; response: SafeResponse | null; findings: Finding[]; status: "ok" | "error" }> {
  const { settings } = ctx;
  const max = settings.maxRedirects;
  const chain: RedirectHop[] = [];
  const seen = new Set<string>();
  const jar = new CookieJar();
  const findings: Finding[] = [];
  const source = "HTTP fetch (Innova scanner, isolated)";
  let current = ctx.url;
  let response: SafeResponse | null = null;
  let error: string | null = null;
  let stoppedReason: string | null = null;
  let downgrade = false;
  let metaRefresh = false;
  let metaCrossSite = false;
  let pendingRedirect = false;

  for (let i = 0; i <= max; i++) {
    pendingRedirect = false;
    const key = stripHash(current);
    const cookie = jar.header(current);
    // Revisiting a URL is only a loop if nothing changed; a newly set cookie is
    // the anti-bot handshake completing.
    const visit = `${key}\n${cookie ?? ""}`;
    if (seen.has(visit)) {
      stoppedReason = "loop";
      findings.push(makeFinding("redirects", { code: "REDIRECT_LOOP", title: "Redirect loop", status: "WARN", severity: "MEDIUM", weight: 10, result: `Loops back to ${key}`, explanation: "The redirect chain returns to an address it already visited. Loops are used to stall automated scanners.", source }));
      break;
    }
    seen.add(visit);

    let res: SafeResponse;
    try {
      res = await safeRequest(current, {
        timeoutMs: settings.requestTimeoutMs,
        maxTextBytes: settings.maxResponseBytes,
        maxDownloadBytes: settings.maxDownloadBytes,
        userAgent: settings.userAgent,
        cookie,
        signal: ctx.signal,
      });
    } catch (e) {
      const { code, message } = describeNetworkError(e);
      if (e instanceof BlockedDestinationError) {
        chain.push({ url: current.toString(), kind: "blocked", note: message });
        stoppedReason = "blocked";
        if (i > 0) {
          findings.push(makeFinding("redirects", { code: "REDIRECT_BLOCKED", title: "Redirect into a blocked destination", status: "FAIL", severity: "HIGH", weight: 30, result: message, explanation: "A redirect pointed at an internal, private or otherwise disallowed address. The scanner refused to follow it. Public websites do not redirect visitors into private networks.", evidence: { hop: current.toString(), reason: e.detail.reason }, source }));
        } else {
          error = message;
        }
      } else {
        chain.push({ url: current.toString(), kind: "error", note: `${code}: ${message}` });
        error = `${code}: ${message}`;
        stoppedReason = "network-error";
      }
      break;
    }

    jar.store(res.setCookies, current);
    const status = res.status;
    const location = res.headers["location"];
    if (status >= 300 && status < 400 && location) {
      chain.push({ url: current.toString(), status, location, ip: res.remoteAddress ?? undefined, kind: "http" });
      let next: URL;
      try {
        next = new URL(location, current);
      } catch {
        stoppedReason = "invalid-location";
        break;
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        stoppedReason = "non-web-scheme";
        findings.push(makeFinding("redirects", { code: "REDIRECT_SCHEME", title: "Redirect to non-web scheme", status: "FAIL", severity: "HIGH", weight: 30, result: next.protocol, explanation: "The server redirects to a data:, javascript: or other non-web URL, a technique used to render phishing content without a hosting domain or to run script.", evidence: { location: location.slice(0, 300) }, source }));
        break;
      }
      if (current.protocol === "https:" && next.protocol === "http:") downgrade = true;
      current = next;
      pendingRedirect = true;
      continue;
    }

    response = res;
    if (res.bodyKind === "text" && i < max) {
      const head = res.body.subarray(0, 65536).toString("utf8");
      const m = META_REFRESH.exec(head) ?? META_REFRESH_ALT.exec(head);
      if (m) {
        try {
          const next = new URL(m[1].replace(/&amp;/g, "&"), current);
          if ((next.protocol === "http:" || next.protocol === "https:") && stripHash(next) !== key) {
            chain.push({ url: current.toString(), status, location: next.toString(), ip: res.remoteAddress ?? undefined, kind: "meta-refresh" });
            metaRefresh = true;
            if (domainParts(next.hostname).tenant !== domainParts(current.hostname).tenant) metaCrossSite = true;
            current = next;
            pendingRedirect = true;
            continue;
          }
        } catch {
          /* fall through: treat as final */
        }
      }
    }
    chain.push({ url: current.toString(), status, ip: res.remoteAddress ?? undefined, kind: "final" });
    break;
  }

  if (pendingRedirect && !response && !stoppedReason) {
    stoppedReason = "max-redirects";
    findings.push(makeFinding("redirects", { code: "REDIRECT_MAX", title: "Redirect limit reached", status: "WARN", severity: "MEDIUM", weight: 12, result: `More than ${max} redirects`, explanation: "The chain exceeded the scanner's redirect limit. Long chains are used to launder links through many domains and to exhaust scanners.", evidence: { lastUrl: current.toString() }, source }));
  }

  const redirectCount = chain.filter((h) => h.kind === "http" || h.kind === "meta-refresh").length;
  const finalUrl = response ? current.toString() : null;
  const startParts = domainParts(ctx.url.hostname);
  const finalParts = response ? domainParts(current.hostname) : null;
  const startIsShortener = settings.urlShorteners.some((s) => hostMatchesDomain(ctx.url.hostname, s));

  if (redirectCount === 0 && response) {
    findings.push(makeFinding("redirects", { code: "REDIRECT_CHAIN", title: "Redirect chain", status: "PASS", result: "No redirects", explanation: "The link opens its destination directly.", source }));
  } else if (redirectCount > 0) {
    findings.push(makeFinding("redirects", { code: "REDIRECT_CHAIN", title: "Redirect chain", status: redirectCount >= 3 ? "WARN" : "INFO", severity: redirectCount >= 3 ? "MEDIUM" : "NONE", weight: redirectCount >= 3 ? 12 : 0, result: `${redirectCount} redirect(s)`, explanation: redirectCount >= 3 ? "Several hops before the final page. Multi-hop chains are a common way to hide the destination from e-mail filters." : "One or two redirects are normal (for example http → https or adding www).", evidence: { chain }, source }));
  }

  if (response && finalParts && (finalParts.tenant ?? finalParts.host) !== (startParts.tenant ?? startParts.host)) {
    findings.push(makeFinding("redirects", { code: "REDIRECT_CROSS_DOMAIN", title: "Final destination domain", status: "INFO", severity: startIsShortener ? "NONE" : "LOW", weight: startIsShortener ? 0 : 5, result: `Lands on ${finalParts.tenant ?? finalParts.host}`, explanation: startIsShortener ? "The short link resolves to this destination. Judge the link by this domain, not by the shortener." : "The link ends on a different domain than the one shown in the link. Verify that the final domain is one you expect.", evidence: { from: ctx.url.hostname, to: current.hostname }, source }));
  }

  if (downgrade) {
    findings.push(makeFinding("redirects", { code: "REDIRECT_DOWNGRADE", title: "HTTPS to HTTP downgrade", status: "WARN", severity: "MEDIUM", weight: 15, result: "Redirected from HTTPS to HTTP", explanation: "A secure link redirects to an unencrypted page, which exposes anything entered on it.", source }));
  }
  if (metaRefresh) {
    findings.push(makeFinding("redirects", { code: "REDIRECT_META", title: "Meta-refresh redirect", status: metaCrossSite ? "WARN" : "INFO", severity: metaCrossSite ? "MEDIUM" : "LOW", weight: metaCrossSite ? 16 : 5, result: metaCrossSite ? "HTML meta refresh to another site" : "HTML meta refresh used", explanation: metaCrossSite ? "A static page forwards visitors to a different site with an HTML meta refresh. Attackers park such redirector pages on reputable storage or hosting (S3, Azure, GitHub Pages) so the first link in the e-mail looks harmless." : "The page forwards the browser with an HTML meta refresh instead of an HTTP redirect, a technique often used to slip past link scanners.", source }));
  }

  let hiddenDestinations: string[] = [];
  if (response && response.bodyKind === "text") {
    hiddenDestinations = extractJsRedirects(response.body.toString("utf8"), current);
    const foreign = hiddenDestinations.filter((d) => {
      const p = domainParts(new URL(d).hostname);
      return (p.tenant ?? p.host) !== (finalParts?.tenant ?? finalParts?.host);
    });
    if (foreign.length) {
      findings.push(makeFinding("redirects", { code: "REDIRECT_HIDDEN", title: "Hidden script redirects", status: "WARN", severity: "MEDIUM", weight: 14, result: `Script sends visitors to ${new URL(foreign[0]).hostname}`, explanation: "The page contains JavaScript that navigates to another domain. Scripts are never executed by the scanner; the destination was extracted from the source code.", evidence: { destinations: foreign.slice(0, 5) }, source }));
    }
  }

  if (!response) {
    findings.push(makeFinding("redirects", { code: "SITE_REACHABLE", title: "Website reachability", status: error ? "UNAVAILABLE" : "INFO", result: error ?? "No final response", explanation: "The scanner could not retrieve the page, so content and download checks could not run. A dead link is not proof of safety: phishing pages are often taken down or only served to specific regions.", evidence: { chain }, source }));
  } else if (response.status >= 400) {
    findings.push(makeFinding("redirects", { code: "SITE_REACHABLE", title: "Website reachability", status: "INFO", result: `HTTP ${response.status} ${response.statusText}`, explanation: "The server answered with an error status. Content analysis covers whatever the server returned.", source }));
  } else {
    findings.push(makeFinding("redirects", { code: "SITE_REACHABLE", title: "Website reachability", status: "PASS", result: `HTTP ${response.status} in ${response.elapsedMs} ms`, explanation: "The final page was retrieved for analysis.", evidence: { ip: response.remoteAddress, contentType: response.contentType }, source }));
  }

  return {
    data: {
      chain,
      finalUrl,
      finalStatus: response?.status ?? null,
      reachable: !!response,
      error,
      stoppedReason,
      hiddenDestinations,
      responseHeaders: response?.headers ?? null,
    },
    response,
    findings,
    status: response ? "ok" : "error",
  };
}
