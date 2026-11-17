import { env } from "../env";

export type ProviderId = "CLICK" | "CARD";

export interface ClickConfig {
  serviceId: string;
  merchantId: string;
  merchantUserId?: string;
  secretKey: string;
}

export function clickConfig(): ClickConfig | null {
  const e = env();
  if (!e.CLICK_SERVICE_ID || !e.CLICK_MERCHANT_ID || !e.CLICK_SECRET_KEY) return null;
  return { serviceId: e.CLICK_SERVICE_ID, merchantId: e.CLICK_MERCHANT_ID, merchantUserId: e.CLICK_MERCHANT_USER_ID, secretKey: e.CLICK_SECRET_KEY };
}

/** Simulated payments for local development; refused on any non-local APP_URL. */
export function mockPaymentsEnabled(): boolean {
  const e = env();
  const host = new URL(e.APP_URL).hostname;
  return e.PAYMENTS_MOCK && (host === "localhost" || host === "127.0.0.1" || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host));
}

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  region: string;
  currency: "UZS" | "USD";
  live: boolean;
  available: boolean;
}

// Card payments (Visa / Mastercard outside Uzbekistan) need a gateway adapter;
// until one is configured they are only available in local test mode.
export function providerStatus(): ProviderStatus[] {
  const mock = mockPaymentsEnabled();
  const click = !!clickConfig();
  return [
    { id: "CLICK", label: "Click", region: "Uzbekistan", currency: "UZS", live: click, available: click || mock },
    { id: "CARD", label: "Visa / Mastercard", region: "Other countries", currency: "USD", live: false, available: mock },
  ];
}

export function paymentsAvailable(): boolean {
  return providerStatus().some((p) => p.available);
}
