import type { Finding, ScannerSettings, Verdict } from "./types";

export function buildRecommendations(verdict: Verdict, findings: Finding[], settings: ScannerSettings): string[] {
  const has = (code: string) => findings.some((f) => f.code.endsWith(code) && f.weight > 0);
  const out: string[] = [];

  switch (verdict) {
    case "MALICIOUS":
      out.push("Do not open this link and do not forward it to colleagues.");
      out.push("Report the message to your IT/security team and delete it from your inbox.");
      out.push("If you already entered a password on this site, change it immediately from a trusted device and enable multi-factor authentication.");
      break;
    case "HIGH_RISK":
      out.push("Do not open this link. Report the message to your IT/security team.");
      out.push("Confirm the request with the sender using a phone number or address you already know, not contact details from the message.");
      break;
    case "SUSPICIOUS":
      out.push("Treat this link with caution and verify the sender through a separate, known channel before opening it.");
      out.push("Do not sign in, pay or download anything from this page unless you have confirmed it is legitimate.");
      break;
    case "INCONCLUSIVE":
      if (findings.some((f) => f.code === "DNS_RESOLUTION" && f.evidence?.nxdomain === true)) {
        out.push("This address does not exist right now. Ask the sender for the correct link instead of guessing or searching for it.");
        out.push("If the message claims to come from a carrier, broker or partner, open their official website by typing it yourself.");
        out.push("Scan the link again if the sender says the site has just been set up: the address may go live later with different content.");
      } else {
        out.push("The scan could not reach a conclusion. Do not open the link unless you were expecting it and can confirm it with the sender.");
      }
      break;
    case "LOW_RISK":
      out.push("No serious threats were detected. Still check that the domain is the one you expect before entering any data.");
      break;
    case "SAFE":
      out.push("No threats were detected. Continue to apply normal caution: automated checks cannot guarantee a site is safe.");
      break;
  }

  const brandFinding = findings.find((f) => (f.code.endsWith("URL_BRAND") || f.code === "CONTENT_CREDENTIAL_PHISH" || f.code === "CONTENT_BRAND_CLAIM" || f.code.endsWith("URL_HOMOGRAPH")) && f.weight > 0);
  const brandName = (brandFinding?.evidence?.brand as string | undefined) ?? undefined;
  const brand = brandName ? settings.brandDomains.find((b) => b.brand === brandName) : undefined;
  if (brand) {
    out.push(`To check a ${brand.brand} shipment or account, type ${brand.domains[0]} into the address bar yourself instead of using links from messages.`);
  }
  if (has("CONTENT_CREDENTIAL_PHISH") || has("CONTENT_LOGIN_FORM") || has("CONTENT_FORM_EXTERNAL")) {
    out.push("Never enter corporate e-mail or ERP/TMS credentials on a page you reached from a link in a message.");
  }
  if (has("CONTENT_PAYMENT_FORM")) {
    out.push("Carriers and customs brokers do not collect release or redelivery fees by card through e-mailed links. Do not pay.");
  }
  if (has("DOWNLOAD_TYPE") || has("DOWNLOAD_MISMATCH") || has("DOWNLOAD_DOUBLE_EXT") || has("CONTENT_HTML_SMUGGLING")) {
    out.push("Do not open the downloaded file. If it was already saved, hand it to IT for sandbox analysis and do not enable macros or editing.");
  }
  if (has("URL_SHORTENER") || has("REDIRECT_CHAIN") || has("REDIRECT_HIDDEN")) {
    out.push("Judge the link by its final destination shown in the redirect analysis, not by the domain in the original message.");
  }
  if (has("DOMAIN_AGE")) {
    out.push("The domain is very new. Legitimate partners rarely send business documents from freshly registered domains.");
  }
  if (has("TLS_CERT_VALID") || has("TLS_HOSTNAME")) {
    out.push("Do not click through browser certificate warnings for this site.");
  }
  return [...new Set(out)];
}

export const DISCLAIMER =
  "Innova Checker combines automated heuristics with the threat-intelligence sources listed in this report. No automated scanner can guarantee that a website is 100% safe; attackers change content, serve different pages to different visitors and use brand-new infrastructure. Use this report as one input to your judgement and follow your company's security policy.";
