import { defineMessages } from "../config";

type SiteControlsText = {
  eyebrow: string;
  title: string;
  description: string;
  accessTitle: string;
  accessHint: string;
  open: string;
  closed: string;
  visible: string;
  hidden: string;
  on: string;
  off: string;
  loginTitle: string;
  loginDesc: string;
  registrationTitle: string;
  registrationDesc: string;
  registrationNote: string;
  pricingTitle: string;
  pricingDesc: string;
  signOutHint: string;
  signOutButton: string;
  signOutTitle: string;
  signOutDesc: string;
  signOutConfirm: string;
  consentTitle: string;
  consentHint: string;
  consentRequiredTitle: string;
  consentRequiredDesc: string;
  verifyTitle: string;
  verifyDesc: string;
  smtpMissing: string;
  viewAcceptances: string;
  freeTitle: string;
  freeHint: string;
  presets: { unlimited: string; perDay: (n: number) => string; oneTotal: string; paidOnly: string };
  mode: string;
  modeUnlimited: string;
  modeDaily: string;
  modeTotal: string;
  limitPerDay: string;
  limitTotal: string;
  limitHint: string;
  networkLimit: string;
  networkHintUnlimited: string;
  networkHint: string;
  visitorsSee: string;
  todayStats: (devices: number, exhausted: number) => string;
  totalStats: (devices: number, exhausted: number) => string;
  saveFree: string;
};

