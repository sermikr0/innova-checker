import { defineMessages } from "../config";

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

type Role = "SUPER_ADMIN" | "UNLIMITED" | "USER";

type AdminUsersText = {
  roles: Record<Role, string>;
  roleOptions: Record<Role, string>;
  system: string;
  never: string;
  filter: string;
  search: string;
  list: {
    eyebrow: string;
    title: string;
    count: (n: number) => string;
    searchPlaceholder: string;
    role: string;
    allRoles: string;
    roleUsers: string;
    roleUnlimited: string;
    roleAdmins: string;
    status: string;
    allStatuses: string;
    active: string;
    deactivated: string;
    user: string;
    company: string;
    subscription: string;
    scans: string;
    lastLogin: string;
    joined: string;
    deactivatedBadge: string;
    unlimited: string;
  };
  detail: {
    eyebrow: (joined: string, lastLogin: string) => string;
    active: string;
    deactivated: string;
    unlimitedNote: string;
    editUser: string;
    subscription: string;
    subLine: (plan: string, status: string, start: string, end: string, days: number, active: number, limit: number) => string;
    noSubscription: string;
    devices: (signedIn: number) => string;
    device: string;
    state: string;
    sessions: string;
    lastSeen: string;
    ip: string;
    noDevices: string;
    registered: (date: string) => string;
    revoked: (reason: string | undefined) => string;
    signedIn: string;
    signedOut: string;
    scanHistory: (n: number) => string;
    noScans: string;
    subHistory: string;
    noSubChanges: string;
    expires: (date: string) => string;
  };
  forms: {
    createUser: string;
    createUserText: string;
    fullName: string;
    email: string;
    company: string;
    role: string;
    initialPassword: string;
    saveChanges: string;
    deactivateTitle: string;
    activateTitle: string;
    deactivateText: (email: string) => string;
    activateText: (email: string) => string;
    deactivate: string;
    activate: string;
    resetPassword: string;
    resetPasswordText: string;
    newPassword: string;
    setPassword: string;
    signOutTitle: string;
    signOutText: string;
    signOutConfirm: string;
    signOutButton: string;
    deleteTitle: string;
    deleteText: (email: string) => string;
    deleteUser: string;
    revokeTitle: string;
    revokeText: (label: string) => string;
    revoke: string;
    removeUnlimitedTitle: string;
    removeUnlimitedText: (email: string) => string;
    removeUnlimitedConfirm: string;
    removeUnlimitedButton: string;
    grantUnlimitedTitle: string;
    grantUnlimitedText: (email: string) => string;
    grantUnlimitedConfirm: string;
    grantUnlimitedButton: string;
  };
};

