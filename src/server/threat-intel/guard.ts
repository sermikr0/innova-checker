import { readFileSync, existsSync } from "node:fs";
import { domainParts, userContentPlatform } from "../scanner/util";
import { FREE_HOSTING_SUFFIXES } from "../scanner/data/defaults";
import { EXTRA_PLATFORMS, SCAM_TLDS, type Listing } from "./logistics";

// False-positive guard for imported threat data. Public feeds sometimes list a
// popular site (a Google country domain, a news site, a university) because one
// page on it was abused. Blocking the whole host would show a trusted site as
// "100% scam", so popular sites are protected:
//
//   - a popular site itself, its www host, and shared-service hosts on it
//     (maps., mail., s., url., ...) are never listed — only exact URLs are;
//   - government, education and military domains are never listed;
//   - a subdomain of a popular registrable is kept only when the platform
//     visibly hands out subdomains to its users (at least three different
//     malicious hosts under it), i.e. it is an attacker's own tenant site.
//
// Popularity comes from the Tranco and Cisco Umbrella top-sites lists
// (prisma/data/popular-domains.txt, refreshed by scripts/research/update-popular-domains.ts).

export const POPULAR_LIMIT = 200_000;

const SHARED_LABELS = new Set([
  "www", "m", "mobile", "mail", "webmail", "email", "e", "app", "apps", "api", "cdn", "static", "img", "images", "assets", "media",
  "maps", "docs", "drive", "sites", "accounts", "account", "login", "auth", "signin", "sso", "id", "support", "help", "blog", "blogs", "news",
  "shop", "store", "go", "link", "links", "l", "t", "s", "r", "u", "url", "click", "clicks", "track", "tracking", "redirect", "out", "info",
  "portal", "my", "secure", "admin", "files", "file", "download", "downloads", "share", "forms", "form", "survey", "surveys", "community",
  "forum", "forums", "wiki", "events", "careers", "jobs", "intranet", "web", "home", "ad", "ads", "pay", "payment", "payments", "status",
]);

const GOV_EDU = /(^|\.)(gov|gob|gouv|govt|gv|mil|edu|ac|go|sch|school|k12|mod|police|judiciary|parliament|nic)\.[a-z]{2,3}$|\.(gov|edu|mil|int)$/;

// Families of trusted brands whose country domains rank unevenly (google.rs,
// google.no...). Protected regardless of rank.
const TRUSTED_FAMILIES = /^(google|youtube|blogger|android|gmail|amazon|microsoft|live|outlook|office|bing|apple|icloud|facebook|instagram|whatsapp|meta|yandex|yahoo|wikipedia|wikimedia|telegram|linkedin|paypal|ebay|netflix|samsung|mail|ok|vk)\.(com?\.)?[a-z]{2,3}$/;

