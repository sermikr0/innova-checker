import { defineMessages } from "../config";

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

const RU_UNITS: Record<string, [string, string, string]> = { DAY: ["день", "дня", "дней"], MONTH: ["месяц", "месяца", "месяцев"], YEAR: ["год", "года", "лет"] };
const UZ_UNITS: Record<string, string> = { DAY: "kun", MONTH: "oy", YEAR: "yil" };

type Unit = { DAY: string; MONTH: string; YEAR: string };

type AdminBillingText = {
  system: string;
  units: Unit;
  subs: {
    eyebrow: string;
    title: string;
    description: string;
    expireTitle: string;
    expireText: string;
    expireConfirm: string;
    expireButton: string;
    all: string;
    user: string;
    plan: string;
    status: string;
    start: string;
    expires: string;
    remaining: string;
    devices: string;
    empty: string;
    daysShort: (n: number) => string;
    manage: string;
    recent: string;
  };
  assign: {
    title: string;
    description: string;
    user: string;
    plan: string;
    planOption: (name: string, devices: number) => string;
    start: string;
    expiry: string;
    deviceLimit: string;
    note: string;
    notePlaceholder: string;
    assign: string;
  };
  manage: {
    changePlan: string;
    plan: string;
    restart: string;
    extend: string;
    amount: string;
    unit: string;
    customExpiry: string;
    expiresOn: string;
    setExpiry: string;
    deviceLimit: string;
    allowedDevices: string;
    updateLimit: string;
    status: string;
    activateTitle: string;
    activateText: string;
    activate: string;
    suspendTitle: string;
    suspendText: string;
    suspend: string;
    deactivateTitle: string;
    deactivateText: string;
    deactivate: string;
  };
  plans: {
    eyebrow: string;
    title: string;
    description: string;
    plan: string;
    duration: string;
    price: string;
    devices: string;
    status: string;
    inUse: string;
    recommended: string;
    durationValue: (n: number, unit: string) => string;
    enabled: string;
    disabled: string;
    deleteTitle: (name: string) => string;
    deleteText: string;
    delete: string;
    pricingSettings: string;
  };
  planForm: {
    editTitle: (name: string) => string;
    createPlan: string;
    description: string;
    edit: string;
    newPlan: string;
    name: string;
    slug: string;
    descriptionLabel: string;
    priceUzs: string;
    priceCard: string;
    deviceLimit: string;
    duration: string;
    durationUnit: string;
    sortOrder: string;
    features: string;
    enabled: string;
    enabledText: string;
    recommended: string;
    recommendedText: string;
    savePlan: string;
    paymentNotice: string;
    buttonLabel: string;
    recommendedBadge: string;
    showComparison: string;
    noProvider: string;
    savePricing: string;
  };
};

