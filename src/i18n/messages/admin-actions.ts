import { defineMessages } from "../config";

type SiteControl = "loginEnabled" | "registrationEnabled" | "pricingVisible" | "consentRequired" | "consentEmailVerification";

type AdminActionsText = {
  forbidden: string;
  /** Messages of the admin zod schemas (keyed by their English text) in this language. */
  validation: Record<string, string>;
  inUse: string;
  emailExists: string;
  userCreated: string;
  ownRole: string;
  emailTaken: string;
  userUpdated: string;
  superAdminUnlimited: string;
  alreadyUnlimited: string;
  alreadyRegular: string;
  unlimitedGranted: (email: string) => string;
  unlimitedRemoved: (email: string) => string;
  ownDeactivate: string;
  accountActivated: string;
  accountDeactivated: string;
  ownDelete: string;
  userDeleted: string;
  passwordReset: string;
  deviceRevoked: string;
  sessionsRevoked: (n: number) => string;
  assigned: (plan: string) => string;
  planChanged: string;
  extended: string;
  expiryUpdated: string;
  subStatus: { ACTIVE: string; SUSPENDED: string; CANCELLED: string };
  deviceLimitUpdated: string;
  lapsedExpired: (n: number) => string;
  slugInUse: string;
  planCreated: string;
  planUpdated: string;
  planInUse: (n: number) => string;
  planDeleted: string;
  pricingSaved: string;
  invalidVerificationDate: string;
  recordUpdated: string;
  recordAdded: string;
  recordDeleted: string;
  approved: string;
  rejected: string;
  fileTooLarge: string;
  imported: (created: number, updated: number, skipped: number, pending: number, errors: number) => string;
  jobRunning: string;
  jobStarted: { revalidate: string; feeds: string };
  scannerSaved: string;
  scannerReset: string;
  settingsSaved: string;
  siteControlLabels: Record<SiteControl, string>;
  nothingToSave: string;
  toggled: (label: string, on: boolean) => string;
  freePolicySaved: string;
  clientsSignedOut: (n: number) => string;
  noClientSignedIn: string;
  markedHandled: string;
  keySaved: (note: string) => string;
  keyNoteSaved: string;
  keyNoteValidated: (used: number | string, allowed: number | string) => string;
  keyRemoved: string;
  noVtKey: string;
  quotaRefreshed: string;
  ipUnblocked: string;
};

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