// Hosting, site-builder, dynamic-DNS and e-mail tracking services that give every
// customer their own subdomain but are not on the Public Suffix List.
const TENANT_PLATFORMS = [
  "mybluehost.me", "mybluehostin.me", "misitiohostgator.com", "meusitehostgator.com.br", "mybigcommerce.com", "joomla.com", "lovestoblog.com",
  "zzz.com.ua", "conohawing.com", "usrfiles.com", "filesusr.com", "nxcli.net", "nxcli.io", "contaboserver.net", "ct.ws", "zyns.com", "serveusers.com",
  "linkpc.net", "softether.net", "arweave.net", "drv.tw", "2waky.com", "run.place", "cloudflareaccess.com", "larksuite.com", "idaptive.app",
  "workspaceoneaccess.com", "commercesuite.com.br", "mitiendanube.com", "uscreen.io", "convertri.com", "mschosting.com", "ezua.com", "airbridge.io",
  "acquia-sites.com", "fortimailcloud.com", "maillist-manage.eu", "maillist-manage.com", "mj.am", "sendibm3.com", "myportfolio.com", "teachable.com",
  "b-cdn.net", "tw1.ru", "myqcloud.com", "activehosted.com", "aliyuncs.com", "cloudwaysapps.com", "jimdofree.com", "wpengine.com", "kinsta.cloud",
  "appdomain.cloud", "myftpupload.com", "hostingersite.com", "tmweb.ru", "home.pl", "nazwa.pl", "onelink.me", "page.link", "app.link", "imgix.net",
  "typeform.com", "wufoo.com", "sibforms.com", "list-manage.com", "sendgrid.net", "rs6.net", "awstrack.me", "mjt.lu", "hsforms.com", "zendesk.com",
  "screenconnect.com", "huaweicloud.com", "sfmc-marketing.com", "tripod.com", "webwave.dev", "boxmode.io", "w3spaces.com", "ukit.me", "selcdn.ru",
  "weeblysite.com", "craftum.io", "elasticemail.com", "teemill.com", "myclickfunnels.com", "vh.net.pl", "sitebeat.crazydomains.com", "ghost.io",
  "duckdns.org", "ddns.net", "no-ip.org", "hopto.org", "zapto.org", "dynu.net", "freeddns.org", "dns.army", "linkpc.net", "webstarterz.com",
];
const BLOGSPOT = /^blogspot\.(com?\.)?[a-z]{2,3}$/;

let popular: Map<string, number> | null = null;

export function loadPopular(file = `${process.cwd()}/prisma/data/popular-domains.txt`): Map<string, number> {
  if (popular) return popular;
  popular = new Map();
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const [rank, domain] = line.split(",");
      if (domain) popular.set(domain.trim(), Number(rank));
    }
  }
  return popular;
}

export function popularityRank(registrable: string): number {
  if (TRUSTED_FAMILIES.test(registrable)) return 1;
  const rank = loadPopular().get(registrable) ?? 0;
  // DNS-popularity lists also rank busy malware and adware domains; on scam
  // TLDs only a very high rank is taken as a sign of a real site.
  if (rank > 10_000 && SCAM_TLDS.has(registrable.split(".").pop() ?? "")) return 0;
  return rank;
}

export type GuardVerdict = { action: "keep" } | { action: "drop"; reason: string };

/**
 * Decides whether a non-URL listing may be stored. `tenantHosts` is the number
 * of distinct listed hosts under the same registrable (evidence that the
 * registrable is a platform handing out subdomains).
 */
export function guardListing(listing: Listing, tenantHosts: number): GuardVerdict {
  if (listing.scope === "URL") {
    try {
      const u = new URL(listing.domain);
      const reg = domainParts(u.hostname).registrable ?? u.hostname;
      const rank = popularityRank(reg);
      if (rank > 0 && rank <= POPULAR_LIMIT && (u.pathname === "/" || u.pathname === "") && !u.search) return { action: "drop", reason: "home page of a popular site" };
    } catch {
      return { action: "drop", reason: "invalid URL" };
    }
    return { action: "keep" };
  }
  const host = listing.domain;
  const parts = domainParts(host);
  const reg = parts.registrable ?? host;
  // Hosts under a hosting platform or a Public Suffix List private suffix
  // (*.pages.dev, *.blogspot.com) belong to that platform's users.
  const tenantPlatform =
    !!userContentPlatform(host, [...FREE_HOSTING_SUFFIXES, ...EXTRA_PLATFORMS, ...TENANT_PLATFORMS]) ||
    (!!parts.tenant && parts.tenant !== parts.registrable) ||
    (BLOGSPOT.test(reg) && host !== reg);
  if (GOV_EDU.test(reg) && !tenantPlatform) return { action: "drop", reason: "government / education domain" };
  const rank = popularityRank(reg);
  if (rank === 0 || rank > POPULAR_LIMIT) return { action: "keep" };
  if (host === reg || host === `www.${reg}`) return { action: "drop", reason: `popular site (rank ${rank})` };
  // "maps.google.rs", "s.przelewy24.pl": a service name directly under the site.
  // Deeper names ("signin.x.y.mybluehost.me") are chosen by whoever owns them.
  const sub = host.slice(0, host.length - reg.length - 1);
  if (!sub.includes(".") && SHARED_LABELS.has(sub)) return { action: "drop", reason: `shared service host on a popular site (rank ${rank})` };
  if (tenantPlatform) return { action: "keep" };
  if (tenantHosts >= 3) return { action: "keep" };
  return { action: "drop", reason: `isolated host on a popular site (rank ${rank}), most likely a compromised legitimate page` };
}

