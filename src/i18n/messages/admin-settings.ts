import { defineMessages } from "../config";

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

type ModuleKey = "url" | "domain" | "dns" | "tls" | "redirects" | "content" | "download" | "intel";

type AdminSettingsText = {
  entries: (n: number) => string;
  /** What each threat-intelligence provider is queried with (by provider id). */
  providerScope: Record<string, string>;
  scanner: {
    modules: Record<ModuleKey, string>;
    modulesTitle: string;
    modulesText: string;
    weight: string;
    providersTitle: string;
    providersText: string;
    keyConfigured: string;
    notConfigured: string;
    vtSubmit: string;
    vtSubmitText: string;
    indicators: string;
    keywords: string;
    tlds: string;
    shorteners: string;
    patterns: string;
    patternsHint: string;
    trusted: string;
    trustedHint: string;
    limits: string;
    requestTimeout: string;
    scanTimeout: string;
    maxRedirects: string;
    maxPage: string;
    maxDownload: string;
    userAgent: string;
    save: string;
    resetTitle: string;
    resetText: string;
    resetConfirm: string;
    resetButton: string;
  };
  system: {
    website: string;
    siteName: string;
    supportEmail: string;
    security: string;
    sessionTtl: string;
    loginMax: string;
    loginWindow: string;
    ipBlock: string;
    paymentWindow: string;
    passwordMin: string;
    deviceRemovals: string;
    noSubDevices: string;
    allowRemoval: string;
    maintenance: string;
    maintenanceText: string;
    maintenanceMessage: string;
    save: string;
  };
  keys: {
    title: (hasKey: boolean, name: string) => string;
    vtText: string;
    text: string;
    replace: string;
    add: string;
    apiKey: string;
    save: string;
    removeTitle: (name: string) => string;
    removeText: string;
    remove: string;
    refresh: string;
  };
  unblock: {
    title: (ip: string) => string;
    text: string;
    button: string;
  };
};

