#!/usr/bin/env python3
"""Builds prisma/data/innova-dns-allowlist.json from the DNS boxes' allowlist export
(65 company DNS boxes, 2026-11-12). Decision approved by the Innova Networks CISO:
clean business, logistics and .gov names become Trusted; multi-tenant platforms are
never trusted as a whole (only named tenant hosts); suspicious entries go to review.

Usage: python3 scripts/research/build-dns-allowlist.py
"""
import json, os, datetime

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "..", "prisma", "data", "dns-boxes-allowlist-2026-11-12.txt")
OUT = os.path.join(HERE, "..", "..", "prisma", "data", "innova-dns-allowlist.json")
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
SOURCE = ("Innova Networks DNS boxes allowlist (65 company DNS boxes, export 2026-11-12 19:59 Tashkent); "
          "clean entries approved as Trusted by the Innova Networks CISO on 2026-11-12")

# Platforms where anyone can publish pages, forms, invoices, redirects or tenants: never trusted whole.
PLATFORMS = {
    "my.site.com", "site.com", "force.com", "okta.com", "pingone.com", "apps.pingone.com", "auth0.com", "azurewebsites.net", "pages.dev",
    "vercel.app", "squarespace.com", "square.link", "branch.io", "mandrillapp.com", "urlisolation.com", "proofpoint.com", "docusign.com",
    "docusign.net", "pandadoc.com", "app.pandadoc.com", "signnow.com", "boldsign.com", "coupahost.com", "edgesuite.net", "chime.aws",
    "teams.cloud.microsoft", "craigslist.org", "linkedin.com", "tiktok.com", "www.tiktok.com", "indeed.com", "www.indeed.com",
    "ziprecruiter.com", "photopea.com", "dhgate.com", "intuit.com", "arb-1.okta.com",
}
# Exact tenant hosts on those platforms that belong to known companies: trusted as HOST only.
TENANT_HOSTS = {
    "arrivelogisticsapp.okta.com": "Arrive Logistics (Okta tenant)",
    "bm2-freight.my.site.com": "BM2 Freight (Salesforce site)",
    "deploysolutionsgroup.my.site.com": "Deploy Solutions Group (Salesforce site)",
    "dtna.my.site.com": "Daimler Truck North America (Salesforce site)",
    "dynamicconnections.my.site.com": "Dynamic Connections (Salesforce site)",
    "flstransportation.my.site.com": "FLS Transportation (Salesforce site)",
    "mandplogistics.my.site.com": "M&P Logistics (Salesforce site)",
    "shipxlgx.my.site.com": "XLGX (Salesforce site)",
    "totalonelogistics.my.site.com": "Total One Logistics (Salesforce site)",
    "wexinc.my.site.com": "WEX (Salesforce site)",
    "schneidercarrier.b2clogin.com": "Schneider carrier login (Azure AD B2C tenant)",
}
# Utilities (IP check, speed test, telemetry, games): harmless but not something to vouch for.
UTILITY = {"2ip.io", "ifconfig.me", "myip.com", "speedtest.net", "whatismyip.com", "www.whatismyip.com", "whatismyipaddress.com",
           "datadoghq.com", "browser-intake-datadoghq.com", "cudasvc.com", "battle.net", "eu.shop.battle.net"}
