import crypto from "node:crypto";
import { prisma } from "../db";
import { hmac } from "../crypto";
import { clickConfig } from "./config";
import { COMPLETE_GRACE_MS, expireIntent, fulfillIntent, logPaymentEvent } from "./service";

// Click SHOP API (https://docs.click.uz/click-api-request/): Click calls Prepare
// (action=0) before charging the payer and Complete (action=1) after. Both are
// form-encoded POSTs signed with MD5 over the merchant secret. Error codes are
// Click's own and must be returned exactly.

export const CLICK_ERRORS = {
  SUCCESS: [0, "Success"],
  SIGN_FAILED: [-1, "SIGN CHECK FAILED!"],
  BAD_AMOUNT: [-2, "Incorrect parameter amount"],
  ACTION_NOT_FOUND: [-3, "Action not found"],
  ALREADY_PAID: [-4, "Already paid"],
  ORDER_NOT_FOUND: [-5, "User does not exist"],
  TRANSACTION_NOT_FOUND: [-6, "Transaction does not exist"],
  UPDATE_FAILED: [-7, "Failed to update user"],
  BAD_REQUEST: [-8, "Error in request from click"],
  CANCELLED: [-9, "Transaction cancelled"],
} as const;

type ClickParams = Record<string, string>;
type Secret = { serviceId: string; secretKey: string; mock: boolean };

export function clickSign(p: ClickParams, secretKey: string): string {
  const parts = p.action === "1"
    ? [p.click_trans_id, p.service_id, secretKey, p.merchant_trans_id, p.merchant_prepare_id, p.amount, p.action, p.sign_time]
    : [p.click_trans_id, p.service_id, secretKey, p.merchant_trans_id, p.amount, p.action, p.sign_time];
  return crypto.createHash("md5").update(parts.join("")).digest("hex");
}

