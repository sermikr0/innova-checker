import crypto from "node:crypto";
import { promises as dns } from "node:dns";
import { cookies } from "next/headers";
import { z } from "zod";
import type { ClientConsent } from "@/generated/prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { hmac, randomToken, sha256 } from "../crypto";
import { ApiError } from "../http";
import { cookieOptions } from "../auth/cookies";
import { sendMail } from "../mailer";
import type { CurrentSession } from "../auth/session";
import type { Locale } from "@/i18n/config";
import { consentText } from "@/i18n/messages/consent";
import { TERMS_VERSION } from "@/i18n/messages/legal-types";

// Terms-of-Use acceptance with identification before the first check: people
// tick the Terms, give their first and last name and e-mail, and confirm the
// e-mail with a one-time code. The record is kept as evidence of acceptance and
// listed in Admin → Terms & clients.

export const CONSENT_COOKIE = "ic_consent";
const CODE_TTL_MS = 10 * 60_000;
const RESEND_AFTER_MS = 60_000;
const MAX_CODE_ATTEMPTS = 5;

type System = { consentRequired: boolean; consentEmailVerification: boolean };

export function smtpConfigured(): boolean {
  return !!env().SMTP_HOST;
}

/** Whether acceptance is required and whether the e-mail must be confirmed with a code. */
export function consentPolicy(system: System) {
  return { required: system.consentRequired, verifyEmail: system.consentEmailVerification && smtpConfigured() };
}

// ─── Input checks ─────────────────────────────────────────────────────────────

