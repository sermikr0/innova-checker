import { defineMessages } from "../config";

type Trust = { VERIFIED_OFFICIAL: string; CONFIRMED_MALICIOUS: string; SUSPECTED: string; UNVERIFIED: string };

type AdminDomainsText = {
  system: string;
  filter: string;
  search: string;
  edit: string;
  trust: Trust;
  page: {
    tabs: { WHITELIST: string; BLACKLIST: string; SUSPICIOUS: string; PENDING: string };
    eyebrow: string;
    title: string;
    description: string;
    exportCsv: string;
    searchPlaceholder: string;
    trustStatus: string;
    anyTrust: string;
    origin: string;
    anyOrigin: string;
    origins: { SEED_RESEARCH: string; ADMIN: string; IMPORT: string; USER_SUBMISSION: string; feed: string };
    records: (n: number) => string;
    domain: string;
    platformCategory: string;
    trustCol: string;
    source: string;
    checked: string;
    empty: string;
    by: (email: string) => string;
    noSource: string;
    verified: (date: string) => string;
    history: string;
    deleteTitle: (domain: string) => string;
    deleteText: string;
    delete: string;
  };
  detail: {
    noSource: string;
    back: string;
  };
  form: {
    editTitle: (domain: string) => string;
    addTitle: string;
    description: string;
    addRecord: string;
    saveRecord: string;
    exactUrl: string;
    domainHost: string;
    list: string;
    lists: { WHITELIST: string; BLACKLIST: string; SUSPICIOUS: string };
    scope: string;
    scopes: { DOMAIN: string; HOST: string; URL: string };
    status: string;
    statuses: { ACTIVE: string; PENDING: string; REJECTED: string };
    trustStatus: string;
    platformName: string;
    companyName: string;
    officialUrl: string;
    category: string;
    categoryPlaceholder: string;
    brandKeywords: string;
    brandKeywordsHint: string;
    source: string;
    sourcePlaceholder: string;
    verifiedOn: string;
    notes: string;
    approve: string;
    reject: string;
    importTitle: string;
    importText: string;
    importCsv: string;
    pasteCsv: string;
    overwrite: string;
    overwriteText: string;
    import: string;
    importedOk: string;
    revalidate: string;
    syncFeeds: string;
  };
  jobs: {
    labels: Record<string, string>;
    running: string;
    starting: string;
    failed: string;
    finishedToast: (label: string) => string;
    failedToast: (label: string, error: string) => string;
    noJobs: string;
  };
};

