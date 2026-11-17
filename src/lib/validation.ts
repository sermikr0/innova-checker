import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { validationText } from "@/i18n/messages/validation";

// Shared (client + server) input schemas. Their messages are the English texts of the
// validation namespace; forms show them in the visitor's language via localizeValidation().

const m = validationText.en;

export const emailSchema = z.string().trim().toLowerCase().max(254, m.emailTooLong).pipe(z.email(m.emailInvalid));

// No composition rules: any password is accepted. The upper bound only protects the
// server from very long inputs to Argon2. A minimum length can be set in Admin → Settings.
export const passwordSchema = z.string().min(1, m.passwordRequired).max(128, m.passwordTooLong);

const name = (required: string, tooLong: string, max = 120) => z.string().trim().min(2, required).max(max, tooLong);

export const registerSchema = z
  .object({
    fullName: name(m.fullNameRequired, m.fullNameTooLong),
    email: emailSchema,
    companyName: name(m.companyNameRequired, m.companyNameTooLong, 160),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: m.passwordsMismatch });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, m.passwordEnter).max(128),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ token: z.string().min(20).max(200), password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: m.passwordsMismatch });

export const contactSchema = z.object({
  name: name(m.nameRequired, m.nameTooLong),
  email: emailSchema,
  company: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.string().trim().min(3, m.subjectRequired).max(160),
  message: z.string().trim().min(10, m.messageTooShort).max(4000, m.messageTooLong),
  website: z.string().max(0).optional(),
});

export const profileSchema = z.object({ fullName: name(m.fullNameRequired, m.fullNameTooLong), companyName: name(m.companyNameRequired, m.companyNameTooLong, 160) });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, m.currentPasswordRequired), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: m.passwordsMismatch });

// English schema message → its key in the validation namespace.
const KEY_BY_TEXT = new Map<string, keyof typeof m>(
  (Object.keys(m) as (keyof typeof m)[]).flatMap((k) => (typeof m[k] === "string" ? [[m[k] as string, k] as const] : [])),
);

/**
 * A schema message (as produced by zod on the client or returned in an API error's
 * `message` / `fields`) in the given language. Any other text, e.g. a message the
 * server already localized, is returned unchanged.
 */
export function localizeValidation<M extends string | null | undefined>(message: M, locale: Locale): M {
  if (!message || locale === "en") return message;
  const key = KEY_BY_TEXT.get(message);
  const text = key ? validationText[locale][key] : undefined;
  return (typeof text === "string" ? text : message) as M;
}