/** First and last name: at least two words of letters (any script), hyphens or apostrophes. */
export function normalizeFullName(raw: string): string | null {
  const v = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (v.length < 3 || v.length > 100) return null;
  const words = v.split(" ");
  if (words.length < 2 || words.some((w) => !/^\p{L}[\p{L}\p{M}'’‘ʻʼ`-]*$/u.test(w))) return null;
  return v;
}

const emailField = z.string().trim().toLowerCase().max(254).pipe(z.email());

// Common throw-away mailbox services; the code check proves ownership anyway.
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "grr.la", "10minutemail.com", "10minutemail.net", "temp-mail.org", "tempmail.com", "tempmail.net", "temp-mail.io",
  "yopmail.com", "yopmail.net", "yopmail.fr", "trashmail.com", "trashmail.de", "getnada.com", "nada.email", "dispostable.com", "maildrop.cc", "mailnesia.com", "mintemail.com", "throwawaymail.com",
  "fakeinbox.com", "mohmal.com", "emailondeck.com", "tempinbox.com", "tempr.email", "mailcatch.com", "spamgourmet.com", "moakt.com", "tmail.ws", "tmpmail.org", "tmpmail.net", "1secmail.com",
  "1secmail.org", "1secmail.net", "burnermail.io", "inboxkitten.com", "mail.tm", "emailfake.com", "fakemail.net", "crazymailing.com", "dropmail.me", "minuteinbox.com", "mail-temp.com",
]);

export type EmailProblem = "invalid" | "disposable" | "no-mail";

/** Normalises an e-mail address and checks that its domain can receive mail. */
export async function checkEmail(raw: string): Promise<{ email: string } | { problem: EmailProblem }> {
  const parsed = emailField.safeParse(raw);
  if (!parsed.success) return { problem: "invalid" };
  const email = parsed.data;
  const domain = email.split("@")[1];
  if (DISPOSABLE.has(domain)) return { problem: "disposable" };
  const timeout = <T,>(p: Promise<T>) => Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), 4000))]);
  try {
    const mx = await timeout(dns.resolveMx(domain));
    if (mx.length === 1 && mx[0].exchange === "") return { problem: "no-mail" }; // RFC 7505 null MX
    if (mx.length) return { email };
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "ENOTFOUND") return { problem: "no-mail" };
    if (code !== "ENODATA") return { email }; // resolver trouble: the code check decides
  }
  // No MX record: mail falls back to the domain's address record.
  try {
    const a = await timeout(dns.resolve4(domain).catch(() => dns.resolve6(domain)));
    return a.length ? { email } : { problem: "no-mail" };
  } catch (e) {
    const code = (e as { code?: string }).code;
    return code === "ENOTFOUND" || code === "ENODATA" ? { problem: "no-mail" } : { email };
  }
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  const shown = user.length <= 2 ? user.slice(0, 1) : user.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(2, Math.min(6, user.length - shown.length)))}@${domain}`;
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

async function consentFromCookie(): Promise<ClientConsent | null> {
  const token = (await cookies()).get(CONSENT_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  return prisma.clientConsent.findUnique({ where: { tokenHash: sha256(token) } });
}

function isValid(c: ClientConsent, verifyEmail: boolean): boolean {
  return c.termsVersion === TERMS_VERSION && (!verifyEmail || !!c.emailVerifiedAt);
}

/**
 * Consent the current request may check links under: the browser's own record,
 * the signed-in user's record, or one made earlier on the same device (so a
 * private window does not ask again). Returns null when none is valid.
 */
export async function findValidConsent(system: System, who: { userId?: string | null; fingerprintHash?: string | null }): Promise<{ consent: ClientConsent | null; pending: ClientConsent | null }> {
  const { verifyEmail } = consentPolicy(system);
  const own = await consentFromCookie();
  if (own && isValid(own, verifyEmail) && (!own.userId || !who.userId || own.userId === who.userId)) return { consent: own, pending: null };
  const where = verifyEmail ? { termsVersion: TERMS_VERSION, emailVerifiedAt: { not: null } } : { termsVersion: TERMS_VERSION };
  if (who.userId) {
    const mine = await prisma.clientConsent.findFirst({ where: { ...where, userId: who.userId }, orderBy: { acceptedAt: "desc" } });
    if (mine) return { consent: mine, pending: null };
  }
  if (who.fingerprintHash && !who.userId) {
    const device = await prisma.clientConsent.findFirst({ where: { ...where, fingerprintHash: who.fingerprintHash, userId: null }, orderBy: { acceptedAt: "desc" } });
    if (device) return { consent: device, pending: null };
  }
  return { consent: null, pending: own && own.termsVersion === TERMS_VERSION ? own : null };
}

/**
 * Throws CONSENT_REQUIRED (HTTP 428) unless the request may check links. The
 * details tell the page which step to show. Returns the consent id for the scan.
 */
export async function requireConsent(system: System, locale: Locale, who: { session: CurrentSession | null; fingerprintHash: string | null }): Promise<string | null> {
  if (!consentPolicy(system).required || who.session?.user.role === "SUPER_ADMIN") return null;
  const { consent, pending } = await findValidConsent(system, { userId: who.session?.user.id ?? null, fingerprintHash: who.fingerprintHash });
  if (consent) {
    if (who.session && !consent.userId) await prisma.clientConsent.update({ where: { id: consent.id }, data: { userId: who.session.user.id } }).catch(() => {});
    await prisma.clientConsent.update({ where: { id: consent.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    return consent.id;
  }
  const t = consentText[locale].errors;
  const awaitingCode = !!pending?.codeHash && !pending.emailVerifiedAt;
  throw new ApiError(428, "CONSENT_REQUIRED", awaitingCode ? t.verifyRequired : t.required, {
    step: awaitingCode ? "verify" : "terms",
    email: awaitingCode ? maskEmail(pending.email) : undefined,
    signedIn: !!who.session,
    fullName: who.session?.user.fullName ?? pending?.fullName,
    accountEmail: who.session?.user.email,
  });
}

// ─── Start / verify ───────────────────────────────────────────────────────────

type Evidence = { locale: Locale; ip: string; country: string | null; userAgent: string; fingerprintHash: string };

/** Records acceptance and, when required, sends a code. Returns the next step. */
export async function startConsent(system: System, input: { fullName: string; email: string; session: CurrentSession | null } & Evidence): Promise<{ step: "verify"; email: string; resendIn: number } | { step: "done" }> {
  const { verifyEmail } = consentPolicy(system);
  const jar = await cookies();
  let record = await consentFromCookie();
  if (record && record.userId && input.session && record.userId !== input.session.user.id) record = null;
  const evidence = { termsVersion: TERMS_VERSION, acceptedAt: new Date(), locale: input.locale, ipAddress: input.ip, country: input.country, userAgent: input.userAgent.slice(0, 500), fingerprintHash: input.fingerprintHash, lastSeenAt: new Date() };
  const sameEmail = record?.email === input.email;
  if (record) {
    record = await prisma.clientConsent.update({
      where: { id: record.id },
      data: { ...evidence, fullName: input.fullName, email: input.email, userId: input.session?.user.id ?? record.userId, ...(sameEmail ? {} : { emailVerifiedAt: null, codeHash: null, codeExpiresAt: null, codeAttempts: 0, codeSentAt: null }) },
    });
  } else {
    const token = randomToken(32);
    record = await prisma.clientConsent.create({ data: { ...evidence, fullName: input.fullName, email: input.email, userId: input.session?.user.id ?? null, tokenHash: sha256(token) } });
    jar.set(CONSENT_COOKIE, token, cookieOptions(5 * 365 * 24 * 3600));
  }
  if (!verifyEmail || record.emailVerifiedAt) return { step: "done" };
  return sendCode(record, input.locale);
}

/** Sends a fresh code unless one was sent less than a minute ago. */
export async function sendCode(record: ClientConsent, locale: Locale): Promise<{ step: "verify"; email: string; resendIn: number }> {
  const since = record.codeSentAt ? Date.now() - record.codeSentAt.getTime() : Infinity;
  if (record.codeHash && record.codeExpiresAt && record.codeExpiresAt.getTime() > Date.now() && since < RESEND_AFTER_MS) {
    return { step: "verify", email: maskEmail(record.email), resendIn: Math.ceil((RESEND_AFTER_MS - since) / 1000) };
  }
  const t = consentText[locale];
  if (record.codesSent >= 20) throw new ApiError(429, "RATE_LIMITED", t.errors.tooMany);
  const code = String(crypto.randomInt(100_000, 1_000_000));
  await prisma.clientConsent.update({ where: { id: record.id }, data: { codeHash: hmac(`consent-code:${record.id}:${code}`), codeExpiresAt: new Date(Date.now() + CODE_TTL_MS), codeAttempts: 0, codeSentAt: new Date(), codesSent: { increment: 1 } } });
  try {
    await sendMail({ to: record.email, subject: t.mail.subject, text: t.mail.body(record.fullName, code) });
  } catch (e) {
    console.error("[consent] verification e-mail failed", (e as Error).message);
    await prisma.clientConsent.update({ where: { id: record.id }, data: { codeSentAt: null } });
    throw new ApiError(502, "EMAIL_SEND_FAILED", t.errors.sendFailed);
  }
  return { step: "verify", email: maskEmail(record.email), resendIn: Math.ceil(RESEND_AFTER_MS / 1000) };
}

export async function pendingConsent(): Promise<ClientConsent | null> {
  const record = await consentFromCookie();
  return record && record.termsVersion === TERMS_VERSION ? record : null;
}

/** Checks the code typed by the visitor. */
export async function verifyConsentCode(code: string, locale: Locale): Promise<{ step: "done" }> {
  const t = consentText[locale].errors;
  const record = await pendingConsent();
  if (!record) throw new ApiError(400, "CONSENT_NOT_STARTED", t.noPending);
  if (record.emailVerifiedAt) return { step: "done" };
  if (!record.codeHash || !record.codeExpiresAt) throw new ApiError(400, "CONSENT_NOT_STARTED", t.noPending);
  if (record.codeAttempts >= MAX_CODE_ATTEMPTS) throw new ApiError(429, "CODE_LOCKED", t.codeLocked);
  if (record.codeExpiresAt.getTime() < Date.now()) throw new ApiError(400, "CODE_EXPIRED", t.codeExpired);
  const ok = /^\d{6}$/.test(code) && crypto.timingSafeEqual(Buffer.from(hmac(`consent-code:${record.id}:${code}`)), Buffer.from(record.codeHash.padEnd(64, "0").slice(0, 64)));
  if (!ok) {
    const updated = await prisma.clientConsent.update({ where: { id: record.id }, data: { codeAttempts: { increment: 1 } } });
    const left = MAX_CODE_ATTEMPTS - updated.codeAttempts;
    if (left <= 0) throw new ApiError(429, "CODE_LOCKED", t.codeLocked);
    throw new ApiError(400, "CODE_INVALID", t.codeInvalid(left), { attemptsLeft: left });
  }
  await prisma.clientConsent.update({ where: { id: record.id }, data: { emailVerifiedAt: new Date(), codeHash: null, codeExpiresAt: null, codeAttempts: 0, lastSeenAt: new Date() } });
  return { step: "done" };
}

/** Acceptance given in the registration form (the e-mail is confirmed at the first check). */
export async function recordRegistrationConsent(userId: string, input: { fullName: string; email: string } & Evidence): Promise<void> {
  const token = randomToken(32);
  await prisma.clientConsent.create({
    data: { fullName: input.fullName, email: input.email, userId, termsVersion: TERMS_VERSION, locale: input.locale, ipAddress: input.ip, country: input.country, userAgent: input.userAgent.slice(0, 500), fingerprintHash: input.fingerprintHash, tokenHash: sha256(token) },
  });
  (await cookies()).set(CONSENT_COOKIE, token, cookieOptions(5 * 365 * 24 * 3600));
}
