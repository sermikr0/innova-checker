import type { Finding } from "../types";
import { BlockedDestinationError, bareHost } from "../net/ip-policy";
import { describeNetworkError, tlsProbe, type TlsDetails } from "../net/safe-http";
import { makeFinding } from "../util";

const DAY = 86_400_000;
const FREE_DV_ISSUERS = /let's encrypt|zerossl|buypass|google trust services|ssl\.com free|cloudflare/i;

export interface TlsData {
  probedPort: number;
  linkUsesHttps: boolean;
  available: boolean;
  details: TlsDetails | null;
  error: string | null;
  daysToExpiry: number | null;
  certAgeDays: number | null;
}

export async function analyzeTls(ctx: { url: URL; timeoutMs: number }): Promise<{ data: TlsData; findings: Finding[]; status: "ok" | "error" }> {
  const { url } = ctx;
  const host = bareHost(url.hostname);
  const linkUsesHttps = url.protocol === "https:";
  const port = linkUsesHttps ? Number(url.port || 443) : 443;
  const data: TlsData = { probedPort: port, linkUsesHttps, available: false, details: null, error: null, daysToExpiry: null, certAgeDays: null };
  const findings: Finding[] = [];
  const source = `TLS handshake (${host}:${port})`;

  try {
    data.details = await tlsProbe(host, port, ctx.timeoutMs);
    data.available = true;
  } catch (e) {
    const { code, message } = describeNetworkError(e);
    data.error = `${code}: ${message}`;
    if (e instanceof BlockedDestinationError) {
      findings.push(makeFinding("tls", { code: "TLS_AVAILABLE", title: "HTTPS availability", status: "SKIPPED", result: "Blocked by scanner network policy", explanation: e.message, source }));
      return { data, findings, status: "error" };
    }
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      findings.push(makeFinding("tls", { code: "TLS_AVAILABLE", title: "HTTPS availability", status: "UNAVAILABLE", result: "Host does not resolve", explanation: "No TLS check is possible because the host name does not resolve; see DNS records.", source }));
      return { data, findings, status: "error" };
    }
    // No answer at all (filtered, refused, reset by a geo-block) says nothing
    // about the site's TLS setup; the reachability check reports it.
    if (["ETIMEDOUT", "ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(code)) {
      findings.push(makeFinding("tls", { code: "TLS_AVAILABLE", title: "HTTPS availability", status: "UNAVAILABLE", result: "Server did not answer on port 443", explanation: `No TLS check was possible because the server did not accept a connection from the scanner (${message}). Sites that block foreign or data-centre networks look like this too.`, evidence: { code }, source }));
      return { data, findings, status: "error" };
    }
    if (linkUsesHttps) {
      findings.push(makeFinding("tls", { code: "TLS_AVAILABLE", title: "HTTPS availability", status: "FAIL", severity: "MEDIUM", weight: 12, result: "TLS handshake failed", explanation: `The link uses HTTPS but no secure connection could be established (${message}).`, evidence: { code }, source }));
    } else {
      findings.push(makeFinding("tls", { code: "TLS_AVAILABLE", title: "HTTPS availability", status: "WARN", severity: "LOW", weight: 8, result: "No HTTPS on port 443", explanation: "The site is only reachable over unencrypted HTTP. Credentials or documents exchanged with it are exposed in transit.", evidence: { code }, source }));
    }
    return { data, findings, status: "error" };
  }

  const d = data.details;
  const cert = d.cert;
  findings.push(makeFinding("tls", { code: "TLS_AVAILABLE", title: "HTTPS availability", status: linkUsesHttps ? "PASS" : "INFO", result: linkUsesHttps ? "Secure connection established" : "HTTPS available, but the link uses HTTP", explanation: linkUsesHttps ? "The server completed a TLS handshake." : "The server supports HTTPS even though the link points to the unencrypted version.", evidence: { protocol: d.protocol, cipher: d.cipher, ip: d.ip }, source }));

  if (!cert) {
    findings.push(makeFinding("tls", { code: "TLS_CERT_VALID", title: "Certificate validity", status: "FAIL", severity: "HIGH", weight: 25, result: "No certificate presented", explanation: "The server did not present a certificate.", source }));
    return { data, findings, status: "ok" };
  }

  const now = Date.now();
  data.daysToExpiry = Math.floor((new Date(cert.validTo).getTime() - now) / DAY);
  data.certAgeDays = Math.floor((now - new Date(cert.validFrom).getTime()) / DAY);
  const chainError = d.authorizationError && d.authorizationError !== "ERR_TLS_CERT_ALTNAME_INVALID" ? d.authorizationError : null;

  if (data.daysToExpiry < 0 || chainError === "CERT_HAS_EXPIRED") {
    findings.push(makeFinding("tls", { code: "TLS_CERT_VALID", title: "Certificate validity", status: "FAIL", severity: "HIGH", weight: 25, result: `Expired ${Math.abs(data.daysToExpiry)} day(s) ago`, explanation: "Browsers show a full-page warning for expired certificates. Users are often told to click through such warnings by attackers.", evidence: { validTo: cert.validTo }, source }));
  } else if (chainError && /SELF_SIGNED/.test(chainError) && /russian trusted/i.test(`${cert.issuer} ${cert.issuerCN ?? ""}`)) {
    // Russia's state CA (Минцифры) issues certificates to verified Russian
    // organisations such as banks; it is legitimate but not in browser stores.
    findings.push(makeFinding("tls", { code: "TLS_CERT_VALID", title: "Certificate validity", status: "INFO", severity: "LOW", weight: 4, result: "Issued by the Russian national CA", explanation: "The certificate comes from Russia's state certificate authority (Russian Trusted Root CA). It is issued only to verified organisations, but browsers outside Russia do not trust it and will show a warning.", evidence: { error: chainError, issuer: cert.issuer }, source }));
  } else if (chainError === "SELF_SIGNED_CERT_IN_CHAIN") {
    findings.push(makeFinding("tls", { code: "TLS_CERT_VALID", title: "Certificate validity", status: "FAIL", severity: "MEDIUM", weight: 15, result: "Chain ends in an untrusted root", explanation: "The certificate was issued by a private or unknown root authority that browsers do not trust. Corporate and some national authorities do this; so do attackers.", evidence: { error: chainError, issuer: cert.issuer }, source }));
  } else if (chainError && /SELF_SIGNED/.test(chainError)) {
    findings.push(makeFinding("tls", { code: "TLS_CERT_VALID", title: "Certificate validity", status: "FAIL", severity: "HIGH", weight: 25, result: "Self-signed certificate", explanation: "The certificate is not issued by a trusted authority. Anyone can create one, so it proves nothing about the site's identity.", evidence: { error: chainError, issuer: cert.issuer }, source }));
  } else if (chainError) {
    findings.push(makeFinding("tls", { code: "TLS_CERT_VALID", title: "Certificate validity", status: "FAIL", severity: "MEDIUM", weight: 15, result: `Untrusted chain (${chainError})`, explanation: "The certificate chain does not validate against trusted root authorities. This can be a server misconfiguration (missing intermediate) or an untrusted issuer.", evidence: { error: chainError, issuer: cert.issuer }, source }));
  } else {
    findings.push(makeFinding("tls", { code: "TLS_CERT_VALID", title: "Certificate validity", status: "PASS", result: `Trusted, valid until ${cert.validTo.slice(0, 10)}`, explanation: "The certificate chains to a trusted root authority and is within its validity period.", evidence: { validFrom: cert.validFrom, validTo: cert.validTo }, source }));
  }

  if (d.hostnameMatches) {
    findings.push(makeFinding("tls", { code: "TLS_HOSTNAME", title: "Certificate hostname match", status: "PASS", result: `Covers ${host}`, explanation: "The certificate is issued for this host name.", evidence: { subjectCN: cert.subjectCN, san: cert.san.slice(0, 20) }, source }));
  } else {
    findings.push(makeFinding("tls", { code: "TLS_HOSTNAME", title: "Certificate hostname match", status: "FAIL", severity: "HIGH", weight: 22, result: `Certificate is for ${cert.subjectCN ?? cert.san[0] ?? "another host"}`, explanation: "The certificate does not cover the host in the link, so the browser cannot confirm it is talking to the right site.", evidence: { subjectCN: cert.subjectCN, san: cert.san.slice(0, 20), error: d.hostnameError }, source }));
  }

  if (data.daysToExpiry >= 0 && data.daysToExpiry < 14) {
    findings.push(makeFinding("tls", { code: "TLS_EXPIRY", title: "Certificate expiration", status: "INFO", severity: "LOW", weight: 2, result: `Expires in ${data.daysToExpiry} day(s)`, explanation: "The certificate is close to expiry. Usually an operational issue rather than a threat.", source }));
  } else if (data.daysToExpiry >= 0) {
    findings.push(makeFinding("tls", { code: "TLS_EXPIRY", title: "Certificate expiration", status: "PASS", result: `${data.daysToExpiry} days remaining`, explanation: "The certificate is not close to expiry.", source }));
  }

  if (data.certAgeDays >= 0 && data.certAgeDays <= 3) {
    findings.push(makeFinding("tls", { code: "TLS_CERT_AGE", title: "Certificate age", status: "INFO", severity: "LOW", weight: 5, result: `Issued ${data.certAgeDays} day(s) ago`, explanation: "Phishing sites usually obtain a certificate just before a campaign. Legitimate renewals look the same, so this only matters together with other signals.", evidence: { validFrom: cert.validFrom }, source }));
  }

  const proto = d.protocol ?? "";
  if (/TLSv1(\.1)?$/.test(proto) || proto === "SSLv3") {
    findings.push(makeFinding("tls", { code: "TLS_PROTOCOL", title: "TLS configuration", status: "WARN", severity: "MEDIUM", weight: 10, result: `${proto} negotiated`, explanation: "The server negotiated an obsolete protocol version that modern browsers have deprecated.", evidence: { protocol: proto, cipher: d.cipher }, source }));
  } else {
    findings.push(makeFinding("tls", { code: "TLS_PROTOCOL", title: "TLS configuration", status: "PASS", result: `${proto || "unknown"}${d.cipher ? ` · ${d.cipher}` : ""}`, explanation: "A modern TLS version was negotiated. Only the negotiated parameters are observed; the full cipher-suite matrix is not enumerated.", evidence: { protocol: proto, cipher: d.cipher, alpn: d.alpn }, source }));
  }

  const issuer = cert.issuerOrg ?? cert.issuerCN ?? cert.issuer;
  findings.push(makeFinding("tls", { code: "TLS_ISSUER", title: "Certificate issuer", status: "INFO", result: issuer, explanation: FREE_DV_ISSUERS.test(issuer) ? "Domain-validated certificate from a free/automated authority. It proves control of the domain only, not the identity of the company behind it; phishing sites use these too." : "Certificate issuing authority.", evidence: { issuer: cert.issuer, serialNumber: cert.serialNumber, fingerprint256: cert.fingerprint256 }, source }));

  return { data, findings, status: "ok" };
}
