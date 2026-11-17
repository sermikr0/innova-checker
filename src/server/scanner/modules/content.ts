import * as cheerio from "cheerio";
import net from "node:net";
import type { Finding, ScannerSettings } from "../types";
import type { SafeResponse } from "../net/safe-http";
import { FREE_HOSTING_SUFFIXES } from "../data/defaults";
import {
  brandsMentionedInTokens,
  domainParts,
  hostMatchesDomain,
  isOfficialFor,
  isTrustedHost,
  makeFinding,
  tokenize,
  truncate,
  userContentPlatform,
} from "../util";

// Static HTML analysis. The page is parsed with cheerio (parse5); no script is ever
// executed and no sub-resource is fetched.

export interface FormInfo {
  action: string | null;
  actionHost: string | null;
  method: string;
  hasPassword: boolean;
  hasEmail: boolean;
  hasCard: boolean;
  inputCount: number;
}

export interface ContentData {
  analyzed: boolean;
  reason: string | null;
  url: string;
  status: number;
  contentType: string;
  bytes: number;
  truncated: boolean;
  charset: string;
  title: string | null;
  metaDescription: string | null;
  generator: string | null;
  siteName: string | null;
  language: string | null;
  externalScripts: string[];
  scriptHosts: string[];
  inlineScriptCount: number;
  iframes: { src: string | null; hidden: boolean }[];
  forms: FormInfo[];
  externalDomains: string[];
  favicon: string | null;
  textLength: number;
  indicators: string[];
  securityHeaders: Record<string, string | null>;
  server: string | null;
}

const SECURITY_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

const LURE_PHRASES: [RegExp, string][] = [
  [/verify (your|the) (account|identity|email)/i, "verify your account"],
  [/(account|mailbox) (has been |will be )?(suspended|locked|disabled|deactivated)/i, "account suspended"],
  [/unusual (sign[- ]?in )?activity/i, "unusual activity"],
  [/confirm your (identity|password|details|payment)/i, "confirm your details"],
  [/(customs|import) (duty|fee|charge|clearance fee)/i, "customs fee"],
  [/(shipment|parcel|package|delivery) (is )?(on hold|pending|suspended|could not be delivered|failed)/i, "delivery on hold"],
  [/(redelivery|re-delivery|delivery) fee/i, "redelivery fee"],
  [/(update|confirm) (your )?(delivery|shipping) address/i, "update delivery address"],
  [/password (will )?expir/i, "password expiry"],
  [/(view|download|open) (the )?(shared )?(document|invoice|file|bill of lading|waybill)/i, "view shared document"],
  [/sign in to (view|access|download)/i, "sign in to view"],
  [/(within|in) 24 hours/i, "urgency (24 hours)"],
];

const FINGERPRINT_APIS = /\b(ipapi\.co|ipinfo\.io|ip-api\.com|geoplugin\.net|api\.ipify\.org|ipwho\.is|ipgeolocation\.io|extreme-ip-lookup\.com|db-ip\.com)\b/i;
const SUSPICIOUS_SCRIPT_HOSTS = [
  "pastebin.com", "raw.githubusercontent.com", "gist.githubusercontent.com", "cdn.discordapp.com", "transfer.sh", "paste.ee", "hastebin.com",
  "ngrok.io", "ngrok-free.app", "ngrok.app", "trycloudflare.com", "loca.lt", "serveo.net", "000webhostapp.com", "glitch.me", "repl.co",
];

