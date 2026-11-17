# Innova Checker

URL security intelligence for logistics teams, by **Innova Networks**. Paste a suspicious link and Innova Checker analyses it on the server, without the user's browser ever opening it. It returns a 0–100 risk score, a verdict (Trusted, Safe, Low Risk, Suspicious, High Risk, Malicious or Inconclusive) and an evidence-backed report.

- **Analysis engine:** eight modules — URL, domain/RDAP/WHOIS, DNS, TLS, redirects, page content, file downloads and threat intelligence. The fetcher is hardened against SSRF.
- **Domain intelligence database:**
  - Whitelist: verified official logistics domains.
  - Blacklist: confirmed indicators of compromise (IOCs) and policy blocks.
  - Suspicious list.
  - Every active trusted or malicious record cites a verification source and date.
- **Accounts:** registration, login, password reset, device-bound sessions, subscriptions with device limits, and a Super Admin panel.
- **Payments are not integrated.** Plans are shown in UZS with "Coming Soon", and administrators assign subscriptions manually.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide · Motion · Recharts · Prisma 7 + PostgreSQL 16 · Zod · React Hook Form · Argon2id (`@node-rs/argon2`) · pdf-lib · Vitest.

`cacheComponents` is intentionally **off**. Every page is rendered per request, which the nonce-based Content-Security-Policy and the session-aware UI require.

## Project structure

```
prisma/
  schema.prisma            data model (users, sessions, devices, plans, subscriptions, scans, domain intelligence, audit…)
  migrations/              SQL migrations (incl. partial unique index: one current subscription per user)
  seed.ts                  plans, settings, Super Admin, researched domain intelligence
  data/
    logistics-candidates.json   research input (76 logistics platforms)
    logistics-whitelist.json    verification output with evidence per domain
    threat-domains.json         blacklist / suspicious records with sources
scripts/
  scan-cli.ts              run the engine on one URL from the terminal (no DB)
  sync-scanner-defaults.ts merge new built-in brands/keywords into the DB config
  research/                domain verification pipeline (Wikidata, Wikipedia, SEC EDGAR, parent-site checks)
src/
  proxy.ts                 per-request CSP nonce + optimistic auth redirect
  instrumentation.ts       optional in-process scheduler (ENABLE_INTERNAL_SCHEDULER)
  app/
    (marketing)/           landing, pricing, features, how-it-works, about, contact, privacy, terms, /scan/[id]
    (auth)/                login, register, forgot-password, reset-password
    dashboard/             overview, scanner, history, subscription, devices, profile, settings (+ server actions)
    admin/                 overview, users, subscriptions, plans, domains, scanner, settings, audit-logs, messages (+ server actions)
    api/                   scans, auth, contact, CSV exports, cron endpoint
  components/              ui (shadcn), marketing, scan (report, gauge, progress), dashboard, admin, common
  lib/                     shared validation, formatting, verdict metadata, report text
  server/
    scanner/               analysis engine (DB-free): net/ (SSRF-safe HTTP/TLS), modules/, intel/, scoring, domain-db matching
    domain-intel/          whitelist/blacklist storage, CSV import/export, revalidation & threat-feed jobs
    scans/                 scan orchestration, access control, persistence, DTO
    auth/                  sessions, devices, passwords
    subscriptions/         subscription rules, payment-provider abstraction
    reports/pdf.ts         PDF report rendering
tests/                     Vitest unit tests (SSRF policy, normalisation, domain matching, heuristics, CSV)
```

## Getting started

Requirements: Node.js ≥ 20.19 (22 LTS recommended), npm, and Docker (or any PostgreSQL 16).

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit: POSTGRES_PASSWORD, DATABASE_URL, IP_HASH_SECRET, CRON_SECRET
openssl rand -hex 32             # use for IP_HASH_SECRET; another one for CRON_SECRET

npm run db:up                    # starts PostgreSQL on 127.0.0.1:5442 (docker compose)
npm run db:deploy                # applies migrations (use `npm run db:migrate` while developing the schema)
npm run db:seed                  # plans, settings, Super Admin, domain intelligence

