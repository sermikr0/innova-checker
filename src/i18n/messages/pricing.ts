import { defineMessages } from "../config";

type Unit = "DAY" | "MONTH" | "YEAR";

type PricingText = {
  /** "3 months", "1 year". */
  duration: (value: number, unit: Unit) => string;
  cards: {
    /** Line under the plan name, e.g. "1 month of access". */
    access: (duration: string) => string;
    /** Shown after the big price number (same currency word as formatUzs). */
    currency: string;
    perDay: (price: string) => string;
    /** "Up to <strong>n</strong> devices": text before and after the number. */
    devicesBefore: string;
    devicesAfter: (n: number) => string;
    choosePlan: string;
    checkoutNote: string;
    included: string;
  };
  footnote: { before: string; link: string; after: string };
  page: {
    metaTitle: string;
    metaDescription: string;
    hiddenBanner: string;
    heroEyebrow: string;
    heroTitle: { before: string; highlight: string };
    heroSubtitle: string;
    noticeSuffix: string;
    compareTitle: string;
    compareSubtitle: string;
    table: { feature: string; duration: string; price: string; perDay: string; devices: string; included: string };
    featureRows: string[];
    intelFootnote: string;
  };
};

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

const RU_UNITS: Record<Unit, [string, string, string]> = {
  DAY: ["день", "дня", "дней"],
  MONTH: ["месяц", "месяца", "месяцев"],
  YEAR: ["год", "года", "лет"],
};
const UZ_UNITS: Record<Unit, string> = { DAY: "kun", MONTH: "oy", YEAR: "yil" };

