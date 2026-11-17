import type { BrandProfile, ModuleKey, ProviderId, ScannerSettings } from "../types";

// Default scanner configuration. Seeded into ScannerConfiguration; the database copy
// is the source of truth afterwards and can be edited in /admin/scanner.

export const DEFAULT_BRANDS: BrandProfile[] = [
  // Logistics, shipping and freight
  { brand: "DHL", keywords: ["dhl"], domains: ["dhl.com", "dhl.de", "dhl.uz", "dhlparcel.nl", "dhl.co.uk", "dpdhl.com", "dhlecommerce.com"] },
  { brand: "FedEx", keywords: ["fedex"], domains: ["fedex.com", "fedex.co.uk", "fedex.uz"] },
  { brand: "UPS", keywords: ["ups"], domains: ["ups.com", "ups-scs.com"] },
  { brand: "USPS", keywords: ["usps"], domains: ["usps.com", "usps.gov"] },
  { brand: "Maersk", keywords: ["maersk"], domains: ["maersk.com", "maerskline.com", "sealand.com"] },
  { brand: "MSC", keywords: ["msc"], domains: ["msc.com", "mscgva.ch"] },
  { brand: "CMA CGM", keywords: ["cmacgm", "cma-cgm"], domains: ["cma-cgm.com", "cmacgm-group.com"] },
  { brand: "Hapag-Lloyd", keywords: ["hapag", "hapaglloyd", "hapag-lloyd"], domains: ["hapag-lloyd.com"] },
  { brand: "COSCO", keywords: ["cosco", "coscon"], domains: ["cosco.com", "coscoshipping.com", "lines.coscoshipping.com"] },
  { brand: "Evergreen", keywords: ["evergreen-line", "evergreenline"], domains: ["evergreen-line.com"] },
  { brand: "DB Schenker", keywords: ["schenker", "dbschenker"], domains: ["dbschenker.com"] },
  { brand: "Kuehne+Nagel", keywords: ["kuehne", "kuehnenagel", "kuehne-nagel"], domains: ["kuehne-nagel.com"] },
  { brand: "DSV", keywords: ["dsv"], domains: ["dsv.com"] },
  { brand: "TNT", keywords: ["tnt"], domains: ["tnt.com"] },
  { brand: "Aramex", keywords: ["aramex"], domains: ["aramex.com"] },
  { brand: "C.H. Robinson", keywords: ["chrobinson", "navisphere"], domains: ["chrobinson.com", "navisphere.com"] },
  { brand: "Flexport", keywords: ["flexport"], domains: ["flexport.com"] },
  { brand: "DAT", keywords: ["dat"], domains: ["dat.com"] },
  { brand: "Truckstop", keywords: ["truckstop"], domains: ["truckstop.com"] },
  { brand: "FMCSA", keywords: ["fmcsa", "usdot"], domains: ["fmcsa.dot.gov", "dot.gov", "transportation.gov"] },
  { brand: "Login.gov", keywords: ["logingov"], domains: ["login.gov"] },
  // US trucking platforms commonly impersonated in carrier/dispatcher phishing
  { brand: "Highway", keywords: ["highway"], domains: ["highway.com"] },
  { brand: "123Loadboard", keywords: ["123loadboard", "loadboard123"], domains: ["123loadboard.com"] },
  { brand: "RMIS", keywords: ["rmis", "rmissecure"], domains: ["rmissecure.com", "registrymonitoring.com"] },
  { brand: "MyCarrierPackets", keywords: ["mycarrierpackets", "carrierpackets"], domains: ["mycarrierpackets.com"] },
  { brand: "Carrier Assure", keywords: ["carrierassure"], domains: ["carrierassure.com"] },
  { brand: "TQL", keywords: ["tql"], domains: ["tql.com"] },
  { brand: "Uber Freight", keywords: ["uberfreight"], domains: ["uberfreight.com"] },
  { brand: "J.B. Hunt", keywords: ["jbhunt"], domains: ["jbhunt.com"] },
  { brand: "Landstar", keywords: ["landstar"], domains: ["landstar.com"] },
  { brand: "Comdata", keywords: ["comdata"], domains: ["comdata.com"] },
  { brand: "EFS", keywords: ["efsllc", "efsfleet"], domains: ["efsllc.com"] },
  { brand: "Relay Payments", keywords: ["relaypayments"], domains: ["relaypayments.com"] },
  { brand: "TriumphPay", keywords: ["triumphpay"], domains: ["triumphpay.com"] },
  { brand: "RTS Financial", keywords: ["rtsfinancial"], domains: ["rtsfinancial.com"] },
  { brand: "Motive", keywords: ["gomotive", "keeptruckin"], domains: ["gomotive.com", "keeptruckin.com"] },
  { brand: "Uzbekistan Post", keywords: ["uzpost", "pochtauz"], domains: ["pochta.uz"] },
  { brand: "Uzbekistan Railways", keywords: ["uzrailway", "temiryol"], domains: ["railway.uz"] },
  { brand: "Innova Networks", keywords: ["innovanetworks"], domains: ["innovanetworks.uz"] },
  // Commonly impersonated platforms in logistics phishing
  { brand: "Microsoft", keywords: ["microsoft", "office365", "outlook", "onedrive", "sharepoint", "msonline"], domains: ["microsoft.com", "office.com", "office365.com", "outlook.com", "live.com", "microsoftonline.com", "msauth.net", "azure.com"] },
  { brand: "Google", keywords: ["google", "gmail"], domains: ["google.com", "gmail.com", "google.uz", "youtube.com", "gstatic.com"] },
  { brand: "Apple", keywords: ["apple", "icloud"], domains: ["apple.com", "icloud.com"] },
  { brand: "PayPal", keywords: ["paypal"], domains: ["paypal.com", "paypal.me"] },
  { brand: "DocuSign", keywords: ["docusign"], domains: ["docusign.com", "docusign.net"] },
  { brand: "Dropbox", keywords: ["dropbox"], domains: ["dropbox.com"] },
  { brand: "WeTransfer", keywords: ["wetransfer"], domains: ["wetransfer.com", "we.tl"] },
  { brand: "Adobe", keywords: ["adobe"], domains: ["adobe.com", "acrobat.com"] },
  { brand: "Amazon", keywords: ["amazon"], domains: ["amazon.com", "amazon.de", "amazon.co.uk", "amazon.fr", "amazon.it", "amazon.es", "amazon.nl", "amazon.se", "amazon.pl", "amazon.com.be", "amazon.com.tr", "amazon.ae", "amazon.sa", "amazon.eg", "amazon.in", "amazon.co.jp", "amazon.ca", "amazon.com.mx", "amazon.com.br", "amazon.com.au", "amazon.sg"] },
  { brand: "Telegram", keywords: ["telegram"], domains: ["telegram.org", "t.me", "telegram.me"] },
  { brand: "WhatsApp", keywords: ["whatsapp"], domains: ["whatsapp.com", "whatsapp.net", "wa.me"] },
  { brand: "Payme", keywords: ["payme"], domains: ["payme.uz", "paycom.uz"] },
  { brand: "Click", keywords: ["clickuz"], domains: ["click.uz"] },
  // Consumer brands most often cloned by phishing kits worldwide, plus banks and
  // marketplaces targeted in Central Asia. Generic words ("ledger", "booking",
  // "chase", "steam") are deliberately not used as keywords.
  { brand: "Facebook", keywords: ["facebook"], domains: ["facebook.com", "fb.com", "fb.me", "facebook.net", "fbcdn.net", "meta.com", "messenger.com"] },
  { brand: "Instagram", keywords: ["instagram"], domains: ["instagram.com", "cdninstagram.com"] },
  { brand: "Netflix", keywords: ["netflix"], domains: ["netflix.com", "nflxext.com", "nflximg.net", "nflxso.net"] },
  { brand: "TikTok", keywords: ["tiktok"], domains: ["tiktok.com", "tiktokv.com", "tiktokcdn.com", "tiktokglobalshop.com"] },
  { brand: "LinkedIn", keywords: ["linkedin"], domains: ["linkedin.com", "licdn.com", "lnkd.in"] },
  { brand: "X (Twitter)", keywords: ["twitter"], domains: ["twitter.com", "x.com", "twimg.com", "t.co"] },
  { brand: "Discord", keywords: ["discord"], domains: ["discord.com", "discord.gg", "discordapp.com", "discordapp.net"] },
  { brand: "Roblox", keywords: ["roblox"], domains: ["roblox.com", "rbxcdn.com"] },
  { brand: "Steam", keywords: ["steampowered", "steamcommunity"], domains: ["steampowered.com", "steamcommunity.com", "steamstatic.com"] },
  { brand: "Binance", keywords: ["binance"], domains: ["binance.com", "binance.us", "bnbstatic.com"] },
  { brand: "Coinbase", keywords: ["coinbase"], domains: ["coinbase.com"] },
  { brand: "KuCoin", keywords: ["kucoin"], domains: ["kucoin.com"] },
  { brand: "Bybit", keywords: ["bybit"], domains: ["bybit.com"] },
  { brand: "OKX", keywords: ["okx"], domains: ["okx.com"] },
  { brand: "MetaMask", keywords: ["metamask"], domains: ["metamask.io"] },
  { brand: "Trust Wallet", keywords: ["trustwallet"], domains: ["trustwallet.com"] },
  { brand: "Wells Fargo", keywords: ["wellsfargo"], domains: ["wellsfargo.com"] },
  { brand: "Bank of America", keywords: ["bankofamerica"], domains: ["bankofamerica.com", "bofa.com"] },
  { brand: "Santander", keywords: ["santander"], domains: ["santander.com", "santander.co.uk", "santander.es", "santander.pt", "santander.de", "santander.pl", "santander.com.br", "santander.com.mx", "santander.cl", "santander.com.ar", "santanderbank.com"] },
  { brand: "Kaspi", keywords: ["kaspi"], domains: ["kaspi.kz"] },
  { brand: "Uzcard", keywords: ["uzcard"], domains: ["uzcard.uz"] },
  { brand: "Sberbank", keywords: ["sberbank"], domains: ["sberbank.ru", "sber.ru", "sberbank.com"] },
  { brand: "T-Bank (Tinkoff)", keywords: ["tinkoff"], domains: ["tinkoff.ru", "tbank.ru"] },
  { brand: "Wildberries", keywords: ["wildberries"], domains: ["wildberries.ru", "wb.ru", "wildberries.by", "wildberries.kz", "wildberries.uz", "wildberries.kg", "wildberries.am", "wildberries.ge"] },
  { brand: "Ozon", keywords: ["ozon"], domains: ["ozon.ru", "ozon.kz", "ozon.by", "ozon.com"] },
  { brand: "Avito", keywords: ["avito"], domains: ["avito.ru"] },
  { brand: "Yandex", keywords: ["yandex"], domains: ["yandex.ru", "yandex.com", "yandex.kz", "yandex.uz", "yandex.by", "ya.ru", "yandex.net"] },
];

