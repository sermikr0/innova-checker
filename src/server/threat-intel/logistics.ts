import { domainParts, userContentPlatform } from "../scanner/util";
import { FREE_HOSTING_SUFFIXES } from "../scanner/data/defaults";

// Logistics-themed phishing classifier shared by the daily threat-intel
// collector and scripts/research/collect-logistics-threats.ts.

// ── Brand and lure dictionary ────────────────────────────────────────────────
// Substring keywords are distinctive enough to match inside a label. Short
// ones must stand alone or touch a lure word ("ups-track", "dpdparcel").
export type Rule = { brand: string; group: "postal" | "freight"; subs?: string[]; tokens?: string[] };
export const RULES: Rule[] = [
  { brand: "USPS", group: "postal", subs: ["usps", "uspost"] },
  { brand: "UPS", group: "postal", tokens: ["ups"] },
  { brand: "FedEx", group: "postal", subs: ["fedex", "fedx", "fed-ex"] },
  { brand: "DHL", group: "postal", tokens: ["dhl"] },
  { brand: "DPD", group: "postal", tokens: ["dpd"], subs: ["dpdgroup", "dpdparcel", "dpdlocal"] },
  { brand: "GLS", group: "postal", tokens: ["gls"], subs: ["gls-group", "glsgroup"] },
  { brand: "TNT", group: "postal", tokens: ["tnt"] },
  { brand: "Evri / Hermes", group: "postal", subs: ["myhermes", "hermesworld", "hermes-parcel"], tokens: ["evri"] },
  { brand: "Royal Mail", group: "postal", subs: ["royalmail", "royal-mail", "parcelforce"] },
  { brand: "InPost", group: "postal", subs: ["inpost"] },
  { brand: "Poczta Polska", group: "postal", subs: ["poczta", "pocztex"], tokens: ["envelo"] },
  { brand: "PostNL / bpost", group: "postal", subs: ["postnl"], tokens: ["bpost"] },
  { brand: "La Poste / Colissimo", group: "postal", subs: ["laposte", "la-poste", "colissimo", "chronopost"] },
  { brand: "Correos / CTT / Correios", group: "postal", subs: ["correos", "correios", "cttexpresso", "ctt-pt"], tokens: ["ctt"] },
  { brand: "Poste Italiane", group: "postal", subs: ["posteitaliane", "poste-italiane", "posteit"] },
  { brand: "Swiss Post / PostNord / Posti", group: "postal", subs: ["swisspost", "postnord", "posti-fi"], tokens: ["omniva"] },
  { brand: "An Post", group: "postal", tokens: ["anpost"] },
  { brand: "Canada Post / Purolator", group: "postal", subs: ["canadapost", "canpost", "postescanada", "purolator"], tokens: ["canpar"] },
  { brand: "Australia Post / NZ Post", group: "postal", subs: ["auspost", "australiapost", "nzpost"] },
  { brand: "Japan Post / Yamato / Sagawa", group: "postal", subs: ["japanpost", "jppost", "kuronekoyamato", "sagawa"], tokens: ["yamato"] },
  { brand: "Korea / China / Singapore Post", group: "postal", subs: ["koreapost", "epost-kr", "chinapost", "singpost"] },
  { brand: "Emirates / Qatar / Saudi / Oman Post", group: "postal", subs: ["emiratespost", "emirates-post", "qatarpost", "qpost", "saudipost", "splonline", "omanpost", "naqel", "smsaexpress"] },
  { brand: "Israel / Egypt / India Post", group: "postal", subs: ["israelpost", "israeipost", "egyptpost", "indiapost", "speedpost"] },
  { brand: "Aramex", group: "postal", subs: ["aramex"] },
  { brand: "Delhivery / Blue Dart / DTDC", group: "postal", subs: ["delhivery", "bluedart", "dtdc"] },
  { brand: "J&T / Ninja Van / Lalamove / Kerry / Flash", group: "postal", subs: ["jtexpress", "jnt-express", "ninjavan", "lalamove", "kerryexpress", "flashexpress"] },
  { brand: "CDEK / Boxberry / Russian Post", group: "postal", subs: ["cdek", "boxberry", "pochtarossii", "russianpost", "pochta-rf"] },
  { brand: "Nova Poshta / Ukrposhta / Meest", group: "postal", subs: ["novaposhta", "nova-poshta", "novapost", "ukrposhta"], tokens: ["meest"] },
  { brand: "Uzbekistan / Kazakhstan / Belarus Post", group: "postal", subs: ["uzpost", "pochta-uz", "kazpost", "belpost"] },
  { brand: "Packeta / PPL / Sameday / FAN Courier / Econt", group: "postal", subs: ["packeta", "zasilkovna", "fancourier", "fan-courier", "cargus"], tokens: ["sameday", "econt"] },
  { brand: "OnTrac / LaserShip / Estafeta", group: "postal", subs: ["lasership", "estafeta", "servientrega", "chilexpress"], tokens: ["ontrac"] },
  { brand: "Maersk", group: "freight", subs: ["maersk"] },
  { brand: "MSC", group: "freight", tokens: ["msc"] },
  { brand: "CMA CGM / Hapag-Lloyd / COSCO / ONE / ZIM", group: "freight", subs: ["cmacgm", "cma-cgm", "hapag", "yangming", "evergreen-line", "evergreenline"], tokens: ["cosco", "oocl"] },
  { brand: "DB Schenker / Kuehne+Nagel / DSV / Expeditors", group: "freight", subs: ["schenker", "kuehne", "expeditors"], tokens: ["dsv"] },
  { brand: "C.H. Robinson / Flexport / Freightos", group: "freight", subs: ["chrobinson", "flexport", "freightos", "cargowise"] },
  { brand: "Load boards (DAT / Truckstop / 123Loadboard / Timocom)", group: "freight", subs: ["truckstop", "loadboard", "datloadboard", "dat-one", "datone", "timocom", "transporeon"] },
  { brand: "Carrier onboarding (RMIS / MyCarrierPackets / Highway / Carrier Assure)", group: "freight", subs: ["rmissecure", "mycarrierpackets", "carrierpackets", "carrierassure", "highwaycarrier", "gohighway"], tokens: ["rmis"] },
  { brand: "Brokers & fleet (TQL / Uber Freight / J.B. Hunt / Landstar / Penske / Ryder)", group: "freight", subs: ["uberfreight", "jbhunt", "landstar", "penske", "echoglobal"], tokens: ["tql"] },
  { brand: "Freight payments (Comdata / EFS / Relay / TriumphPay / RTS)", group: "freight", subs: ["relaypayments", "triumphpay", "rtsfinancial", "wexfleet", "fleetone"], tokens: ["comdata"] },
  { brand: "FMCSA / DOT impersonation", group: "freight", subs: ["fmcsa", "safer-fmcsa"] },
  { brand: "Generic parcel / delivery lure", group: "postal", subs: ["parcel", "redeliver", "delivery", "deliveries", "shipment", "courier", "postage", "tracking-", "-tracking", "trackparcel", "trackmypackage", "packagetrack", "customsfee", "customs-fee"] },
  { brand: "Generic freight / cargo lure", group: "freight", subs: ["freight", "cargo", "logistic", "trucking", "carrier-setup", "broker-carrier"] },
];
// Affixes allowed around a short brand: lure words, country codes and the
// local words for parcel/delivery used in European smishing.
const LURE = [
  "pl", "polska", "de", "uk", "us", "usa", "eu", "fr", "it", "es", "nl", "be", "at", "ch", "cz", "ro", "bg", "gr", "hu", "lt", "lv", "ee", "se", "no", "dk", "fi", "ie", "ca", "au", "nz", "jp", "kr", "in", "ae", "sa", "uz", "kz", "ru", "ua", "tr", "my", "go", "get", "new", "now", "net", "web",
  "paket", "pakete", "paczka", "paczki", "dostawa", "kurier", "zustellung", "sendung", "envio", "envios", "livraison", "colis", "consegna", "spedizione", "entrega", "encomenda", "ondemand", "ecommerce","track", "tracking", "trace", "express", "exp", "delivery", "deliver", "redelivery", "parcel", "package", "pkg", "post", "postal", "ship", "shipping", "shipment", "cargo", "freight", "logistic", "logistics", "courier", "customs", "fee", "pay", "payment", "support", "service", "services", "notice", "info", "help", "center", "care", "update", "verify", "schedule", "sms", "global", "world", "online", "app", "portal", "login", "secure", "id", "status", "home", "box", "mail", "group", "load", "loads", "board", "carrier", "broker", "invoice"];

