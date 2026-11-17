import { defineMessages } from "../config";

type ScanServerText = {
  tooManyPerMinute: string;
  tooManyRequests: string;
  dailyLimit: string;
  networkDailyLimit: string;
  deviceRequired: string;
  deviceLimit: (plan: string, limit: number, active: number) => string;
  nextSignedIn: string;
  nextRegister: string;
  nextContact: string;
  subscriptionRequired: (next: string) => string;
  dailyUsed: (limit: number, next: string) => string;
  totalUsed: (limit: number, next: string) => string;
};

const ruChecks = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "бесплатная проверка" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "бесплатные проверки" : "бесплатных проверок");

/** Messages returned by the scan API (POST /api/scans). */
export const scanServerText = defineMessages<ScanServerText>({
  en: {
    tooManyPerMinute: "Too many scans. Please wait a minute.",
    tooManyRequests: "Too many requests. Please wait a minute.",
    dailyLimit: "Daily scan limit reached.",
    networkDailyLimit: "Daily scan limit for this network reached. Please try again tomorrow.",
    deviceRequired: "This session is not bound to a registered device. Please sign in again.",
    deviceLimit: (plan, limit, active) => `Your ${plan} plan allows ${limit} device${limit === 1 ? "" : "s"}, but ${active} are registered. Remove devices in Dashboard → Devices to continue scanning.`,
    nextSignedIn: "Choose a subscription plan or contact your administrator to continue.",
    nextRegister: "Create an account and choose a subscription plan to continue analyzing suspicious URLs.",
    nextContact: "Contact Innova Networks to get a subscription.",
    subscriptionRequired: (next) => `An active subscription is required to scan URLs. ${next}`,
    dailyUsed: (limit, next) => `You have used today's ${limit} free check${limit === 1 ? "" : "s"}. They renew at 00:00 Tashkent time. ${next}`,
    totalUsed: (limit, next) => `Your free security scan${limit === 1 ? " has" : "s have"} been used. ${next}`,
  },
  ru: {
    tooManyPerMinute: "Слишком много проверок. Подождите минуту.",
    tooManyRequests: "Слишком много запросов. Подождите минуту.",
    dailyLimit: "Достигнут дневной лимит проверок.",
    networkDailyLimit: "Достигнут дневной лимит проверок для этой сети. Попробуйте завтра.",
    deviceRequired: "Этот сеанс не привязан к зарегистрированному устройству. Войдите снова.",
    deviceLimit: (plan, limit, active) => `Тариф ${plan} позволяет устройств: ${limit}, а зарегистрировано: ${active}. Удалите лишние в разделе Кабинет → Устройства, чтобы продолжить.`,
    nextSignedIn: "Выберите тариф или обратитесь к администратору, чтобы продолжить.",
    nextRegister: "Зарегистрируйтесь и выберите тариф, чтобы продолжить проверку подозрительных ссылок.",
    nextContact: "Свяжитесь с Innova Networks, чтобы оформить подписку.",
    subscriptionRequired: (next) => `Для проверки ссылок нужна активная подписка. ${next}`,
    dailyUsed: (limit, next) => `Вы использовали сегодняшний лимит: ${limit} ${ruChecks(limit)}. Он обновится в 00:00 по ташкентскому времени. ${next}`,
    totalUsed: (limit, next) => `Ваш лимит бесплатных проверок (${limit}) исчерпан. ${next}`,
  },
  uz: {
    tooManyPerMinute: "Tekshiruvlar juda ko‘p. Bir daqiqa kuting.",
    tooManyRequests: "So‘rovlar juda ko‘p. Bir daqiqa kuting.",
    dailyLimit: "Kunlik tekshiruv limiti tugadi.",
    networkDailyLimit: "Bu tarmoq uchun kunlik tekshiruv limiti tugadi. Ertaga qayta urinib ko‘ring.",
    deviceRequired: "Bu seans ro‘yxatdan o‘tgan qurilmaga bog‘lanmagan. Qaytadan kiring.",
    deviceLimit: (plan, limit, active) => `${plan} tarifi ${limit} ta qurilmaga ruxsat beradi, lekin ${active} ta ro‘yxatdan o‘tgan. Davom etish uchun Kabinet → Qurilmalar bo‘limida ortiqchasini o‘chiring.`,
    nextSignedIn: "Davom etish uchun tarif tanlang yoki administratoringizga murojaat qiling.",
    nextRegister: "Shubhali havolalarni tekshirishni davom ettirish uchun ro‘yxatdan o‘ting va tarif tanlang.",
    nextContact: "Obuna olish uchun Innova Networks bilan bog‘laning.",
    subscriptionRequired: (next) => `Havolalarni tekshirish uchun faol obuna kerak. ${next}`,
    dailyUsed: (limit, next) => `Bugungi ${limit} ta bepul tekshiruvdan foydalanib bo‘ldingiz. Ular Toshkent vaqti bilan 00:00 da yangilanadi. ${next}`,
    totalUsed: (limit, next) => `${limit} ta bepul tekshiruvingiz tugadi. ${next}`,
  },
});
