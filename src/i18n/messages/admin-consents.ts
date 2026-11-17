import { defineMessages } from "../config";

type AdminConsentsText = {
  eyebrow: string;
  title: string;
  description: string;
  exportCsv: string;
  total: string;
  verified: string;
  pending: string;
  last7: string;
  withAccount: (n: number) => string;
  searchPlaceholder: string;
  searchLabel: string;
  statusLabel: string;
  all: string;
  onlyVerified: string;
  onlyPending: string;
  filter: string;
  colPerson: string;
  colEmail: string;
  colAccepted: string;
  colWhere: string;
  colDevice: string;
  colChecks: string;
  colLastSeen: string;
  verifiedBadge: string;
  pendingBadge: string;
  notRequiredBadge: string;
  account: string;
  visitor: string;
  terms: (v: string) => string;
  lang: string;
  outdated: string;
  empty: string;
  emptyText: string;
  showing: (shown: number, total: number) => string;
  smtpMissing: string;
};

export const adminConsentsText = defineMessages<AdminConsentsText>({
  en: {
    eyebrow: "Clients",
    title: "Terms & clients",
    description: "Everyone who accepted the Terms of Use before checking links: name, e-mail, confirmation status and evidence of acceptance (time, Terms version, IP, country, browser).",
    exportCsv: "Export CSV",
    total: "Acceptances",
    verified: "E-mail confirmed",
    pending: "Waiting for the code",
    last7: "Last 7 days",
    withAccount: (n) => `${n} linked to an account`,
    searchPlaceholder: "Name, e-mail or IP",
    searchLabel: "Search",
    statusLabel: "Status",
    all: "Everyone",
    onlyVerified: "E-mail confirmed",
    onlyPending: "Not confirmed",
    filter: "Filter",
    colPerson: "Person",
    colEmail: "E-mail",
    colAccepted: "Accepted",
    colWhere: "IP · country",
    colDevice: "Browser · language",
    colChecks: "Checks",
    colLastSeen: "Last seen",
    verifiedBadge: "Confirmed",
    pendingBadge: "Not confirmed",
    notRequiredBadge: "No code sent",
    account: "Account",
    visitor: "Visitor",
    terms: (v) => `Terms ${v}`,
    lang: "Language",
    outdated: "old version",
    empty: "No acceptances yet",
    emptyText: "People appear here after they accept the Terms of Use before their first check.",
    showing: (shown, total) => `Showing ${shown} of ${total}.`,
    smtpMissing: "SMTP is not configured, so e-mail codes are not sent and e-mails are not confirmed. Add SMTP settings on the server to turn confirmation on.",
  },
  ru: {
    eyebrow: "Клиенты",
    title: "Условия и клиенты",
    description: "Все, кто принял Условия использования перед проверкой ссылок: имя, эл. почта, статус подтверждения и доказательства принятия (время, редакция Условий, IP, страна, браузер).",
    exportCsv: "Экспорт CSV",
    total: "Принятий",
    verified: "Почта подтверждена",
    pending: "Ожидают код",
    last7: "За 7 дней",
    withAccount: (n) => `С аккаунтом: ${n}`,
    searchPlaceholder: "Имя, почта или IP",
    searchLabel: "Поиск",
    statusLabel: "Статус",
    all: "Все",
    onlyVerified: "Почта подтверждена",
    onlyPending: "Не подтверждена",
    filter: "Фильтр",
    colPerson: "Человек",
    colEmail: "Эл. почта",
    colAccepted: "Принято",
    colWhere: "IP · страна",
    colDevice: "Браузер · язык",
    colChecks: "Проверки",
    colLastSeen: "Был(а)",
    verifiedBadge: "Подтверждена",
    pendingBadge: "Не подтверждена",
    notRequiredBadge: "Код не отправлялся",
    account: "Аккаунт",
    visitor: "Посетитель",
    terms: (v) => `Условия ${v}`,
    lang: "Язык",
    outdated: "старая редакция",
    empty: "Пока никто не принял условия",
    emptyText: "Люди появляются здесь после того, как примут Условия использования перед первой проверкой.",
    showing: (shown, total) => `Показано ${shown} из ${total}.`,
    smtpMissing: "SMTP не настроен: коды на почту не отправляются, и адреса не подтверждаются. Добавьте настройки SMTP на сервере, чтобы включить подтверждение.",
  },
  uz: {
    eyebrow: "Mijozlar",
    title: "Shartlar va mijozlar",
    description: "Havolalarni tekshirishdan oldin Foydalanish shartlarini qabul qilganlar: ism, e-pochta, tasdiqlash holati va qabul qilinganining dalillari (vaqt, shartlar tahriri, IP, davlat, brauzer).",
    exportCsv: "CSV yuklab olish",
    total: "Qabul qilganlar",
    verified: "E-pochta tasdiqlangan",
    pending: "Kod kutilmoqda",
    last7: "Oxirgi 7 kun",
    withAccount: (n) => `${n} tasi akkauntga bog‘langan`,
    searchPlaceholder: "Ism, e-pochta yoki IP",
    searchLabel: "Qidirish",
    statusLabel: "Holat",
    all: "Hammasi",
    onlyVerified: "E-pochta tasdiqlangan",
    onlyPending: "Tasdiqlanmagan",
    filter: "Saralash",
    colPerson: "Shaxs",
    colEmail: "E-pochta",
    colAccepted: "Qabul qilingan",
    colWhere: "IP · davlat",
    colDevice: "Brauzer · til",
    colChecks: "Tekshiruvlar",
    colLastSeen: "Oxirgi faollik",
    verifiedBadge: "Tasdiqlangan",
    pendingBadge: "Tasdiqlanmagan",
    notRequiredBadge: "Kod yuborilmagan",
    account: "Akkaunt",
    visitor: "Mehmon",
    terms: (v) => `Shartlar ${v}`,
    lang: "Til",
    outdated: "eski tahrir",
    empty: "Hali hech kim shartlarni qabul qilmagan",
    emptyText: "Odamlar birinchi tekshiruvdan oldin Foydalanish shartlarini qabul qilgach, shu yerda paydo bo‘ladi.",
    showing: (shown, total) => `${total} tadan ${shown} tasi ko‘rsatilmoqda.`,
    smtpMissing: "SMTP sozlanmagan: e-pochtaga kod yuborilmaydi va manzillar tasdiqlanmaydi. Tasdiqlashni yoqish uchun serverga SMTP sozlamalarini qo‘shing.",
  },
});