export const DEFAULT_SUSPICIOUS_KEYWORDS = [
  "login", "signin", "sign-in", "logon", "verify", "verification", "validate", "confirm",
  "account", "update", "secure", "security", "suspended", "unlock", "password", "credential",
  "banking", "billing", "invoice", "payment", "pay", "refund", "wallet", "auth", "authenticate",
  "webscr", "session", "recovery", "support", "helpdesk", "alert",
  // Logistics-specific lures
  "tracking", "track", "shipment", "parcel", "package", "delivery", "redelivery", "customs",
  "clearance", "waybill", "airwaybill", "awb", "bill-of-lading", "bol", "consignment",
  "freight", "rateconfirmation", "rate-con", "loadboard", "dispatch", "container", "cargo",
  "carrier", "onboarding", "onboard", "setup", "packet", "sign", "broker", "factoring", "fuelcard",
  "ratecon", "quickpay", "mcs150", "boc3", "renewal",
];

export const DEFAULT_SUSPICIOUS_TLDS = [
  "zip", "mov", "xyz", "top", "icu", "click", "rest", "cam", "quest", "cfd", "sbs", "lat",
  "bond", "buzz", "monster", "tk", "ml", "ga", "cf", "gq", "work", "support", "country",
  "kim", "loan", "men", "date", "racing", "review", "stream", "download", "xin", "mom",
  "lol", "beauty", "hair", "skin", "boats", "autos", "yachts", "makeup", "zone", "cyou",
  "shop", "online", "site", "website", "store", "vip", "live", "fun", "space", "club",
  "best", "surf", "fans",
];

