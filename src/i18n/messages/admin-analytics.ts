import { defineMessages } from "../config";

type AnalyticsText = {
  eyebrow: string;
  title: string;
  description: string;
  exportCsv: string;
  period: string;
  ranges: { "24h": string; "7d": string; "30d": string; "90d": string; all: string };
  emptyTitle: string;
  emptyText: string;
  linksChecked: string;
  failedAvg: (failed: number, avg: string) => string;
  domains: string;
  perDomain: (n: string) => string;
  scamCaught: string;
  scamSub: (pct: string, suspicious: string) => string;
  people: string;
  peopleSub: (users: number, visitors: number) => string;
  perDay: string;
  perDayHint: (days: number) => string;
  results: string;
  signedIn: string;
  visitors: string;
  inconclusiveNote: (n: number) => string;
  topDomains: string;
  topDomainsHint: string;
  riskyDomains: string;
  riskyDomainsHint: string;
  noChecks: string;
  noRisky: string;
  colDomain: string;
  colChecks: string;
  colPeople: string;
  colLatest: string;
  colLastChecked: string;
  countries: string;
  countriesEmpty: string;
  hours: string;
  hoursHint: string;
  hourTitle: (hour: string, n: number) => string;
  topUsers: string;
  deletedUser: string;
  topUsersEmpty: string;
  checkedLinks: string;
  checkedLinksHint: (range: string) => string;
  searchLabel: string;
  searchPlaceholder: string;
  verdictLabel: string;
  whoLabel: string;
  allResults: string;
  fScam: string;
  fRisky: string;
  fSafe: string;
  fInconclusive: string;
  everyone: string;
  fRegistered: string;
  fVisitors: string;
  filter: string;
  colTime: string;
  colLink: string;
  colResult: string;
  colRisk: string;
  colBy: string;
  colCountry: string;
  openReport: string;
  visitor: string;
  noMatch: string;
};