/** Admin → Scanner and Settings forms, integration-key dialogs and the IP unblock button. */
export const adminSettingsText = defineMessages<AdminSettingsText>({
  en: {
    entries: (n) => `${n} entries`,
    providerScope: {
      googleSafeBrowsing: "URL (original and final)",
      virusTotal: "URL report (and file SHA-256 when a download is found)",
      urlhaus: "URL and host",
      phishTank: "URL",
      abuseIpdb: "Resolved server IP addresses",
    },
    scanner: {
      modules: { url: "URL analysis", domain: "Domain intelligence", dns: "DNS records", tls: "SSL/TLS certificate", redirects: "Redirect analysis", content: "Website content", download: "File downloads", intel: "Threat intelligence" },
      modulesTitle: "Analysis modules & risk weights",
      modulesText: "Disabled modules are reported as skipped. Weights multiply the finding weights of each module (0 = ignore, 1 = default, up to 5).",
      weight: "weight",
      providersTitle: "Threat-intelligence providers",
      providersText: "API keys are read from server environment variables and are never shown here.",
      keyConfigured: "· key configured",
      notConfigured: "· not configured",
      vtSubmit: "Submit unknown URLs to VirusTotal",
      vtSubmitText: "Off by default: submitted URLs become visible to other VirusTotal users.",
      indicators: "Indicators",
      keywords: "Suspicious keywords",
      tlds: "High-abuse TLDs (without dot)",
      shorteners: "URL shorteners",
      patterns: "Suspicious domain patterns",
      patternsHint: "Glob patterns only (* and ?), matched against the host. No regular expressions or code.",
      trusted: "Additional trusted domains",
      trustedHint: "Prefer the domain-intelligence whitelist; these only suppress heuristic checks.",
      limits: "Limits",
      requestTimeout: "Request timeout (ms)",
      scanTimeout: "Total scan timeout (ms)",
      maxRedirects: "Maximum redirects",
      maxPage: "Max page size (bytes)",
      maxDownload: "Max download hashed (bytes)",
      userAgent: "Scanner User-Agent",
      save: "Save scanner configuration",
      resetTitle: "Reset scanner configuration?",
      resetText: "Modules, providers, weights, indicator lists and limits return to the built-in defaults.",
      resetConfirm: "Reset",
      resetButton: "Reset to defaults",
    },
    system: {
      website: "Website & branding",
      siteName: "Site name",
      supportEmail: "Support e-mail (shown publicly)",
      security: "Security policies",
      sessionTtl: "Session lifetime (hours)",
      loginMax: "Failed logins before account lock / IP block",
      loginWindow: "Counting window (minutes)",
      ipBlock: "IP block duration (minutes)",
      paymentWindow: "Payment QR validity (seconds)",
      passwordMin: "Minimum password length",
      deviceRemovals: "Device self-removals per 30 days",
      noSubDevices: "Devices without a subscription",
      allowRemoval: "Users may remove their own devices",
      maintenance: "Maintenance mode",
      maintenanceText: "Shows a banner and blocks scanning for everyone except Super Admins.",
      maintenanceMessage: "Maintenance message",
      save: "Save settings",
    },
    keys: {
      title: (hasKey, name) => `${hasKey ? "Replace" : "Add"} ${name} API key`,
      vtText: "The key is checked with VirusTotal before it is saved. It is stored encrypted and never shown again.",
      text: "The key is stored encrypted and never shown again.",
      replace: "Replace key",
      add: "Add key",
      apiKey: "API key",
      save: "Save key",
      removeTitle: (name) => `Remove the stored ${name} key?`,
      removeText: "Scans fall back to the environment variable, or report the provider as Not configured.",
      remove: "Remove",
      refresh: "Refresh quota",
    },
    unblock: {
      title: (ip) => `Unblock ${ip}?`,
      text: "Sign-ins and scans from this address are allowed again and its failed-attempt counter is reset.",
      button: "Unblock",
    },
  },
  ru: {
    entries: (n) => `${n} ${ruPlural(n, "запись", "записи", "записей")}`,
    providerScope: {
      googleSafeBrowsing: "URL (исходный и конечный)",
      virusTotal: "Отчёт по URL (и SHA-256 файла, если найдена загрузка)",
      urlhaus: "URL и хост",
      phishTank: "URL",
      abuseIpdb: "IP-адреса сервера (по данным DNS)",
    },
    scanner: {
      modules: { url: "Анализ URL", domain: "Анализ домена", dns: "DNS-записи", tls: "SSL/TLS-сертификат", redirects: "Анализ перенаправлений", content: "Содержимое сайта", download: "Загрузки файлов", intel: "Базы угроз" },
      modulesTitle: "Модули анализа и веса риска",
      modulesText: "Отключённые модули отмечаются как пропущенные. Вес умножает значимость находок каждого модуля (0 = игнорировать, 1 = по умолчанию, до 5).",
      weight: "вес",
      providersTitle: "Провайдеры баз угроз",
      providersText: "API-ключи читаются из переменных окружения сервера и никогда здесь не показываются.",
      keyConfigured: "· ключ настроен",
      notConfigured: "· не настроен",
      vtSubmit: "Отправлять неизвестные URL в VirusTotal",
      vtSubmitText: "По умолчанию выключено: отправленные URL становятся видны другим пользователям VirusTotal.",
      indicators: "Индикаторы",
      keywords: "Подозрительные ключевые слова",
      tlds: "TLD с частыми злоупотреблениями (без точки)",
      shorteners: "Сервисы сокращения URL",
      patterns: "Подозрительные шаблоны доменов",
      patternsHint: "Только glob-шаблоны (* и ?), сравниваются с хостом. Без регулярных выражений и кода.",
      trusted: "Дополнительные доверенные домены",
      trustedHint: "Лучше используйте белый список в базе доменов; эти записи лишь отключают эвристические проверки.",
      limits: "Ограничения",
      requestTimeout: "Тайм-аут запроса (мс)",
      scanTimeout: "Общий тайм-аут проверки (мс)",
      maxRedirects: "Максимум перенаправлений",
      maxPage: "Макс. размер страницы (байт)",
      maxDownload: "Макс. размер хешируемой загрузки (байт)",
      userAgent: "User-Agent сканера",
      save: "Сохранить настройки сканера",
      resetTitle: "Сбросить настройки сканера?",
      resetText: "Модули, провайдеры, веса, списки индикаторов и ограничения вернутся к встроенным значениям по умолчанию.",
      resetConfirm: "Сбросить",
      resetButton: "Вернуть по умолчанию",
    },
    system: {
      website: "Сайт и брендинг",
      siteName: "Название сайта",
      supportEmail: "Эл. почта поддержки (видна всем)",
      security: "Политики безопасности",
      sessionTtl: "Время жизни сеанса (часы)",
      loginMax: "Неудачных входов до блокировки аккаунта / IP",
      loginWindow: "Окно подсчёта (минуты)",
      ipBlock: "Длительность блокировки IP (минуты)",
      paymentWindow: "Срок действия платёжного QR-кода (секунды)",
      passwordMin: "Минимальная длина пароля",
      deviceRemovals: "Самостоятельных удалений устройств за 30 дней",
      noSubDevices: "Устройств без подписки",
      allowRemoval: "Пользователи могут удалять свои устройства",
      maintenance: "Режим обслуживания",
      maintenanceText: "Показывает баннер и блокирует проверки для всех, кроме суперадминов.",
      maintenanceMessage: "Сообщение об обслуживании",
      save: "Сохранить настройки",
    },
    keys: {
      title: (hasKey, name) => `${hasKey ? "Заменить" : "Добавить"} API-ключ ${name}`,
      vtText: "Перед сохранением ключ проверяется в VirusTotal. Он хранится в зашифрованном виде и больше не показывается.",
      text: "Ключ хранится в зашифрованном виде и больше не показывается.",
      replace: "Заменить ключ",
      add: "Добавить ключ",
      apiKey: "API-ключ",
      save: "Сохранить ключ",
      removeTitle: (name) => `Удалить сохранённый ключ ${name}?`,
      removeText: "Проверки будут использовать переменную окружения, а если её нет — провайдер будет отмечен как «Не настроено».",
      remove: "Удалить",
      refresh: "Обновить квоту",
    },
    unblock: {
      title: (ip) => `Разблокировать ${ip}?`,
      text: "Вход и проверки с этого адреса снова будут разрешены, а счётчик неудачных попыток обнулится.",
      button: "Разблокировать",
    },
  },
  uz: {
    entries: (n) => `${n} ta yozuv`,
    providerScope: {
      googleSafeBrowsing: "URL (dastlabki va yakuniy)",
      virusTotal: "URL hisoboti (yuklab olinadigan fayl topilsa, uning SHA-256 xeshi ham)",
      urlhaus: "URL va xost",
      phishTank: "URL",
      abuseIpdb: "Server IP manzillari (DNS orqali aniqlangan)",
    },
    scanner: {
      modules: { url: "URL tahlili", domain: "Domen tahlili", dns: "DNS yozuvlari", tls: "SSL/TLS sertifikati", redirects: "Yo‘naltirishlar tahlili", content: "Sayt mazmuni", download: "Fayl yuklanmalari", intel: "Tahdidlar bazalari" },
      modulesTitle: "Tahlil modullari va xavf koeffitsiyentlari",
      modulesText: "O‘chirilgan modullar «o‘tkazib yuborildi» deb ko‘rsatiladi. Koeffitsiyent har bir modul topilmalarining og‘irligini ko‘paytiradi (0 = e’tiborga olinmaydi, 1 = standart, 5 gacha).",
      weight: "koeffitsiyent",
      providersTitle: "Tahdidlar bazalari provayderlari",
      providersText: "API kalitlari server muhit o‘zgaruvchilaridan o‘qiladi va bu yerda hech qachon ko‘rsatilmaydi.",
      keyConfigured: "· kalit sozlangan",
      notConfigured: "· sozlanmagan",
      vtSubmit: "Noma’lum URL manzillarni VirusTotal xizmatiga yuborish",
      vtSubmitText: "Odatda o‘chiq: yuborilgan URL manzillar VirusTotal xizmatining boshqa foydalanuvchilariga ko‘rinadi.",
      indicators: "Indikatorlar",
      keywords: "Shubhali kalit so‘zlar",
      tlds: "Ko‘p suiiste’mol qilinadigan TLD-lar (nuqtasiz)",
      shorteners: "URL qisqartirish xizmatlari",
      patterns: "Shubhali domen shablonlari",
      patternsHint: "Faqat glob shablonlar (* va ?), xost nomi bilan solishtiriladi. Muntazam ifodalar yoki kod ishlatilmaydi.",
      trusted: "Qo‘shimcha ishonchli domenlar",
      trustedHint: "Domenlar bazasidagi oq ro‘yxatdan foydalangan ma’qul; bular faqat evristik tekshiruvlarni o‘chiradi.",
      limits: "Limitlar",
      requestTimeout: "So‘rov kutish vaqti (ms)",
      scanTimeout: "Tekshiruvning umumiy kutish vaqti (ms)",
      maxRedirects: "Yo‘naltirishlarning maksimal soni",
      maxPage: "Sahifaning maksimal hajmi (bayt)",
      maxDownload: "Xeshlanadigan yuklanmaning maksimal hajmi (bayt)",
      userAgent: "Skaner User-Agent qiymati",
      save: "Skaner sozlamalarini saqlash",
      resetTitle: "Skaner sozlamalari tiklansinmi?",
      resetText: "Modullar, provayderlar, koeffitsiyentlar, indikatorlar ro‘yxatlari va limitlar standart qiymatlarga qaytariladi.",
      resetConfirm: "Tiklash",
      resetButton: "Standart qiymatlarga qaytarish",
    },
    system: {
      website: "Sayt va brend",
      siteName: "Sayt nomi",
      supportEmail: "Qo‘llab-quvvatlash e-pochtasi (hammaga ko‘rinadi)",
      security: "Xavfsizlik siyosati",
      sessionTtl: "Seans muddati (soat)",
      loginMax: "Akkaunt yoki IP bloklanishigacha muvaffaqiyatsiz kirishlar soni",
      loginWindow: "Hisoblash oralig‘i (daqiqa)",
      ipBlock: "IP bloklash muddati (daqiqa)",
      paymentWindow: "To‘lov QR kodining amal qilish muddati (soniya)",
      passwordMin: "Parolning minimal uzunligi",
      deviceRemovals: "30 kunda qurilmani mustaqil o‘chirishlar soni",
      noSubDevices: "Obunasiz qurilmalar soni",
      allowRemoval: "Foydalanuvchilar o‘z qurilmalarini o‘chira oladi",
      maintenance: "Texnik xizmat rejimi",
      maintenanceText: "Banner ko‘rsatiladi va Super Adminlardan boshqa hamma uchun tekshiruvlar to‘xtatiladi.",
      maintenanceMessage: "Texnik xizmat xabari",
      save: "Sozlamalarni saqlash",
    },
    keys: {
      title: (hasKey, name) => `${name} API kalitini ${hasKey ? "almashtirish" : "qo‘shish"}`,
      vtText: "Kalit saqlashdan oldin VirusTotal orqali tekshiriladi. U shifrlangan holda saqlanadi va boshqa ko‘rsatilmaydi.",
      text: "Kalit shifrlangan holda saqlanadi va boshqa ko‘rsatilmaydi.",
      replace: "Kalitni almashtirish",
      add: "Kalit qo‘shish",
      apiKey: "API kaliti",
      save: "Kalitni saqlash",
      removeTitle: (name) => `Saqlangan ${name} kaliti o‘chirilsinmi?`,
      removeText: "Tekshiruvlar muhit o‘zgaruvchisidagi kalitdan foydalanadi, u bo‘lmasa provayder «Sozlanmagan» deb ko‘rsatiladi.",
      remove: "O‘chirish",
      refresh: "Kvotani yangilash",
    },
    unblock: {
      title: (ip) => `${ip} blokdan chiqarilsinmi?`,
      text: "Bu manzildan yana kirish va tekshiruv o‘tkazish mumkin bo‘ladi, muvaffaqiyatsiz urinishlar hisoblagichi nolga tushiriladi.",
      button: "Blokdan chiqarish",
    },
  },
});