function decodeBody(res: SafeResponse): { html: string; charset: string } {
  const fromHeader = /charset=([\w-]+)/i.exec(res.headers["content-type"] ?? "")?.[1];
  const sniff = /<meta[^>]+charset=["']?([\w-]+)/i.exec(res.body.subarray(0, 4096).toString("latin1"))?.[1];
  const charset = (fromHeader ?? sniff ?? "utf-8").toLowerCase();
  try {
    return { html: new TextDecoder(charset).decode(res.body), charset };
  } catch {
    return { html: res.body.toString("utf8"), charset: "utf-8" };
  }
}

function abs(href: string | undefined, base: URL): URL | null {
  if (!href) return null;
  try {
    return new URL(href.trim(), base);
  } catch {
    return null;
  }
}

function siteKey(host: string): string {
  const p = domainParts(host);
  return p.tenant ?? p.registrable ?? host;
}

export function analyzeContent(ctx: { response: SafeResponse; finalUrl: string; settings: ScannerSettings }): { data: ContentData; findings: Finding[]; status: "ok" | "skipped" } {
  const { response, settings } = ctx;
  const base = new URL(ctx.finalUrl);
  const host = base.hostname;
  const own = siteKey(host);
  const trusted = isTrustedHost(host, settings, FREE_HOSTING_SUFFIXES);
  const source = "Static HTML analysis (no script execution)";
  const findings: Finding[] = [];
  const securityHeaders = Object.fromEntries(SECURITY_HEADERS.map((h) => [h, response.headers[h] ?? null]));

  const data: ContentData = {
    analyzed: false,
    reason: null,
    url: ctx.finalUrl,
    status: response.status,
    contentType: response.contentType,
    bytes: response.bytesRead,
    truncated: response.truncated,
    charset: "utf-8",
    title: null,
    metaDescription: null,
    generator: null,
    siteName: null,
    language: null,
    externalScripts: [],
    scriptHosts: [],
    inlineScriptCount: 0,
    iframes: [],
    forms: [],
    externalDomains: [],
    favicon: null,
    textLength: 0,
    indicators: [],
    securityHeaders,
    server: response.headers["server"] ?? null,
  };

  const isHtml = /html|xml/.test(response.contentType) || (response.contentType === "" && /^\s*</.test(response.body.subarray(0, 512).toString("utf8")));
  if (response.bodyKind !== "text" || !isHtml) {
    data.reason = response.bodyKind === "binary" ? "Response is a file download" : `Response is ${response.contentType || "not HTML"}`;
    findings.push(makeFinding("content", { code: "CONTENT_ANALYZED", title: "Website content", status: "SKIPPED", result: data.reason, explanation: "Content analysis applies to HTML pages. See the file download analysis for non-HTML responses.", source }));
    return { data, findings, status: "skipped" };
  }

  const { html, charset } = decodeBody(response);
  data.charset = charset;
  data.analyzed = true;
  const $ = cheerio.load(html);

  data.title = truncate($("title").first().text().replace(/\s+/g, " ").trim(), 200) || null;
  data.metaDescription = truncate(($('meta[name="description" i]').attr("content") ?? "").trim(), 300) || null;
  data.generator = ($('meta[name="generator" i]').attr("content") ?? "").trim() || null;
  data.siteName = ($('meta[property="og:site_name" i]').attr("content") ?? "").trim() || null;
  data.language = ($("html").attr("lang") ?? "").trim() || null;

  // Scripts
  const inline: string[] = [];
  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      const u = abs(src, base);
      if (u) data.externalScripts.push(u.toString());
    } else {
      inline.push($(el).text());
    }
  });
  data.inlineScriptCount = inline.length;
  data.externalScripts = [...new Set(data.externalScripts)].slice(0, 60);
  data.scriptHosts = [...new Set(data.externalScripts.map((s) => new URL(s).hostname))];
  const scriptText = inline.join("\n").slice(0, 600_000);
  const fullText = `${html.slice(0, 1_500_000)}`;

  // Iframes
  $("iframe, frame").each((_, el) => {
    const $el = $(el);
    const style = ($el.attr("style") ?? "").toLowerCase().replace(/\s/g, "");
    const w = $el.attr("width") ?? "";
    const h = $el.attr("height") ?? "";
    const hidden = /display:none|visibility:hidden|opacity:0/.test(style) || ["0", "1", "0px", "1px"].includes(w) || ["0", "1", "0px", "1px"].includes(h);
    data.iframes.push({ src: abs($el.attr("src"), base)?.toString() ?? null, hidden });
  });

  // Forms
  $("form").each((_, el) => {
    const $f = $(el);
    const actionUrl = abs($f.attr("action") ?? "", base);
    const inputs = $f.find("input, select, textarea");
    const attrs = inputs
      .map((__, i) => `${$(i).attr("type") ?? ""} ${$(i).attr("name") ?? ""} ${$(i).attr("id") ?? ""} ${$(i).attr("autocomplete") ?? ""} ${$(i).attr("placeholder") ?? ""}`.toLowerCase())
      .get()
      .join(" | ");
    data.forms.push({
      action: actionUrl?.toString() ?? null,
      actionHost: actionUrl && (actionUrl.protocol === "http:" || actionUrl.protocol === "https:") ? actionUrl.hostname : actionUrl?.protocol ?? null,
      method: ($f.attr("method") ?? "get").toLowerCase(),
      hasPassword: inputs.filter('[type="password" i]').length > 0 || /\bpass(word|wd)?\b/.test(attrs),
      hasEmail: /email|e-mail|username|login|user_?id|userid/.test(attrs),
      hasCard: /cc-number|card ?number|cardnumber|cvv|cvc|cc-exp|expiry|card_?num/.test(attrs),
      inputCount: inputs.length,
    });
  });
  // Password fields outside forms (JS-submitted logins)
  const loosePassword = $('input[type="password" i]').filter((_, el) => $(el).closest("form").length === 0).length > 0;

  // External resources. Logos, icons and stylesheets are tracked separately:
  // copying those is what makes a clone look authentic, while scripts are
  // mostly widgets and SDKs (pixels, payment buttons) that legitimate sites embed.
  const resourceHosts = new Set<string>();
  const visualHosts = new Set<string>();
  $("img[src], link[href], script[src], iframe[src], source[src], video[src], audio[src], form[action]").each((_, el) => {
    const v = $(el).attr("src") ?? $(el).attr("href") ?? $(el).attr("action");
    const u = abs(v, base);
    if (!u || (u.protocol !== "http:" && u.protocol !== "https:") || siteKey(u.hostname) === own) return;
    resourceHosts.add(u.hostname);
    const tag = (el as { tagName?: string }).tagName?.toLowerCase();
    const rel = ($(el).attr("rel") ?? "").toLowerCase();
    // Tracking pixels and informers (facebook.com/tr, mc.yandex.ru) are images too,
    // so only logo-like images count.
    if ((tag === "img" && /logo|brand|sprite|favicon/i.test(u.pathname)) || (tag === "link" && /stylesheet|icon/.test(rel))) visualHosts.add(u.hostname);
  });
  data.externalDomains = [...resourceHosts].slice(0, 60);
  const iconHref = $('link[rel~="icon" i], link[rel="shortcut icon" i]').first().attr("href");
  data.favicon = abs(iconHref, base)?.toString() ?? null;

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  data.textLength = bodyText.length;

  // ── Findings ───────────────────────────────────────────────────────────────
  findings.push(makeFinding("content", { code: "CONTENT_METADATA", title: "Page metadata", status: "INFO", result: data.title ? `“${data.title}”` : "No page title", explanation: "Title and description as published by the page.", evidence: { title: data.title, description: data.metaDescription, siteName: data.siteName, generator: data.generator, language: data.language }, source }));

  // Brand presentation vs domain
  // Hosting providers that replaced the site with an abuse warning. Cloudflare
  // only shows its "Suspected Phishing" interstitial after reviewing reports.
  const cloudflarePhishing = /suspected phishing/i.test(data.title ?? "") && /reported for potential phishing/i.test(bodyText) && /cloudflare/i.test(bodyText);
  const takedown = cloudflarePhishing ? null : /\b(?:suspended|disabled|blocked|removed|taken down)\b[^.]{0,80}\b(phishing|fraud|malware|abuse|violat\w* (?:of )?(?:our|the) terms)/i.exec(bodyText.slice(0, 4000));
  if (cloudflarePhishing) {
    findings.push(makeFinding("content", { code: "CONTENT_PROVIDER_WARNING", title: "Provider phishing warning", status: "FAIL", severity: "CRITICAL", weight: 85, result: "Cloudflare has flagged this site as phishing", explanation: "Instead of the website, its network provider Cloudflare serves a \"Suspected Phishing\" warning page. Cloudflare shows this after phishing reports about the site. Do not click \"Ignore & Proceed\".", evidence: { title: data.title, status: response.status }, source }));
  } else if (takedown) {
    findings.push(makeFinding("content", { code: "CONTENT_PROVIDER_WARNING", title: "Provider abuse notice", status: "FAIL", severity: "HIGH", weight: 35, result: `Hosting provider notice: ${truncate(takedown[0], 120)}`, explanation: "The hosting provider has replaced this site with a suspension or abuse notice. Providers do this after reports of phishing, fraud or malware, so links to it should not be trusted even if the site comes back.", evidence: { excerpt: truncate(takedown[0], 200) }, source }));
  }

  // Store badges and social icons ("Get it on Google Play", "Telegram") name a
  // brand on almost every legitimate site, so image alt text only counts as a
  // claim next to a password field; title, site name and main heading always do.
  const BADGE_ALT = /play|store|download|get it|app ?gallery|follow|share|telegram|whatsapp|facebook|instagram|youtube|twitter|linkedin|tiktok|viber|\bvk\b/i;
  const anyPassword = data.forms.some((f) => f.hasPassword) || loosePassword;
  // Folding accents defeats look-alike spellings such as "KúCōiñ®".
  const fold = (t: string) => t.normalize("NFKD").replace(/\p{M}/gu, "");
  const headline = fold([data.title, data.siteName, $("h1").first().text()].filter(Boolean).join(" "));
  const headlineTokens = tokenize(headline);
  const altTokens = anyPassword ? tokenize($("img[alt]").slice(0, 10).map((_, i) => $(i).attr("alt") ?? "").get().filter((a) => !BADGE_ALT.test(a)).join(" ")) : [];
  const claimed = trusted ? [] : brandsMentionedInTokens([...headlineTokens, ...altTokens], settings).filter((b) => !isOfficialFor(host, b));
  const hotlinked = claimed.length
    ? [...resourceHosts].filter((h) => claimed.some((b) => b.domains.some((d) => hostMatchesDomain(h, d))))
    : settings.brandDomains.filter((b) => !isOfficialFor(host, b)).flatMap((b) => [...visualHosts].filter((h) => b.domains.some((d) => hostMatchesDomain(h, d)) && !/google|gstatic|microsoft|apple|amazonaws|youtube|twimg|fbcdn|licdn|cdninstagram|tiktokcdn|rbxcdn|steamstatic|yandex/.test(h)));

  if (claimed.length && anyPassword) {
    const b = claimed[0];
    findings.push(makeFinding("content", { code: "CONTENT_CREDENTIAL_PHISH", title: "Credential harvesting page", status: "FAIL", severity: hotlinked.length ? "CRITICAL" : "HIGH", weight: hotlinked.length ? 60 : 45, result: `Asks for a password while presenting itself as ${b.brand}`, explanation: `The page title or branding says ${b.brand}, it contains a password field, and it is not hosted on any of ${b.brand}'s domains (${b.domains.slice(0, 3).join(", ")}). This is the defining pattern of a credential-phishing page. Do not enter credentials.`, evidence: { brand: b.brand, title: data.title, hotlinkedFrom: hotlinked.slice(0, 5) }, source }));
  } else if (claimed.length) {
    const b = claimed[0];
    const titleTokens = tokenize(fold(data.title ?? ""));
    const kws = b.keywords.map((k) => k.replace(/[^a-z0-9]/gi, "").toLowerCase());
    // "AMAZON", "Santander Web", "ROBLOX": the page names itself after the brand.
    const leadsWithBrand = titleTokens.length > 0 && titleTokens.length <= 6 && kws.includes(titleTokens[0]);
    const loginLure = /log ?in|sign ?in|log ?on|verif|account|wallet|password|unlock|suspend|connexion|anmelden|iniciar|entrar|вход|войти|kirish/i.test(headline);
    // Big brands never run their sign-in pages on free hosting platforms.
    const onPlatform = !!userContentPlatform(host, FREE_HOSTING_SUFFIXES);
    const weight = onPlatform ? (loginLure ? 45 : 35) : loginLure || leadsWithBrand ? 30 : 18;
    findings.push(makeFinding("content", {
      code: "CONTENT_BRAND_CLAIM",
      title: "Title / domain mismatch",
      status: "WARN",
      severity: weight >= 30 ? "HIGH" : "MEDIUM",
      weight,
      result: loginLure ? `${b.brand}-branded sign-in page on a foreign domain` : `Page presents itself as ${b.brand}`,
      explanation: onPlatform
        ? `The page is branded as ${b.brand} but published on a free hosting platform (${host}). ${b.brand} does not run its pages there; this is how phishing kits are usually deployed.`
        : loginLure
          ? `The page presents itself as a ${b.brand} sign-in or account page, but it is not on ${b.brand}'s official domains (${b.domains.slice(0, 3).join(", ")}). Sign-in forms may be loaded by script, so the absence of a visible password field does not make it safe.`
          : `The title or branding mentions ${b.brand}, but the site is not on ${b.brand}'s official domains. This can be a reseller or news page, or an impersonation.`,
      evidence: { brand: b.brand, title: data.title, siteName: data.siteName, onPlatform, loginLure },
      source,
    }));
  } else {
    findings.push(makeFinding("content", { code: "CONTENT_BRAND_CLAIM", title: "Title / domain mismatch", status: "PASS", result: trusted ? "Trusted/official domain" : "No brand mismatch", explanation: "The page does not claim to be a known brand hosted elsewhere.", source }));
  }

  if (hotlinked.length) {
    findings.push(makeFinding("content", { code: "CONTENT_HOTLINK", title: "Assets loaded from a brand's official site", status: "FAIL", severity: "HIGH", weight: 28, result: `Loads resources from ${hotlinked[0]}`, explanation: "The page pulls logos, styles or scripts straight from a well-known brand's servers while being hosted elsewhere. Cloned phishing pages do this to look authentic.", evidence: { hosts: hotlinked.slice(0, 8) }, source }));
  }

  // Login / payment forms
  const insecure = base.protocol === "http:";
  if (anyPassword && !claimed.length) {
    findings.push(makeFinding("content", { code: "CONTENT_LOGIN_FORM", title: "Login form", status: trusted ? "INFO" : insecure ? "FAIL" : "WARN", severity: trusted ? "NONE" : insecure ? "HIGH" : "LOW", weight: trusted ? 0 : insecure ? 30 : 8, result: insecure ? "Password field on an unencrypted page" : "Page asks for a password", explanation: insecure ? "The page collects a password over plain HTTP." : trusted ? "Login form on a trusted domain." : "The page contains a password field. Only sign in if you reached this site by typing its address yourself or from a bookmark.", source }));
  } else if (!anyPassword) {
    findings.push(makeFinding("content", { code: "CONTENT_LOGIN_FORM", title: "Login form", status: "PASS", result: "No password field", explanation: "The page does not ask for a password in its static HTML.", source }));
  }

  const externalPost = data.forms.filter((f) => f.actionHost?.includes(".") && siteKey(f.actionHost) !== own);
  const mailtoForm = data.forms.find((f) => f.actionHost === "mailto:");
  if (externalPost.length || mailtoForm) {
    const withPw = externalPost.some((f) => f.hasPassword || f.hasCard);
    findings.push(makeFinding("content", { code: "CONTENT_FORM_EXTERNAL", title: "Form submits to another site", status: withPw ? "FAIL" : "WARN", severity: withPw ? "HIGH" : "LOW", weight: withPw ? 32 : 8, result: mailtoForm ? "Form submits via e-mail (mailto:)" : `Data is sent to ${externalPost[0].actionHost}`, explanation: withPw ? "Credentials typed here are posted to a different domain than the one you are visiting, a hallmark of phishing kits." : "A form on the page sends its data to another domain. Common for newsletters and payment providers; verify before submitting.", evidence: { forms: [...externalPost, mailtoForm].filter(Boolean).slice(0, 5) }, source }));
  }
  if (data.forms.some((f) => f.hasCard) && !trusted) {
    findings.push(makeFinding("content", { code: "CONTENT_PAYMENT_FORM", title: "Payment card form", status: "WARN", severity: "MEDIUM", weight: 18, result: "Page asks for card details", explanation: "The page collects payment card data. Carriers and customs brokers do not request card payments for parcel release through e-mailed links.", source }));
  }

  // Script indicators
  const ind: { code: string; title: string; sev: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; w: number; result: string; explanation: string }[] = [];
  if (/api\.telegram\.org\/bot|telegram\.org\/bot\d+:/i.test(fullText)) {
    ind.push({ code: "CONTENT_TELEGRAM_EXFIL", title: "Data exfiltration to Telegram", sev: "CRITICAL", w: 65, result: "Telegram Bot API endpoint in page code", explanation: "The page code sends data to a Telegram bot. Phishing kits use this to deliver stolen credentials to the attacker in real time; legitimate login pages never do." });
  }
  if (/discord(app)?\.com\/api\/webhooks\//i.test(fullText)) {
    ind.push({ code: "CONTENT_WEBHOOK_EXFIL", title: "Data exfiltration to Discord", sev: "HIGH", w: 45, result: "Discord webhook in page code", explanation: "The page posts data to a Discord webhook, a common exfiltration channel for phishing kits." });
  }
  if (/script\.google\.com\/macros\/s\//i.test(fullText) && anyPassword) {
    ind.push({ code: "CONTENT_APPS_SCRIPT_EXFIL", title: "Credentials sent to Google Apps Script", sev: "HIGH", w: 35, result: "Login data posted to script.google.com", explanation: "Password fields combined with a Google Apps Script endpoint is a known way to collect stolen credentials in a spreadsheet." });
  }
  const obf: string[] = [];
  if (/\beval\s*\(/.test(scriptText)) obf.push("eval()");
  if (/new\s+Function\s*\(/.test(scriptText)) obf.push("new Function()");
  if (/\batob\s*\(\s*["'`][A-Za-z0-9+/=]{200,}/.test(scriptText)) obf.push("large base64 payload decoded with atob()");
  if (/unescape\s*\(\s*["'`]%[0-9a-f]{2}/i.test(scriptText)) obf.push("unescape() of percent-encoded code");
  if (/String\.fromCharCode\((\s*\d+\s*,){20,}/.test(scriptText)) obf.push("String.fromCharCode() char-code arrays");
  if (/document\.write\s*\(\s*(unescape|atob|decodeURIComponent)/.test(scriptText)) obf.push("document.write() of decoded markup");
  if (/(\\x[0-9a-f]{2}){40,}/i.test(scriptText)) obf.push("long hex-escaped strings");
  if (/_0x[0-9a-f]{4,6}\s*=|_0x[0-9a-f]{4,6}\(/i.test(scriptText)) obf.push("javascript-obfuscator identifiers (_0x…)");
  if (obf.length) {
    ind.push({ code: "CONTENT_OBFUSCATION", title: "Obfuscated JavaScript", sev: "MEDIUM", w: Math.min(22, 10 + obf.length * 4), result: obf.join(", "), explanation: "The page hides part of its code. Obfuscation is used to evade scanners; some legitimate sites minify aggressively, so this is weighed with other signals." });
  }
  const anti: string[] = [];
  if (/contextmenu[^;]{0,80}(preventDefault|return\s+false)|oncontextmenu\s*=\s*["']?return\s+false/i.test(fullText)) anti.push("right-click disabled");
  if (/keyCode\s*={2,3}\s*123|key\s*={2,3}\s*["']F12["']/i.test(scriptText)) anti.push("F12 / DevTools key blocked");
  if (/setInterval\([^)]{0,80}debugger|\bdebugger\s*;[^}]{0,40}\}\s*,\s*\d+/i.test(scriptText)) anti.push("debugger trap loop");
  if (/navigator\.webdriver|HeadlessChrome|phantom|selenium/i.test(scriptText)) anti.push("automation / scanner detection");
  if (anti.length) {
    ind.push({ code: "CONTENT_ANTI_ANALYSIS", title: "Anti-analysis tricks", sev: "MEDIUM", w: 12, result: anti.join(", "), explanation: "The page tries to stop inspection or to detect automated scanners, techniques typical of phishing kits that show harmless content to security tools." });
  }
  if (FINGERPRINT_APIS.test(fullText)) {
    ind.push({ code: "CONTENT_FINGERPRINT", title: "Visitor IP geolocation", sev: "LOW", w: 6, result: FINGERPRINT_APIS.exec(fullText)?.[1] ?? "geolocation API", explanation: "The page looks up the visitor's IP location. Phishing kits do this to log victims and to block visitors from security-vendor networks." });
  }
  if (/addEventListener\(\s*["']key(down|up|press)["']/.test(scriptText) && /(sendBeacon|XMLHttpRequest|fetch\s*\()/.test(scriptText) && anyPassword) {
    ind.push({ code: "CONTENT_KEYLOGGER", title: "Keystroke capture", sev: "MEDIUM", w: 15, result: "Key events captured on a login page and sent over the network", explanation: "Script captures keystrokes and has network code. On a credential page this can mean typed passwords are sent before you press submit." });
  }
  if (/coinhive|cryptonight|coin-hive|\bminer\.start\(|webminepool|crypto-loot/i.test(fullText)) {
    ind.push({ code: "CONTENT_MINER", title: "Cryptocurrency miner", sev: "HIGH", w: 35, result: "In-browser mining script", explanation: "The page loads a cryptocurrency miner that uses the visitor's CPU." });
  }
  if (/(saved from url=\(\d+\)|<!--\s*Mirrored from|HTTrack Website Copier)/i.test(fullText)) {
    ind.push({ code: "CONTENT_CLONE_MARKER", title: "Cloned page marker", sev: "HIGH", w: 30, result: "Page is a saved copy of another website", explanation: "The HTML still carries the marker a browser or HTTrack adds when a page is saved. Phishers clone real login pages this way." });
  }
  if (/(new\s+Blob\(|msSaveOrOpenBlob|createObjectURL)/.test(scriptText) && /[A-Za-z0-9+/]{5000,}={0,2}/.test(scriptText) && /\.download\s*=|download=/.test(fullText)) {
    ind.push({ code: "CONTENT_HTML_SMUGGLING", title: "HTML smuggling", sev: "HIGH", w: 40, result: "Page assembles a file from embedded data", explanation: "The page builds a file in the browser from a large embedded blob and triggers a download, a technique used to slip malware past e-mail and proxy filters." });
  }
  for (const i of ind) {
    findings.push(makeFinding("content", { code: i.code, title: i.title, status: "FAIL", severity: i.sev, weight: i.w, result: i.result, explanation: i.explanation, source }));
    data.indicators.push(i.title);
  }
  if (!ind.length) {
    findings.push(makeFinding("content", { code: "CONTENT_SCRIPTS", title: "Suspicious JavaScript patterns", status: "PASS", result: `${data.inlineScriptCount} inline / ${data.externalScripts.length} external scripts, no known-bad patterns`, explanation: "No exfiltration endpoints, obfuscation, anti-analysis or miner patterns were found in the page source.", source }));
  }

  // External script hosts
  // CDNs and cloud storage serve scripts for countless legitimate sites, so only raw
  // IPs, paste sites and tunnelling services are treated as suspicious script sources.
  const badScriptHosts = data.scriptHosts.filter((h) => net.isIP(h) || SUSPICIOUS_SCRIPT_HOSTS.some((s) => hostMatchesDomain(h, s)));
  if (badScriptHosts.length) {
    findings.push(makeFinding("content", { code: "CONTENT_SCRIPT_HOSTS", title: "External script sources", status: "WARN", severity: "MEDIUM", weight: 12, result: `Scripts from ${badScriptHosts.slice(0, 3).join(", ")}`, explanation: "The page loads code from raw IP addresses, paste sites or free hosting, which attackers use to swap in malicious code without touching the page.", evidence: { hosts: badScriptHosts }, source }));
  } else {
    findings.push(makeFinding("content", { code: "CONTENT_SCRIPT_HOSTS", title: "External script sources", status: data.scriptHosts.length ? "INFO" : "PASS", result: data.scriptHosts.length ? `${data.scriptHosts.length} external script host(s)` : "None", explanation: "Third-party script origins loaded by the page.", evidence: { hosts: data.scriptHosts.slice(0, 20) }, source }));
  }

  // Iframes
  const hiddenFrames = data.iframes.filter((f) => f.hidden && f.src && siteKey(new URL(f.src).hostname) !== own);
  const fullPageFrame = data.iframes.length === 1 && data.textLength < 200 && data.iframes[0].src && siteKey(new URL(data.iframes[0].src).hostname) !== own;
  if (hiddenFrames.length) {
    findings.push(makeFinding("content", { code: "CONTENT_IFRAMES", title: "Iframes", status: "WARN", severity: "MEDIUM", weight: 15, result: `Hidden iframe to ${new URL(hiddenFrames[0].src as string).hostname}`, explanation: "An invisible frame loads another site in the background, a technique used for drive-by downloads, click fraud and tracking.", evidence: { iframes: hiddenFrames.slice(0, 5) }, source }));
  } else if (fullPageFrame) {
    findings.push(makeFinding("content", { code: "CONTENT_IFRAMES", title: "Iframes", status: "WARN", severity: "MEDIUM", weight: 14, result: `Whole page is a frame of ${new URL(data.iframes[0].src as string).hostname}`, explanation: "The visible page is just a frame around another site, so the address bar shows a different domain than the content.", source }));
  } else {
    findings.push(makeFinding("content", { code: "CONTENT_IFRAMES", title: "Iframes", status: "PASS", result: `${data.iframes.length} iframe(s), none hidden`, explanation: "No hidden or full-page frames.", source }));
  }

  // Lure text
  const textSample = `${data.title ?? ""} ${bodyText.slice(0, 30_000)}`;
  const lures = LURE_PHRASES.filter(([re]) => re.test(textSample)).map(([, l]) => l);
  if (lures.length && !trusted) {
    findings.push(makeFinding("content", { code: "CONTENT_LURE_TEXT", title: "Social-engineering language", status: "WARN", severity: lures.length >= 3 ? "MEDIUM" : "LOW", weight: lures.length >= 3 ? 14 : 7, result: lures.join(", "), explanation: "The page uses urgency or account/delivery problem wording typical of phishing aimed at logistics staff.", evidence: { phrases: lures }, source }));
  }

  if (data.textLength < 80 && data.inlineScriptCount + data.externalScripts.length > 0 && !anyPassword) {
    findings.push(makeFinding("content", { code: "CONTENT_JS_RENDERED", title: "Script-rendered page", status: "INFO", result: "Little static content; page is built by JavaScript", explanation: "Most of the page is created by scripts at runtime. Scripts are deliberately not executed by the scanner, so content checks are limited for this page.", source }));
  }

  // Security headers (informational only)
  const missing = SECURITY_HEADERS.filter((h) => !securityHeaders[h]);
  findings.push(makeFinding("content", { code: "CONTENT_HEADERS", title: "HTTP security headers", status: missing.length <= 2 ? "PASS" : "INFO", result: missing.length ? `Missing: ${missing.join(", ")}` : "All common headers present", explanation: "Hardening headers protect visitors of a legitimate site. Their absence is not a sign of maliciousness and is not scored.", evidence: { headers: securityHeaders, server: data.server }, source }));

  if (response.truncated) {
    findings.push(makeFinding("content", { code: "CONTENT_TRUNCATED", title: "Analysis size limit", status: "INFO", result: `Only the first ${response.bytesRead.toLocaleString("en-US")} bytes were analyzed`, explanation: "The page is larger than the scanner's response limit.", source }));
  }

  return { data, findings, status: "ok" };
}