export const siteControlsText = defineMessages<SiteControlsText>({
  en: {
    eyebrow: "Platform",
    title: "Site controls",
    description: "Open or close client sign-in and registration, show or hide pricing, require the Terms of Use, and choose how many free checks people get before paying.",
    accessTitle: "Website access",
    accessHint: "Each switch applies immediately to the live website.",
    open: "Open",
    closed: "Closed",
    visible: "Visible",
    hidden: "Hidden",
    on: "On",
    off: "Off",
    loginTitle: "Client sign-in",
    loginDesc: "Off: the Log in and Register buttons disappear from the website and clients cannot sign in. Super Admins can always sign in at /login. Clients who are already signed in stay signed in unless you sign them out below.",
    registrationTitle: "Registration (new clients)",
    registrationDesc: "Off: new accounts cannot be created and the Register / Get started buttons are hidden. On: anyone can create an account.",
    registrationNote: "Registration is closed while client sign-in is off.",
    pricingTitle: "Pricing section",
    pricingDesc: "Off: the Pricing page returns 404, plans disappear from the home page and the menu, View plans links are removed and online checkout is closed. You can still preview /pricing as Super Admin.",
    signOutHint: "Sign out every client right now (Super Admin sessions are kept).",
    signOutButton: "Sign out all clients",
    signOutTitle: "Sign out all clients?",
    signOutDesc: "Every active session of non-admin accounts ends now. Clients can sign in again only while client sign-in is open.",
    signOutConfirm: "Sign out all",
    consentTitle: "Terms of Use and identification",
    consentHint: "Before the first check people tick the Terms of Use and give their first and last name and e-mail. Everything is listed in Terms & clients.",
    consentRequiredTitle: "Require the Terms of Use before the first check",
    consentRequiredDesc: "On: visitors and clients must accept the Terms of Use (including the limitation of liability) and give their name and e-mail once, before their first check. Super Admins are never asked.",
    verifyTitle: "Confirm the e-mail with a code",
    verifyDesc: "On: a 6-digit code is sent to the e-mail address, and checking starts only after the code is entered.",
    smtpMissing: "SMTP is not configured on the server, so codes cannot be sent. Until SMTP is added, e-mails are collected but not confirmed.",
    viewAcceptances: "Open Terms & clients",
    freeTitle: "Free checks without a subscription",
    freeHint: "Applies to visitors and to signed-in users without a plan, counted per device (private windows and new accounts on the same device share it). Subscribers and Unlimited users are not affected.",
    presets: { unlimited: "Unlimited", perDay: (n) => `${n} per day`, oneTotal: "1 total, then paid", paidOnly: "Paid only" },
    mode: "Mode",
    modeUnlimited: "Unlimited (free for everyone)",
    modeDaily: "Daily allowance (renews 00:00)",
    modeTotal: "One-time allowance, then paid",
    limitPerDay: "Free checks per day",
    limitTotal: "Free checks in total",
    limitHint: "0 = subscription required",
    networkLimit: "Visitor checks per network per day",
    networkHintUnlimited: "Unlimited mode uses at least 1000 (anti-abuse).",
    networkHint: "Offices behind one IP share this ceiling.",
    visitorsSee: "Visitors will see: ",
    todayStats: (d, e) => `Today: ${d} device${d === 1 ? "" : "s"} used free checks, ${e} reached the limit.`,
    totalStats: (d, e) => `So far: ${d} device${d === 1 ? "" : "s"} used free checks, ${e} reached the limit.`,
    saveFree: "Save free-check policy",
  },
  ru: {
    eyebrow: "Платформа",
    title: "Управление сайтом",
    description: "Открывайте и закрывайте вход и регистрацию клиентов, показывайте или скрывайте цены, требуйте принятия Условий использования и выбирайте, сколько бесплатных проверок доступно до оплаты.",
    accessTitle: "Доступ к сайту",
    accessHint: "Каждый переключатель сразу применяется на сайте.",
    open: "Открыто",
    closed: "Закрыто",
    visible: "Видно",
    hidden: "Скрыто",
    on: "Вкл",
    off: "Выкл",
    loginTitle: "Вход для клиентов",
    loginDesc: "Выкл: кнопки «Войти» и «Регистрация» исчезают с сайта, и клиенты не могут войти. Суперадмин всегда может войти через /login. Клиенты, которые уже вошли, остаются в системе, пока вы не завершите их сеансы ниже.",
    registrationTitle: "Регистрация (новые клиенты)",
    registrationDesc: "Выкл: новые аккаунты создать нельзя, кнопки регистрации скрыты. Вкл: любой может создать аккаунт.",
    registrationNote: "Регистрация закрыта, пока вход для клиентов выключен.",
    pricingTitle: "Раздел цен",
    pricingDesc: "Выкл: страница цен отдаёт 404, тарифы пропадают с главной и из меню, ссылки «Посмотреть тарифы» убираются, онлайн-оплата закрывается. Суперадмин по-прежнему может просмотреть /pricing.",
    signOutHint: "Завершить сеансы всех клиентов прямо сейчас (сеансы суперадминов сохраняются).",
    signOutButton: "Выйти у всех клиентов",
    signOutTitle: "Завершить сеансы всех клиентов?",
    signOutDesc: "Все активные сеансы аккаунтов без прав администратора будут завершены. Клиенты смогут войти снова, только пока вход открыт.",
    signOutConfirm: "Завершить все",
    consentTitle: "Условия использования и идентификация",
    consentHint: "Перед первой проверкой человек отмечает согласие с Условиями использования и указывает имя, фамилию и эл. почту. Всё собирается в разделе «Условия и клиенты».",
    consentRequiredTitle: "Требовать Условия использования перед первой проверкой",
    consentRequiredDesc: "Вкл: посетители и клиенты один раз, перед первой проверкой, принимают Условия использования (включая ограничение ответственности) и указывают имя и почту. Суперадмина это не касается.",
    verifyTitle: "Подтверждать почту кодом",
    verifyDesc: "Вкл: на почту отправляется 6-значный код, и проверка начинается только после ввода кода.",
    smtpMissing: "На сервере не настроен SMTP, поэтому коды не отправляются. Пока SMTP не добавлен, почта собирается, но не подтверждается.",
    viewAcceptances: "Открыть «Условия и клиенты»",
    freeTitle: "Бесплатные проверки без подписки",
    freeHint: "Действует для посетителей и для вошедших пользователей без тарифа; считается по устройству (приватные окна и новые аккаунты на том же устройстве делят лимит). На подписчиков и Unlimited-пользователей не влияет.",
    presets: { unlimited: "Безлимит", perDay: (n) => `${n} в день`, oneTotal: "1 всего, потом платно", paidOnly: "Только платно" },
    mode: "Режим",
    modeUnlimited: "Безлимит (бесплатно для всех)",
    modeDaily: "Дневной лимит (обновляется в 00:00)",
    modeTotal: "Разовый лимит, потом платно",
    limitPerDay: "Бесплатных проверок в день",
    limitTotal: "Бесплатных проверок всего",
    limitHint: "0 = нужна подписка",
    networkLimit: "Проверок посетителей с одной сети в день",
    networkHintUnlimited: "В безлимитном режиме не меньше 1000 (защита от злоупотреблений).",
    networkHint: "Офисы за одним IP делят этот лимит.",
    visitorsSee: "Посетители увидят: ",
    todayStats: (d, e) => `Сегодня бесплатными проверками воспользовались устройств: ${d}, исчерпали лимит: ${e}.`,
    totalStats: (d, e) => `Всего бесплатными проверками воспользовались устройств: ${d}, исчерпали лимит: ${e}.`,
    saveFree: "Сохранить правила бесплатных проверок",
  },
  uz: {
    eyebrow: "Platforma",
    title: "Sayt boshqaruvi",
    description: "Mijozlar uchun kirish va ro‘yxatdan o‘tishni yoqing yoki o‘chiring, narxlarni ko‘rsating yoki yashiring, Foydalanish shartlarini majburiy qiling va to‘lovdan oldin nechta bepul tekshiruv berilishini tanlang.",
    accessTitle: "Saytga kirish",
    accessHint: "Har bir almashtirgich saytda darhol qo‘llanadi.",
    open: "Ochiq",
    closed: "Yopiq",
    visible: "Ko‘rinadi",
    hidden: "Yashirin",
    on: "Yoqilgan",
    off: "O‘chirilgan",
    loginTitle: "Mijozlar uchun kirish",
    loginDesc: "O‘chirilsa: saytdan «Kirish» va «Ro‘yxatdan o‘tish» tugmalari yo‘qoladi va mijozlar kira olmaydi. Super Admin har doim /login orqali kira oladi. Allaqachon kirgan mijozlar, quyida ularni chiqarib yubormaguningizcha, tizimda qoladi.",
    registrationTitle: "Ro‘yxatdan o‘tish (yangi mijozlar)",
    registrationDesc: "O‘chirilsa: yangi akkaunt ochib bo‘lmaydi va ro‘yxatdan o‘tish tugmalari yashiriladi. Yoqilsa: istalgan odam akkaunt ochishi mumkin.",
    registrationNote: "Mijozlar uchun kirish o‘chiq ekan, ro‘yxatdan o‘tish ham yopiq.",
    pricingTitle: "Narxlar bo‘limi",
    pricingDesc: "O‘chirilsa: Narxlar sahifasi 404 qaytaradi, tariflar bosh sahifa va menyudan yo‘qoladi, «Tariflarni ko‘rish» havolalari olib tashlanadi va onlayn to‘lov yopiladi. Super Admin sifatida /pricing sahifasini baribir ko‘ra olasiz.",
    signOutHint: "Hozirning o‘zida barcha mijozlarni tizimdan chiqarish (Super Admin seanslari saqlanadi).",
    signOutButton: "Barcha mijozlarni chiqarish",
    signOutTitle: "Barcha mijozlar tizimdan chiqarilsinmi?",
    signOutDesc: "Admin bo‘lmagan akkauntlarning barcha faol seanslari hozir tugatiladi. Mijozlar faqat kirish ochiq bo‘lganda qayta kira oladi.",
    signOutConfirm: "Hammasini chiqarish",
    consentTitle: "Foydalanish shartlari va identifikatsiya",
    consentHint: "Birinchi tekshiruvdan oldin odamlar Foydalanish shartlariga rozilik belgisini qo‘yadi va ism-familiyasi hamda e-pochtasini kiritadi. Hammasi «Shartlar va mijozlar» bo‘limida yig‘iladi.",
    consentRequiredTitle: "Birinchi tekshiruvdan oldin Foydalanish shartlarini talab qilish",
    consentRequiredDesc: "Yoqilsa: mehmonlar va mijozlar birinchi tekshiruvdan oldin bir marta Foydalanish shartlarini (javobgarlikni cheklash bandi bilan) qabul qiladi hamda ism va e-pochtasini kiritadi. Super Admin’dan so‘ralmaydi.",
    verifyTitle: "E-pochtani kod bilan tasdiqlash",
    verifyDesc: "Yoqilsa: e-pochtaga 6 xonali kod yuboriladi va tekshiruv faqat kod kiritilgandan keyin boshlanadi.",
    smtpMissing: "Serverda SMTP sozlanmagan, shuning uchun kod yuborib bo‘lmaydi. SMTP qo‘shilmaguncha e-pochtalar yig‘iladi, lekin tasdiqlanmaydi.",
    viewAcceptances: "«Shartlar va mijozlar»ni ochish",
    freeTitle: "Obunasiz bepul tekshiruvlar",
    freeHint: "Mehmonlarga va tarifi yo‘q ro‘yxatdan o‘tgan foydalanuvchilarga qo‘llanadi, qurilma bo‘yicha hisoblanadi (bir qurilmadagi maxfiy oynalar va yangi akkauntlar limitni bo‘lishadi). Obunachilar va Unlimited foydalanuvchilarga ta’sir qilmaydi.",
    presets: { unlimited: "Cheksiz", perDay: (n) => `Kuniga ${n} ta`, oneTotal: "Jami 1 ta, keyin pullik", paidOnly: "Faqat pullik" },
    mode: "Rejim",
    modeUnlimited: "Cheksiz (hamma uchun bepul)",
    modeDaily: "Kunlik limit (00:00 da yangilanadi)",
    modeTotal: "Bir martalik limit, keyin pullik",
    limitPerDay: "Kunlik bepul tekshiruvlar",
    limitTotal: "Jami bepul tekshiruvlar",
    limitHint: "0 = obuna talab qilinadi",
    networkLimit: "Bir tarmoqdan mehmonlarning kunlik tekshiruvlari",
    networkHintUnlimited: "Cheksiz rejimda kamida 1000 (suiiste’mollardan himoya).",
    networkHint: "Bitta IP ortidagi ofislar shu limitni bo‘lishadi.",
    visitorsSee: "Mehmonlar ko‘radi: ",
    todayStats: (d, e) => `Bugun: ${d} ta qurilma bepul tekshiruvdan foydalandi, ${e} tasi limitga yetdi.`,
    totalStats: (d, e) => `Jami: ${d} ta qurilma bepul tekshiruvdan foydalandi, ${e} tasi limitga yetdi.`,
    saveFree: "Bepul tekshiruv qoidalarini saqlash",
  },
});