# Excluded by the Innova logistics list rules.
NEVER = {"progressive.com", "account.apps.progressive.com", "convoy.com", "carrier.convoy.com", "tch.com"}
# Confirmed problems found while reviewing the export.
SUSPICIOUS = {
    "fmcsa.com": ("FMCSA", "Private MCS-150 filing service; its own page states it is 'NOT affiliated with any government authority'. The official FMCSA domain is fmcsa.dot.gov."),
    "missecure.com": ("RMIS", "Parked look-alike of rmissecure.com (one letter missing); registered 2017 via PublicDomainRegistry on parking nameservers."),
}
# Needs a human decision before it is trusted (new, personal, unrelated, unresolvable or too broad).
REVIEW = {
    "secemail.uz": "registered 36 days ago", "ieltswithmrikromov.com": "personal IELTS tutoring site, unrelated to logistics",
    "verifly.tech": "registered 136 days ago", "eld-portal.com": "registered 152 days ago; generic ELD name",
    "osirisai.live": "registered 183 days ago", "bvbconnect.com": "registered 185 days ago", "surewayagent.com": "registered 353 days ago",
    "classarecruiting.com": "registered 359 days ago", "ptest.uz": "test domain", "khayitovdev.uz": "personal developer domain",
    "cdn-contextgrave.chal.sh": "CTF/challenge infrastructure", "cyberwarfare.live": "security training/CTF site, unrelated to logistics",
    "chicago.ru": "Russian domain unrelated to logistics", "compassartel.info": "no A record and no registration data",
    "securextrack.com": "no A record and no registration data", "app.paidbylink.com": "payment-link service (anyone can request payments)",
    "glmtransport.net": "name is one edit away from pamtransport.com; confirm the company", "snlcarriers.com": "name is close to rlcarriers.com; confirm the company",
    "luxcarschicago.com": "car rental, unrelated to logistics", "magicui.design": "UI component site, unrelated", "arena.ai": "AI chat site, unrelated",
    "deload-board.pages.dev": "Cloudflare Pages site (user content)", "ipintel.vercel.app": "Vercel app (user content)",
    "al.us": "whole Alabama .us namespace", "pa.us": "whole Pennsylvania .us namespace", "va.us": "whole Virginia .us namespace",
}

domains = sorted({l.strip().lower() for l in open(SRC, encoding="utf-8") if l.strip()})
records = []
summary = {"trusted": 0, "tenantHosts": 0, "suspicious": 0, "review": 0, "platforms": [], "utility": [], "excluded": []}
for d in domains:
    if d in NEVER:
        summary["excluded"].append(d); continue
    if d in UTILITY:
        summary["utility"].append(d); continue
    if d in SUSPICIOUS:
        platform, why = SUSPICIOUS[d]
        records.append({"domain": d, "listType": "SUSPICIOUS", "scope": "DOMAIN", "status": "ACTIVE", "trustStatus": "SUSPECTED", "platformName": platform,
                        "category": "Found in DNS boxes allowlist", "verificationSource": f"Innova Checker review of the DNS boxes allowlist, {NOW[:10]}: {why}", "verifiedAt": NOW,
                        "notes": "Remove this name from the DNS boxes' allowlist."})
        summary["suspicious"] += 1; continue
    if d in TENANT_HOSTS:
        records.append({"domain": d, "listType": "WHITELIST", "scope": "HOST", "status": "ACTIVE", "trustStatus": "VERIFIED_OFFICIAL", "platformName": TENANT_HOSTS[d],
                        "category": "Company tenant on a shared platform (exact host only)", "verificationSource": SOURCE, "verifiedAt": NOW,
                        "notes": "Exact host only; the platform parent is never trusted."})
        summary["tenantHosts"] += 1; continue
    if d in PLATFORMS or any(d.endswith("." + p) for p in PLATFORMS):
        summary["platforms"].append(d); continue
    if d in REVIEW:
        records.append({"domain": d, "listType": "WHITELIST", "scope": "DOMAIN", "status": "PENDING", "trustStatus": "UNVERIFIED", "platformName": None,
                        "category": "DNS boxes allowlist — needs review", "verificationSource": f"Listed in the DNS boxes allowlist (2026-11-12); held for review: {REVIEW[d]}", "verifiedAt": NOW,
                        "notes": REVIEW[d]})
        summary["review"] += 1; continue
    records.append({"domain": d, "listType": "WHITELIST", "scope": "DOMAIN", "status": "ACTIVE", "trustStatus": "VERIFIED_OFFICIAL", "platformName": None,
                    "category": "Government" if d.endswith(".gov") else "DNS boxes allowlist", "verificationSource": SOURCE, "verifiedAt": NOW, "notes": None})
    summary["trusted"] += 1

json.dump({"generatedAt": NOW, "summary": summary, "records": records}, open(OUT, "w"), indent=1)
print({k: (len(v) if isinstance(v, list) else v) for k, v in summary.items()})
