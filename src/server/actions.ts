import "server-only";
import { ZodError, type z } from "zod";
import { ApiError } from "./http";
import { SubscriptionError } from "./subscriptions/service";
import { DomainIntelError } from "./domain-intel/service";
import { getLocale } from "@/i18n/server";
import { localizeValidation } from "@/lib/validation";

const TEXT = {
  en: { invalid: "Invalid input.", failed: "Something went wrong. Please try again." },
  ru: { invalid: "Неверные данные.", failed: "Что-то пошло не так. Попробуйте ещё раз." },
  uz: { invalid: "Ma’lumotlar noto‘g‘ri.", failed: "Nimadir xato ketdi. Qaytadan urinib ko‘ring." },
};

export type ActionResult<T = unknown> = { ok: true; message?: string; data?: T } | { ok: false; error: string; fields?: Record<string, string> };

/** Uniform error handling for Server Actions: known errors become messages, others are logged. */
export async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ZodError) {
      const locale = await getLocale().catch(() => "en" as const);
      const tr = (m: string) => localizeValidation(m, locale);
      return { ok: false, error: e.issues[0] ? tr(e.issues[0].message) : TEXT[locale].invalid, fields: Object.fromEntries(e.issues.map((i) => [i.path.join("."), tr(i.message)])) };
    }
    if (e instanceof ApiError || e instanceof SubscriptionError || e instanceof DomainIntelError) return { ok: false, error: e.message };
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    console.error("[action] unhandled error", e);
    return { ok: false, error: TEXT[await getLocale().catch(() => "en" as const)].failed };
  }
}

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}
