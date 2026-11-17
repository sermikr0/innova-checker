// Interface languages. The choice lives in the ic_lang cookie (set by the
// UZ / RU / EN buttons); without it the browser's Accept-Language decides.

export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "ic_lang";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  uz: { short: "UZ", name: "O‘zbekcha" },
  ru: { short: "RU", name: "Русский" },
  en: { short: "EN", name: "English" },
};

/** BCP 47 tags for Intl formatting and <html lang>. */
export const INTL_LOCALE: Record<Locale, string> = { uz: "uz-Latn-UZ", ru: "ru-RU", en: "en-GB" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Best supported language from an Accept-Language header. */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((x) => x.lang && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) if (isLocale(lang)) return lang;
  return DEFAULT_LOCALE;
}

/** One namespace of UI text in every language; ru and uz must match the shape of en. */
export type Messages<T> = { en: T; ru: T; uz: T };

export function defineMessages<T>(m: { en: T; ru: NoInfer<T>; uz: NoInfer<T> }): Messages<T> {
  return m;
}