// ── Brand-owned domains ───────────────────────────────────────────────────────
// Carriers own many country and service domains (dhlparcel.se, dhl-parcel.pt)
// that are not on any popularity list. A candidate that looks like such a
// domain is checked against its TLS certificate: an organisation-validated
// certificate issued to the carrier proves ownership.

const BRAND_TOKENS =
  "dhl|dpd|gls|ups|usps|fedex|tnt|inpost|poczta|pocztex|envelo|evri|hermes|royalmail|parcelforce|postnl|bpost|laposte|colissimo|chronopost|correos|ctt|posteitaliane|swisspost|postnord|anpost|canadapost|purolator|auspost|nzpost|japanpost|yamato|sagawa|aramex|smsa|naqel|cdek|boxberry|novaposhta|ukrposhta|meest|uzpost|kazpost|belpost|packeta|zasilkovna|ppl|sameday|fancourier|cargus|econt|maersk|msc|cmacgm|hapag|cosco|oocl|schenker|kuehne|dsv|chrobinson|flexport|timocom|penske|ryder|landstar|jbhunt";
const SERVICE_WORDS = "express|ecommerce|parcel|paket|group|global|freight|logistics|supplychain|post|delivery|24";
const OFFICIAL_LOOKING = new RegExp(`^(?:${BRAND_TOKENS})(?:-?(?:${SERVICE_WORDS}|[a-z]{2}))?\\.(?:com|net|org|eu|[a-z]{2}|co\\.[a-z]{2}|com\\.[a-z]{2})$`);
const LEGAL_ENTITIES =
  /deutsche post|\bdhl\b|fedex|federal express|united parcel service|united states postal service|royal mail|postnl|\bbpost\b|la poste|correos|\bctt\b|poste italiane|swiss post|schweizerische post|postnord|an post|canada post|postes canada|australia(n)? post|japan post|yamato|sagawa|aramex|inpost|poczta polska|\bdpd\b|geopost|general logistics systems|\bgls\b|evri|hermes|maersk|m.ller|mediterranean shipping|cma cgm|hapag|cosco|kuehne|schenker|\bdsv\b|robinson|flexport|ppl cz|o.zbekiston pochtasi|uzbekistan post/i;

export function officialLooking(registrable: string): boolean {
  return OFFICIAL_LOOKING.test(registrable);
}

/** True when the host's TLS certificate is issued to a known carrier. */
export async function ownedByBrand(host: string, timeoutMs = 6000): Promise<{ owned: boolean; organisation: string | null }> {
  const tls = await import("node:tls");
  const { guardedLookup } = await import("../scanner/net/safe-http");
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, lookup: guardedLookup as never, ALPNProtocols: ["http/1.1"] });
    const done = (r: { owned: boolean; organisation: string | null }) => {
      socket.destroy();
      resolve(r);
    };
    socket.setTimeout(timeoutMs, () => done({ owned: false, organisation: null }));
    socket.once("error", () => done({ owned: false, organisation: null }));
    socket.once("secureConnect", () => {
      const subject = socket.getPeerCertificate()?.subject as { O?: string | string[] } | undefined;
      const org = Array.isArray(subject?.O) ? subject.O.join(", ") : (subject?.O ?? null);
      done({ owned: !!org && LEGAL_ENTITIES.test(org) && socket.authorized, organisation: org });
    });
  });
}
