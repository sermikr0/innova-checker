// OpenAPI 3.1 description of the public HTTP API. Served to Super Admins at
// /api/openapi.json and rendered with Swagger UI at /admin/api-docs; exported
// to docs/openapi.json with `npm run openapi:export`.

const json = (schema: unknown) => ({ "application/json": { schema } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const err = (description: string) => ({ description, content: json(ref("Error")) });

const DEVICE = { $ref: "#/components/parameters/DeviceFingerprint" };

export function openApiSpec(serverUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Innova Checker API",
      version: "1.0.0",
      description: [
        "URL security analysis for logistics teams, by Innova Networks.",
        "",
        "**Authentication.** Browser endpoints use the `ic_session` httpOnly cookie set by `/api/auth/login`. State-changing requests must come from the site's own origin (`Origin` header).",
        "",
        "**Device check.** Sign-in, registration, payments and anonymous scans require the `x-innova-device` header: base64url JSON of the browser traits collected by `src/lib/device-fingerprint.ts`. Browsers cannot read MAC addresses; this fingerprint identifies the machine across private windows.",
        "",
        "**Brute-force protection.** After the configured number of failed sign-ins (default 5) an IP is blocked from all auth and scan endpoints (`429 IP_BLOCKED`).",
        "",
        "**Payments.** `POST /api/payments/intents` returns a QR code valid for `paymentWindowSeconds` (default 180). Click calls `/api/payments/click` (SHOP API Prepare/Complete). The subscription is activated only by a verified Complete callback.",
      ].join("\n"),
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "Auth" },
      { name: "Scans" },
      { name: "Payments" },
      { name: "Click callbacks", description: "Server-to-server, authenticated by Click's MD5 signature. Configure in the Click merchant cabinet." },
      { name: "Account" },
      { name: "Admin" },
      { name: "Operations" },
    ],
    components: {
      securitySchemes: {
        session: { type: "apiKey", in: "cookie", name: "ic_session" },
        cronSecret: { type: "http", scheme: "bearer", description: "CRON_SECRET from the server environment." },
      },
      parameters: {
        DeviceFingerprint: { name: "x-innova-device", in: "header", required: true, schema: { type: "string", maxLength: 3000, pattern: "^[A-Za-z0-9_-]+$" }, description: "Browser device fingerprint (base64url JSON)." },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string", examples: ["IP_BLOCKED", "DEVICE_LIMIT", "INVALID_CREDENTIALS"] }, message: { type: "string" }, fields: { type: "object", additionalProperties: { type: "string" } } } } },
        },
        Redirect: { type: "object", properties: { ok: { type: "boolean" }, redirect: { type: "string" } } },
        Verdict: { type: "string", enum: ["TRUSTED", "SAFE", "LOW_RISK", "SUSPICIOUS", "HIGH_RISK", "MALICIOUS", "INCONCLUSIVE"] },
        ScanStatus: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: { type: "string", enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"] },
            stages: { type: "array", items: { type: "string" } },
            verdict: { oneOf: [ref("Verdict"), { type: "null" }] },
            riskScore: { type: ["integer", "null"], minimum: 0, maximum: 100 },
            deadLink: { type: "boolean", description: "The host does not exist (NXDOMAIN)." },
            url: { type: "string" },
            error: { type: ["string", "null"] },
          },
        },
        PaymentIntent: {
          type: "object",
          properties: {
            id: { type: "string" },
            number: { type: "integer", description: "Order number sent to Click as merchant_trans_id." },
            status: ref("PaymentStatus"),
            provider: { type: "string", enum: ["CLICK", "CARD"] },
            amount: { type: "integer", description: "Whole so'm for UZS, cents for USD." },
            currency: { type: "string", enum: ["UZS", "USD"] },
            mock: { type: "boolean", description: "Created in local test mode." },
            plan: { type: "object", properties: { slug: { type: "string" }, name: { type: "string" } } },
            expiresAt: { type: "string", format: "date-time" },
            serverNow: { type: "string", format: "date-time" },
            payUrl: { type: "string", format: "uri", description: "Encoded in the QR code; redirects to Click while valid." },
            qrSvg: { type: "string", description: "SVG markup of the QR code." },
          },
        },
        PaymentStatus: { type: "string", enum: ["PENDING", "PREPARED", "PAID", "EXPIRED", "CANCELLED", "FAILED"] },
        ClickRequest: {
          type: "object",
          required: ["click_trans_id", "service_id", "merchant_trans_id", "amount", "action", "sign_time", "sign_string"],
          properties: {
            click_trans_id: { type: "string" },
            service_id: { type: "string" },
            click_paydoc_id: { type: "string" },
            merchant_trans_id: { type: "string", description: "PaymentIntent.number" },
            merchant_prepare_id: { type: "string", description: "Complete only." },
            amount: { type: "string" },
            action: { type: "string", enum: ["0", "1"], description: "0 = Prepare, 1 = Complete" },
            error: { type: "string" },
            error_note: { type: "string" },
            sign_time: { type: "string", examples: ["2026-11-14 10:00:00"] },
            sign_string: { type: "string", description: "md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id [+ merchant_prepare_id] + amount + action + sign_time)" },
          },
        },
        ClickResponse: {
          type: "object",
          properties: {
            click_trans_id: { type: "string" },
            merchant_trans_id: { type: "string" },
            merchant_prepare_id: { type: "integer" },
            merchant_confirm_id: { type: "integer" },
            error: { type: "integer", description: "0 success, -1 sign failed, -2 amount, -3 action, -4 already paid, -5 order not found, -6 transaction not found, -7 update failed, -8 bad request, -9 cancelled (expired QR, failed payment)" },
            error_note: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Auth"], summary: "Create an account and sign in on this device",
          parameters: [DEVICE],
          requestBody: { required: true, content: json({ type: "object", required: ["fullName", "email", "companyName", "password", "confirmPassword"], properties: { fullName: { type: "string" }, email: { type: "string", format: "email" }, companyName: { type: "string" }, password: { type: "string", maxLength: 128 }, confirmPassword: { type: "string" } } }) },
          responses: { 201: { description: "Registered", content: json(ref("Redirect")) }, 400: err("Validation or device check failed"), 403: err("Registration disabled or device limit"), 409: err("E-mail taken"), 429: err("Rate limited or IP blocked") },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"], summary: "Sign in; registers this device if it is new",
          description: "Each failed attempt counts against the caller's IP. When the limit is reached the IP is blocked (`IP_BLOCKED`). The account is also locked separately after repeated failures (`ACCOUNT_LOCKED`).",
          parameters: [DEVICE],
          requestBody: { required: true, content: json({ type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string" }, next: { type: "string" } } }) },
          responses: { 200: { description: "Signed in; sets ic_session", content: json(ref("Redirect")) }, 400: err("Device check failed"), 401: err("Incorrect e-mail or password"), 403: err("Account disabled or DEVICE_LIMIT"), 429: err("ACCOUNT_LOCKED, IP_BLOCKED or rate limited") },
        },
      },
      "/api/auth/logout": { post: { tags: ["Auth"], summary: "Sign out this session", security: [{ session: [] }], responses: { 200: { description: "Signed out" } } } },
      "/api/auth/forgot-password": {
        post: { tags: ["Auth"], summary: "Send a password-reset link", requestBody: { required: true, content: json({ type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } }) }, responses: { 200: { description: "Always succeeds (no account enumeration)" }, 429: err("Rate limited or IP blocked") } },
      },
      "/api/auth/reset-password": {
        post: { tags: ["Auth"], summary: "Set a new password with a reset token", requestBody: { required: true, content: json({ type: "object", required: ["token", "password", "confirmPassword"], properties: { token: { type: "string" }, password: { type: "string" }, confirmPassword: { type: "string" } } }) }, responses: { 200: { description: "Password changed; all sessions revoked", content: json(ref("Redirect")) }, 400: err("Invalid or expired token"), 429: err("IP blocked") } },
      },
      "/api/scans": {
        post: {
          tags: ["Scans"], summary: "Start a URL scan",
          description: "Signed-in users need an active subscription on a registered device (Super Admin and Unlimited roles excepted). Anonymous visitors get the configured number of free scans per device fingerprint and per IP.",
          parameters: [{ ...DEVICE, required: false, description: "Required for anonymous scans." }],
          security: [{}, { session: [] }],
          requestBody: { required: true, content: json({ type: "object", required: ["url"], properties: { url: { type: "string", maxLength: 2048 } } }) },
          responses: { 202: { description: "Scan queued", content: json({ type: "object", properties: { id: { type: "string" } } }) }, 400: err("Invalid URL or device check failed"), 402: err("Subscription required"), 403: err("FREE_SCAN_USED, DEVICE_LIMIT_EXCEEDED"), 429: err("Rate limited or IP blocked"), 503: err("Maintenance") },
        },
      },
      "/api/scans/{id}": {
        get: { tags: ["Scans"], summary: "Scan status and verdict", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status", content: json(ref("ScanStatus")) }, 404: err("Not found or not yours") } },
      },
      "/api/scans/{id}/pdf": {
        get: { tags: ["Scans"], summary: "Download the report as PDF", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "PDF", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } }, 404: err("Not found") } },
      },
      "/api/payments/intents": {
        post: {
          tags: ["Payments"], summary: "Create a payment QR code for a plan",
          description: "Bound to the session's registered device (the fingerprint must match). Any earlier unpaid code of the user is cancelled. The code expires after `paymentWindowSeconds`; Click payments started later are refused.",
          security: [{ session: [] }],
          parameters: [DEVICE],
          requestBody: { required: true, content: json({ type: "object", required: ["plan", "provider"], properties: { plan: { type: "string", description: "Plan slug" }, provider: { type: "string", enum: ["CLICK", "CARD"] } } }) },
          responses: { 201: { description: "QR code issued", content: json(ref("PaymentIntent")) }, 400: err("Plan not purchasable with this method"), 401: err("Not signed in"), 403: err("DEVICE_MISMATCH"), 404: err("Plan not found"), 429: err("Too many attempts"), 503: err("Payment method unavailable") },
        },
      },
      "/api/payments/intents/{id}": {
        get: { tags: ["Payments"], summary: "Poll payment status", security: [{ session: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status", content: json({ type: "object", properties: { id: { type: "string" }, status: ref("PaymentStatus"), expiresAt: { type: "string", format: "date-time" }, serverNow: { type: "string", format: "date-time" }, paidAt: { type: ["string", "null"], format: "date-time" }, subscriptionId: { type: ["string", "null"] }, failureReason: { type: ["string", "null"] } } }) }, 404: err("Not found") } },
      },
      "/api/payments/intents/{id}/cancel": {
        post: { tags: ["Payments"], summary: "Withdraw an unpaid QR code", security: [{ session: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Cancelled if it was still pending" } } },
      },
      "/pay/{token}": {
        get: { tags: ["Payments"], summary: "QR code target", description: "Redirects to Click's payment page while the code is valid; otherwise shows an expired/closed page.", parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }], responses: { 302: { description: "To my.click.uz" }, 404: { description: "Unknown code" }, 410: { description: "Expired or closed" } } },
      },
      "/api/payments/click": {
        post: {
          tags: ["Click callbacks"], summary: "Click SHOP API: Prepare (action=0) and Complete (action=1)",
          description: "Prepare is accepted only while the QR code is valid. Complete activates the subscription on the paying device. Aliases: `/api/payments/click/prepare`, `/api/payments/click/complete`.",
          requestBody: { required: true, content: { "application/x-www-form-urlencoded": { schema: ref("ClickRequest") } } },
          responses: { 200: { description: "Click result (check `error`)", content: json(ref("ClickResponse")) } },
        },
      },
      "/api/payments/click/prepare": { post: { tags: ["Click callbacks"], summary: "Alias of /api/payments/click", requestBody: { required: true, content: { "application/x-www-form-urlencoded": { schema: ref("ClickRequest") } } }, responses: { 200: { description: "Click result", content: json(ref("ClickResponse")) } } } },
      "/api/payments/click/complete": { post: { tags: ["Click callbacks"], summary: "Alias of /api/payments/click", requestBody: { required: true, content: { "application/x-www-form-urlencoded": { schema: ref("ClickRequest") } } }, responses: { 200: { description: "Click result", content: json(ref("ClickResponse")) } } } },
      "/api/contact": {
        post: { tags: ["Account"], summary: "Send a message to Innova Networks", requestBody: { required: true, content: json({ type: "object", required: ["name", "email", "subject", "message"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, company: { type: "string" }, subject: { type: "string" }, message: { type: "string" } } }) }, responses: { 200: { description: "Received" }, 429: err("Rate limited") } },
      },
      "/api/me/scans/export": {
        get: { tags: ["Account"], summary: "Export your scan history as CSV", security: [{ session: [] }], parameters: [{ name: "q", in: "query", schema: { type: "string" } }, { name: "verdict", in: "query", schema: { type: "string" } }, { name: "from", in: "query", schema: { type: "string", format: "date" } }, { name: "to", in: "query", schema: { type: "string", format: "date" } }], responses: { 200: { description: "CSV", content: { "text/csv": { schema: { type: "string" } } } }, 401: err("Not signed in") } },
      },
      "/api/admin/domains/export": {
        get: { tags: ["Admin"], summary: "Export the domain-intelligence database as CSV (Super Admin)", security: [{ session: [] }], parameters: [{ name: "list", in: "query", schema: { type: "string", enum: ["WHITELIST", "BLACKLIST", "SUSPICIOUS"] } }, { name: "status", in: "query", schema: { type: "string", enum: ["PENDING"] } }], responses: { 200: { description: "CSV", content: { "text/csv": { schema: { type: "string" } } } }, 404: { description: "Not a Super Admin" } } },
      },
      "/api/admin/jobs": { get: { tags: ["Admin"], summary: "Background job progress (Super Admin)", security: [{ session: [] }], responses: { 200: { description: "Jobs" } } } },
      "/api/cron/domain-intel": {
        post: { tags: ["Operations"], summary: "Threat-feed sync and domain revalidation", security: [{ cronSecret: [] }], parameters: [{ name: "job", in: "query", schema: { type: "string", enum: ["feeds", "revalidate", "all"], default: "all" } }], responses: { 200: { description: "Job results" }, 401: err("Bad secret") } },
      },
    },
  };
}
