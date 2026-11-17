import { defineMessages } from "../config";

// Text around the URL security report (report-view.tsx) and its plain-text copy
// (lib/report-text.ts). Findings, the engine summary and recommendations come
// from the scanner engine in English and are not part of this namespace.

type Module = "url" | "domain" | "tls" | "dns" | "redirects" | "content" | "download" | "intel";
type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "Minimal";
type DbDecision = "BLACKLIST" | "SUSPICIOUS" | "IMPERSONATION" | "WHITELIST" | "WHITELIST_OVERRIDDEN" | "NONE" | "UNAVAILABLE";
type ListType = "WHITELIST" | "BLACKLIST" | "SUSPICIOUS";
type TrustStatus = "VERIFIED_OFFICIAL" | "CONFIRMED_MALICIOUS" | "SUSPECTED" | "UNVERIFIED";
type MatchType = "exact" | "subdomain" | "url";

type ReportText = {
  /** Module section titles; MODULE_LABELS in lib/report-types.ts is the English fallback. */
  modules: Record<Module, string>;
  riskLevels: Record<RiskLevel, string>;
  /** Labels and fixed values of the fact grids inside each module section. */
  facts: {
    none: string;
    yes: string;
    no: string;
    unavailable: string;
    // URL
    scheme: string;
    host: string;
    registrableDomain: string;
    subdomainDepth: string;
    port: string;
    portDefault: string;
    queryParams: string;
    lureKeywords: string;
    brandsReferenced: string;
    hostingPlatform: string;
    notFreeHosting: string;
    urlShortener: string;
    // Domain
    domain: string;
    registrar: string;
    created: string;
    domainAge: string;
    days: (n: number) => string;
    expires: string;
    lastChanged: string;
    registryStatus: string;
    nameservers: string;
    dataSource: string;
    // SSL/TLS
    httpsAvailable: string;
    yesPort: (port: string) => string;
    protocolCipher: string;
    subject: string;
    issuer: string;
    validFrom: string;
    validUntil: string;
    daysToExpiry: string;
    chainTrusted: string;
    noBecause: (reason: string) => string;
    subjectAltNames: string;
    sha256Fingerprint: string;
    // Content
    status: string;
    pageTitle: string;
    description: string;
    httpStatus: string;
    contentType: string;
    sizeAnalyzed: string;
    bytes: (n: number, formatted: string) => string;
    truncated: string;
    forms: string;
    formsWithPassword: (total: number, withPassword: number) => string;
    scripts: string;
    scriptsCount: (inline: string, external: number) => string;
    iframes: string;
    externalDomains: string;
    serverHeader: string;
    // Download
    download: string;
    opensWebPage: string;
    fileName: string;
    detectedType: string;
    unrecognized: string;
    category: string;
    declaredMime: string;
    bytesAnalyzed: string;
    sizeLimitReached: string;
    notAvailable: string;
  };
  finding: { source: string; checked: string; checkId: string };
  run: { completed: string; disabled: string; skipped: string; partial: string; unavailable: string; failed: string };
  badges: { fail: (n: number) => string; warn: (n: number) => string; pass: (n: number) => string };
  redirectBlocked: string;
  redirectError: string;
  intel: { provider: string; status: string; result: string; checked: string; ms: (n: number) => string; noProviders: string };
  db: {
    title: string;
    decision: Record<DbDecision, string>;
    /** Text around the imitated brand name: before + <brand> + after + official domains. */
    imitatesBefore: string;
    imitatesAfter: string;
    listType: Record<ListType, string>;
    matched: (host: string, matchType: string) => string;
    matchType: Record<MatchType, string>;
    platform: string;
    company: string;
    category: string;
    trustStatus: string;
    trust: Record<TrustStatus, string>;
    verificationSource: string;
    verified: string;
  };
  copied: string;
  copyFailed: string;
  back: string;
  eyebrow: string;
  scanId: string;
  duration: string;
  status: string;
  completed: string;
  downloadPdf: string;
  copyReport: string;
  collapse: string;
  expand: string;
  scanAnother: string;
  riskLevel: string;
  target: string;
  scannedUrl: string;
  finalDestination: string;
  domain: string;
  scanDate: string;
  coverage: string;
  modulesCompleted: (ok: number, enabled: number) => string;
  restNeedLiveSite: string;
  providersConsulted: (run: number, total: number) => string;
  verdictSummary: string;
  noFindings: string;
  recommendations: string;
  disclaimerTitle: string;
  disclaimer: string;
  sectionsAria: string;
  sections: string;
  navRecommendations: string;
  /** Plain-text report produced by "Copy Report". */
  copy: {
    title: string;
    verdict: string;
    riskScore: string;
    scannedUrl: string;
    finalUrl: string;
    domain: string;
    scannedAt: string;
    duration: string;
    seconds: (s: string) => string;
    coverage: string;
    reportId: string;
    summary: string;
    domainDb: string;
    dbMatch: (listType: string, domain: string, trust: string, source: string, verified: string) => string;
    trust: Record<TrustStatus, string>;
    risk: (weight: number) => string;
    recommendations: string;
    disclaimer: string;
  };
};