// Tokens keep digits so random strings (IPFS hashes, "h57dhl7w4") never
// yield a brand; digits are only trimmed from the ends ("dostawadhl29015").
function affixOk(rest: string): boolean {
  return rest === "" || LURE.includes(rest) || LURE.some((l) => l.length >= 4 && (rest.startsWith(l) || rest.endsWith(l)));
}

export function matchLogistics(host: string): { rule: Rule; inRegistrable: boolean } | null {
  const parts = domainParts(host);
  const ps = parts.publicSuffix ?? "";
  const labels = host.split(".");
  const meaningful = labels.slice(0, Math.max(1, labels.length - ps.split(".").length));
  const regLabel = meaningful[meaningful.length - 1] ?? "";
  const test = (text: string) => {
    const tokens = text.split(/[^a-z0-9]+/).map((t) => t.replace(/^\d+|\d+$/g, "")).filter(Boolean);
    for (const r of RULES) {
      if (r.subs?.some((sub) => text.includes(sub))) return r;
      if (r.tokens?.some((t) => tokens.some((tok) => tok === t || (tok.startsWith(t) && affixOk(tok.slice(t.length))) || (tok.endsWith(t) && affixOk(tok.slice(0, tok.length - t.length)))))) return r;
    }
    return null;
  };
  const inReg = test(regLabel);
  if (inReg) return { rule: inReg, inRegistrable: true };
  const inSub = test(meaningful.join("."));
  return inSub ? { rule: inSub, inRegistrable: false } : null;
}