export const analyticsText = defineMessages<AnalyticsText>({
  en: {
    eyebrow: "Insights",
    title: "Link analytics",
    description: "Which links people check, what the scanner found, and who is checking. Reports open in the safe report view; links are never opened in your browser.",
    exportCsv: "Export CSV",
    period: "Period",
    ranges: { "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", all: "All time" },
    emptyTitle: "No checks in this period",
    emptyText: "Statistics appear here as soon as people start checking links.",
    linksChecked: "Links checked",
    failedAvg: (failed, avg) => `${failed} failed · avg ${avg}`,
    domains: "Different domains",
    perDomain: (n) => `${n} checks per domain`,
    scamCaught: "Scam links caught",
    scamSub: (pct, suspicious) => `${pct} of results · ${suspicious} more suspicious`,
    people: "People checking",
    peopleSub: (u, v) => `${u} signed-in users · ${v} visitors`,
    perDay: "Checks per day",
    perDayHint: (d) => `Last ${d} days (UTC), split by verdict.`,
    results: "Results",
    signedIn: "Signed-in users",
    visitors: "Visitors (no account)",
    inconclusiveNote: (n) => `${n} inconclusive results (dead links, timeouts) are counted with safe.`,
    topDomains: "Most checked domains",
    topDomainsHint: "Click a domain to see every check of it below.",
    riskyDomains: "Scam and risky domains people received",
    riskyDomainsHint: "Domains that came back Scam, High risk or Suspicious — what your users are being targeted with.",
    noChecks: "No checks yet.",
    noRisky: "No risky links in this period.",
    colDomain: "Domain",
    colChecks: "Checks",
    colPeople: "People",
    colLatest: "Latest verdict",
    colLastChecked: "Last checked",
    countries: "Countries",
    countriesEmpty: "Country is recorded for checks made from now on (from Cloudflare).",
    hours: "Busiest hours",
    hoursHint: "Checks by hour of day, Tashkent time.",
    hourTitle: (h, n) => `${h}:00 — ${n} checks`,
    topUsers: "Most active users",
    deletedUser: "Deleted user",
    topUsersEmpty: "No signed-in user checked a link in this period.",
    checkedLinks: "Checked links",
    checkedLinksHint: (r) => `Latest 100 matching checks in ${r}.`,
    searchLabel: "Search domain or URL",
    searchPlaceholder: "Domain or URL",
    verdictLabel: "Verdict",
    whoLabel: "Who",
    allResults: "All results",
    fScam: "Scam",
    fRisky: "Suspicious / high risk",
    fSafe: "Safe / trusted",
    fInconclusive: "Inconclusive",
    everyone: "Everyone",
    fRegistered: "Signed-in users",
    fVisitors: "Visitors",
    filter: "Filter",
    colTime: "Time",
    colLink: "Link",
    colResult: "Result",
    colRisk: "Risk",
    colBy: "Checked by",
    colCountry: "Country",
    openReport: "open the report",
    visitor: "Visitor",
    noMatch: "No checks match these filters.",
  },
  ru: {
    eyebrow: "Аналитика",
    title: "Аналитика ссылок",
    description: "Какие ссылки проверяют, что нашёл сканер и кто проверяет. Отчёты открываются в безопасном режиме — сами ссылки в вашем браузере не открываются.",
    exportCsv: "Экспорт CSV",
    period: "Период",
    ranges: { "24h": "За 24 часа", "7d": "За 7 дней", "30d": "За 30 дней", "90d": "За 90 дней", all: "За всё время" },
    emptyTitle: "За этот период проверок нет",
    emptyText: "Статистика появится, как только люди начнут проверять ссылки.",
    linksChecked: "Проверено ссылок",
    failedAvg: (failed, avg) => `ошибок: ${failed} · в среднем ${avg}`,
    domains: "Разных доменов",
    perDomain: (n) => `${n} проверки на домен`,
    scamCaught: "Найдено мошеннических ссылок",
    scamSub: (pct, suspicious) => `${pct} результатов · ещё подозрительных: ${suspicious}`,
    people: "Проверяющих людей",
    peopleSub: (u, v) => `пользователей: ${u} · посетителей: ${v}`,
    perDay: "Проверки по дням",
    perDayHint: (d) => `Последние ${d} дн. (UTC), по вердиктам.`,
    results: "Результаты",
    signedIn: "Вошедшие пользователи",
    visitors: "Посетители (без аккаунта)",
    inconclusiveNote: (n) => `Неопределённые результаты (${n}: несуществующие ссылки, тайм-ауты) учтены вместе с безопасными.`,
    topDomains: "Самые проверяемые домены",
    topDomainsHint: "Нажмите на домен, чтобы увидеть все его проверки ниже.",
    riskyDomains: "Мошеннические и опасные домены, которые получают люди",
    riskyDomainsHint: "Домены с результатом «Мошенничество», «Высокий риск» или «Подозрительно» — то, чем атакуют ваших пользователей.",
    noChecks: "Проверок пока нет.",
    noRisky: "За этот период опасных ссылок нет.",
    colDomain: "Домен",
    colChecks: "Проверки",
    colPeople: "Людей",
    colLatest: "Последний вердикт",
    colLastChecked: "Последняя проверка",
    countries: "Страны",
    countriesEmpty: "Страна записывается для проверок, начиная с этого момента (по данным Cloudflare).",
    hours: "Часы пик",
    hoursHint: "Проверки по часам, время ташкентское.",
    hourTitle: (h, n) => `${h}:00 — проверок: ${n}`,
    topUsers: "Самые активные пользователи",
    deletedUser: "Удалённый пользователь",
    topUsersEmpty: "За этот период вошедшие пользователи ссылки не проверяли.",
    checkedLinks: "Проверенные ссылки",
    checkedLinksHint: (r) => `Последние 100 подходящих проверок (${r.toLowerCase()}).`,
    searchLabel: "Поиск по домену или ссылке",
    searchPlaceholder: "Домен или ссылка",
    verdictLabel: "Вердикт",
    whoLabel: "Кто",
    allResults: "Все результаты",
    fScam: "Мошенничество",
    fRisky: "Подозрительно / высокий риск",
    fSafe: "Безопасно / доверенный",
    fInconclusive: "Не определено",
    everyone: "Все",
    fRegistered: "Вошедшие пользователи",
    fVisitors: "Посетители",
    filter: "Фильтр",
    colTime: "Время",
    colLink: "Ссылка",
    colResult: "Результат",
    colRisk: "Риск",
    colBy: "Кто проверил",
    colCountry: "Страна",
    openReport: "открыть отчёт",
    visitor: "Посетитель",
    noMatch: "Нет проверок по этим фильтрам.",
  },
  uz: {
    eyebrow: "Tahlil",
    title: "Havolalar tahlili",
    description: "Odamlar qaysi havolalarni tekshirayotgani, skaner nima topgani va kim tekshirayotgani. Hisobotlar xavfsiz ko‘rinishda ochiladi — havolalarning o‘zi brauzeringizda ochilmaydi.",
    exportCsv: "CSV yuklab olish",
    period: "Davr",
    ranges: { "24h": "Oxirgi 24 soat", "7d": "Oxirgi 7 kun", "30d": "Oxirgi 30 kun", "90d": "Oxirgi 90 kun", all: "Butun davr" },
    emptyTitle: "Bu davrda tekshiruvlar yo‘q",
    emptyText: "Odamlar havolalarni tekshira boshlashi bilan statistika shu yerda paydo bo‘ladi.",
    linksChecked: "Tekshirilgan havolalar",
    failedAvg: (failed, avg) => `${failed} ta xato · o‘rtacha ${avg}`,
    domains: "Turli domenlar",
    perDomain: (n) => `Har bir domenga ${n} ta tekshiruv`,
    scamCaught: "Aniqlangan firibgar havolalar",
    scamSub: (pct, suspicious) => `natijalarning ${pct} · yana ${suspicious} ta shubhali`,
    people: "Tekshirayotgan odamlar",
    peopleSub: (u, v) => `${u} ta foydalanuvchi · ${v} ta mehmon`,
    perDay: "Kunlik tekshiruvlar",
    perDayHint: (d) => `Oxirgi ${d} kun (UTC), natijalar bo‘yicha.`,
    results: "Natijalar",
    signedIn: "Kirgan foydalanuvchilar",
    visitors: "Mehmonlar (akkauntsiz)",
    inconclusiveNote: (n) => `${n} ta aniqlanmagan natija (mavjud bo‘lmagan havolalar, vaqt tugashi) xavfsizlar qatorida hisoblangan.`,
    topDomains: "Eng ko‘p tekshirilgan domenlar",
    topDomainsHint: "Domenning barcha tekshiruvlarini pastda ko‘rish uchun uni bosing.",
    riskyDomains: "Odamlarga kelayotgan firibgar va xavfli domenlar",
    riskyDomainsHint: "«Firibgarlik», «Yuqori xavf» yoki «Shubhali» natijasini olgan domenlar — foydalanuvchilaringizga qarshi ishlatilayotgan narsalar.",
    noChecks: "Hali tekshiruvlar yo‘q.",
    noRisky: "Bu davrda xavfli havolalar yo‘q.",
    colDomain: "Domen",
    colChecks: "Tekshiruvlar",
    colPeople: "Odamlar",
    colLatest: "Oxirgi natija",
    colLastChecked: "Oxirgi tekshiruv",
    countries: "Davlatlar",
    countriesEmpty: "Davlat bundan buyon qilingan tekshiruvlar uchun yoziladi (Cloudflare ma’lumotlari asosida).",
    hours: "Eng faol soatlar",
    hoursHint: "Soatlar bo‘yicha tekshiruvlar, Toshkent vaqti.",
    hourTitle: (h, n) => `${h}:00 — ${n} ta tekshiruv`,
    topUsers: "Eng faol foydalanuvchilar",
    deletedUser: "O‘chirilgan foydalanuvchi",
    topUsersEmpty: "Bu davrda kirgan foydalanuvchilar havola tekshirmagan.",
    checkedLinks: "Tekshirilgan havolalar",
    checkedLinksHint: (r) => `Mos keladigan oxirgi 100 ta tekshiruv (${r.toLowerCase()}).`,
    searchLabel: "Domen yoki havola bo‘yicha qidirish",
    searchPlaceholder: "Domen yoki havola",
    verdictLabel: "Natija",
    whoLabel: "Kim",
    allResults: "Barcha natijalar",
    fScam: "Firibgarlik",
    fRisky: "Shubhali / yuqori xavf",
    fSafe: "Xavfsiz / ishonchli",
    fInconclusive: "Aniqlanmadi",
    everyone: "Hamma",
    fRegistered: "Kirgan foydalanuvchilar",
    fVisitors: "Mehmonlar",
    filter: "Saralash",
    colTime: "Vaqt",
    colLink: "Havola",
    colResult: "Natija",
    colRisk: "Xavf",
    colBy: "Kim tekshirgan",
    colCountry: "Davlat",
    openReport: "hisobotni ochish",
    visitor: "Mehmon",
    noMatch: "Bu saralashga mos tekshiruvlar yo‘q.",
  },
});
