import { INTL_LOCALE, type Locale } from "@/i18n/config";

// Number and date formatting. Every helper takes the interface language;
// without one it formats in English.

const nf = (l: Locale) => new Intl.NumberFormat(l === "en" ? "en-US" : INTL_LOCALE[l]);
const dateFmts = new Map<string, Intl.DateTimeFormat>();
function dateFmt(l: Locale, withTime: boolean) {
  const key = `${l}:${withTime}`;
  let f = dateFmts.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(INTL_LOCALE[l], { day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : {}), timeZone: "Asia/Tashkent" });
    dateFmts.set(key, f);
  }
  return f;
}

const UZS: Record<Locale, string> = { en: "UZS", ru: "сум", uz: "so‘m" };

export function formatUzs(amount: number, locale: Locale = "en"): string {
  return `${nf(locale).format(amount)} ${UZS[locale]}`;
}

export function formatNumber(n: number, locale: Locale = "en"): string {
  return nf(locale).format(n);
}

export function formatDate(d: Date | string | null | undefined, locale: Locale = "en"): string {
  if (!d) return "—";
  return dateFmt(locale, false).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined, locale: Locale = "en"): string {
  if (!d) return "—";
  return `${dateFmt(locale, true).format(new Date(d))} (UZT)`;
}

const MS: Record<Locale, [string, string]> = { en: ["ms", "s"], ru: ["мс", "с"], uz: ["ms", "s"] };

export function formatDuration(ms: number | null | undefined, locale: Locale = "en"): string {
  if (ms == null) return "—";
  const [msU, sU] = MS[locale];
  return ms < 1000 ? `${ms} ${msU}` : `${(ms / 1000).toFixed(1)} ${sU}`;
}

const JUST_NOW: Record<Locale, string> = { en: "just now", ru: "только что", uz: "hozirgina" };

export function timeAgo(d: Date | string, locale: Locale = "en"): string {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return JUST_NOW[locale];
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], { numeric: "always", style: "short" });
  const m = Math.round(s / 60);
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.round(m / 60);
  if (h < 24) return rtf.format(-h, "hour");
  return rtf.format(-Math.round(h / 24), "day");
}
