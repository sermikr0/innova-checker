import { defineMessages } from "../config";

type Page = { title: string; heading: string; text: string };

type PayPagesText = {
  tooMany: Page;
  notFound: Page;
  mockDisabled: Page;
  cardUnavailable: Page;
  paid: Page;
  expired: Page;
  prepared: Page;
  closed: Page;
  mock: { title: string; testMode: string; text: (time: string) => string; pay: string; cancel: string };
};

/** Script-free pages shown on the phone that scanned the payment QR code (/pay/[token]). */
export const payPagesText = defineMessages<PayPagesText>({
  en: {
    tooMany: { title: "Too many requests", heading: "Too many requests", text: "Please wait a few minutes and scan again." },
    notFound: { title: "Not found", heading: "Payment not found", text: "This QR code is not valid." },
    mockDisabled: { title: "Unavailable", heading: "Payment unavailable", text: "Test payments are disabled." },
    cardUnavailable: { title: "Unavailable", heading: "Card payments are not available yet", text: "Please pay with Click or contact support." },
    paid: { title: "Payment received", heading: "Payment received", text: "Your subscription is now active on the device that showed this QR code. You can close this page." },
    expired: { title: "QR code expired", heading: "This QR code has expired", text: "Payment codes are valid for a few minutes only. Go back to Innova Checker on your computer and generate a new QR code." },
    prepared: { title: "Payment in progress", heading: "Payment in progress", text: "This payment is already being processed. Finish it in the payment app." },
    closed: { title: "Payment closed", heading: "This payment is closed", text: "It was cancelled or replaced by a newer QR code. Generate a new one on your computer." },
    mock: {
      title: "Test checkout",
      testMode: "Test mode",
      text: (time) => `Simulated payment for local testing. No money is charged. Valid until ${time} UTC.`,
      pay: "Pay (simulate success)",
      cancel: "Cancel (simulate failure)",
    },
  },
  ru: {
    tooMany: { title: "Слишком много запросов", heading: "Слишком много запросов", text: "Подождите несколько минут и отсканируйте код снова." },
    notFound: { title: "Не найдено", heading: "Платёж не найден", text: "Этот QR-код недействителен." },
    mockDisabled: { title: "Недоступно", heading: "Оплата недоступна", text: "Тестовые платежи отключены." },
    cardUnavailable: { title: "Недоступно", heading: "Оплата картой пока недоступна", text: "Оплатите через Click или обратитесь в поддержку." },
    paid: { title: "Оплата получена", heading: "Оплата получена", text: "Подписка активирована на устройстве, на котором был показан этот QR-код. Эту страницу можно закрыть." },
    expired: { title: "QR-код истёк", heading: "Срок действия этого QR-кода истёк", text: "Коды оплаты действуют всего несколько минут. Вернитесь в Innova Checker на компьютере и создайте новый QR-код." },
    prepared: { title: "Оплата выполняется", heading: "Оплата выполняется", text: "Этот платёж уже обрабатывается. Завершите его в платёжном приложении." },
    closed: { title: "Платёж закрыт", heading: "Этот платёж закрыт", text: "Он был отменён или заменён новым QR-кодом. Создайте новый код на компьютере." },
    mock: {
      title: "Тестовая оплата",
      testMode: "Тестовый режим",
      text: (time) => `Имитация оплаты для локального тестирования. Деньги не списываются. Действует до ${time} UTC.`,
      pay: "Оплатить (имитация успеха)",
      cancel: "Отмена (имитация ошибки)",
    },
  },
  uz: {
    tooMany: { title: "So‘rovlar juda ko‘p", heading: "So‘rovlar juda ko‘p", text: "Bir necha daqiqa kuting va kodni qayta skanerlang." },
    notFound: { title: "Topilmadi", heading: "To‘lov topilmadi", text: "Bu QR-kod yaroqsiz." },
    mockDisabled: { title: "Mavjud emas", heading: "To‘lov mavjud emas", text: "Test to‘lovlari o‘chirilgan." },
    cardUnavailable: { title: "Mavjud emas", heading: "Karta orqali to‘lov hozircha mavjud emas", text: "Iltimos, Click orqali to‘lang yoki qo‘llab-quvvatlash xizmatiga murojaat qiling." },
    paid: { title: "To‘lov qabul qilindi", heading: "To‘lov qabul qilindi", text: "Obunangiz ushbu QR-kod ko‘rsatilgan qurilmada faollashtirildi. Bu sahifani yopishingiz mumkin." },
    expired: { title: "QR-kod muddati tugadi", heading: "Bu QR-kodning muddati tugagan", text: "To‘lov kodlari bir necha daqiqagina amal qiladi. Kompyuteringizda Innova Checker sahifasiga qayting va yangi QR-kod yarating." },
    prepared: { title: "To‘lov jarayonda", heading: "To‘lov jarayonda", text: "Bu to‘lov allaqachon amalga oshirilmoqda. Uni to‘lov ilovasida yakunlang." },
    closed: { title: "To‘lov yopilgan", heading: "Bu to‘lov yopilgan", text: "U bekor qilingan yoki yangi QR-kod bilan almashtirilgan. Kompyuteringizda yangisini yarating." },
    mock: {
      title: "Test to‘lovi",
      testMode: "Test rejimi",
      text: (time) => `Mahalliy test uchun to‘lov imitatsiyasi. Pul yechilmaydi. ${time} UTC gacha amal qiladi.`,
      pay: "To‘lash (muvaffaqiyatli to‘lov imitatsiyasi)",
      cancel: "Bekor qilish (xato imitatsiyasi)",
    },
  },
});