npm run dev                      # http://localhost:3000
```

Production:

```bash
npm run build
npm start                        # serves on :3000
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run scan -- https://example.com`, `npm run scanner:sync-defaults`, `npm run db:studio`.

## Super Admin

The seed creates the Super Admin from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`. Any 1–128 character password is accepted (the minimum length is configurable in Admin → Settings); use a long random one. It is hashed with Argon2id and never stored in clear text.

Set them in `.env` before the first seed:

| | |
|---|---|
| E-mail | `SUPER_ADMIN_EMAIL` from `.env` |
| Password | `SUPER_ADMIN_PASSWORD` from `.env` (only used to create the account) |

Use different, secret values in every real deployment. Re-running the seed never changes an existing user's password. Administrators can create more admins in **Admin → Users**, and an admin can change their own password in **Admin → Settings**.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `IP_HASH_SECRET` | yes | ≥ 32 chars; keyed hash for visitor IPs |
| `APP_URL` | yes | public base URL (reset links, CSRF origin check, HSTS when `https://`) |
| `TRUSTED_PROXY_COUNT` | no | reverse proxies appending to `X-Forwarded-For` (see *Anonymous limits*) |
| `SUPER_ADMIN_*` | seed | initial Super Admin |
| `CRON_SECRET` | for cron | bearer token for `POST /api/cron/domain-intel` (≥ 24 chars) |
| `ENABLE_INTERNAL_SCHEDULER` | no | `true` runs feed sync every 6 h and revalidation every 24 h in-process |
| `SMTP_*` | no | password-reset e-mail. Without it, links are logged, and shown on screen in `next dev` only |
| `MAX_CONCURRENT_SCANS` | no | per-instance scan concurrency (default 4) |

### Optional threat-intelligence keys

| Variable | Provider | Used for |
|---|---|---|
| `GOOGLE_SAFE_BROWSING_API_KEY` | Google Safe Browsing v4 | original and final URL |
| `VIRUSTOTAL_API_KEY` | VirusTotal v3 | URL report, and the hash of a downloaded file. Unknown URLs are **not** submitted unless enabled in Admin → Scanner |
| `URLHAUS_AUTH_KEY` | URLhaus (abuse.ch) | URL and host lookup, and the recent-URL feed sync |
| `PHISHTANK_APP_KEY` | PhishTank | URL lookup |
| `ABUSEIPDB_API_KEY` | AbuseIPDB | reputation of resolved server IPs (never marks a URL malicious on its own) |

Providers without a key are shown as **Not configured** in every report and are never presented as clean. They can also be disabled individually in **Admin → Scanner**. The app runs fully without any key; the public OpenPhish feed needs no key.

**Admin → Integrations** manages these keys without a redeploy:
- Keys are stored encrypted (AES-256-GCM with `SECRETS_ENCRYPTION_KEY`) and override the environment variables. They are never shown again; only the last 4 characters are displayed.
- A VirusTotal key is validated against VirusTotal before it is saved.
- Hourly, daily and monthly VirusTotal quota usage is reported by VirusTotal itself. The overview shows a warning at 80% and a critical alert at 95%, so the key can be replaced before it runs out.
- Innova Checker never exceeds `VIRUSTOTAL_REQUESTS_PER_MINUTE` (4 for public keys) and caches VirusTotal URL results for 6 hours, so repeated URLs cost no quota.
- To move a key from a file into the database: `npx tsx scripts/import-provider-key.ts virusTotal ./virustotal.txt`, then delete the file.

## Domain intelligence

Three lists, matched in this priority:

1. **Blacklist match → Malicious.** The record says whether it is a *confirmed* IOC or an Innova Networks *policy* block.
2. **Verified official domain (whitelist) → Trusted immediately.** The link's own domain must be on the whitelist (exact host or safe subdomain), and so must the final destination. Strictness lives in that matching: look-alikes such as `highway-security-example.com` or `www.tch.com` (only `ent.tch.com` is pinned) never match. Two things override Trusted:
   - a threat-intelligence provider reports this exact URL as malicious;
   - the page shows a critical compromise indicator (for example credential exfiltration to Telegram, or a disguised executable).

   A whitelisted link that redirects to a non-whitelisted site is judged on the final site. A non-whitelisted link that merely redirects to an official site is not trusted. Other observations (plain HTTP, file download, bot protection) are listed in the report without changing the verdict.
3. **Suspicious-list match, or impersonation of a verified platform → at least High Risk.**
4. **Unknown → full analysis.**

Matching supports:
- exact hosts, and safe subdomains (subdomains never cross a hosting-platform boundary, so `x.s3.amazonaws.com` does not inherit anything from `amazonaws.com`);
- `HOST` scope (exact host only) and `URL` scope (exact URL);
- IDN/punycode homographs, typosquats, brand-in-domain and similar-looking domains, with brand keywords coming from the verified whitelist.

A domain is never trusted because its name contains a company name.

**Innova Networks verified list (2026-11-12).** `prisma/data/innova-verified-list.json` is generated by `scripts/research/build-innova-list.py` from the URL Safety Checker list (`logistics-domain-lists.md`). The CISO declared it authoritative.
- **Whitelist:** 221 domains plus 2 exact S3 file hosts are active immediately. They cover load boards, onboarding, TMS, ELD, visibility, factoring and fuel, carriers and brokers, and the government names `dot.gov`, `transportation.gov` and `ucr.gov`.
- **Pinned host:** only `ent.tch.com`, not `tch.com`.
- **Blacklist:** the list's 153 entries, plus `safersys.org` from "Still do not add".
- **Never whitelisted:** `convoy.com` (defunct company, the name can be resold), `progressive.com`, `tch.com`, cloud parents (`amazonaws.com` and others), and office brands whose subdomains host user content (`google.com`, `adobe.com`, `docusign.com`, `microsoft.com`).
- The list's "Candidates only" lure patterns are scanner patterns: `login-`, `secure-`, `verify-`, `portal-` or `app-` combined with DAT, Truckstop, RMIS, TQL, Triumph, Apex, Comdata, EFS or DataTruck; `ratecon`, `carrier-packet` and `quickpay`; FMCSA, UCR, MCS-150 and DOT renewal names on `.com`, `.net`, `.top` and `.icu`.

**DNS boxes allowlist (2026-11-12).** `prisma/data/dns-boxes-allowlist-2026-11-12.txt` (478 names from the 65 company DNS boxes) is classified by `scripts/research/build-dns-allowlist.py` into `innova-dns-allowlist.json`:
- **Trusted:** clean business, logistics and `.gov` names (386; 87 were already covered by the whitelist).
- **Exact host only:** 11 named company tenants on shared platforms, such as `arrivelogisticsapp.okta.com` and `wexinc.my.site.com`.
- **Never trusted:** 36 platform names where anyone can publish pages, forms, invoices or tenants (`azurewebsites.net`, `my.site.com`, `okta.com`, `pages.dev`, `vercel.app`, `branch.io`, `mandrillapp.com`, DocuSign, `intuit.com` and others).
- **Pending admin review:** 24 new, personal, unrelated or unresolvable names.
- **Suspicious:** 2 names, `fmcsa.com` (a private filing service, not FMCSA) and `missecure.com` (a parked look-alike of `rmissecure.com`).

VirusTotal counts a URL as malicious only when at least 5 engines agree. Fewer detections are reported as suspicious and noted on whitelisted links.

**Seeded research (2026-11-12):**

- **76 logistics platforms** were researched. **57 are verified official**, each with a recorded source:
  - Wikidata *official website* (P856);
  - the English Wikipedia infobox;
  - SEC EDGAR filings;
  - press releases (PR Newswire, investor.uber.com, FreightWaves);
  - links or redirects from an already-verified official site, plus DNS evidence.

  Example: `gohighway.com` redirects to `highway.com`, is Highway's Pardot tracking host, and shares its registrar and DNS provider. The remaining 19 are **pending** admin review; they were not trusted automatically.