/** /pricing page, plan cards and plan durations. */
export const pricingText = defineMessages<PricingText>({
  en: {
    duration: (value, unit) => `${value} ${unit === "DAY" ? "day" : unit === "MONTH" ? "month" : "year"}${value === 1 ? "" : "s"}`,
    cards: {
      access: (d) => `${d} of access`,
      currency: "UZS",
      perDay: (p) => `≈ ${p} per day`,
      devicesBefore: "Up to ",
      devicesAfter: (n) => ` device${n === 1 ? "" : "s"}`,
      choosePlan: "Choose plan",
      checkoutNote: "Pay with Click (UZS) or Visa / Mastercard. Activated instantly on your device.",
      included: "Included",
    },
    footnote: { before: "Need access now? ", link: "Contact Innova Networks", after: " and an administrator can activate a plan for your company." },
    page: {
      metaTitle: "Pricing",
      metaDescription: "Innova Checker subscription plans in Uzbekistani so'm. Every plan includes full URL analysis.",
      hiddenBanner: "Pricing is hidden from visitors. Only administrators see this preview; turn it on in Admin → Site controls.",
      heroEyebrow: "Pricing",
      heroTitle: { before: "Full protection, ", highlight: "every plan" },
      heroSubtitle: "All plans include the complete Innova Checker analysis engine. Choose the duration and number of devices that fit your team.",
      noticeSuffix: "Until then, an Innova Networks administrator can activate a plan for your company on request.",
      compareTitle: "Compare plans",
      compareSubtitle: "Same engine, different duration and device allowance.",
      table: { feature: "Feature", duration: "Duration", price: "Price", perDay: "Approx. price per day", devices: "Allowed devices", included: "Included" },
      featureRows: [
        "URL structure & homograph analysis",
        "Domain intelligence (RDAP / WHOIS)",
        "DNS records & mail authentication",
        "SSL/TLS certificate inspection",
        "Redirect-chain tracing",
        "Website content & login-form analysis",
        "File download inspection (SHA-256)",
        "Threat-intelligence lookups*",
        "PDF reports & copyable summaries",
        "Personal scan history",
      ],
      intelFootnote: "* Threat-intelligence providers are queried when the operator has configured their API keys. Reports always state which providers were consulted.",
    },
  },
  ru: {
    duration: (value, unit) => `${value} ${ruPlural(value, ...RU_UNITS[unit])}`,
    cards: {
      access: (d) => `Доступ на ${d}`,
      currency: "сум",
      perDay: (p) => `≈ ${p} в день`,
      devicesBefore: "До ",
      devicesAfter: (n) => (n % 10 === 1 && n % 100 !== 11 ? " устройства" : " устройств"),
      choosePlan: "Выбрать тариф",
      checkoutNote: "Оплата через Click (UZS) или Visa / Mastercard. Тариф активируется сразу на вашем устройстве.",
      included: "Что входит",
    },
    footnote: { before: "Нужен доступ прямо сейчас? ", link: "Свяжитесь с Innova Networks", after: ", и администратор активирует тариф для вашей компании." },
    page: {
      metaTitle: "Цены",
      metaDescription: "Тарифы подписки Innova Checker в узбекских сумах. Каждый тариф включает полный анализ ссылок.",
      hiddenBanner: "Цены скрыты от посетителей. Этот предпросмотр видят только администраторы; включить показ можно в разделе Админ-панель → Управление сайтом.",
      heroEyebrow: "Цены",
      heroTitle: { before: "Полная защита ", highlight: "в каждом тарифе" },
      heroSubtitle: "Все тарифы включают полный движок анализа Innova Checker. Выберите срок и количество устройств, которые подходят вашей команде.",
      noticeSuffix: "А пока администратор Innova Networks может по запросу активировать тариф для вашей компании.",
      compareTitle: "Сравнение тарифов",
      compareSubtitle: "Один и тот же движок, разные сроки и лимиты устройств.",
      table: { feature: "Возможность", duration: "Срок", price: "Цена", perDay: "Примерная цена в день", devices: "Число устройств", included: "Включено" },
      featureRows: [
        "Анализ структуры URL и гомографов",
        "Данные о домене (RDAP / WHOIS)",
        "DNS-записи и аутентификация почты",
        "Проверка SSL/TLS-сертификата",
        "Отслеживание цепочки перенаправлений",
        "Анализ содержимого сайта и форм входа",
        "Проверка загружаемых файлов (SHA-256)",
        "Проверка по базам угроз*",
        "PDF-отчёты и краткие сводки для копирования",
        "Личная история проверок",
      ],
      intelFootnote: "* Запросы к базам угроз выполняются, если оператор настроил их API-ключи. В отчётах всегда указано, какие провайдеры были опрошены.",
    },
  },
  uz: {
    duration: (value, unit) => `${value} ${UZ_UNITS[unit]}`,
    cards: {
      access: (d) => `Foydalanish muddati: ${d}`,
      currency: "so‘m",
      perDay: (p) => `Kuniga ≈ ${p}`,
      devicesBefore: "",
      devicesAfter: () => " tagacha qurilma",
      choosePlan: "Tarifni tanlash",
      checkoutNote: "Click (UZS) yoki Visa / Mastercard orqali to‘lang. Tarif qurilmangizda darhol faollashadi.",
      included: "Tarifga kiradi",
    },
    footnote: { before: "Hoziroq foydalanish kerakmi? ", link: "Innova Networks bilan bog‘laning", after: " — administrator kompaniyangiz uchun tarifni faollashtiradi." },
    page: {
      metaTitle: "Narxlar",
      metaDescription: "Innova Checker obuna tariflari o‘zbek so‘mida. Har bir tarif to‘liq URL tahlilini o‘z ichiga oladi.",
      hiddenBanner: "Narxlar tashrif buyuruvchilardan yashirilgan. Bu ko‘rinishni faqat administratorlar ko‘radi; ko‘rsatishni Admin panel → Sayt boshqaruvi bo‘limida yoqing.",
      heroEyebrow: "Narxlar",
      heroTitle: { before: "To‘liq himoya — ", highlight: "har bir tarifda" },
      heroSubtitle: "Barcha tariflar Innova Checker tahlil tizimini to‘liq o‘z ichiga oladi. Jamoangizga mos muddat va qurilmalar sonini tanlang.",
      noticeSuffix: "Ungacha Innova Networks administratori so‘rovingiz bo‘yicha kompaniyangiz uchun tarifni faollashtirishi mumkin.",
      compareTitle: "Tariflarni solishtirish",
      compareSubtitle: "Tahlil tizimi bir xil, muddat va qurilmalar soni har xil.",
      table: { feature: "Imkoniyat", duration: "Muddat", price: "Narx", perDay: "Kunlik taxminiy narx", devices: "Ruxsat etilgan qurilmalar", included: "Kiritilgan" },
      featureRows: [
        "URL tuzilmasi va gomograflar tahlili",
        "Domen ma’lumotlari (RDAP / WHOIS)",
        "DNS yozuvlari va pochta autentifikatsiyasi",
        "SSL/TLS sertifikatini tekshirish",
        "Yo‘naltirishlar zanjirini kuzatish",
        "Sayt mazmuni va kirish formalarini tahlil qilish",
        "Yuklab olinadigan fayllarni tekshirish (SHA-256)",
        "Tahdidlar bazalari bo‘yicha tekshiruv*",
        "PDF hisobotlar va nusxalanadigan qisqa xulosalar",
        "Shaxsiy tekshiruvlar tarixi",
      ],
      intelFootnote: "* Tahdidlar bazalariga so‘rov operator ularning API kalitlarini sozlagan bo‘lsagina yuboriladi. Hisobotlarda qaysi provayderlarga murojaat qilingani doim ko‘rsatiladi.",
    },
  },
});