/** Toasts and errors returned by the admin Server Actions (src/app/admin/actions.ts). */
export const adminActionsText = defineMessages<AdminActionsText>({
  en: {
    forbidden: "Super Admin access required.",
    validation: {},
    inUse: "Already in use.",
    emailExists: "A user with this e-mail already exists.",
    userCreated: "User created",
    ownRole: "You cannot remove your own Super Admin role.",
    emailTaken: "Another user already uses this e-mail.",
    userUpdated: "User updated",
    superAdminUnlimited: "Super Admins already have unlimited access. Change their role in the edit form if needed.",
    alreadyUnlimited: "Already unlimited",
    alreadyRegular: "Already a regular user",
    unlimitedGranted: (email) => `${email} now has unlimited access`,
    unlimitedRemoved: (email) => `Unlimited access removed from ${email}`,
    ownDeactivate: "You cannot deactivate your own account.",
    accountActivated: "Account activated",
    accountDeactivated: "Account deactivated and signed out",
    ownDelete: "You cannot delete your own account.",
    userDeleted: "User deleted",
    passwordReset: "Password reset; the user was signed out everywhere",
    deviceRevoked: "Device revoked",
    sessionsRevoked: (n) => `Signed out ${n} session(s)`,
    assigned: (plan) => `${plan} assigned`,
    planChanged: "Plan changed",
    extended: "Subscription extended",
    expiryUpdated: "Expiration date updated",
    subStatus: { ACTIVE: "Subscription activated", SUSPENDED: "Subscription suspended", CANCELLED: "Subscription deactivated" },
    deviceLimitUpdated: "Device limit updated",
    lapsedExpired: (n) => `${n} lapsed subscription(s) marked expired`,
    slugInUse: "Slug already in use.",
    planCreated: "Plan created",
    planUpdated: "Plan updated. Existing subscriptions keep their terms.",
    planInUse: (n) => `This plan is used by ${n} subscription(s). Disable it instead of deleting.`,
    planDeleted: "Plan deleted",
    pricingSaved: "Pricing settings saved",
    invalidVerificationDate: "Invalid verification date.",
    recordUpdated: "Record updated",
    recordAdded: "Record added",
    recordDeleted: "Record deleted",
    approved: "Approved and activated",
    rejected: "Rejected",
    fileTooLarge: "File is too large (5 MB maximum).",
    imported: (c, u, s, p, e) => `Imported: ${c} new, ${u} updated, ${s} skipped, ${p} set to pending (missing evidence), ${e} error(s)`,
    jobRunning: "This job is already running. Progress is shown above the table.",
    jobStarted: {
      revalidate: "Revalidation started in the background. You can keep working.",
      feeds: "Threat-feed sync started in the background. You can keep working.",
    },
    scannerSaved: "Scanner configuration saved; it applies to the next scan",
    scannerReset: "Scanner configuration reset to defaults",
    settingsSaved: "Settings saved",
    siteControlLabels: {
      loginEnabled: "Client sign-in",
      registrationEnabled: "Registration",
      pricingVisible: "Pricing section",
      consentRequired: "Terms acceptance before the first check",
      consentEmailVerification: "E-mail code verification",
    },
    nothingToSave: "Nothing to save",
    toggled: (label, on) => `${label} ${on ? "turned on" : "turned off"}`,
    freePolicySaved: "Free-check policy saved",
    clientsSignedOut: (n) => `${n} client session${n === 1 ? "" : "s"} signed out`,
    noClientSignedIn: "No client was signed in",
    markedHandled: "Marked as handled",
    keySaved: (note) => `API key ${note}. New scans use it immediately.`,
    keyNoteSaved: "saved",
    keyNoteValidated: (used, allowed) => `validated with VirusTotal (daily ${used}/${allowed})`,
    keyRemoved: "Stored key removed. The environment variable is used if set.",
    noVtKey: "No VirusTotal key is configured.",
    quotaRefreshed: "Quota refreshed",
    ipUnblocked: "IP unblocked",
  },
  ru: {
    forbidden: "Требуются права суперадмина.",
    validation: {
      "Invalid date": "Неверная дата",
      "Use lowercase letters, digits and dashes.": "Используйте только строчные латинские буквы, цифры и дефисы.",
      "Patterns may contain only letters, digits, dots, dashes, * and ?.": "Шаблоны могут содержать только буквы, цифры, точки, дефисы, * и ?.",
      "This does not look like an API key.": "Это не похоже на API-ключ.",
      "API keys contain only letters, digits and - _ . :": "API-ключ может содержать только буквы, цифры и символы - _ . :",
    },
    inUse: "Уже используется.",
    emailExists: "Пользователь с такой эл. почтой уже существует.",
    userCreated: "Пользователь создан",
    ownRole: "Нельзя снять роль суперадмина с самого себя.",
    emailTaken: "Эта эл. почта уже используется другим пользователем.",
    userUpdated: "Пользователь обновлён",
    superAdminUnlimited: "У суперадминов уже есть безлимитный доступ. При необходимости измените роль в форме редактирования.",
    alreadyUnlimited: "Доступ уже безлимитный",
    alreadyRegular: "Уже обычный пользователь",
    unlimitedGranted: (email) => `У ${email} теперь безлимитный доступ`,
    unlimitedRemoved: (email) => `Безлимитный доступ для ${email} отключён`,
    ownDeactivate: "Нельзя деактивировать собственный аккаунт.",
    accountActivated: "Аккаунт активирован",
    accountDeactivated: "Аккаунт деактивирован, все сеансы завершены",
    ownDelete: "Нельзя удалить собственный аккаунт.",
    userDeleted: "Пользователь удалён",
    passwordReset: "Пароль сброшен, пользователь вышел из системы на всех устройствах",
    deviceRevoked: "Устройство отозвано",
    sessionsRevoked: (n) => `Завершено сеансов: ${n}`,
    assigned: (plan) => `Тариф ${plan} назначен`,
    planChanged: "Тариф изменён",
    extended: "Подписка продлена",
    expiryUpdated: "Дата окончания обновлена",
    subStatus: { ACTIVE: "Подписка активирована", SUSPENDED: "Подписка приостановлена", CANCELLED: "Подписка деактивирована" },
    deviceLimitUpdated: "Лимит устройств обновлён",
    lapsedExpired: (n) => `Отмечено как истёкшие: ${n} ${ruPlural(n, "просроченная подписка", "просроченные подписки", "просроченных подписок")}`,
    slugInUse: "Этот slug уже используется.",
    planCreated: "Тариф создан",
    planUpdated: "Тариф обновлён. Условия действующих подписок не меняются.",
    planInUse: (n) => `Этот тариф используется в ${n} ${ruPlural(n, "подписке", "подписках", "подписках")}. Отключите его вместо удаления.`,
    planDeleted: "Тариф удалён",
    pricingSaved: "Настройки цен сохранены",
    invalidVerificationDate: "Неверная дата подтверждения.",
    recordUpdated: "Запись обновлена",
    recordAdded: "Запись добавлена",
    recordDeleted: "Запись удалена",
    approved: "Одобрено и активировано",
    rejected: "Отклонено",
    fileTooLarge: "Файл слишком большой (максимум 5 МБ).",
    imported: (c, u, s, p, e) => `Импорт завершён: новых — ${c}, обновлено — ${u}, пропущено — ${s}, отправлено на проверку (нет подтверждения) — ${p}, ошибок — ${e}`,
    jobRunning: "Эта задача уже выполняется. Ход выполнения показан над таблицей.",
    jobStarted: {
      revalidate: "Перепроверка запущена в фоне. Можно продолжать работу.",
      feeds: "Синхронизация фидов угроз запущена в фоне. Можно продолжать работу.",
    },
    scannerSaved: "Настройки сканера сохранены и применятся со следующей проверки",
    scannerReset: "Настройки сканера сброшены по умолчанию",
    settingsSaved: "Настройки сохранены",
    siteControlLabels: {
      loginEnabled: "Вход клиентов",
      registrationEnabled: "Регистрация",
      pricingVisible: "Раздел цен",
      consentRequired: "Принятие условий перед первой проверкой",
      consentEmailVerification: "Подтверждение кодом по эл. почте",
    },
    nothingToSave: "Нечего сохранять",
    toggled: (label, on) => `${label}: ${on ? "включено" : "выключено"}`,
    freePolicySaved: "Правила бесплатных проверок сохранены",
    clientsSignedOut: (n) => `Завершено клиентских сеансов: ${n}`,
    noClientSignedIn: "Ни один клиент не был в системе",
    markedHandled: "Отмечено как обработанное",
    keySaved: (note) => `API-ключ ${note}. Новые проверки используют его сразу.`,
    keyNoteSaved: "сохранён",
    keyNoteValidated: (used, allowed) => `проверен в VirusTotal (за день ${used}/${allowed})`,
    keyRemoved: "Сохранённый ключ удалён. Если задана переменная окружения, будет использоваться она.",
    noVtKey: "Ключ VirusTotal не настроен.",
    quotaRefreshed: "Квота обновлена",
    ipUnblocked: "IP разблокирован",
  },
  uz: {
    forbidden: "Super Admin huquqi talab qilinadi.",
    validation: {
      "Invalid date": "Sana noto‘g‘ri",
      "Use lowercase letters, digits and dashes.": "Faqat kichik lotin harflari, raqamlar va chiziqchadan foydalaning.",
      "Patterns may contain only letters, digits, dots, dashes, * and ?.": "Shablonlarda faqat harflar, raqamlar, nuqta, chiziqcha, * va ? bo‘lishi mumkin.",
      "This does not look like an API key.": "Bu API kalitiga o‘xshamaydi.",
      "API keys contain only letters, digits and - _ . :": "API kalitida faqat harflar, raqamlar va - _ . : belgilari bo‘ladi",
    },
    inUse: "Allaqachon band.",
    emailExists: "Bu e-pochtali foydalanuvchi allaqachon mavjud.",
    userCreated: "Foydalanuvchi yaratildi",
    ownRole: "O‘zingizdan Super Admin rolini olib tashlay olmaysiz.",
    emailTaken: "Bu e-pochta boshqa foydalanuvchiga tegishli.",
    userUpdated: "Foydalanuvchi yangilandi",
    superAdminUnlimited: "Super Adminlar allaqachon cheksiz kirish huquqiga ega. Kerak bo‘lsa, rolni tahrirlash formasida o‘zgartiring.",
    alreadyUnlimited: "Allaqachon cheksiz",
    alreadyRegular: "Allaqachon oddiy foydalanuvchi",
    unlimitedGranted: (email) => `${email} endi cheksiz kirish huquqiga ega`,
    unlimitedRemoved: (email) => `${email} uchun cheksiz kirish olib tashlandi`,
    ownDeactivate: "O‘z akkauntingizni faolsizlantira olmaysiz.",
    accountActivated: "Akkaunt faollashtirildi",
    accountDeactivated: "Akkaunt faolsizlantirildi va barcha seanslar yakunlandi",
    ownDelete: "O‘z akkauntingizni o‘chira olmaysiz.",
    userDeleted: "Foydalanuvchi o‘chirildi",
    passwordReset: "Parol tiklandi, foydalanuvchi barcha qurilmalarda tizimdan chiqarildi",
    deviceRevoked: "Qurilma ruxsati bekor qilindi",
    sessionsRevoked: (n) => `${n} ta seans yakunlandi`,
    assigned: (plan) => `${plan} tarifi berildi`,
    planChanged: "Tarif o‘zgartirildi",
    extended: "Obuna uzaytirildi",
    expiryUpdated: "Tugash sanasi yangilandi",
    subStatus: { ACTIVE: "Obuna faollashtirildi", SUSPENDED: "Obuna to‘xtatib turildi", CANCELLED: "Obuna bekor qilindi" },
    deviceLimitUpdated: "Qurilmalar limiti yangilandi",
    lapsedExpired: (n) => `Muddati o‘tgan ${n} ta obuna yakunlangan deb belgilandi`,
    slugInUse: "Bu slug allaqachon band.",
    planCreated: "Tarif yaratildi",
    planUpdated: "Tarif yangilandi. Mavjud obunalarning shartlari o‘zgarmaydi.",
    planInUse: (n) => `Bu tarif ${n} ta obunada ishlatilmoqda. Uni o‘chirish o‘rniga nofaol qiling.`,
    planDeleted: "Tarif o‘chirildi",
    pricingSaved: "Narx sozlamalari saqlandi",
    invalidVerificationDate: "Tasdiqlash sanasi noto‘g‘ri.",
    recordUpdated: "Yozuv yangilandi",
    recordAdded: "Yozuv qo‘shildi",
    recordDeleted: "Yozuv o‘chirildi",
    approved: "Tasdiqlandi va faollashtirildi",
    rejected: "Rad etildi",
    fileTooLarge: "Fayl juda katta (ko‘pi bilan 5 MB).",
    imported: (c, u, s, p, e) => `Import qilindi: yangi — ${c}, yangilangan — ${u}, o‘tkazib yuborilgan — ${s}, ko‘rib chiqishga yuborilgan (dalil yo‘q) — ${p}, xatolar — ${e}`,
    jobRunning: "Bu vazifa allaqachon bajarilmoqda. Jarayon jadval ustida ko‘rsatiladi.",
    jobStarted: {
      revalidate: "Qayta tekshirish fonda boshlandi. Ishni davom ettirishingiz mumkin.",
      feeds: "Tahdid lentalarini sinxronlash fonda boshlandi. Ishni davom ettirishingiz mumkin.",
    },
    scannerSaved: "Skaner sozlamalari saqlandi, ular keyingi tekshiruvdan boshlab qo‘llanadi",
    scannerReset: "Skaner sozlamalari standart holatga qaytarildi",
    settingsSaved: "Sozlamalar saqlandi",
    siteControlLabels: {
      loginEnabled: "Mijozlar kirishi",
      registrationEnabled: "Ro‘yxatdan o‘tish",
      pricingVisible: "Narxlar bo‘limi",
      consentRequired: "Birinchi tekshiruvdan oldin shartlarni qabul qilish",
      consentEmailVerification: "E-pochta kodi orqali tasdiqlash",
    },
    nothingToSave: "Saqlanadigan o‘zgarish yo‘q",
    toggled: (label, on) => `${label}: ${on ? "yoqildi" : "o‘chirildi"}`,
    freePolicySaved: "Bepul tekshiruvlar qoidasi saqlandi",
    clientsSignedOut: (n) => `${n} ta mijoz seansi yakunlandi`,
    noClientSignedIn: "Tizimda birorta ham mijoz yo‘q edi",
    markedHandled: "Ko‘rib chiqilgan deb belgilandi",
    keySaved: (note) => `API kaliti ${note}. Yangi tekshiruvlar undan darhol foydalanadi.`,
    keyNoteSaved: "saqlandi",
    keyNoteValidated: (used, allowed) => `VirusTotal orqali tekshirildi (kunlik ${used}/${allowed})`,
    keyRemoved: "Saqlangan kalit o‘chirildi. Agar muhit o‘zgaruvchisi o‘rnatilgan bo‘lsa, undan foydalaniladi.",
    noVtKey: "VirusTotal kaliti sozlanmagan.",
    quotaRefreshed: "Kvota yangilandi",
    ipUnblocked: "IP blokdan chiqarildi",
  },
});