function signValid(p: ClickParams, secretKey: string): boolean {
  const expected = Buffer.from(clickSign(p, secretKey));
  const given = Buffer.from(String(p.sign_string ?? "").toLowerCase());
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** Secret for simulated payments; derived so it never equals a real merchant key. */
export function mockClickSecret(): Secret {
  return { serviceId: "mock", secretKey: hmac("mock-click-secret"), mock: true };
}

function liveSecret(): Secret | null {
  const c = clickConfig();
  return c ? { serviceId: c.serviceId, secretKey: c.secretKey, mock: false } : null;
}

const REQUIRED = ["click_trans_id", "service_id", "merchant_trans_id", "amount", "action", "sign_time", "sign_string"];

export async function handleClickCallback(params: ClickParams, opts: { ip?: string; secret?: Secret } = {}): Promise<Record<string, string | number>> {
  const secret = opts.secret ?? liveSecret();
  const action = params.action;
  const base = { click_trans_id: params.click_trans_id ?? "", merchant_trans_id: params.merchant_trans_id ?? "" };
  let intentId: string | null = null;

  const reply = async ([code, note]: readonly [number, string], extra: Record<string, string | number> = {}) => {
    const response = { ...base, ...extra, error: code, error_note: note };
    await logPaymentEvent({ intentId, provider: "CLICK", kind: action === "1" ? "COMPLETE" : action === "0" ? "PREPARE" : "UNKNOWN", request: params, response, ip: opts.ip });
    return response;
  };

  if (!secret) return reply(CLICK_ERRORS.BAD_REQUEST);
  if (REQUIRED.some((k) => !params[k]) || (action === "1" && !params.merchant_prepare_id)) return reply(CLICK_ERRORS.BAD_REQUEST);
  if (!signValid(params, secret.secretKey)) return reply(CLICK_ERRORS.SIGN_FAILED);
  if (params.service_id !== secret.serviceId) return reply(CLICK_ERRORS.BAD_REQUEST);
  if (action !== "0" && action !== "1") return reply(CLICK_ERRORS.ACTION_NOT_FOUND);

  const number = Number(params.merchant_trans_id);
  const found = Number.isSafeInteger(number) ? await prisma.paymentIntent.findUnique({ where: { number } }) : null;
  // Live callbacks never touch simulated intents and vice versa.
  if (!found || found.provider !== "CLICK" || found.mock !== secret.mock) return reply(CLICK_ERRORS.ORDER_NOT_FOUND);
  intentId = found.id;
  const intent = await expireIntent(found);
  const amount = Number(params.amount);
  if (!Number.isFinite(amount) || Math.abs(amount - intent.amount) > 0.01) return reply(CLICK_ERRORS.BAD_AMOUNT);

  if (action === "0") {
    if (intent.status === "PAID") return reply(CLICK_ERRORS.ALREADY_PAID);
    if (intent.status === "PREPARED" && intent.providerTransId === params.click_trans_id) return reply(CLICK_ERRORS.SUCCESS, { merchant_prepare_id: intent.number });
    if (intent.status !== "PENDING") return reply(CLICK_ERRORS.CANCELLED);
    const prepared = await prisma.paymentIntent.updateMany({
      where: { id: intent.id, status: "PENDING", expiresAt: { gt: new Date() } },
      data: { status: "PREPARED", preparedAt: new Date(), providerTransId: params.click_trans_id },
    });
    if (prepared.count === 0) return reply(CLICK_ERRORS.CANCELLED);
    return reply(CLICK_ERRORS.SUCCESS, { merchant_prepare_id: intent.number });
  }

  // Complete
  if (Number(params.merchant_prepare_id) !== intent.number) return reply(CLICK_ERRORS.TRANSACTION_NOT_FOUND);
  if (intent.providerTransId && intent.providerTransId !== params.click_trans_id) return reply(CLICK_ERRORS.TRANSACTION_NOT_FOUND);
  if (intent.status === "PAID") return reply(intent.providerTransId === params.click_trans_id ? CLICK_ERRORS.SUCCESS : CLICK_ERRORS.ALREADY_PAID, { merchant_confirm_id: intent.number });
  if (Number(params.error ?? 0) < 0) {
    // Click could not charge the payer (insufficient funds, cancelled in app...).
    await prisma.paymentIntent.updateMany({ where: { id: intent.id, status: { in: ["PENDING", "PREPARED"] } }, data: { status: "CANCELLED", cancelledAt: new Date(), failureReason: `Click: ${params.error_note ?? params.error}`.slice(0, 200) } });
    return reply(CLICK_ERRORS.CANCELLED);
  }
  if (intent.status !== "PREPARED") return reply(intent.status === "PENDING" ? CLICK_ERRORS.TRANSACTION_NOT_FOUND : CLICK_ERRORS.CANCELLED);
  if (Date.now() > intent.expiresAt.getTime() + COMPLETE_GRACE_MS) {
    await prisma.paymentIntent.updateMany({ where: { id: intent.id, status: "PREPARED" }, data: { status: "CANCELLED", cancelledAt: new Date(), failureReason: "Completed after the payment window" } });
    return reply(CLICK_ERRORS.CANCELLED);
  }
  try {
    await fulfillIntent(intent.id, params.click_trans_id);
  } catch {
    return reply(CLICK_ERRORS.UPDATE_FAILED);
  }
  return reply(CLICK_ERRORS.SUCCESS, { merchant_confirm_id: intent.number });
}

/** Runs Prepare + Complete for a simulated payment, exactly as Click would. */
export async function simulateClickPayment(intent: { number: number; amount: number }, outcome: "pay" | "cancel"): Promise<{ prepare: Record<string, string | number>; complete: Record<string, string | number> }> {
  const secret = mockClickSecret();
  const transId = String(Date.now());
  const signTime = new Date().toISOString().replace("T", " ").slice(0, 19);
  const prep: ClickParams = { click_trans_id: transId, service_id: secret.serviceId, click_paydoc_id: transId, merchant_trans_id: String(intent.number), amount: String(intent.amount), action: "0", error: "0", error_note: "Success", sign_time: signTime, sign_string: "" };
  prep.sign_string = clickSign(prep, secret.secretKey);
  const prepare = await handleClickCallback(prep, { secret });
  const comp: ClickParams = { ...prep, action: "1", merchant_prepare_id: String(prepare.merchant_prepare_id ?? intent.number), error: outcome === "pay" ? "0" : "-5017", error_note: outcome === "pay" ? "Success" : "Payment cancelled by user", sign_string: "" };
  comp.sign_string = clickSign(comp, secret.secretKey);
  const complete = await handleClickCallback(comp, { secret });
  return { prepare, complete };
}
