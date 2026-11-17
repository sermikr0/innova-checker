import { defineMessages } from "../config";

/** A heading with one highlighted (gradient) fragment. */
type HighlightTitle = { before: string; highlight: string };
type FindingKey = "credentials" | "telegram" | "newDomain" | "brand" | "language";
type ModuleKey = "url" | "domain" | "dns" | "ssl" | "content" | "intel";
type Heading = { eyebrow: string; title: string; subtitle: string };

type HomeText = {
  hero: {
    badge: string;
    tagline: string;
    /** Rendered as three spans: two silver, the last one orange. */
    title: { first: string; second: string; highlight: string };
    subtitle: string;
    points: { modules: string; isolated: string; evidence: string; noFabricated: string };
  };
  /** Illustrative report on the landing page. */
  report: {
    exampleLabel: string;
    verdict: string;
    stats: { domainAgeValue: string; domainAge: string; redirects: string; intelHits: string };
    keyFindings: string;
    flaggedCount: string;
    findings: Record<FindingKey, { title: string; detail: string }>;
    modulesTitle: string;
    modules: Record<ModuleKey, string>;
    recommendationTitle: string;
    /** The recommendation text wraps the highlighted "dhl.com". */
    recommendation: { before: string; after: string };
  };
  page: {
    exampleReportLabel: string;
    howItWorks: Heading;
    detection: { eyebrow: string; title: HighlightTitle; subtitle: string };
    exploreFeatures: string;
    why: Heading;
    pricing: Heading;
    compareAll: (n: number) => string;
    faqEyebrow: string;
    faqTitle: string;
  };
};

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

