import { defineMessages } from "../config";

type ScanBoxText = {
  inputLabel: string;
  placeholder: string;
  analyze: string;
  enterFullLink: string;
  couldNotStart: string;
  network: string;
  lostTrack: string;
  failed: string;
  subscriberNote: string;
  visitorNote: (policy: string) => string;
  done: string;
  complete: string;
  riskScore: (n: number) => string;
  opening: string;
  viewReport: string;
  newScan: string;
  freeUsedTitle: string;
  deviceTitle: string;
  subscriptionTitle: string;
  createAccount: string;
  viewPricing: string;
  logIn: string;
  contactUs: string;
  manageDevices: string;
  mySubscription: string;
};

export const scanBoxText = defineMessages<ScanBoxText>({
  en: {
    inputLabel: "URL to analyze",
    placeholder: "Paste a suspicious URL here...",
    analyze: "Analyze URL",
    enterFullLink: "Enter a full link, for example https://example.com/track",
    couldNotStart: "The scan could not be started.",
    network: "Network error. Check your connection and try again.",
    lostTrack: "Lost track of the scan. Please try again.",
    failed: "The scan failed. Please try again.",
    subscriberNote: "Scans are included in your subscription.",
    visitorNote: (policy) => `${policy} · No account needed · Results in seconds`,
    done: "Done",
    complete: "Analysis complete",
    riskScore: (n) => ` · risk score ${n}/100`,
    opening: "Opening report",
    viewReport: "View report",
    newScan: "New scan",
    freeUsedTitle: "Your free checks have been used",
    deviceTitle: "Device limit reached",
    subscriptionTitle: "Active subscription required",
    createAccount: "Create Free Account",
    viewPricing: "View Pricing",
    logIn: "Log In",
    contactUs: "Contact us",
    manageDevices: "Manage devices",
    mySubscription: "My subscription",
  },
  ru: {
    inputLabel: "Ссылка для проверки",
    placeholder: "Вставьте подозрительную ссылку...",
    analyze: "Проверить",
    enterFullLink: "Введите полную ссылку, например https://example.com/track",
    couldNotStart: "Не удалось начать проверку.",
    network: "Ошибка сети. Проверьте подключение и попробуйте снова.",
    lostTrack: "Связь с проверкой потеряна. Попробуйте ещё раз.",
    failed: "Проверка не удалась. Попробуйте ещё раз.",
    subscriberNote: "Проверки входят в вашу подписку.",
    visitorNote: (policy) => `${policy} · Без регистрации · Результат за секунды`,
    done: "Готово",
    complete: "Анализ завершён",
    riskScore: (n) => ` · уровень риска ${n}/100`,
    opening: "Открываем отчёт",
    viewReport: "Открыть отчёт",
    newScan: "Новая проверка",
    freeUsedTitle: "Бесплатные проверки закончились",
    deviceTitle: "Достигнут лимит устройств",
    subscriptionTitle: "Нужна активная подписка",
    createAccount: "Создать бесплатный аккаунт",
    viewPricing: "Посмотреть цены",
    logIn: "Войти",
    contactUs: "Связаться с нами",
    manageDevices: "Управлять устройствами",
    mySubscription: "Моя подписка",
  },
  uz: {
    inputLabel: "Tekshiriladigan havola",
    placeholder: "Shubhali havolani shu yerga qo‘ying...",
    analyze: "Tekshirish",
    enterFullLink: "To‘liq havolani kiriting, masalan https://example.com/track",
    couldNotStart: "Tekshiruvni boshlab bo‘lmadi.",
    network: "Tarmoq xatosi. Ulanishni tekshirib, qaytadan urinib ko‘ring.",
    lostTrack: "Tekshiruv bilan aloqa uzildi. Qaytadan urinib ko‘ring.",
    failed: "Tekshiruv amalga oshmadi. Qaytadan urinib ko‘ring.",
    subscriberNote: "Tekshiruvlar obunangizga kiradi.",
    visitorNote: (policy) => `${policy} · Ro‘yxatdan o‘tish shart emas · Natija bir necha soniyada`,
    done: "Tayyor",
    complete: "Tahlil yakunlandi",
    riskScore: (n) => ` · xavf darajasi ${n}/100`,
    opening: "Hisobot ochilmoqda",
    viewReport: "Hisobotni ko‘rish",
    newScan: "Yangi tekshiruv",
    freeUsedTitle: "Bepul tekshiruvlaringiz tugadi",
    deviceTitle: "Qurilmalar limiti tugadi",
    subscriptionTitle: "Faol obuna kerak",
    createAccount: "Bepul akkaunt ochish",
    viewPricing: "Narxlarni ko‘rish",
    logIn: "Kirish",
    contactUs: "Biz bilan bog‘lanish",
    manageDevices: "Qurilmalarni boshqarish",
    mySubscription: "Mening obunam",
  },
});