/** Admin → Subscriptions and Plans & pricing (pages and dialogs). */
export const adminBillingText = defineMessages<AdminBillingText>({
  en: {
    system: "system",
    units: { DAY: "Days", MONTH: "Months", YEAR: "Years" },
    subs: {
      eyebrow: "Licensing",
      title: "Subscriptions",
      description: "Assign, extend, suspend or change subscriptions. Payments are not integrated; all activations are manual.",
      expireTitle: "Expire lapsed subscriptions now?",
      expireText: "Active subscriptions past their expiration date are marked expired (this also happens automatically).",
      expireConfirm: "Run",
      expireButton: "Expire lapsed",
      all: "All",
      user: "User",
      plan: "Plan",
      status: "Status",
      start: "Start",
      expires: "Expires",
      remaining: "Remaining",
      devices: "Devices",
      empty: "No subscriptions.",
      daysShort: (n) => `${n} d`,
      manage: "Manage",
      recent: "Recent subscription changes",
    },
    assign: {
      title: "Assign subscription",
      description: "Replaces any current subscription of this user. Leave dates empty to start now with the plan's duration.",
      user: "User",
      plan: "Plan",
      planOption: (name, n) => `${name} · ${n} device(s)`,
      start: "Start (optional)",
      expiry: "Custom expiry (optional)",
      deviceLimit: "Device limit override (optional)",
      note: "Note (optional)",
      notePlaceholder: "e.g. Paid by bank transfer, invoice #123",
      assign: "Assign",
    },
    manage: {
      changePlan: "Change plan",
      plan: "Plan",
      restart: "Restart duration from today",
      extend: "Extend",
      amount: "Amount",
      unit: "Unit",
      customExpiry: "Custom expiration date",
      expiresOn: "Expires on",
      setExpiry: "Set expiry",
      deviceLimit: "Device limit",
      allowedDevices: "Allowed devices",
      updateLimit: "Update limit",
      status: "Status",
      activateTitle: "Activate subscription?",
      activateText: "The user will be able to scan until the expiration date.",
      activate: "Activate",
      suspendTitle: "Suspend subscription?",
      suspendText: "Scanning is blocked until the subscription is activated again.",
      suspend: "Suspend",
      deactivateTitle: "Deactivate subscription?",
      deactivateText: "The subscription is cancelled. Assign a new one to restore access.",
      deactivate: "Deactivate",
    },
    plans: {
      eyebrow: "Pricing",
      title: "Plans & pricing",
      description: "Prices, durations and device limits are read from the database by the pricing page and by subscription assignment.",
      plan: "Plan",
      duration: "Duration",
      price: "Price",
      devices: "Devices",
      status: "Status",
      inUse: "In use",
      recommended: "Recommended",
      durationValue: (n, unit) => `${n} ${unit.toLowerCase()}${n === 1 ? "" : "s"}`,
      enabled: "enabled",
      disabled: "disabled",
      deleteTitle: (name) => `Delete ${name}?`,
      deleteText: "Plans that are used by subscriptions cannot be deleted; disable them instead.",
      delete: "Delete",
      pricingSettings: "Pricing page settings",
    },
    planForm: {
      editTitle: (name) => `Edit ${name}`,
      createPlan: "Create plan",
      description: "Changes apply to new subscriptions. Existing subscriptions keep their device limit and dates.",
      edit: "Edit",
      newPlan: "New plan",
      name: "Name",
      slug: "Slug",
      descriptionLabel: "Description",
      priceUzs: "Price (UZS)",
      priceCard: "Card price (USD cents, 0 = not sold by card)",
      deviceLimit: "Device limit",
      duration: "Duration",
      durationUnit: "Duration unit",
      sortOrder: "Sort order",
      features: "Features (one per line)",
      enabled: "Enabled",
      enabledText: "Visible on the pricing page and assignable.",
      recommended: "Recommended",
      recommendedText: "Highlighted on the pricing page (only one plan).",
      savePlan: "Save plan",
      paymentNotice: "Payment notice on every card",
      buttonLabel: "Button label",
      recommendedBadge: "Recommended badge",
      showComparison: "Show comparison table",
      noProvider: "No payment provider is integrated, so purchase buttons stay disabled regardless of these labels.",
      savePricing: "Save pricing settings",
    },
  },
  ru: {
    system: "система",
    units: { DAY: "Дни", MONTH: "Месяцы", YEAR: "Годы" },
    subs: {
      eyebrow: "Лицензирование",
      title: "Подписки",
      description: "Назначение, продление, приостановка и изменение подписок. Платежи не подключены, все активации выполняются вручную.",
      expireTitle: "Завершить просроченные подписки сейчас?",
      expireText: "Активные подписки с прошедшей датой окончания будут отмечены как истёкшие (это также происходит автоматически).",
      expireConfirm: "Выполнить",
      expireButton: "Завершить просроченные",
      all: "Все",
      user: "Пользователь",
      plan: "Тариф",
      status: "Статус",
      start: "Начало",
      expires: "Окончание",
      remaining: "Осталось",
      devices: "Устройства",
      empty: "Подписок нет.",
      daysShort: (n) => `${n} дн.`,
      manage: "Управлять",
      recent: "Последние изменения подписок",
    },
    assign: {
      title: "Назначить подписку",
      description: "Заменяет текущую подписку пользователя. Оставьте даты пустыми, чтобы подписка началась сейчас и действовала весь срок тарифа.",
      user: "Пользователь",
      plan: "Тариф",
      planOption: (name, n) => `${name} · ${n} ${ruPlural(n, "устройство", "устройства", "устройств")}`,
      start: "Начало (необязательно)",
      expiry: "Своя дата окончания (необязательно)",
      deviceLimit: "Свой лимит устройств (необязательно)",
      note: "Примечание (необязательно)",
      notePlaceholder: "например: оплачено банковским переводом, счёт №123",
      assign: "Назначить",
    },
    manage: {
      changePlan: "Сменить тариф",
      plan: "Тариф",
      restart: "Начать срок заново с сегодняшнего дня",
      extend: "Продлить",
      amount: "Количество",
      unit: "Единица",
      customExpiry: "Своя дата окончания",
      expiresOn: "Дата окончания",
      setExpiry: "Установить дату",
      deviceLimit: "Лимит устройств",
      allowedDevices: "Разрешено устройств",
      updateLimit: "Обновить лимит",
      status: "Статус",
      activateTitle: "Активировать подписку?",
      activateText: "Пользователь сможет выполнять проверки до даты окончания.",
      activate: "Активировать",
      suspendTitle: "Приостановить подписку?",
      suspendText: "Проверки будут заблокированы, пока подписку снова не активируют.",
      suspend: "Приостановить",
      deactivateTitle: "Деактивировать подписку?",
      deactivateText: "Подписка будет отменена. Чтобы восстановить доступ, назначьте новую.",
      deactivate: "Деактивировать",
    },
    plans: {
      eyebrow: "Цены",
      title: "Тарифы и цены",
      description: "Цены, сроки и лимиты устройств берутся из базы данных — их используют страница цен и назначение подписок.",
      plan: "Тариф",
      duration: "Срок",
      price: "Цена",
      devices: "Устройства",
      status: "Статус",
      inUse: "Используется",
      recommended: "Рекомендуем",
      durationValue: (n, unit) => {
        const f = RU_UNITS[unit];
        return f ? `${n} ${ruPlural(n, ...f)}` : `${n} ${unit.toLowerCase()}`;
      },
      enabled: "включён",
      disabled: "отключён",
      deleteTitle: (name) => `Удалить ${name}?`,
      deleteText: "Тарифы, которые используются в подписках, удалить нельзя — вместо этого отключите их.",
      delete: "Удалить",
      pricingSettings: "Настройки страницы цен",
    },
    planForm: {
      editTitle: (name) => `Редактировать ${name}`,
      createPlan: "Создать тариф",
      description: "Изменения применяются к новым подпискам. У действующих подписок лимит устройств и даты сохраняются.",
      edit: "Изменить",
      newPlan: "Новый тариф",
      name: "Название",
      slug: "Slug",
      descriptionLabel: "Описание",
      priceUzs: "Цена (UZS)",
      priceCard: "Цена при оплате картой (центы USD, 0 = не продаётся по карте)",
      deviceLimit: "Лимит устройств",
      duration: "Срок",
      durationUnit: "Единица срока",
      sortOrder: "Порядок сортировки",
      features: "Возможности (по одной в строке)",
      enabled: "Включён",
      enabledText: "Отображается на странице цен и доступен для назначения.",
      recommended: "Рекомендуемый",
      recommendedText: "Выделяется на странице цен (только один тариф).",
      savePlan: "Сохранить тариф",
      paymentNotice: "Уведомление об оплате на каждой карточке",
      buttonLabel: "Текст кнопки",
      recommendedBadge: "Метка рекомендуемого тарифа",
      showComparison: "Показывать таблицу сравнения",
      noProvider: "Платёжный провайдер не подключён, поэтому кнопки покупки остаются неактивными независимо от этих надписей.",
      savePricing: "Сохранить настройки цен",
    },
  },
  uz: {
    system: "tizim",
    units: { DAY: "Kun", MONTH: "Oy", YEAR: "Yil" },
    subs: {
      eyebrow: "Litsenziyalash",
      title: "Obunalar",
      description: "Obunalarni berish, uzaytirish, to‘xtatib turish yoki o‘zgartirish. To‘lovlar ulanmagan, barcha faollashtirishlar qo‘lda bajariladi.",
      expireTitle: "Muddati o‘tgan obunalar hozir yakunlansinmi?",
      expireText: "Tugash sanasi o‘tgan faol obunalar «muddati tugagan» deb belgilanadi (bu avtomatik ravishda ham bajariladi).",
      expireConfirm: "Bajarish",
      expireButton: "Muddati o‘tganlarni yakunlash",
      all: "Barchasi",
      user: "Foydalanuvchi",
      plan: "Tarif",
      status: "Holat",
      start: "Boshlanish",
      expires: "Tugash",
      remaining: "Qolgan",
      devices: "Qurilmalar",
      empty: "Obunalar yo‘q.",
      daysShort: (n) => `${n} kun`,
      manage: "Boshqarish",
      recent: "Obunalardagi so‘nggi o‘zgarishlar",
    },
    assign: {
      title: "Obuna berish",
      description: "Foydalanuvchining joriy obunasi almashtiriladi. Obuna hozirdan boshlanib, tarif muddati bo‘yicha amal qilishi uchun sanalarni bo‘sh qoldiring.",
      user: "Foydalanuvchi",
      plan: "Tarif",
      planOption: (name, n) => `${name} · ${n} ta qurilma`,
      start: "Boshlanish (ixtiyoriy)",
      expiry: "Boshqa tugash sanasi (ixtiyoriy)",
      deviceLimit: "Boshqa qurilmalar limiti (ixtiyoriy)",
      note: "Izoh (ixtiyoriy)",
      notePlaceholder: "masalan: bank o‘tkazmasi orqali to‘langan, hisob-faktura №123",
      assign: "Berish",
    },
    manage: {
      changePlan: "Tarifni o‘zgartirish",
      plan: "Tarif",
      restart: "Muddatni bugundan qayta boshlash",
      extend: "Uzaytirish",
      amount: "Miqdor",
      unit: "Birlik",
      customExpiry: "Boshqa tugash sanasi",
      expiresOn: "Tugash sanasi",
      setExpiry: "Sanani o‘rnatish",
      deviceLimit: "Qurilmalar limiti",
      allowedDevices: "Ruxsat etilgan qurilmalar",
      updateLimit: "Limitni yangilash",
      status: "Holat",
      activateTitle: "Obuna faollashtirilsinmi?",
      activateText: "Foydalanuvchi tugash sanasigacha tekshiruv o‘tkaza oladi.",
      activate: "Faollashtirish",
      suspendTitle: "Obuna to‘xtatib turilsinmi?",
      suspendText: "Obuna qayta faollashtirilmaguncha tekshiruvlar bloklanadi.",
      suspend: "To‘xtatib turish",
      deactivateTitle: "Obuna bekor qilinsinmi?",
      deactivateText: "Obuna bekor qilinadi. Kirishni tiklash uchun yangi obuna bering.",
      deactivate: "Bekor qilish",
    },
    plans: {
      eyebrow: "Narxlar",
      title: "Tariflar va narxlar",
      description: "Narxlar sahifasi va obuna berish jarayoni narxlar, muddatlar va qurilmalar limitini ma’lumotlar bazasidan oladi.",
      plan: "Tarif",
      duration: "Muddat",
      price: "Narx",
      devices: "Qurilmalar",
      status: "Holat",
      inUse: "Foydalanilmoqda",
      recommended: "Tavsiya etiladi",
      durationValue: (n, unit) => `${n} ${UZ_UNITS[unit] ?? unit.toLowerCase()}`,
      enabled: "faol",
      disabled: "nofaol",
      deleteTitle: (name) => `${name} o‘chirilsinmi?`,
      deleteText: "Obunalarda ishlatilayotgan tariflarni o‘chirib bo‘lmaydi, ularni nofaol qiling.",
      delete: "O‘chirish",
      pricingSettings: "Narxlar sahifasi sozlamalari",
    },
    planForm: {
      editTitle: (name) => `${name} tarifini tahrirlash`,
      createPlan: "Tarif yaratish",
      description: "O‘zgarishlar yangi obunalarga qo‘llanadi. Mavjud obunalarning qurilmalar limiti va sanalari o‘zgarmaydi.",
      edit: "Tahrirlash",
      newPlan: "Yangi tarif",
      name: "Nomi",
      slug: "Slug",
      descriptionLabel: "Tavsif",
      priceUzs: "Narx (UZS)",
      priceCard: "Karta orqali narx (USD sentlarda, 0 = karta orqali sotilmaydi)",
      deviceLimit: "Qurilmalar limiti",
      duration: "Muddat",
      durationUnit: "Muddat birligi",
      sortOrder: "Tartib raqami",
      features: "Imkoniyatlar (har biri alohida qatorda)",
      enabled: "Faol",
      enabledText: "Narxlar sahifasida ko‘rinadi va obuna sifatida berilishi mumkin.",
      recommended: "Tavsiya etiladi",
      recommendedText: "Narxlar sahifasida ajratib ko‘rsatiladi (faqat bitta tarif).",
      savePlan: "Tarifni saqlash",
      paymentNotice: "Har bir kartochkadagi to‘lov haqidagi eslatma",
      buttonLabel: "Tugma matni",
      recommendedBadge: "Tavsiya belgisi matni",
      showComparison: "Taqqoslash jadvalini ko‘rsatish",
      noProvider: "To‘lov provayderi ulanmagan, shuning uchun bu matnlardan qat’i nazar xarid tugmalari o‘chiq qoladi.",
      savePricing: "Narx sozlamalarini saqlash",
    },
  },
});