/** Admin → Users: list, user detail page and the user dialogs. */
export const adminUsersText = defineMessages<AdminUsersText>({
  en: {
    roles: { SUPER_ADMIN: "Super Admin", UNLIMITED: "Unlimited user", USER: "User" },
    roleOptions: {
      USER: "User (needs a subscription)",
      UNLIMITED: "Unlimited user (no subscription or device limit)",
      SUPER_ADMIN: "Super Admin (full admin panel)",
    },
    system: "system",
    never: "never",
    filter: "Filter",
    search: "Search",
    list: {
      eyebrow: "Accounts",
      title: "Users",
      count: (n) => `${n} user(s)`,
      searchPlaceholder: "Search name, e-mail or company",
      role: "Role",
      allRoles: "All roles",
      roleUsers: "Users",
      roleUnlimited: "Unlimited users",
      roleAdmins: "Super Admins",
      status: "Status",
      allStatuses: "All statuses",
      active: "Active",
      deactivated: "Deactivated",
      user: "User",
      company: "Company",
      subscription: "Subscription",
      scans: "Scans",
      lastLogin: "Last login",
      joined: "Joined",
      deactivatedBadge: "deactivated",
      unlimited: "Unlimited",
    },
    detail: {
      eyebrow: (joined, lastLogin) => `User · joined ${joined} · last login ${lastLogin}`,
      active: "active",
      deactivated: "deactivated",
      unlimitedNote: "This account has unlimited access: no subscription, device limit or scan quota is applied.",
      editUser: "Edit user",
      subscription: "Subscription",
      subLine: (plan, status, start, end, days, active, limit) => `${plan} · ${status} · ${start} → ${end} · ${days} day(s) left · devices ${active}/${limit}`,
      noSubscription: "No current subscription",
      devices: (n) => `Devices (${n} signed in)`,
      device: "Device",
      state: "State",
      sessions: "Sessions",
      lastSeen: "Last seen",
      ip: "IP",
      noDevices: "No devices registered.",
      registered: (date) => `registered ${date}`,
      revoked: (reason) => `revoked (${reason})`,
      signedIn: "signed in",
      signedOut: "signed out",
      scanHistory: (n) => `Scan history (${n})`,
      noScans: "No scans.",
      subHistory: "Subscription history",
      noSubChanges: "No subscription changes.",
      expires: (date) => `expires ${date}`,
    },
    forms: {
      createUser: "Create user",
      createUserText: "The user can sign in immediately with this password.",
      fullName: "Full name",
      email: "E-mail",
      company: "Company",
      role: "Role",
      initialPassword: "Initial password",
      saveChanges: "Save changes",
      deactivateTitle: "Deactivate this account?",
      activateTitle: "Activate this account?",
      deactivateText: (email) => `${email} will be signed out and unable to log in.`,
      activateText: (email) => `${email} will be able to log in again.`,
      deactivate: "Deactivate",
      activate: "Activate",
      resetPassword: "Reset password",
      resetPasswordText: "Sets a new password and signs the user out everywhere.",
      newPassword: "New password",
      setPassword: "Set password",
      signOutTitle: "Sign out all sessions?",
      signOutText: "Every browser signed in as this user will be signed out.",
      signOutConfirm: "Sign out all",
      signOutButton: "Sign out all sessions",
      deleteTitle: "Delete this user?",
      deleteText: (email) => `${email}, their devices, sessions, subscriptions and scan history will be permanently deleted.`,
      deleteUser: "Delete user",
      revokeTitle: "Revoke device?",
      revokeText: (label) => `"${label}" will be signed out and removed from the user's devices.`,
      revoke: "Revoke",
      removeUnlimitedTitle: "Remove unlimited access?",
      removeUnlimitedText: (email) => `${email} becomes a regular user again and needs an active subscription to scan. Device limits apply again.`,
      removeUnlimitedConfirm: "Remove unlimited",
      removeUnlimitedButton: "Remove unlimited access",
      grantUnlimitedTitle: "Grant unlimited access?",
      grantUnlimitedText: (email) => `${email} will be able to scan without a subscription, on any number of devices, with no scan quota. The admin panel stays closed to this user.`,
      grantUnlimitedConfirm: "Grant unlimited",
      grantUnlimitedButton: "Grant unlimited access",
    },
  },
  ru: {
    roles: { SUPER_ADMIN: "Суперадмин", UNLIMITED: "Безлимитный пользователь", USER: "Пользователь" },
    roleOptions: {
      USER: "Пользователь (нужна подписка)",
      UNLIMITED: "Безлимитный пользователь (без подписки и лимита устройств)",
      SUPER_ADMIN: "Суперадмин (полный доступ к админ-панели)",
    },
    system: "система",
    never: "никогда",
    filter: "Фильтр",
    search: "Поиск",
    list: {
      eyebrow: "Аккаунты",
      title: "Пользователи",
      count: (n) => `${n} ${ruPlural(n, "пользователь", "пользователя", "пользователей")}`,
      searchPlaceholder: "Поиск по имени, эл. почте или компании",
      role: "Роль",
      allRoles: "Все роли",
      roleUsers: "Пользователи",
      roleUnlimited: "Безлимитные пользователи",
      roleAdmins: "Суперадмины",
      status: "Статус",
      allStatuses: "Все статусы",
      active: "Активные",
      deactivated: "Деактивированные",
      user: "Пользователь",
      company: "Компания",
      subscription: "Подписка",
      scans: "Проверки",
      lastLogin: "Последний вход",
      joined: "Регистрация",
      deactivatedBadge: "деактивирован",
      unlimited: "Безлимит",
    },
    detail: {
      eyebrow: (joined, lastLogin) => `Пользователь · регистрация: ${joined} · последний вход: ${lastLogin}`,
      active: "активен",
      deactivated: "деактивирован",
      unlimitedNote: "У этого аккаунта безлимитный доступ: подписка, лимит устройств и квота проверок не применяются.",
      editUser: "Редактировать пользователя",
      subscription: "Подписка",
      subLine: (plan, status, start, end, days, active, limit) =>
        `${plan} · ${status} · ${start} → ${end} · осталось ${days} ${ruPlural(days, "день", "дня", "дней")} · устройства ${active}/${limit}`,
      noSubscription: "Нет текущей подписки",
      devices: (n) => `Устройства (в системе: ${n})`,
      device: "Устройство",
      state: "Состояние",
      sessions: "Сеансы",
      lastSeen: "Последняя активность",
      ip: "IP",
      noDevices: "Зарегистрированных устройств нет.",
      registered: (date) => `зарегистрировано ${date}`,
      revoked: (reason) => `отозвано (${reason})`,
      signedIn: "в системе",
      signedOut: "не в системе",
      scanHistory: (n) => `История проверок (${n})`,
      noScans: "Проверок нет.",
      subHistory: "История подписки",
      noSubChanges: "Изменений подписки не было.",
      expires: (date) => `истекает ${date}`,
    },
    forms: {
      createUser: "Создать пользователя",
      createUserText: "Пользователь сможет сразу войти с этим паролем.",
      fullName: "Имя и фамилия",
      email: "Эл. почта",
      company: "Компания",
      role: "Роль",
      initialPassword: "Начальный пароль",
      saveChanges: "Сохранить изменения",
      deactivateTitle: "Деактивировать этот аккаунт?",
      activateTitle: "Активировать этот аккаунт?",
      deactivateText: (email) => `${email} будет выведен из системы и не сможет войти.`,
      activateText: (email) => `${email} снова сможет войти.`,
      deactivate: "Деактивировать",
      activate: "Активировать",
      resetPassword: "Сбросить пароль",
      resetPasswordText: "Устанавливает новый пароль и завершает все сеансы пользователя.",
      newPassword: "Новый пароль",
      setPassword: "Установить пароль",
      signOutTitle: "Завершить все сеансы?",
      signOutText: "Во всех браузерах, где выполнен вход под этим пользователем, сеанс будет завершён.",
      signOutConfirm: "Завершить все",
      signOutButton: "Завершить все сеансы",
      deleteTitle: "Удалить этого пользователя?",
      deleteText: (email) => `${email}, а также устройства, сеансы, подписки и история проверок этого пользователя будут удалены безвозвратно.`,
      deleteUser: "Удалить пользователя",
      revokeTitle: "Отозвать устройство?",
      revokeText: (label) => `На устройстве «${label}» будет выполнен выход, и оно будет удалено из устройств пользователя.`,
      revoke: "Отозвать",
      removeUnlimitedTitle: "Отключить безлимитный доступ?",
      removeUnlimitedText: (email) => `${email} снова станет обычным пользователем, и для проверок понадобится активная подписка. Лимиты устройств снова будут действовать.`,
      removeUnlimitedConfirm: "Отключить безлимит",
      removeUnlimitedButton: "Отключить безлимитный доступ",
      grantUnlimitedTitle: "Предоставить безлимитный доступ?",
      grantUnlimitedText: (email) => `${email} сможет выполнять проверки без подписки, на любом количестве устройств и без квоты. Доступа к админ-панели у пользователя не будет.`,
      grantUnlimitedConfirm: "Включить безлимит",
      grantUnlimitedButton: "Предоставить безлимитный доступ",
    },
  },
  uz: {
    roles: { SUPER_ADMIN: "Super Admin", UNLIMITED: "Cheksiz foydalanuvchi", USER: "Foydalanuvchi" },
    roleOptions: {
      USER: "Foydalanuvchi (obuna kerak)",
      UNLIMITED: "Cheksiz foydalanuvchi (obuna va qurilmalar limiti yo‘q)",
      SUPER_ADMIN: "Super Admin (to‘liq admin panel)",
    },
    system: "tizim",
    never: "hech qachon",
    filter: "Filtrlash",
    search: "Qidirish",
    list: {
      eyebrow: "Akkauntlar",
      title: "Foydalanuvchilar",
      count: (n) => `${n} ta foydalanuvchi`,
      searchPlaceholder: "Ism, e-pochta yoki kompaniya bo‘yicha qidirish",
      role: "Rol",
      allRoles: "Barcha rollar",
      roleUsers: "Foydalanuvchilar",
      roleUnlimited: "Cheksiz foydalanuvchilar",
      roleAdmins: "Super Adminlar",
      status: "Holat",
      allStatuses: "Barcha holatlar",
      active: "Faol",
      deactivated: "Faolsizlantirilgan",
      user: "Foydalanuvchi",
      company: "Kompaniya",
      subscription: "Obuna",
      scans: "Tekshiruvlar",
      lastLogin: "Oxirgi kirish",
      joined: "Ro‘yxatdan o‘tgan",
      deactivatedBadge: "faolsizlantirilgan",
      unlimited: "Cheksiz",
    },
    detail: {
      eyebrow: (joined, lastLogin) => `Foydalanuvchi · ro‘yxatdan o‘tgan: ${joined} · oxirgi kirish: ${lastLogin}`,
      active: "faol",
      deactivated: "faolsizlantirilgan",
      unlimitedNote: "Bu akkaunt cheksiz kirish huquqiga ega: obuna, qurilmalar limiti va tekshiruvlar kvotasi qo‘llanmaydi.",
      editUser: "Foydalanuvchini tahrirlash",
      subscription: "Obuna",
      subLine: (plan, status, start, end, days, active, limit) => `${plan} · ${status} · ${start} → ${end} · ${days} kun qoldi · qurilmalar ${active}/${limit}`,
      noSubscription: "Joriy obuna yo‘q",
      devices: (n) => `Qurilmalar (tizimda: ${n})`,
      device: "Qurilma",
      state: "Holat",
      sessions: "Seanslar",
      lastSeen: "Oxirgi faollik",
      ip: "IP",
      noDevices: "Ro‘yxatga olingan qurilmalar yo‘q.",
      registered: (date) => `ro‘yxatga olingan: ${date}`,
      revoked: (reason) => `ruxsat bekor qilingan (${reason})`,
      signedIn: "tizimda",
      signedOut: "tizimdan chiqqan",
      scanHistory: (n) => `Tekshiruvlar tarixi (${n})`,
      noScans: "Tekshiruvlar yo‘q.",
      subHistory: "Obuna tarixi",
      noSubChanges: "Obunada o‘zgarishlar bo‘lmagan.",
      expires: (date) => `tugash sanasi: ${date}`,
    },
    forms: {
      createUser: "Foydalanuvchi yaratish",
      createUserText: "Foydalanuvchi shu parol bilan darhol tizimga kira oladi.",
      fullName: "Ism va familiya",
      email: "E-pochta",
      company: "Kompaniya",
      role: "Rol",
      initialPassword: "Boshlang‘ich parol",
      saveChanges: "O‘zgarishlarni saqlash",
      deactivateTitle: "Bu akkaunt faolsizlantirilsinmi?",
      activateTitle: "Bu akkaunt faollashtirilsinmi?",
      deactivateText: (email) => `${email} tizimdan chiqariladi va qayta kira olmaydi.`,
      activateText: (email) => `${email} yana tizimga kira oladi.`,
      deactivate: "Faolsizlantirish",
      activate: "Faollashtirish",
      resetPassword: "Parolni tiklash",
      resetPasswordText: "Yangi parol o‘rnatiladi va foydalanuvchi barcha qurilmalarda tizimdan chiqariladi.",
      newPassword: "Yangi parol",
      setPassword: "Parolni o‘rnatish",
      signOutTitle: "Barcha seanslar yakunlansinmi?",
      signOutText: "Shu foydalanuvchi nomidan kirilgan barcha brauzerlarda seans yakunlanadi.",
      signOutConfirm: "Hammasini yakunlash",
      signOutButton: "Barcha seanslarni yakunlash",
      deleteTitle: "Bu foydalanuvchi o‘chirilsinmi?",
      deleteText: (email) => `${email} hamda uning qurilmalari, seanslari, obunalari va tekshiruvlar tarixi butunlay o‘chiriladi.`,
      deleteUser: "Foydalanuvchini o‘chirish",
      revokeTitle: "Qurilma ruxsati bekor qilinsinmi?",
      revokeText: (label) => `“${label}” qurilmasida seans yakunlanadi va u foydalanuvchi qurilmalari ro‘yxatidan o‘chiriladi.`,
      revoke: "Bekor qilish",
      removeUnlimitedTitle: "Cheksiz kirish huquqi olib tashlansinmi?",
      removeUnlimitedText: (email) => `${email} yana oddiy foydalanuvchiga aylanadi va tekshiruv uchun faol obuna kerak bo‘ladi. Qurilmalar limiti yana qo‘llanadi.`,
      removeUnlimitedConfirm: "Cheksizni olib tashlash",
      removeUnlimitedButton: "Cheksiz kirishni olib tashlash",
      grantUnlimitedTitle: "Cheksiz kirish huquqi berilsinmi?",
      grantUnlimitedText: (email) => `${email} obunasiz, istalgan sondagi qurilmalarda va kvotasiz tekshiruv o‘tkaza oladi. Admin panel bu foydalanuvchi uchun yopiq qoladi.`,
      grantUnlimitedConfirm: "Cheksiz kirish berish",
      grantUnlimitedButton: "Cheksiz kirish huquqini berish",
    },
  },
});
