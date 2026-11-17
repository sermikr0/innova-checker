// Payment-provider abstraction. No provider is integrated yet: purchases are
// disabled and subscriptions are assigned by a Super Admin. A future provider
// (e.g. Payme, Click, Uzum) implements this interface and calls
// assignSubscription() from its verified webhook.

export interface CheckoutRequest {
  userId: string;
  planId: string;
  returnUrl: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  enabled: boolean;
  createCheckout(req: CheckoutRequest): Promise<{ redirectUrl: string }>;
  verifyWebhook(req: Request): Promise<{ userId: string; planId: string; externalId: string } | null>;
}

export const paymentProviders: PaymentProvider[] = [];

export function paymentsAvailable(): boolean {
  return paymentProviders.some((p) => p.enabled);
}