/** Admin → Domain intelligence: list, record history, record dialogs and background jobs. */
export const adminDomainsText = defineMessages<AdminDomainsText>({
  en: {
    system: "system",
    filter: "Filter",
    search: "Search",
    edit: "Edit",
    trust: { VERIFIED_OFFICIAL: "Verified official", CONFIRMED_MALICIOUS: "Confirmed malicious", SUSPECTED: "Suspected", UNVERIFIED: "Unverified" },
    page: {
      tabs: { WHITELIST: "Whitelist", BLACKLIST: "Blacklist", SUSPICIOUS: "Suspicious", PENDING: "Pending review" },
      eyebrow: "Security intelligence",
      title: "Domain intelligence",
      description: "Verified official domains, confirmed or policy-blocked malicious domains, and suspected impersonations. Every active trusted or malicious record cites a verification source.",
      exportCsv: "Export CSV",
      searchPlaceholder: "Search domain, platform, company, category",
      trustStatus: "Trust status",
      anyTrust: "Any trust status",
      origin: "Origin",
      anyOrigin: "Any origin",
      origins: { SEED_RESEARCH: "Research seed", ADMIN: "Admin", IMPORT: "CSV import", USER_SUBMISSION: "User submission", feed: "Threat feeds" },
      records: (n) => `${n} record(s)`,
      domain: "Domain",
      platformCategory: "Platform / category",
      trustCol: "Trust",
      source: "Verification source",
      checked: "Checked",
      empty: "No records.",
      by: (email) => ` · by ${email}`,
      noSource: "No source",
      verified: (date) => `verified ${date}`,
      history: "History",
      deleteTitle: (domain) => `Delete ${domain}?`,
      deleteText: "The record is removed; its change history is kept.",
      delete: "Delete",
    },
    detail: {
      noSource: "No verification source",
      back: "Back to list",
    },
    form: {
      editTitle: (domain) => `Edit ${domain}`,
      addTitle: "Add domain record",
      description: "Active trusted and malicious records require a verification source and date. Never trust a domain only because it contains a company name.",
      addRecord: "Add record",
      saveRecord: "Save record",
      exactUrl: "Exact URL",
      domainHost: "Domain / host",
      list: "List",
      lists: { WHITELIST: "Whitelist (trusted)", BLACKLIST: "Blacklist (malicious)", SUSPICIOUS: "Suspicious" },
      scope: "Match scope",
      scopes: { DOMAIN: "Domain + subdomains", HOST: "Exact host only", URL: "Exact URL only" },
      status: "Status",
      statuses: { ACTIVE: "Active", PENDING: "Pending review", REJECTED: "Rejected" },
      trustStatus: "Trust status",
      platformName: "Platform name",
      companyName: "Company name",
      officialUrl: "Official URL",
      category: "Category",
      categoryPlaceholder: "Load board",
      brandKeywords: "Brand keywords (comma-separated, whitelist only)",
      brandKeywordsHint: "Used to detect look-alike domains of this platform.",
      source: "Verification source",
      sourcePlaceholder: "e.g. SEC filing / press release / threat report URL",
      verifiedOn: "Verified on",
      notes: "Notes",
      approve: "Approve",
      reject: "Reject",
      importTitle: "Import domains from CSV",
      importText:
        "Columns: domain, listType, scope, status, trustStatus, platformName, companyName, officialUrl, category, brandKeywords (; separated), verificationSource, verifiedAt, notes. Rows without a source and date are imported as pending.",
      importCsv: "Import CSV",
      pasteCsv: "…or paste CSV",
      overwrite: "Overwrite existing records",
      overwriteText: "Otherwise existing domain/list pairs are skipped.",
      import: "Import",
      importedOk: "Imported without errors.",
      revalidate: "Revalidate domains",
      syncFeeds: "Sync threat feeds",
    },
    jobs: {
      labels: { "domain-revalidation": "Domain revalidation", "threat-feed-sync": "Threat-feed sync" },
      running: "running",
      starting: "starting…",
      failed: "failed",
      finishedToast: (label) => `${label} finished`,
      failedToast: (label, error) => `${label} failed: ${error}`,
      noJobs: "No jobs have run yet.",
    },
  },
  ru: {
    system: "система",
    filter: "Фильтр",
    search: "Поиск",
    edit: "Изменить",
    trust: { VERIFIED_OFFICIAL: "Проверенный официальный", CONFIRMED_MALICIOUS: "Подтверждённый вредоносный", SUSPECTED: "Подозреваемый", UNVERIFIED: "Не проверен" },
    page: {
      tabs: { WHITELIST: "Белый список", BLACKLIST: "Чёрный список", SUSPICIOUS: "Подозрительные", PENDING: "Ожидают проверки" },
      eyebrow: "Данные безопасности",
      title: "База доменов",
      description: "Проверенные официальные домены, подтверждённые или заблокированные по политике вредоносные домены и предполагаемые подделки. Каждая активная доверенная или вредоносная запись ссылается на источник подтверждения.",
      exportCsv: "Экспорт CSV",
      searchPlaceholder: "Поиск по домену, платформе, компании, категории",
      trustStatus: "Статус доверия",
      anyTrust: "Любой статус доверия",
      origin: "Источник",
      anyOrigin: "Любой источник",
      origins: { SEED_RESEARCH: "Исследовательская выборка", ADMIN: "Администратор", IMPORT: "Импорт CSV", USER_SUBMISSION: "Отправлено пользователем", feed: "Фиды угроз" },
      records: (n) => `Записей: ${n}`,
      domain: "Домен",
      platformCategory: "Платформа / категория",
      trustCol: "Доверие",
      source: "Источник подтверждения",
      checked: "Проверено",
      empty: "Записей нет.",
      by: (email) => ` · от ${email}`,
      noSource: "Нет источника",
      verified: (date) => `подтверждено ${date}`,
      history: "История",
      deleteTitle: (domain) => `Удалить ${domain}?`,
      deleteText: "Запись будет удалена, история её изменений сохранится.",
      delete: "Удалить",
    },
    detail: {
      noSource: "Источник подтверждения не указан",
      back: "Назад к списку",
    },
    form: {
      editTitle: (domain) => `Редактировать ${domain}`,
      addTitle: "Добавить запись домена",
      description: "Для активных доверенных и вредоносных записей нужны источник и дата подтверждения. Никогда не доверяйте домену только потому, что в нём есть название компании.",
      addRecord: "Добавить запись",
      saveRecord: "Сохранить запись",
      exactUrl: "Точный URL",
      domainHost: "Домен / хост",
      list: "Список",
      lists: { WHITELIST: "Белый список (доверенные)", BLACKLIST: "Чёрный список (вредоносные)", SUSPICIOUS: "Подозрительные" },
      scope: "Область совпадения",
      scopes: { DOMAIN: "Домен и поддомены", HOST: "Только точный хост", URL: "Только точный URL" },
      status: "Статус",
      statuses: { ACTIVE: "Активна", PENDING: "Ожидает проверки", REJECTED: "Отклонена" },
      trustStatus: "Статус доверия",
      platformName: "Название платформы",
      companyName: "Название компании",
      officialUrl: "Официальный URL",
      category: "Категория",
      categoryPlaceholder: "Биржа грузов",
      brandKeywords: "Ключевые слова бренда (через запятую, только для белого списка)",
      brandKeywordsHint: "Используются для выявления похожих доменов этой платформы.",
      source: "Источник подтверждения",
      sourcePlaceholder: "например: документ SEC / пресс-релиз / URL отчёта об угрозе",
      verifiedOn: "Дата подтверждения",
      notes: "Заметки",
      approve: "Одобрить",
      reject: "Отклонить",
      importTitle: "Импорт доменов из CSV",
      importText:
        "Столбцы: domain, listType, scope, status, trustStatus, platformName, companyName, officialUrl, category, brandKeywords (через ;), verificationSource, verifiedAt, notes. Строки без источника и даты импортируются как ожидающие проверки.",
      importCsv: "Импорт CSV",
      pasteCsv: "…или вставьте CSV",
      overwrite: "Перезаписывать существующие записи",
      overwriteText: "Иначе существующие пары домен/список пропускаются.",
      import: "Импортировать",
      importedOk: "Импорт выполнен без ошибок.",
      revalidate: "Перепроверить домены",
      syncFeeds: "Синхронизировать фиды угроз",
    },
    jobs: {
      labels: { "domain-revalidation": "Перепроверка доменов", "threat-feed-sync": "Синхронизация фидов угроз" },
      running: "выполняется",
      starting: "запуск…",
      failed: "ошибка",
      finishedToast: (label) => `${label}: завершено`,
      failedToast: (label, error) => `${label}: ошибка — ${error}`,
      noJobs: "Задачи ещё не запускались.",
    },
  },
  uz: {
    system: "tizim",
    filter: "Filtrlash",
    search: "Qidirish",
    edit: "Tahrirlash",
    trust: { VERIFIED_OFFICIAL: "Tasdiqlangan rasmiy", CONFIRMED_MALICIOUS: "Tasdiqlangan zararli", SUSPECTED: "Shubhali", UNVERIFIED: "Tasdiqlanmagan" },
    page: {
      tabs: { WHITELIST: "Oq ro‘yxat", BLACKLIST: "Qora ro‘yxat", SUSPICIOUS: "Shubhali", PENDING: "Ko‘rib chiqish kutilmoqda" },
      eyebrow: "Xavfsizlik ma’lumotlari",
      title: "Domenlar bazasi",
      description: "Tasdiqlangan rasmiy domenlar, tasdiqlangan yoki siyosat bo‘yicha bloklangan zararli domenlar va soxta deb gumon qilinganlar. Har bir faol ishonchli yoki zararli yozuvda tasdiq manbasi ko‘rsatiladi.",
      exportCsv: "CSV eksport",
      searchPlaceholder: "Domen, platforma, kompaniya, kategoriya bo‘yicha qidirish",
      trustStatus: "Ishonch holati",
      anyTrust: "Istalgan ishonch holati",
      origin: "Manba",
      anyOrigin: "Istalgan manba",
      origins: { SEED_RESEARCH: "Tadqiqot to‘plami", ADMIN: "Administrator", IMPORT: "CSV import", USER_SUBMISSION: "Foydalanuvchi yuborgan", feed: "Tahdid lentalari" },
      records: (n) => `Yozuvlar: ${n}`,
      domain: "Domen",
      platformCategory: "Platforma / kategoriya",
      trustCol: "Ishonch",
      source: "Tasdiq manbasi",
      checked: "Tekshirilgan",
      empty: "Yozuvlar yo‘q.",
      by: (email) => ` · yuborgan: ${email}`,
      noSource: "Manba yo‘q",
      verified: (date) => `tasdiqlangan: ${date}`,
      history: "Tarix",
      deleteTitle: (domain) => `${domain} o‘chirilsinmi?`,
      deleteText: "Yozuv o‘chiriladi, uning o‘zgarishlar tarixi saqlanib qoladi.",
      delete: "O‘chirish",
    },
    detail: {
      noSource: "Tasdiq manbasi ko‘rsatilmagan",
      back: "Ro‘yxatga qaytish",
    },
    form: {
      editTitle: (domain) => `${domain} — tahrirlash`,
      addTitle: "Domen yozuvini qo‘shish",
      description: "Faol ishonchli va zararli yozuvlar uchun tasdiq manbasi va sanasi talab qilinadi. Domen nomida kompaniya nomi borligi uchungina unga hech qachon ishonmang.",
      addRecord: "Yozuv qo‘shish",
      saveRecord: "Yozuvni saqlash",
      exactUrl: "Aniq URL",
      domainHost: "Domen / xost",
      list: "Ro‘yxat",
      lists: { WHITELIST: "Oq ro‘yxat (ishonchli)", BLACKLIST: "Qora ro‘yxat (zararli)", SUSPICIOUS: "Shubhali" },
      scope: "Moslik doirasi",
      scopes: { DOMAIN: "Domen + subdomenlar", HOST: "Faqat aniq xost", URL: "Faqat aniq URL" },
      status: "Holat",
      statuses: { ACTIVE: "Faol", PENDING: "Ko‘rib chiqish kutilmoqda", REJECTED: "Rad etilgan" },
      trustStatus: "Ishonch holati",
      platformName: "Platforma nomi",
      companyName: "Kompaniya nomi",
      officialUrl: "Rasmiy URL",
      category: "Kategoriya",
      categoryPlaceholder: "Yuk birjasi",
      brandKeywords: "Brend kalit so‘zlari (vergul bilan, faqat oq ro‘yxat uchun)",
      brandKeywordsHint: "Shu platformaga o‘xshatib yasalgan domenlarni aniqlash uchun ishlatiladi.",
      source: "Tasdiq manbasi",
      sourcePlaceholder: "masalan: SEC hujjati / press-reliz / tahdid hisoboti URL manzili",
      verifiedOn: "Tasdiqlangan sana",
      notes: "Izohlar",
      approve: "Tasdiqlash",
      reject: "Rad etish",
      importTitle: "Domenlarni CSV fayldan import qilish",
      importText:
        "Ustunlar: domain, listType, scope, status, trustStatus, platformName, companyName, officialUrl, category, brandKeywords (; bilan ajratilgan), verificationSource, verifiedAt, notes. Manbasi va sanasi bo‘lmagan qatorlar ko‘rib chiqish kutilayotgan holatda import qilinadi.",
      importCsv: "CSV import",
      pasteCsv: "…yoki CSV matnini joylashtiring",
      overwrite: "Mavjud yozuvlarni qayta yozish",
      overwriteText: "Aks holda mavjud domen/ro‘yxat juftliklari o‘tkazib yuboriladi.",
      import: "Import qilish",
      importedOk: "Xatolarsiz import qilindi.",
      revalidate: "Domenlarni qayta tekshirish",
      syncFeeds: "Tahdid lentalarini sinxronlash",
    },
    jobs: {
      labels: { "domain-revalidation": "Domenlarni qayta tekshirish", "threat-feed-sync": "Tahdid lentalarini sinxronlash" },
      running: "bajarilmoqda",
      starting: "boshlanmoqda…",
      failed: "xatolik",
      finishedToast: (label) => `${label} yakunlandi`,
      failedToast: (label, error) => `${label} bajarilmadi: ${error}`,
      noJobs: "Hali birorta vazifa ishga tushirilmagan.",
    },
  },
});