export const DEFAULT_SHORTENERS = [
  "bit.ly", "bitly.com", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
  "cutt.ly", "rebrand.ly", "shorturl.at", "rb.gy", "tiny.cc", "s.id", "v.gd", "t.ly",
  "lnkd.in", "bl.ink", "short.io", "shorte.st", "adf.ly", "clck.ru", "qrco.de", "u.to",
  "x.gd", "surl.li", "linktr.ee", "urlz.fr", "ln.run", "tr.ee",
];

/** Hosting platforms whose free tiers are frequently abused to host phishing pages. */
export const FREE_HOSTING_SUFFIXES = [
  "webflow.io", "weebly.com", "wixsite.com", "wix.com", "firebaseapp.com", "web.app",
  "pages.dev", "workers.dev", "netlify.app", "vercel.app", "github.io", "glitch.me",
  "repl.co", "replit.app", "000webhostapp.com", "blogspot.com", "duckdns.org",
  "ngrok.io", "ngrok-free.app", "ngrok.app", "trycloudflare.com", "ipfs.io", "dweb.link",
  "r2.dev", "azurewebsites.net", "herokuapp.com", "onrender.com", "surge.sh",
  "square.site", "godaddysites.com", "mystrikingly.com", "framer.app", "framer.website",
  "carrd.co", "notion.site", "sites.google.com", "forms.gle", "typedream.app",
  "glide.page", "webcindario.com", "byethost.com", "freehostia.com", "is-a.dev",
  "s3.amazonaws.com", "blob.core.windows.net", "storage.googleapis.com", "appspot.com",
  "translate.goog", "telegra.ph", "backblazeb2.com", "googleusercontent.com", "dropboxusercontent.com",
  "sharepoint.com", "onedrive.live.com", "1drv.ms", "web.core.windows.net", "firebasestorage.googleapis.com",
  "cloudfront.net", "amplifyapp.com", "digitaloceanspaces.com", "ondigitalocean.app", "fly.dev", "deno.dev",
  "github.dev", "gitbook.io", "canva.site", "my.canva.site", "wordpress.com", "tilda.ws", "yolasite.com",
  "site123.me", "webnode.page", "mailchimpsites.com", "myshopify.com", "docs.google.com", "hubspotpagebuilder.com", "jimdosite.com",
];