/** Landing page: hero, example report and page sections. */
export const homeText = defineMessages<HomeText>({
  en: {
    hero: {
      badge: "New",
      tagline: "Phishing protection built for logistics teams",
      title: { first: "Know Before ", second: "You ", highlight: "Click." },
      subtitle: "Advanced URL security intelligence to detect phishing, scams, malicious websites, and suspicious links before they become a threat.",
      points: { modules: "8 analysis modules", isolated: "Isolated, no script execution", evidence: "Evidence for every check", noFabricated: "No fabricated verdicts" },
    },
    report: {
      exampleLabel: "Example report · illustrative data",
      verdict: "Malicious",
      stats: { domainAgeValue: "3 days", domainAge: "Domain age", redirects: "Redirects", intelHits: "Intel hits" },
      keyFindings: "Key findings",
      flaggedCount: "5 of 71 checks flagged",
      findings: {
        credentials: { title: "Credential harvesting page", detail: "Password form branded as DHL on a non-DHL domain" },
        telegram: { title: "Data exfiltration to Telegram", detail: "api.telegram.org/bot… found in page code" },
        newDomain: { title: "Domain registered 3 days ago", detail: "RDAP creation date · registrar NameSilo" },
        brand: { title: "Brand impersonation in domain", detail: "“dhl” + “redelivery” on .top" },
        language: { title: "Social-engineering language", detail: "“redelivery fee”, “within 24 hours”" },
      },
      modulesTitle: "Analysis modules",
      modules: { url: "URL", domain: "Domain", dns: "DNS", ssl: "SSL/TLS", content: "Content", intel: "Intel" },
      recommendationTitle: "Recommendation",
      recommendation: { before: "Do not open this link. To check a DHL shipment, type ", after: " into the address bar yourself. If you entered a password, change it now." },
    },
    page: {
      exampleReportLabel: "Example report",
      howItWorks: { eyebrow: "How it works", title: "From suspicious link to clear answer in seconds", subtitle: "No installation, no browser extension, no risk of opening the page yourself." },
      detection: { eyebrow: "Advanced detection", title: { before: "Eight engines. ", highlight: "One verdict." }, subtitle: "Every scan runs the full analysis pipeline and shows exactly which checks fired, why, and where the data came from." },
      exploreFeatures: "Explore all detection features",
      why: { eyebrow: "Why Innova Checker", title: "Made for the people who open freight links all day", subtitle: "Generic URL scanners are built for researchers. Innova Checker is built for dispatchers, brokers, forwarders and accountants." },
      pricing: { eyebrow: "Pricing", title: "Simple plans in Uzbekistani so'm", subtitle: "Every plan includes the full analysis engine. Plans differ only in duration and the number of devices." },
      compareAll: (n) => `Compare all ${n} plans`,
      faqEyebrow: "FAQ",
      faqTitle: "Questions, answered",
    },
  },
  ru: {
    hero: {
      badge: "Новое",
      tagline: "Защита от фишинга для логистических команд",
      title: { first: "Проверьте, ", second: "прежде чем ", highlight: "кликнуть." },
      subtitle: "Продвинутый анализ безопасности ссылок: выявляет фишинг, мошенничество, вредоносные сайты и подозрительные ссылки до того, как они станут угрозой.",
      points: { modules: "8 модулей анализа", isolated: "Изоляция, скрипты не выполняются", evidence: "Доказательства для каждой проверки", noFabricated: "Никаких выдуманных вердиктов" },
    },
    report: {
      exampleLabel: "Пример отчёта · демонстрационные данные",
      verdict: "Вредоносно",
      stats: { domainAgeValue: "3 дня", domainAge: "Возраст домена", redirects: "Перенаправления", intelHits: "Совпадения в базах" },
      keyFindings: "Ключевые находки",
      flaggedCount: "Сработало 5 из 71 проверки",
      findings: {
        credentials: { title: "Страница кражи учётных данных", detail: "Форма ввода пароля с брендом DHL на чужом домене" },
        telegram: { title: "Отправка данных в Telegram", detail: "В коде страницы найден api.telegram.org/bot…" },
        newDomain: { title: "Домен зарегистрирован 3 дня назад", detail: "Дата создания по RDAP · регистратор NameSilo" },
        brand: { title: "Имитация бренда в домене", detail: "«dhl» + «redelivery» в зоне .top" },
        language: { title: "Приёмы социальной инженерии", detail: "«redelivery fee», «within 24 hours»" },
      },
      modulesTitle: "Модули анализа",
      modules: { url: "URL", domain: "Домен", dns: "DNS", ssl: "SSL/TLS", content: "Контент", intel: "Базы угроз" },
      recommendationTitle: "Рекомендация",
      recommendation: { before: "Не открывайте эту ссылку. Чтобы проверить отправление DHL, сами введите ", after: " в адресной строке. Если вы ввели пароль, смените его прямо сейчас." },
    },
    page: {
      exampleReportLabel: "Пример отчёта",
      howItWorks: { eyebrow: "Как это работает", title: "От подозрительной ссылки до понятного ответа за секунды", subtitle: "Без установки, без расширений для браузера и без риска открыть страницу самому." },
      detection: { eyebrow: "Продвинутое обнаружение", title: { before: "Восемь движков. ", highlight: "Один вердикт." }, subtitle: "Каждая проверка проходит полный цикл анализа и показывает, какие проверки сработали, почему и откуда взяты данные." },
      exploreFeatures: "Все возможности обнаружения",
      why: { eyebrow: "Почему Innova Checker", title: "Для тех, кто весь день открывает ссылки по грузам", subtitle: "Обычные URL-сканеры созданы для исследователей. Innova Checker создан для диспетчеров, брокеров, экспедиторов и бухгалтеров." },
      pricing: { eyebrow: "Цены", title: "Простые тарифы в узбекских сумах", subtitle: "Каждый тариф включает полный движок анализа. Тарифы отличаются только сроком и количеством устройств." },
      compareAll: (n) => `Сравнить все ${n} ${ruPlural(n, "тариф", "тарифа", "тарифов")}`,
      faqEyebrow: "Частые вопросы",
      faqTitle: "Ответы на вопросы",
    },
  },
  uz: {
    hero: {
      badge: "Yangi",
      tagline: "Logistika jamoalari uchun fishingdan himoya",
      title: { first: "Bosishdan ", second: "oldin ", highlight: "tekshiring." },
      subtitle: "Havolalar xavfsizligini chuqur tahlil qilish: fishing, firibgarlik, zararli saytlar va shubhali havolalarni ular tahdidga aylanmasidan oldin aniqlaydi.",
      points: { modules: "8 ta tahlil moduli", isolated: "Izolyatsiya, skriptlar ishga tushirilmaydi", evidence: "Har bir tekshiruv uchun dalil", noFabricated: "To‘qib chiqarilgan xulosalar yo‘q" },
    },
    report: {
      exampleLabel: "Hisobot namunasi · namunaviy ma’lumotlar",
      verdict: "Zararli",
      stats: { domainAgeValue: "3 kun", domainAge: "Domen yoshi", redirects: "Yo‘naltirishlar", intelHits: "Bazalarda topildi" },
      keyFindings: "Asosiy topilmalar",
      flaggedCount: "71 ta tekshiruvdan 5 tasida xavf topildi",
      findings: {
        credentials: { title: "Login ma’lumotlarini o‘g‘irlovchi sahifa", detail: "DHL bilan bog‘liq bo‘lmagan domendagi DHL brendli parol formasi" },
        telegram: { title: "Ma’lumotlarni Telegram orqali chiqarish", detail: "Sahifa kodida api.telegram.org/bot… topildi" },
        newDomain: { title: "Domen 3 kun oldin ro‘yxatdan o‘tgan", detail: "RDAP bo‘yicha yaratilgan sana · registrator NameSilo" },
        brand: { title: "Domenda brendga taqlid", detail: "“dhl” + “redelivery”, .top zonasida" },
        language: { title: "Ijtimoiy muhandislik iboralari", detail: "“redelivery fee”, “within 24 hours”" },
      },
      modulesTitle: "Tahlil modullari",
      modules: { url: "URL", domain: "Domen", dns: "DNS", ssl: "SSL/TLS", content: "Mazmun", intel: "Bazalar" },
      recommendationTitle: "Tavsiya",
      recommendation: { before: "Bu havolani ochmang. DHL jo‘natmasini tekshirish uchun manzil satriga ", after: " manzilini o‘zingiz yozing. Agar parol kiritgan bo‘lsangiz, uni hoziroq almashtiring." },
    },
    page: {
      exampleReportLabel: "Hisobot namunasi",
      howItWorks: { eyebrow: "Qanday ishlaydi", title: "Shubhali havoladan aniq javobgacha — bir necha soniyada", subtitle: "O‘rnatish ham, brauzer kengaytmasi ham kerak emas, sahifani o‘zingiz ochish xavfi ham yo‘q." },
      detection: { eyebrow: "Kengaytirilgan aniqlash", title: { before: "Sakkiz modul. ", highlight: "Bitta xulosa." }, subtitle: "Har bir tekshiruv to‘liq tahlil jarayonidan o‘tadi va qaysi tekshiruvlar ishlaganini, nima sababdan va ma’lumot qayerdan olinganini aniq ko‘rsatadi." },
      exploreFeatures: "Barcha aniqlash imkoniyatlari",
      why: { eyebrow: "Nega Innova Checker", title: "Kun bo‘yi yuk bilan bog‘liq havolalarni ochadiganlar uchun", subtitle: "Oddiy URL skanerlari tadqiqotchilar uchun yaratilgan. Innova Checker esa dispetcherlar, brokerlar, ekspeditorlar va buxgalterlar uchun." },
      pricing: { eyebrow: "Narxlar", title: "O‘zbek so‘midagi oddiy tariflar", subtitle: "Har bir tarif to‘liq tahlil imkoniyatlarini o‘z ichiga oladi. Tariflar faqat muddati va qurilmalar soni bilan farq qiladi." },
      compareAll: (n) => `Barcha ${n} ta tarifni solishtirish`,
      faqEyebrow: "Ko‘p so‘raladigan savollar",
      faqTitle: "Savollaringizga javoblar",
    },
  },
});