/** Russian plural: one (1, 21), few (2–4, 22–24), many (0, 5–20, 25…). */
function ru(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

export const reportText = defineMessages<ReportText>({
  en: {
    modules: {
      url: "URL Analysis",
      domain: "Domain Intelligence",
      tls: "SSL/TLS Certificate",
      dns: "DNS Records",
      redirects: "Redirect Analysis",
      content: "Website Content Analysis",
      download: "File Download Analysis",
      intel: "Threat Intelligence Results",
    },
    riskLevels: { Critical: "Critical", High: "High", Medium: "Medium", Low: "Low", Minimal: "Minimal" },
    facts: {
      none: "none",
      yes: "Yes",
      no: "No",
      unavailable: "Unavailable",
      scheme: "Scheme",
      host: "Host",
      registrableDomain: "Registrable domain",
      subdomainDepth: "Subdomain depth",
      port: "Port",
      portDefault: "default",
      queryParams: "Query parameters",
      lureKeywords: "Lure keywords",
      brandsReferenced: "Brands referenced",
      hostingPlatform: "Hosting platform",
      notFreeHosting: "not a free-hosting platform",
      urlShortener: "URL shortener",
      domain: "Domain",
      registrar: "Registrar",
      created: "Created",
      domainAge: "Domain age",
      days: (n) => `${n} days`,
      expires: "Expires",
      lastChanged: "Last changed",
      registryStatus: "Registry status",
      nameservers: "Nameservers",
      dataSource: "Data source",
      httpsAvailable: "HTTPS available",
      yesPort: (port) => `Yes (port ${port})`,
      protocolCipher: "Protocol / cipher",
      subject: "Subject",
      issuer: "Issuer",
      validFrom: "Valid from",
      validUntil: "Valid until",
      daysToExpiry: "Days to expiry",
      chainTrusted: "Chain trusted",
      noBecause: (reason) => `No (${reason})`,
      subjectAltNames: "Subject alt names",
      sha256Fingerprint: "SHA-256 fingerprint",
      status: "Status",
      pageTitle: "Page title",
      description: "Description",
      httpStatus: "HTTP status",
      contentType: "Content type",
      sizeAnalyzed: "Size analyzed",
      bytes: (_n, f) => `${f} bytes`,
      truncated: " (truncated)",
      forms: "Forms",
      formsWithPassword: (total, pw) => `${total} (${pw} with password)`,
      scripts: "Scripts",
      scriptsCount: (inline, external) => `${inline} inline · ${external} external`,
      iframes: "Iframes",
      externalDomains: "External domains",
      serverHeader: "Server header",
      download: "Download",
      opensWebPage: "The link opens a web page, not a file",
      fileName: "File name",
      detectedType: "Detected type",
      unrecognized: "unrecognized",
      category: "Category",
      declaredMime: "Declared MIME",
      bytesAnalyzed: "Bytes analyzed",
      sizeLimitReached: " (size limit reached)",
      notAvailable: "not available",
    },
    finding: { source: "Source: ", checked: "Checked: ", checkId: "Check ID: " },
    run: { completed: "Completed", disabled: "Disabled", skipped: "Skipped", partial: "Partially completed", unavailable: "Unavailable", failed: "Failed" },
    badges: { fail: (n) => `${n} fail`, warn: (n) => `${n} warn`, pass: (n) => `${n} pass` },
    redirectBlocked: "BLOCKED",
    redirectError: "ERROR",
    intel: {
      provider: "Provider",
      status: "Status",
      result: "Result",
      checked: "Checked",
      ms: (n) => `${n} ms`,
      noProviders: "No threat-intelligence provider was consulted for this scan. The verdict is based on Innova Checker's own analysis modules only.",
    },
    db: {
      title: "Domain intelligence database",
      decision: {
        BLACKLIST: "Blacklist match",
        SUSPICIOUS: "Suspicious-list match",
        IMPERSONATION: "Impersonates a verified platform",
        WHITELIST: "Verified official domain",
        WHITELIST_OVERRIDDEN: "Official domain — trust withheld",
        NONE: "No database match",
        UNAVAILABLE: "Database unavailable",
      },
      imitatesBefore: "Imitates ",
      imitatesAfter: ". Official domains: ",
      listType: { WHITELIST: "WHITELIST", BLACKLIST: "BLACKLIST", SUSPICIOUS: "SUSPICIOUS" },
      matched: (host, type) => `· matched ${host} (${type})`,
      matchType: { exact: "exact", subdomain: "subdomain", url: "url" },
      platform: "Platform: ",
      company: "Company: ",
      category: "Category: ",
      trustStatus: "Trust status: ",
      trust: { VERIFIED_OFFICIAL: "verified official", CONFIRMED_MALICIOUS: "confirmed malicious", SUSPECTED: "suspected", UNVERIFIED: "unverified" },
      verificationSource: "Verification source: ",
      verified: "Verified: ",
    },
    copied: "Report copied to clipboard",
    copyFailed: "Copy failed. Your browser blocked clipboard access.",
    back: "Back",
    eyebrow: "Security Report",
    scanId: "Scan ID:",
    duration: "Duration:",
    status: "Status:",
    completed: "completed",
    downloadPdf: "Download PDF Report",
    copyReport: "Copy Report",
    collapse: "Collapse Analysis",
    expand: "View Full Analysis",
    scanAnother: "Scan Another URL",
    riskLevel: "Risk level:",
    target: "Target",
    scannedUrl: "Scanned URL",
    finalDestination: "Final destination",
    domain: "Domain",
    scanDate: "Scan date",
    coverage: "Analysis coverage",
    modulesCompleted: (ok, enabled) => `${ok}/${enabled} analysis modules completed`,
    restNeedLiveSite: " (the rest need a live website)",
    providersConsulted: (run, total) => `${run}/${total} threat-intel providers consulted`,
    verdictSummary: "Verdict summary",
    noFindings: "No risk-scoring findings were raised.",
    recommendations: "Security Recommendations",
    disclaimerTitle: "Disclaimer.",
    disclaimer:
      "No automated scanner can guarantee that a website is 100% safe. Attackers change content, serve different pages to different visitors and use brand-new infrastructure. Use this report as one input to your judgement and follow your company's security policy.",
    sectionsAria: "Report sections",
    sections: "Sections",
    navRecommendations: "Recommendations",
    copy: {
      title: "INNOVA CHECKER — URL SECURITY REPORT",
      verdict: "Verdict:",
      riskScore: "Risk score:",
      scannedUrl: "Scanned URL:",
      finalUrl: "Final URL:",
      domain: "Domain:",
      scannedAt: "Scanned at:",
      duration: "Duration:",
      seconds: (s) => `${s} s`,
      coverage: "Coverage:",
      reportId: "Report ID:",
      summary: "Summary:",
      domainDb: "Domain intelligence:",
      dbMatch: (list, domain, trust, source, verified) => `${list} ${domain} (${trust}) — source: ${source}; verified ${verified}`,
      trust: { VERIFIED_OFFICIAL: "VERIFIED_OFFICIAL", CONFIRMED_MALICIOUS: "CONFIRMED_MALICIOUS", SUSPECTED: "SUSPECTED", UNVERIFIED: "UNVERIFIED" },
      risk: (w) => ` (risk +${w})`,
      recommendations: "## Security recommendations",
      disclaimer: "Disclaimer:",
    },
  },
  ru: {
    modules: {
      url: "Анализ URL",
      domain: "Сведения о домене",
      tls: "Сертификат SSL/TLS",
      dns: "DNS-записи",
      redirects: "Анализ перенаправлений",
      content: "Анализ содержимого сайта",
      download: "Анализ загружаемых файлов",
      intel: "Результаты по базам угроз",
    },
    riskLevels: { Critical: "Критический", High: "Высокий", Medium: "Средний", Low: "Низкий", Minimal: "Минимальный" },
    facts: {
      none: "нет",
      yes: "Да",
      no: "Нет",
      unavailable: "Недоступно",
      scheme: "Схема",
      host: "Хост",
      registrableDomain: "Регистрируемый домен",
      subdomainDepth: "Глубина поддоменов",
      port: "Порт",
      portDefault: "по умолчанию",
      queryParams: "Параметры запроса",
      lureKeywords: "Слова-приманки",
      brandsReferenced: "Упомянутые бренды",
      hostingPlatform: "Хостинг-платформа",
      notFreeHosting: "не бесплатный хостинг",
      urlShortener: "Сокращатель ссылок",
      domain: "Домен",
      registrar: "Регистратор",
      created: "Создан",
      domainAge: "Возраст домена",
      days: (n) => `${n} ${ru(n, "день", "дня", "дней")}`,
      expires: "Истекает",
      lastChanged: "Последнее изменение",
      registryStatus: "Статус в реестре",
      nameservers: "NS-серверы",
      dataSource: "Источник данных",
      httpsAvailable: "HTTPS доступен",
      yesPort: (port) => `Да (порт ${port})`,
      protocolCipher: "Протокол / шифр",
      subject: "Кому выдан",
      issuer: "Кем выдан",
      validFrom: "Действует с",
      validUntil: "Действует до",
      daysToExpiry: "Дней до истечения",
      chainTrusted: "Цепочка доверенная",
      noBecause: (reason) => `Нет (${reason})`,
      subjectAltNames: "Альтернативные имена (SAN)",
      sha256Fingerprint: "Отпечаток SHA-256",
      status: "Статус",
      pageTitle: "Заголовок страницы",
      description: "Описание",
      httpStatus: "HTTP-статус",
      contentType: "Тип содержимого",
      sizeAnalyzed: "Проанализировано",
      bytes: (n, f) => `${f} ${ru(n, "байт", "байта", "байт")}`,
      truncated: " (обрезано)",
      forms: "Формы",
      formsWithPassword: (total, pw) => `${total} (с паролем: ${pw})`,
      scripts: "Скрипты",
      scriptsCount: (inline, external) => `встроенных: ${inline} · внешних: ${external}`,
      iframes: "Iframe-элементы",
      externalDomains: "Внешние домены",
      serverHeader: "Заголовок Server",
      download: "Загрузка",
      opensWebPage: "Ссылка открывает веб-страницу, а не файл",
      fileName: "Имя файла",
      detectedType: "Определённый тип",
      unrecognized: "не распознан",
      category: "Категория",
      declaredMime: "Заявленный MIME",
      bytesAnalyzed: "Проанализировано байт",
      sizeLimitReached: " (достигнут лимит размера)",
      notAvailable: "недоступно",
    },
    finding: { source: "Источник: ", checked: "Проверено: ", checkId: "ID проверки: " },
    run: { completed: "Выполнено", disabled: "Отключено", skipped: "Пропущено", partial: "Выполнено частично", unavailable: "Недоступно", failed: "Ошибка" },
    badges: {
      fail: (n) => `${n} ${ru(n, "проблема", "проблемы", "проблем")}`,
      warn: (n) => `${n} ${ru(n, "предупреждение", "предупреждения", "предупреждений")}`,
      pass: (n) => `${n} в норме`,
    },
    redirectBlocked: "БЛОК",
    redirectError: "ОШИБКА",
    intel: {
      provider: "Провайдер",
      status: "Статус",
      result: "Результат",
      checked: "Проверено",
      ms: (n) => `${n} мс`,
      noProviders: "При этой проверке базы угроз не запрашивались. Вердикт основан только на собственных модулях анализа Innova Checker.",
    },
    db: {
      title: "База данных доменов",
      decision: {
        BLACKLIST: "Совпадение с чёрным списком",
        SUSPICIOUS: "Совпадение со списком подозрительных",
        IMPERSONATION: "Выдаёт себя за проверенную платформу",
        WHITELIST: "Проверенный официальный домен",
        WHITELIST_OVERRIDDEN: "Официальный домен — доверие приостановлено",
        NONE: "Нет совпадений в базе",
        UNAVAILABLE: "База недоступна",
      },
      imitatesBefore: "Имитирует ",
      imitatesAfter: ". Официальные домены: ",
      listType: { WHITELIST: "БЕЛЫЙ СПИСОК", BLACKLIST: "ЧЁРНЫЙ СПИСОК", SUSPICIOUS: "ПОДОЗРИТЕЛЬНЫЕ" },
      matched: (host, type) => `· совпадение: ${host} (${type})`,
      matchType: { exact: "точное", subdomain: "поддомен", url: "URL" },
      platform: "Платформа: ",
      company: "Компания: ",
      category: "Категория: ",
      trustStatus: "Статус доверия: ",
      trust: { VERIFIED_OFFICIAL: "проверенный официальный", CONFIRMED_MALICIOUS: "подтверждённо вредоносный", SUSPECTED: "под подозрением", UNVERIFIED: "не проверен" },
      verificationSource: "Источник проверки: ",
      verified: "Проверено: ",
    },
    copied: "Отчёт скопирован в буфер обмена",
    copyFailed: "Не удалось скопировать. Браузер заблокировал доступ к буферу обмена.",
    back: "Назад",
    eyebrow: "Отчёт о безопасности",
    scanId: "ID проверки:",
    duration: "Длительность:",
    status: "Статус:",
    completed: "завершена",
    downloadPdf: "Скачать PDF-отчёт",
    copyReport: "Копировать отчёт",
    collapse: "Свернуть анализ",
    expand: "Показать полный анализ",
    scanAnother: "Проверить другую ссылку",
    riskLevel: "Уровень риска:",
    target: "Объект проверки",
    scannedUrl: "Проверенная ссылка",
    finalDestination: "Конечный адрес",
    domain: "Домен",
    scanDate: "Дата проверки",
    coverage: "Полнота анализа",
    modulesCompleted: (ok, enabled) => `Выполнено модулей анализа: ${ok}/${enabled}`,
    restNeedLiveSite: " (остальным нужен работающий сайт)",
    providersConsulted: (run, total) => `запрошено баз угроз: ${run}/${total}`,
    verdictSummary: "Итоги проверки",
    noFindings: "Факторов, повышающих риск, не обнаружено.",
    recommendations: "Рекомендации по безопасности",
    disclaimerTitle: "Отказ от ответственности.",
    disclaimer:
      "Ни один автоматический сканер не может гарантировать, что сайт безопасен на 100%. Злоумышленники меняют содержимое, показывают разным посетителям разные страницы и используют совершенно новую инфраструктуру. Используйте этот отчёт как один из источников для своего решения и следуйте политике безопасности вашей компании.",
    sectionsAria: "Разделы отчёта",
    sections: "Разделы",
    navRecommendations: "Рекомендации",
    copy: {
      title: "INNOVA CHECKER — ОТЧЁТ О БЕЗОПАСНОСТИ ССЫЛКИ",
      verdict: "Вердикт:",
      riskScore: "Оценка риска:",
      scannedUrl: "Проверенная ссылка:",
      finalUrl: "Конечный адрес:",
      domain: "Домен:",
      scannedAt: "Время проверки:",
      duration: "Длительность:",
      seconds: (s) => `${s} с`,
      coverage: "Полнота:",
      reportId: "ID отчёта:",
      summary: "Кратко:",
      domainDb: "База доменов:",
      dbMatch: (list, domain, trust, source, verified) => `${list} ${domain} (${trust}) — источник: ${source}; проверено ${verified}`,
      trust: { VERIFIED_OFFICIAL: "проверенный официальный", CONFIRMED_MALICIOUS: "подтверждённо вредоносный", SUSPECTED: "под подозрением", UNVERIFIED: "не проверен" },
      risk: (w) => ` (риск +${w})`,
      recommendations: "## Рекомендации по безопасности",
      disclaimer: "Отказ от ответственности:",
    },
  },
  uz: {
    modules: {
      url: "URL tahlili",
      domain: "Domen ma’lumotlari",
      tls: "SSL/TLS sertifikati",
      dns: "DNS yozuvlari",
      redirects: "Yo‘naltirishlar tahlili",
      content: "Sayt mazmuni tahlili",
      download: "Yuklanadigan fayllar tahlili",
      intel: "Tahdidlar bazalari natijalari",
    },
    riskLevels: { Critical: "Kritik", High: "Yuqori", Medium: "O‘rta", Low: "Past", Minimal: "Minimal" },
    facts: {
      none: "yo‘q",
      yes: "Ha",
      no: "Yo‘q",
      unavailable: "Mavjud emas",
      scheme: "Sxema",
      host: "Xost",
      registrableDomain: "Asosiy domen",
      subdomainDepth: "Subdomen chuqurligi",
      port: "Port",
      portDefault: "standart",
      queryParams: "So‘rov parametrlari",
      lureKeywords: "Aldovchi kalit so‘zlar",
      brandsReferenced: "Tilga olingan brendlar",
      hostingPlatform: "Hosting platformasi",
      notFreeHosting: "bepul hosting platformasi emas",
      urlShortener: "Havola qisqartiruvchi",
      domain: "Domen",
      registrar: "Registrator",
      created: "Yaratilgan",
      domainAge: "Domen yoshi",
      days: (n) => `${n} kun`,
      expires: "Muddati tugaydi",
      lastChanged: "Oxirgi o‘zgarish",
      registryStatus: "Reyestrdagi holati",
      nameservers: "NS serverlar",
      dataSource: "Ma’lumot manbasi",
      httpsAvailable: "HTTPS mavjud",
      yesPort: (port) => `Ha (port ${port})`,
      protocolCipher: "Protokol / shifr",
      subject: "Kimga berilgan",
      issuer: "Kim tomonidan berilgan",
      validFrom: "Amal qilish boshi",
      validUntil: "Amal qilish oxiri",
      daysToExpiry: "Tugashiga qolgan kunlar",
      chainTrusted: "Zanjir ishonchli",
      noBecause: (reason) => `Yo‘q (${reason})`,
      subjectAltNames: "Muqobil nomlar (SAN)",
      sha256Fingerprint: "SHA-256 barmoq izi",
      status: "Holat",
      pageTitle: "Sahifa sarlavhasi",
      description: "Tavsif",
      httpStatus: "HTTP holati",
      contentType: "Kontent turi",
      sizeAnalyzed: "Tahlil qilingan hajm",
      bytes: (_n, f) => `${f} bayt`,
      truncated: " (qisqartirilgan)",
      forms: "Formalar",
      formsWithPassword: (total, pw) => `${total} (${pw} tasida parol maydoni)`,
      scripts: "Skriptlar",
      scriptsCount: (inline, external) => `${inline} ta ichki · ${external} ta tashqi`,
      iframes: "Iframe elementlari",
      externalDomains: "Tashqi domenlar",
      serverHeader: "Server sarlavhasi",
      download: "Yuklab olish",
      opensWebPage: "Havola faylni emas, veb-sahifani ochadi",
      fileName: "Fayl nomi",
      detectedType: "Aniqlangan tur",
      unrecognized: "aniqlanmadi",
      category: "Toifa",
      declaredMime: "E’lon qilingan MIME",
      bytesAnalyzed: "Tahlil qilingan baytlar",
      sizeLimitReached: " (hajm chegarasiga yetildi)",
      notAvailable: "mavjud emas",
    },
    finding: { source: "Manba: ", checked: "Tekshirilgan: ", checkId: "Tekshiruv ID: " },
    run: { completed: "Bajarildi", disabled: "O‘chirilgan", skipped: "O‘tkazib yuborildi", partial: "Qisman bajarildi", unavailable: "Mavjud emas", failed: "Muvaffaqiyatsiz" },
    badges: { fail: (n) => `${n} ta muammo`, warn: (n) => `${n} ta ogohlantirish`, pass: (n) => `${n} ta o‘tdi` },
    redirectBlocked: "BLOKLANDI",
    redirectError: "XATO",
    intel: {
      provider: "Provayder",
      status: "Holat",
      result: "Natija",
      checked: "Tekshirilgan",
      ms: (n) => `${n} ms`,
      noProviders: "Bu tekshiruvda tahdidlar bazalariga so‘rov yuborilmadi. Xulosa faqat Innova Checker tahlil modullariga asoslangan.",
    },
    db: {
      title: "Domenlar ma’lumotlar bazasi",
      decision: {
        BLACKLIST: "Qora ro‘yxatda topildi",
        SUSPICIOUS: "Shubhalilar ro‘yxatida topildi",
        IMPERSONATION: "Tasdiqlangan platformaga taqlid qiladi",
        WHITELIST: "Tasdiqlangan rasmiy domen",
        WHITELIST_OVERRIDDEN: "Rasmiy domen — ishonch berilmadi",
        NONE: "Bazada topilmadi",
        UNAVAILABLE: "Baza mavjud emas",
      },
      imitatesBefore: "",
      imitatesAfter: " brendiga taqlid qiladi. Rasmiy domenlar: ",
      listType: { WHITELIST: "OQ RO‘YXAT", BLACKLIST: "QORA RO‘YXAT", SUSPICIOUS: "SHUBHALI" },
      matched: (host, type) => `· mos keldi: ${host} (${type})`,
      matchType: { exact: "aniq", subdomain: "subdomen", url: "URL" },
      platform: "Platforma: ",
      company: "Kompaniya: ",
      category: "Toifa: ",
      trustStatus: "Ishonch holati: ",
      trust: { VERIFIED_OFFICIAL: "tasdiqlangan rasmiy", CONFIRMED_MALICIOUS: "tasdiqlangan zararli", SUSPECTED: "shubhali", UNVERIFIED: "tasdiqlanmagan" },
      verificationSource: "Tasdiqlash manbasi: ",
      verified: "Tasdiqlangan: ",
    },
    copied: "Hisobot buferga nusxalandi",
    copyFailed: "Nusxalab bo‘lmadi. Brauzeringiz buferga kirishni blokladi.",
    back: "Orqaga",
    eyebrow: "Xavfsizlik hisoboti",
    scanId: "Tekshiruv ID:",
    duration: "Davomiyligi:",
    status: "Holat:",
    completed: "yakunlandi",
    downloadPdf: "PDF hisobotni yuklab olish",
    copyReport: "Hisobotni nusxalash",
    collapse: "Tahlilni yig‘ish",
    expand: "To‘liq tahlilni ko‘rish",
    scanAnother: "Boshqa havolani tekshirish",
    riskLevel: "Xavf darajasi:",
    target: "Tekshiruv obyekti",
    scannedUrl: "Tekshirilgan havola",
    finalDestination: "Yakuniy manzil",
    domain: "Domen",
    scanDate: "Tekshiruv sanasi",
    coverage: "Tahlil qamrovi",
    modulesCompleted: (ok, enabled) => `${ok}/${enabled} tahlil moduli bajarildi`,
    restNeedLiveSite: " (qolganlari uchun ishlayotgan sayt kerak)",
    providersConsulted: (run, total) => `${run}/${total} tahdidlar bazasi tekshirildi`,
    verdictSummary: "Tekshiruv xulosasi",
    noFindings: "Xavf darajasini oshiruvchi omillar topilmadi.",
    recommendations: "Xavfsizlik bo‘yicha tavsiyalar",
    disclaimerTitle: "Eslatma.",
    disclaimer:
      "Hech qanday avtomatik skaner saytning 100% xavfsizligini kafolatlay olmaydi. Firibgarlar sahifa mazmunini o‘zgartiradi, turli tashrif buyuruvchilarga turli sahifalarni ko‘rsatadi va mutlaqo yangi infratuzilmadan foydalanadi. Ushbu hisobotni qaror qabul qilishdagi manbalardan biri sifatida ishlating va kompaniyangizning xavfsizlik siyosatiga amal qiling.",
    sectionsAria: "Hisobot bo‘limlari",
    sections: "Bo‘limlar",
    navRecommendations: "Tavsiyalar",
    copy: {
      title: "INNOVA CHECKER — HAVOLA XAVFSIZLIGI HISOBOTI",
      verdict: "Xulosa:",
      riskScore: "Xavf balli:",
      scannedUrl: "Tekshirilgan havola:",
      finalUrl: "Yakuniy manzil:",
      domain: "Domen:",
      scannedAt: "Tekshirilgan vaqt:",
      duration: "Davomiyligi:",
      seconds: (s) => `${s} s`,
      coverage: "Qamrov:",
      reportId: "Hisobot ID:",
      summary: "Qisqacha:",
      domainDb: "Domenlar bazasi:",
      dbMatch: (list, domain, trust, source, verified) => `${list} ${domain} (${trust}) — manba: ${source}; tasdiqlangan: ${verified}`,
      trust: { VERIFIED_OFFICIAL: "tasdiqlangan rasmiy", CONFIRMED_MALICIOUS: "tasdiqlangan zararli", SUSPECTED: "shubhali", UNVERIFIED: "tasdiqlanmagan" },
      risk: (w) => ` (xavf +${w})`,
      recommendations: "## Xavfsizlik bo‘yicha tavsiyalar",
      disclaimer: "Eslatma:",
    },
  },
});