export const DEFAULT_SUSPICIOUS_DOMAIN_PATTERNS = [
  "*-dhl-*",
  "dhl-*.*",
  "*maersk-*",
  "*-fedex*",
  "*ups-track*",
  "*usps-*",
  "*office365-*",
  "*microsoft-login*",
  "*secure-login*",
  "*account-verify*",
  "*verify-account*",
  "*-customs-*",
  // Innova logistics list, "Candidates only" patterns (2026-11-12)
  ...["login", "secure", "verify", "portal", "app"].flatMap((p) =>
    ["dat", "truckstop", "rmis", "tql", "triumph", "apex", "comdata", "efs", "datatruck"].flatMap((b) => [`*${p}-${b}.*`, `*${p}-${b}-*`, `*${b}-${p}.*`, `*${b}-${p}-*`, `*${p}${b}.*`, `*${b}${p}.*`]),
  ),
  "*ratecon*", "*rate-confirmation*", "*rateconfirmation*", "*carrier-packet*", "*carrierpacket*", "*setup-packet*", "*setuppacket*", "*quickpay*",
  ...["com", "net", "top", "icu"].flatMap((t) => [`*fmcsa*.${t}`, `*mcs150*.${t}`, `*mcs-150*.${t}`, `*ucr-renew*.${t}`, `*ucrrenew*.${t}`, `*ucr-filing*.${t}`, `*ucrfiling*.${t}`, `*dot-renew*.${t}`, `*dotrenew*.${t}`, `*usdot-*.${t}`]),
];

export const DEFAULT_TRUSTED_DOMAINS = ["innovanetworks.uz"];

export const DEFAULT_MODULES: Record<ModuleKey, boolean> = {
  url: true,
  domain: true,
  dns: true,
  tls: true,
  redirects: true,
  content: true,
  download: true,
  intel: true,
};

export const DEFAULT_PROVIDERS: Record<ProviderId, boolean> = {
  googleSafeBrowsing: true,
  virusTotal: true,
  urlhaus: true,
  phishTank: true,
  abuseIpdb: true,
};

export const DEFAULT_WEIGHTS: Record<ModuleKey, number> = {
  url: 1,
  domain: 1,
  dns: 1,
  tls: 1,
  redirects: 1,
  content: 1,
  download: 1,
  intel: 1,
};

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 InnovaChecker/1.0";

export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
  modules: DEFAULT_MODULES,
  providers: DEFAULT_PROVIDERS,
  weights: DEFAULT_WEIGHTS,
  suspiciousKeywords: DEFAULT_SUSPICIOUS_KEYWORDS,
  suspiciousTlds: DEFAULT_SUSPICIOUS_TLDS,
  urlShorteners: DEFAULT_SHORTENERS,
  suspiciousDomainPatterns: DEFAULT_SUSPICIOUS_DOMAIN_PATTERNS,
  trustedDomains: DEFAULT_TRUSTED_DOMAINS,
  brandDomains: DEFAULT_BRANDS,
  requestTimeoutMs: 8000,
  scanTimeoutMs: 45000,
  maxRedirects: 5,
  maxResponseBytes: 2_000_000,
  maxDownloadBytes: 10_000_000,
  userAgent: DEFAULT_USER_AGENT,
  virusTotalSubmitUnknown: false,
};
