import { z } from "zod";

// Server environment, validated once on first use. Kept lazy so `next build`
// can import modules without a fully populated environment.

const optional = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_URL: z.url().default("http://localhost:3000"),
  IP_HASH_SECRET: z.string().min(32, "IP_HASH_SECRET must be at least 32 characters"),
  /** Number of reverse proxies in front of the app that append to X-Forwarded-For. */
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).max(5).default(0),
  GOOGLE_SAFE_BROWSING_API_KEY: optional,
  VIRUSTOTAL_API_KEY: optional,
  URLHAUS_AUTH_KEY: optional,
  PHISHTANK_APP_KEY: optional,
  ABUSEIPDB_API_KEY: optional,
  SECRETS_ENCRYPTION_KEY: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().regex(/^[0-9a-f]{64}$/i, "SECRETS_ENCRYPTION_KEY must be 64 hex characters").optional()),
  VIRUSTOTAL_REQUESTS_PER_MINUTE: z.coerce.number().int().min(1).max(1000).default(4),
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  SMTP_FROM: optional,
  /** Click merchant credentials (merchant cabinet → service settings). */
  CLICK_SERVICE_ID: optional,
  CLICK_MERCHANT_ID: optional,
  CLICK_MERCHANT_USER_ID: optional,
  CLICK_SECRET_KEY: optional,
  /** Local test mode: payments are simulated. Only honoured when APP_URL is localhost. */
  /** Serve /api/openapi.json without signing in (default: Super Admins only). */
  API_DOCS_PUBLIC: z.preprocess((v) => v === "true" || v === "1", z.boolean()).default(false),
  PAYMENTS_MOCK: z.preprocess((v) => v === "true" || v === "1", z.boolean()).default(false),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

export function providerKeys() {
  const e = env();
  return {
    googleSafeBrowsing: e.GOOGLE_SAFE_BROWSING_API_KEY,
    virusTotal: e.VIRUSTOTAL_API_KEY,
    urlhaus: e.URLHAUS_AUTH_KEY,
    phishTank: e.PHISHTANK_APP_KEY,
    abuseIpdb: e.ABUSEIPDB_API_KEY,
  };
}

export const isProduction = () => process.env.NODE_ENV === "production";
