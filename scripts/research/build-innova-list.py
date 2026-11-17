#!/usr/bin/env python3
"""Builds prisma/data/innova-verified-list.json from the Innova Networks logistics list
(URL Safety Checker, logistics-domain-lists.md). The CISO declared the list's whitelist
and blacklist authoritative on 2026-11-12, so its entries are imported as ACTIVE with
that decision recorded as the verification source.

Usage: python3 scripts/research/build-innova-list.py /path/to/logistics-domain-lists.md
"""
import json, re, sys, datetime, os

SRC = sys.argv[1] if len(sys.argv) > 1 else "/home/ai/backup/url-checker-deploy/logistics-domain-lists.md"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "prisma", "data", "innova-verified-list.json")
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
SECTION_NAMES = {"A": "A. Already trusted apex domains", "B": "B. Advanced additions", "C": "C. Official government", "D": "D. Official file hosts", "E": "E. Second pass"}
DICT = set()
if os.path.exists("/usr/share/dict/words"):
    DICT = {w.strip().lower() for w in open("/usr/share/dict/words", encoding="utf-8", errors="ignore")}
# Never whitelisted, per the list's "Still do not add" / "What not to whitelist" rules.
NEVER_TRUST = {"progressive.com", "convoy.com", "safersys.org", "tch.com", "www.tch.com", "mail.tch.com", "amazonaws.com", "s3.amazonaws.com",
               "storage.googleapis.com", "sites.google.com", "docs.google.com", "sharepoint.com", "force.com", "lightning.force.com",
               "salesforce.com", "solera.com", "oracle.com", "sap.com", "blackberry.com", "eldrider.us", "motorcity.systems",
               # Office brands from the spoof list host user content on subdomains (sites/docs/script.google.com,
               # express.adobe.com pages, DocuSign envelopes), so the whole domain is never trusted.
               "google.com", "adobe.com", "docusign.com", "microsoft.com"}

text = open(SRC, encoding="utf-8").read()
lines = text.splitlines()

def source(section, sub):
    return (f"Innova Networks verified logistics list (URL Safety Checker logistics-domain-lists.md, "
            f"{SECTION_NAMES.get(section, section)}{' — ' + sub if sub else ''}); declared authoritative by the Innova Networks CISO on 2026-11-12")

def keywords(domain, platform):
    """Distinctive brand keywords for look-alike detection (skips dictionary words and short tokens)."""
    sld = domain.split(".")[-2] if domain.count(".") >= 1 else domain
    out = []
    for k in {sld.replace("-", ""), re.sub(r"[^a-z0-9]", "", (platform or "").lower())}:
        if len(k) >= 6 and k not in DICT and not k.isdigit() and len(k) <= 24:
            out.append(k)
    return sorted(set(out))

records = {}
def add(domain, listType, scope, platform, category, section, sub, hosts="", note="", trust=None, status="ACTIVE"):
    d = domain.strip().strip("`").lower()
    if not re.match(r"^[a-z0-9.-]+\.[a-z]{2,}$", d):
        return
    if listType == "WHITELIST" and d in NEVER_TRUST:
        return
    key = (d, listType)
    if key in records:
        return
    notes = "; ".join(x for x in [f"Hosts dispatchers open: {hosts}" if hosts else "", note] if x)
    records[key] = {
        "domain": d, "listType": listType, "scope": scope, "status": status,
        "trustStatus": trust or ("VERIFIED_OFFICIAL" if listType == "WHITELIST" else "CONFIRMED_MALICIOUS"),
        "platformName": platform, "companyName": None, "officialUrl": f"https://{d}/" if scope != "URL" else d,
        "category": category, "brandKeywords": keywords(d, platform) if listType == "WHITELIST" and scope == "DOMAIN" else [],
        "verificationSource": source(section, sub), "verifiedAt": NOW, "notes": notes or None,
    }

section = sub = None
mode = "white"
for l in lines:
    if l.startswith("## Blacklist"):
        mode = "black"; section = "Blacklist"; continue
    m = re.match(r"^## ([A-E])\. (.*)", l)
    if m:
        section, sub = m.group(1), None; continue
    if l.startswith("## "):
        section = None; continue
    m = re.match(r"^### (.*)", l)
    if m:
        sub = m.group(1).strip(); continue
    if mode == "black":
        if sub and sub.startswith("Candidates"):
            continue
        d = l.strip()
        if re.match(r"^[a-z0-9.-]+\.[a-z]{2,}$", d):
            add(d, "BLACKLIST", "DOMAIN", "Highway" if "highway" in d else None, sub or "Freight phishing", "Blacklist", sub)
        continue
    if section is None:
        continue
    if l.startswith("|") and not l.startswith("| ---") and not re.match(r"^\| (Platform|Apex|Host) \|", l):
        cols = [c.strip() for c in l.strip("|").split("|")]
        if section == "C":
            add(cols[0], "WHITELIST", "DOMAIN", cols[0], "Government registration", "C", "Official government", cols[1], "U.S. .gov name; .gov registration is restricted to U.S. government organisations.")
        elif section == "D":
            host, parent, note = cols
            if "Not a Highway domain" in note:
                add(host, "SUSPICIOUS", "HOST", "Highway", "Look-alike cloud bucket", "D", "Official file hosts", "", note, trust="SUSPECTED")
            else:
                add(host, "WHITELIST", "HOST", "Highway" if "highway" in host else "DataTruck" if "datatruck" in host else host, "Official file host (exact bucket only)", "D", "Official file hosts", "", note + " Exact host only; the amazonaws.com parent is never trusted.")
        elif sub and sub.startswith("Pinned"):
            add("ent.tch.com", "WHITELIST", "DOMAIN", "EFS / TCH card portal", "Fuel card & payments", section, sub, "ent.tch.com", "Pinned: only ent.tch.com and its subdomains; tch.com, www.tch.com and mail.tch.com stay untrusted.")
        else:
            platform, apexes = cols[0], cols[1]
            hosts = cols[2] if len(cols) > 2 else ""
            note = cols[3] if len(cols) > 3 else ""
            if "Already covered" in hosts:
                continue
            for a in re.split(r",\s*", apexes):
                add(a, "WHITELIST", "DOMAIN", platform, sub, section, sub, hosts, note)
    elif section == "A" and sub and sub.startswith("Large carriers") and "," in l and not l.startswith("These"):
        for a in re.split(r",\s*", l.strip().rstrip(".")):
            add(a, "WHITELIST", "DOMAIN", a.split(".")[0], "Carrier / broker", "A", sub)

# "Still do not add": safersys.org is used by phishing (old unofficial SAFER copy).
add("safersys.org", "BLACKLIST", "DOMAIN", "FMCSA", "Unofficial FMCSA SAFER copy used in phishing", "Blacklist", "Still do not add",
    note="Listed under 'Still do not add': old unofficial SAFER copy; phishing uses it.", trust="SUSPECTED")

out = sorted(records.values(), key=lambda r: (r["listType"], r["domain"]))
json.dump({"generatedAt": NOW, "source": SRC.split("/")[-1], "neverTrust": sorted(NEVER_TRUST), "records": out}, open(OUT, "w"), indent=1)
from collections import Counter
print(Counter((r["listType"], r["scope"]) for r in out), "->", os.path.relpath(OUT))