- **Blacklist:** 40 records are confirmed malicious, either published as IOCs by Proofpoint (*Remote Access, Real Cargo*) and Have I Been Squatted / Ctrl-Alt-Intel (*Diesel Vortex*), or seen first-hand in a phishing chain. 114 Highway look-alikes are blocked by an explicit Innova Networks policy decision, and their records cite the underlying evidence.

Administration (**Admin → Domain intelligence**):
- add, edit, delete, approve and reject records;
- CSV import and export (formula-injection safe);
- a change history for every record;
- user-submitted reports ("Report domain" on a report);
- manual **Revalidate domains** and **Sync threat feeds** runs.

Active trusted or malicious records without a verification source and date are rejected, or imported as *pending*.

**Revalidate domains** and **Sync threat feeds** run in the background. The admin UI keeps working while they run, and progress is shown above the table.

Every result also shows a short bold red notice under the verdict, for example *"Domain trusted, but stay alert at the next steps: if this site redirects you to another website or starts a file download, check that new link again."* or *"SCAM: this link is malicious. Do not open it and do not enter any information."* The notice also appears in the PDF and in the copied text.

Scheduled jobs: set `CRON_SECRET` and call the cron endpoint from any scheduler:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/domain-intel?job=feeds"      # or job=revalidate / job=all
```

The other option is `ENABLE_INTERNAL_SCHEDULER=true` on a single self-hosted instance. Feed entries are exact-URL blacklist records that expire after 7 days unless the feed still lists them.

Re-running the research: `npx tsx scripts/research/verify-logistics-domains.ts`, then `wikidata-by-url.ts`, `wikipedia-infobox.ts` and `apply-manual-and-children.ts`. After that, `npm run db:seed` refreshes seed-origin records and leaves admin-edited ones alone.

## Security design

- **SSRF:**
  - Scanner requests resolve DNS in a socket-level lookup hook that rejects any non-public address. Rejected ranges include loopback, RFC 1918, link-local/metadata, CGNAT, ULA, NAT64/6to4/Teredo and documentation ranges.
  - The address that was validated is the address that is connected to, which closes the DNS-rebinding window.
  - IP literals and internal hostnames are refused before any network activity.
  - Redirects are followed manually and re-validated hop by hop.
  - Only ports 80, 443, 8080, 8443, 8000 and 8888 are allowed.
  - Responses are capped (compressed and decompressed sizes) and time-limited.
- **No execution:** page scripts are never run. Downloads are hashed and signature-checked in memory, and are never written, opened or executed.
- **Auth:**
  - Passwords use Argon2id (19 MiB, t=2). Session, device and reset tokens are stored only as SHA-256 hashes.
  - Cookies are httpOnly, SameSite=Lax and `Secure` in production.
  - Login is rate-limited per IP and per account, with configurable lockout.
  - Password change or reset revokes other sessions.
  - Post-login redirects accept same-site paths only.
- **Authorization:**
  - Admin pages return 404 to non-admins, and every server action and API route re-checks the role.
  - Scans are visible only to their owner, the anonymous browser that created them, or admins.
  - Scan IDs are 128-bit random.
- **CSRF:** API routes require a matching `Origin` and reject cross-site `Sec-Fetch-Site`. Server Actions use Next.js's built-in origin check.
- **Headers:** nonce-based CSP with `strict-dynamic`, `frame-ancestors 'none'`, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and COOP/CORP. HSTS is sent when `APP_URL` is `https://`.
- **Audit log:** logins (admin and user), failed logins, user, subscription, plan, pricing, scanner and settings changes, device and session revocations, and account deletion.

### Anonymous free-scan limits (and their limits)

Visitors get `freeScanLimit` scans (default 1). The limit is enforced on the server and is never kept only in the browser:

- an atomic counter on a server-side anonymous session that is identified by a random httpOnly cookie;
- a per-IP daily cap (`anonymousIpDailyLimit`, default 5) stored as an HMAC of the IP.