// Shared hosting and edge platforms that are not on the Public Suffix List.
export const EXTRA_PLATFORMS = ["edgeone.dev", "edgeone.cool", "edgeone.app", "mdbgo.io", "inbrowser.link", "lobster-cloud.com", "cpanel.site", "lovable.app", "s3.amazonaws.com", "amazonaws.com"];
export const THROWAWAY_TLDS = new Set(["top", "xin", "cyou", "shop", "sbs", "icu", "vip", "cfd", "bond", "buzz", "click", "online", "site", "store", "live", "lat", "pics", "info", "cc", "win", "bid", "life", "xyz", "work", "rest", "mom", "lol", "fun", "space", "tech", "pro"]);


/** TLDs used almost only for throw-away scam domains (stricter than THROWAWAY_TLDS). */
export const SCAM_TLDS = new Set(["top", "xin", "cyou", "sbs", "icu", "vip", "cfd", "bond", "buzz", "click", "lat", "pics", "win", "bid", "xyz", "work", "rest", "mom", "lol", "cc", "today", "autos", "boats", "hair", "beauty", "skin", "makeup", "yachts", "monster", "quest", "zone", "su"]);

/** Generic delivery words are only trusted on throw-away infrastructure ("com-" prefix, scam TLDs). */
export function genericLureLooksMalicious(host: string): boolean {
  const p = domainParts(host);
  return (p.registrable ?? "").startsWith("com-") || SCAM_TLDS.has(p.tld ?? "");
}

/** Brand rules that name a real company; the generic lure rules are excluded. */
export const isBrandRule = (r: Rule) => !r.brand.startsWith("Generic");

// Hosts that serve many unrelated users' content under paths rather than
// subdomains. Only exact URLs on them can ever be listed.
export const SHARED_HOSTS = new Set([
  "storage.googleapis.com", "firebasestorage.googleapis.com", "s3.amazonaws.com", "docs.google.com", "drive.google.com", "sites.google.com", "forms.gle",
  "dropbox.com", "www.dropbox.com", "dl.dropboxusercontent.com", "onedrive.live.com", "1drv.ms", "github.com", "raw.githubusercontent.com", "gist.github.com",
  "gitlab.com", "bitbucket.org", "linktr.ee", "t.me", "telegra.ph", "ipfs.io", "dweb.link", "cloudflare-ipfs.com", "cdn.discordapp.com", "archive.org",
  "pastebin.com", "canva.com", "www.canva.com", "forms.office.com", "form.jotform.com", "docs.zoho.com", "notion.so", "www.notion.so", "bit.ly", "tinyurl.com",
]);

export type Listing = { domain: string; scope: "DOMAIN" | "HOST" | "URL" };

/**
 * Decides what to list for a malicious host (and, for URL feeds, its URL):
 * the registrable domain when the attacker evidently owns it, the host when it
 * sits on a hosting platform or an ordinary-looking (possibly compromised)
 * domain, or only the exact URL on shared, path-based services.
 */
export function listingFor(host: string, opts: { url?: string; brandInRegistrable?: boolean; isOfficial: (h: string) => boolean }): Listing | null {
  const h = host.replace(/^www\./, "");
  const pathDeep = !!opts.url && (() => {
    try {
      const u = new URL(opts.url);
      return (u.pathname.length > 1 || !!u.search) && u.pathname !== "/index.html";
    } catch {
      return false;
    }
  })();
  if (SHARED_HOSTS.has(host) || opts.isOfficial(host)) return opts.url ? { domain: opts.url, scope: "URL" } : null;
  const parts = domainParts(h);
  if (!parts.registrable) return null;
  const platform = userContentPlatform(h, [...FREE_HOSTING_SUFFIXES, ...EXTRA_PLATFORMS]);
  const onPrivateSuffix = !!parts.tenant && parts.tenant !== parts.registrable;
  if (platform || onPrivateSuffix) {
    if (EXTRA_PLATFORMS.includes(h)) return opts.url ? { domain: opts.url, scope: "URL" } : null;
    return { domain: parts.tenant && !platform ? parts.tenant : h, scope: "HOST" };
  }
  const regLabel = parts.registrable.split(".")[0] ?? "";
  if (opts.brandInRegistrable || regLabel.startsWith("com-") || THROWAWAY_TLDS.has(parts.tld ?? "")) return { domain: parts.registrable, scope: "DOMAIN" };
  // An ordinary domain with a deep phishing path is most likely compromised:
  // list only the exact URL.
  if (pathDeep && opts.url) return { domain: opts.url, scope: "URL" };
  return h === parts.registrable ? { domain: h, scope: "DOMAIN" } : { domain: h, scope: "HOST" };
}
