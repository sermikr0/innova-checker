// Website access switches and the free-scan policy, shared by server and client code.
import type { Locale } from "@/i18n/config";

export type FreeScanModeKey = "UNLIMITED" | "DAILY" | "TOTAL";

export type SiteAccess = {
  /** Clients may sign in (Super Admins always can). */
  login: boolean;
  /** New accounts may be created: needs both registration and client sign-in. */
  register: boolean;
  /** Plans and prices are shown and checkout is open. */
  pricing: boolean;
  freeMode: FreeScanModeKey;
  freeLimit: number;
};

export function siteAccessFrom(s: { loginEnabled: boolean; registrationEnabled: boolean; pricingVisible: boolean; freeScanMode: string; freeScanLimit: number }): SiteAccess {
  return {
    login: s.loginEnabled,
    register: s.loginEnabled && s.registrationEnabled,
    pricing: s.pricingVisible,
    freeMode: s.freeScanMode as FreeScanModeKey,
    freeLimit: s.freeScanLimit,
  };
}

type Policy = Pick<SiteAccess, "freeMode" | "freeLimit">;

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

const SHORT: Record<Locale, (a: Policy) => string> = {
  en: (a) => (a.freeMode === "UNLIMITED" ? "Unlimited free checks" : a.freeLimit <= 0 ? "Subscription required" : a.freeMode === "DAILY" ? `${a.freeLimit} free check${a.freeLimit === 1 ? "" : "s"} every day` : `${a.freeLimit} free scan${a.freeLimit === 1 ? "" : "s"}`),
  ru: (a) => (a.freeMode === "UNLIMITED" ? "Безлимитные бесплатные проверки" : a.freeLimit <= 0 ? "Нужна подписка" : `${a.freeLimit} ${ruPlural(a.freeLimit, "бесплатная проверка", "бесплатные проверки", "бесплатных проверок")}${a.freeMode === "DAILY" ? " в день" : ""}`),
  uz: (a) => (a.freeMode === "UNLIMITED" ? "Cheksiz bepul tekshiruv" : a.freeLimit <= 0 ? "Obuna talab qilinadi" : a.freeMode === "DAILY" ? `Har kuni ${a.freeLimit} ta bepul tekshiruv` : `${a.freeLimit} ta bepul tekshiruv`),
};

const LONG: Record<Locale, (a: Policy) => string> = {
  en: (a) =>
    a.freeMode === "UNLIMITED" ? "Checking links is currently free and unlimited for everyone. Fair-use limits only stop automated abuse."
    : a.freeLimit <= 0 ? "Checking links requires an active subscription plan."
    : a.freeMode === "DAILY" ? `Every device gets ${a.freeLimit} free check${a.freeLimit === 1 ? "" : "s"} per day, renewed at 00:00 Tashkent time. A subscription plan removes the limit.`
    : `Every device gets ${a.freeLimit} free check${a.freeLimit === 1 ? "" : "s"} to try the full analysis. After that, a subscription plan is required.`,
  ru: (a) =>
    a.freeMode === "UNLIMITED" ? "Сейчас проверка ссылок бесплатна и не ограничена для всех. Ограничения действуют только против автоматических злоупотреблений."
    : a.freeLimit <= 0 ? "Для проверки ссылок нужна активная подписка."
    : a.freeMode === "DAILY" ? `Каждое устройство получает ${a.freeLimit} ${ruPlural(a.freeLimit, "бесплатную проверку", "бесплатные проверки", "бесплатных проверок")} в день; лимит обновляется в 00:00 по ташкентскому времени. С подпиской ограничений нет.`
    : `Каждое устройство получает ${a.freeLimit} ${ruPlural(a.freeLimit, "бесплатную проверку", "бесплатные проверки", "бесплатных проверок")}, чтобы попробовать полный анализ. Дальше нужна подписка.`,
  uz: (a) =>
    a.freeMode === "UNLIMITED" ? "Hozircha havolalarni tekshirish hamma uchun bepul va cheksiz. Cheklovlar faqat avtomatlashtirilgan suiiste’mollarni to‘xtatadi."
    : a.freeLimit <= 0 ? "Havolalarni tekshirish uchun faol obuna kerak."
    : a.freeMode === "DAILY" ? `Har bir qurilma kuniga ${a.freeLimit} ta bepul tekshiruv oladi, limit Toshkent vaqti bilan 00:00 da yangilanadi. Obuna bilan cheklov yo‘q.`
    : `Har bir qurilma to‘liq tahlilni sinab ko‘rish uchun ${a.freeLimit} ta bepul tekshiruv oladi. Shundan so‘ng obuna talab qilinadi.`,
};

/** Short line under the scan box, e.g. "3 free checks every day". */
export function freePolicyShort(a: Policy, locale: Locale = "en"): string {
  return SHORT[locale](a);
}

/** One-sentence explanation for FAQ answers and notices. */
export function freePolicyLong(a: Policy, locale: Locale = "en"): string {
  return LONG[locale](a);
}