Anonymous identification cannot be perfect:
- Clearing cookies or using a private window creates a new anonymous session. The IP cap is then the backstop.
- Offices behind one NAT share the IP cap, so it must not be too low.
- VPNs and mobile networks rotate IPs.
- When the app is exposed directly, `X-Forwarded-For` comes from the client. Deploy behind a reverse proxy that sets it, and configure `TRUSTED_PROXY_COUNT` for reliable IP-based limits.

Accounts with subscriptions are the reliable control.

### Roles

| Role | Scanning | Devices | Admin panel |
|---|---|---|---|
| `USER` | needs an active subscription; 20 scans/min, 1,000/day | plan's device limit | no |
| `UNLIMITED` | no subscription needed; only an abuse ceiling of 120/min and 50,000/day | unlimited | no |
| `SUPER_ADMIN` | same as `UNLIMITED` | unlimited | yes |

To grant unlimited use, open **Admin → Users → user → Grant unlimited access**, or pick the role in the edit form. Every role change is written to the audit log as `USER_ROLE_CHANGED`. Unlimited users still get maintenance mode and all security controls; they simply skip billing and device limits.

### Devices and subscriptions

- A plan limits **simultaneous** devices (1, 1, 5, 20, 30 or 50).
- A device is a random per-browser token in an httpOnly cookie, registered on the server per user. It occupies a slot while it has a live session; signing out or session expiry frees the slot.
- Users can remove other devices, limited per 30 days. Admins can revoke any device or session.
- Scans require an active subscription, verified on the server for every scan. Expired subscriptions are expired automatically.
- Admins can assign, change, extend, set the expiry of, suspend, activate and deactivate subscriptions. Every change is recorded in subscription history.

## Testing

```bash
npm test             # 48 unit tests
npm run lint && npm run typecheck && npm run build
```

Also verified end-to-end in a real browser during development:
- registration, login, logout and lockout, and the password reset flow;
- Super Admin login and role isolation (users get 404 on /admin);
- subscription assignment, the device-limit rules and settings persistence;
- the evidence rule for whitelist records;
- scans of official (`one.dat.com` → Trusted), look-alike (→ High Risk) and blacklisted (→ Malicious) domains.

## Deployment notes

- Serve over **HTTPS**: production cookies are `Secure`. Set `APP_URL` to the public `https://` origin.
- `npm start` runs `server.mjs`, which takes the client IP from the TCP socket and overwrites any client-sent forwarding header. Plain `next start` would trust a forged `X-Forwarded-For` and let attackers dodge IP blocking and rate limits, so do not use it.
- Behind a reverse proxy (nginx, Caddy) set `TRUSTED_PROXY_COUNT=1` (one proxy) so the client address is read from the proxy's `X-Forwarded-For`.
- `npm run db:deploy && npm run db:seed` on release; `npm run build && PORT=3000 npm start`.
- Scans run after the HTTP response (`after()`). On serverless platforms make sure the function duration covers a scan (`maxDuration` is set to 60 s on the scan route).

## Payments

Click (Uzbekistan, UZS) and Visa / Mastercard (other countries, USD) via `src/server/payments/`.

1. A signed-in user opens **Dashboard → Buy / renew**, picks a plan and a method and presses *Generate payment QR code*. The QR code is bound to the session's registered device; the server checks the browser fingerprint.
2. The QR encodes `APP_URL/pay/{token}`. While the code is valid, scanning it redirects the phone to Click's payment page (`my.click.uz/services/pay`) for the exact amount and order number.
3. The code is valid for **Settings → Payment QR validity** (default 180 s), with a countdown in the browser. Click's *Prepare* call is refused after that (`-9`), so an expired code cannot be paid. A *Complete* call for a payment prepared in time is accepted for 2 more minutes.
4. A verified *Complete* activates the plan, or extends the same plan, for the user. The paying device keeps its slot; least-recently-used devices beyond the plan's limit are removed. The browser page switches to "Payment received" by itself.

**Click setup** (credentials from the Click merchant cabinet):

| Variable | Value |
|---|---|
| `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_MERCHANT_USER_ID`, `CLICK_SECRET_KEY` | From the merchant cabinet |
| Prepare URL | `APP_URL/api/payments/click/prepare` |
| Complete URL | `APP_URL/api/payments/click/complete` |

The money is settled by Click to the bank account registered for the merchant. Callbacks are verified with Click's MD5 signature, amount and order state. Each one is logged in `PaymentEvent`, and all payments are listed in **Admin → Payments**.

**Card payments** go through a provider interface. No card gateway is connected yet, so the Visa option is only available in test mode until an adapter (Octo, Payze, …) is added.

**Test mode.** `PAYMENTS_MOCK=true` with a localhost or LAN `APP_URL` simulates both providers with a local checkout page. The Click simulation runs the real Prepare/Complete handler. Test payments are marked "(test)" and are never accepted by a live callback. To scan the QR code from a phone during local tests, set `APP_URL` to the machine's LAN address.

## Threat-intelligence collection (daily)

`src/server/threat-intel/` collects phishing, scam and malware domains from public sources every 6 hours. It runs from the internal scheduler (`ENABLE_INTERNAL_SCHEDULER=true`), from `POST /api/cron/domain-intel?job=feeds`, or from the Domain intelligence admin page.

| Source | Kind | Imported as |
|---|---|---|
| CERT Polska warning list, PhishTank (verified online), OpenPhish, phishunt.io, malware-filter (PhishTank/OpenPhish/IPThreat), URLhaus online hosts | curated | every entry → **BLACKLIST**, `CONFIRMED_MALICIOUS` |
| Phishing.Database, Phishing Army, Jarelllama Scam Blocklist | aggregator | logistics-themed entries only → **SUSPICIOUS** (BLACKLIST when two aggregators agree) |
| whoisds.com newly registered domains (yesterday) | NRD | look-alikes of a named logistics brand → **SUSPICIOUS** |

Generic delivery words ("delivery", "cargo"…) from aggregators are only accepted on throw-away infrastructure (`com-` prefixes, scam TLDs), so real courier, restaurant and logistics businesses are not listed.

The listing rule decides how much is blocked:
- **Registrable domain:** when the attacker evidently owns it.
- **Host:** a hosting-platform tenant (`*.pages.dev`, `*.firebaseapp.com`…), or a subdomain of an ordinary domain.
- **Exact URL:** shared path-based services (Google Docs, S3, link shims) and compromised sites.

Whitelisted domains and records created by admins or seeds are never touched. Feed records expire 14 days (curated), 30 days (aggregator) or 60 days (NRD) after a source last listed them, and are removed automatically.

The classifier and listing rules live in `src/server/threat-intel/logistics.ts` and are shared with `scripts/research/collect-logistics-threats.ts`.

## Devices, brute force and API docs

- **Devices.** Browsers cannot read MAC addresses. A device is identified by an httpOnly cookie and by a browser fingerprint: GPU, CPU cores, memory, platform, timezone, languages and fonts, HMAC-ed on the server. Canvas/audio and screen size are not used because private modes add noise to them. A private window or cleared cookies on the same machine is the same device. Each registered device holds a slot until the user (limited per 30 days) or an admin removes it. Anonymous free scans are counted per fingerprint as well as per cookie and IP.
- **Brute force.** After `loginMaxAttempts` (default 5) failed sign-ins within the counting window, the IP is blocked from sign-in, registration, password reset and scanning for `ipBlockMinutes` (default 60). A successful sign-in does not reset the counter. Blocked IPs are listed in **Admin → Security** and can be unblocked there.
- **API docs.** OpenAPI 3.1 at `/api/openapi.json`, with Swagger UI at **Admin → API docs**. Both are restricted to Super Admins unless `API_DOCS_PUBLIC=true`. `npm run openapi:export` writes `docs/openapi.json`.

---

No automated scanner can guarantee that a website is 100% safe. Innova Checker reports are decision support for your team, not a warranty.
