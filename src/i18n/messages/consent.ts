import { defineMessages } from "../config";

type ConsentText = {
  title: string;
  intro: string;
  steps: [string, string, string];
  keyPointsTitle: string;
  keyPoints: string[];
  readFull: string;
  checkboxBefore: string;
  termsLink: string;
  checkboxMiddle: string;
  privacyLink: string;
  checkboxAfter: string;
  fullName: string;
  fullNamePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  emailLocked: string;
  continue: string;
  codeTitle: string;
  codeSent: (email: string) => string;
  codeLabel: string;
  verify: string;
  resend: string;
  resendIn: (s: number) => string;
  changeEmail: string;
  doneTitle: string;
  doneText: string;
  close: string;
  errors: {
    acceptRequired: string;
    nameInvalid: string;
    emailInvalid: string;
    emailDisposable: string;
    emailNoMail: string;
    tooMany: string;
    sendFailed: string;
    noPending: string;
    codeInvalid: (left: number) => string;
    codeExpired: string;
    codeLocked: string;
    staleTerms: string;
    required: string;
    verifyRequired: string;
    network: string;
  };
  mail: { subject: string; body: (name: string, code: string) => string };
};

export const consentText = defineMessages<ConsentText>({
  en: {
    title: "Before your first check",
    intro: "Innova Checker is used by companies to check links. Please accept the Terms of Use and confirm who you are — it takes less than a minute and is needed only once.",
    steps: ["Terms", "Your details", "E-mail code"],
    keyPointsTitle: "Please note",
    keyPoints: [
      "The check is automated and reflects the link at this moment only. No service can detect every threat.",
      "A “Safe” or “Trusted” result is not a guarantee. Innova Networks, the platform and its administrators are not liable for hacking, malware, fraud or any loss after you open a link — even one rated safe.",
      "You decide whether to open a link, enter data or pay. Always confirm payment requests and changed bank details by phone.",
    ],
    readFull: "Read the full Terms of Use",
    checkboxBefore: "I have read and accept the ",
    termsLink: "Terms of Use",
    checkboxMiddle: " and the ",
    privacyLink: "Privacy Policy",
    checkboxAfter: ", including the limitation of liability.",
    fullName: "First and last name",
    fullNamePlaceholder: "e.g. Aziz Karimov",
    email: "Your e-mail",
    emailPlaceholder: "name@company.uz",
    emailLocked: "The code is sent to your account e-mail.",
    continue: "Continue",
    codeTitle: "Confirm your e-mail",
    codeSent: (email) => `We sent a 6-digit code to ${email}. It is valid for 10 minutes. Check the Spam folder if you do not see it.`,
    codeLabel: "Code from the e-mail",
    verify: "Confirm",
    resend: "Send a new code",
    resendIn: (s) => `New code in ${s} s`,
    changeEmail: "Change e-mail",
    doneTitle: "Thank you!",
    doneText: "Your details are confirmed. Your check starts now.",
    close: "Close",
    errors: {
      acceptRequired: "Please tick the box to accept the Terms of Use and the Privacy Policy.",
      nameInvalid: "Enter your real first and last name (letters only).",
      emailInvalid: "Enter a valid e-mail address.",
      emailDisposable: "Temporary e-mail addresses are not accepted. Use your real e-mail.",
      emailNoMail: "This e-mail domain cannot receive mail. Check the address.",
      tooMany: "Too many attempts. Please wait a few minutes and try again.",
      sendFailed: "We could not send the code right now. Please try again in a minute.",
      noPending: "Start again: enter your details and request a code.",
      codeInvalid: (left) => `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`,
      codeExpired: "The code has expired. Request a new one.",
      codeLocked: "Too many incorrect codes. Request a new one.",
      staleTerms: "The Terms of Use were updated. Please reload the page and accept the new version.",
      required: "Please accept the Terms of Use and confirm your details before your first check.",
      verifyRequired: "Please confirm your e-mail address with the code we sent you.",
      network: "Network error. Check your connection and try again.",
    },
    mail: {
      subject: "Your Innova Checker verification code",
      body: (name, code) => `Hello, ${name}!\n\nYour Innova Checker verification code: ${code}\n\nThe code is valid for 10 minutes. Do not share it with anyone.\nIf you did not request this code, simply ignore this e-mail.\n\nInnova Checker · Innova Networks`,
    },
  },
  ru: {
    title: "Перед первой проверкой",
    intro: "Innova Checker помогает компаниям проверять ссылки. Примите Условия использования и подтвердите свои данные — это займёт меньше минуты и нужно только один раз.",
    steps: ["Условия", "Ваши данные", "Код из письма"],
    keyPointsTitle: "Обратите внимание",
    keyPoints: [
      "Проверка автоматическая и отражает состояние ссылки только на данный момент. Ни один сервис не обнаруживает все угрозы.",
      "Результат «Безопасно» или «Доверенный» — не гарантия. Innova Networks, платформа и её администраторы не несут ответственности за взлом, вредоносные программы, мошенничество или любой ущерб после открытия ссылки — даже признанной безопасной.",
      "Решение открыть ссылку, ввести данные или оплатить принимаете вы. Всегда подтверждайте платёжные запросы и изменённые реквизиты по телефону.",
    ],
    readFull: "Прочитать Условия использования полностью",
    checkboxBefore: "Я прочитал(а) и принимаю ",
    termsLink: "Условия использования",
    checkboxMiddle: " и ",
    privacyLink: "Политику конфиденциальности",
    checkboxAfter: ", включая ограничение ответственности.",
    fullName: "Имя и фамилия",
    fullNamePlaceholder: "например, Азиз Каримов",
    email: "Ваша эл. почта",
    emailPlaceholder: "name@company.uz",
    emailLocked: "Код будет отправлен на почту вашего аккаунта.",
    continue: "Продолжить",
    codeTitle: "Подтвердите эл. почту",
    codeSent: (email) => `Мы отправили 6-значный код на ${email}. Он действует 10 минут. Если письма нет, проверьте папку «Спам».`,
    codeLabel: "Код из письма",
    verify: "Подтвердить",
    resend: "Отправить новый код",
    resendIn: (s) => `Новый код через ${s} с`,
    changeEmail: "Изменить почту",
    doneTitle: "Спасибо!",
    doneText: "Ваши данные подтверждены. Проверка начинается.",
    close: "Закрыть",
    errors: {
      acceptRequired: "Отметьте флажок, чтобы принять Условия использования и Политику конфиденциальности.",
      nameInvalid: "Введите настоящие имя и фамилию (только буквы).",
      emailInvalid: "Введите корректный адрес эл. почты.",
      emailDisposable: "Временные адреса почты не принимаются. Укажите свою настоящую почту.",
      emailNoMail: "Этот почтовый домен не может принимать письма. Проверьте адрес.",
      tooMany: "Слишком много попыток. Подождите несколько минут и попробуйте снова.",
      sendFailed: "Сейчас не удалось отправить код. Попробуйте ещё раз через минуту.",
      noPending: "Начните заново: введите данные и запросите код.",
      codeInvalid: (left) => `Неверный код. Осталось попыток: ${left}.`,
      codeExpired: "Срок действия кода истёк. Запросите новый.",
      codeLocked: "Слишком много неверных кодов. Запросите новый.",
      staleTerms: "Условия использования обновились. Обновите страницу и примите новую редакцию.",
      required: "Перед первой проверкой примите Условия использования и подтвердите свои данные.",
      verifyRequired: "Подтвердите адрес эл. почты кодом, который мы отправили.",
      network: "Ошибка сети. Проверьте подключение и попробуйте снова.",
    },
    mail: {
      subject: "Код подтверждения Innova Checker",
      body: (name, code) => `Здравствуйте, ${name}!\n\nВаш код подтверждения Innova Checker: ${code}\n\nКод действует 10 минут. Никому его не сообщайте.\nЕсли вы не запрашивали код, просто проигнорируйте это письмо.\n\nInnova Checker · Innova Networks`,
    },
  },
  uz: {
    title: "Birinchi tekshiruvdan oldin",
    intro: "Innova Checker kompaniyalarga havolalarni tekshirishda yordam beradi. Foydalanish shartlarini qabul qiling va ma’lumotlaringizni tasdiqlang — bu bir daqiqadan kam vaqt oladi va faqat bir marta kerak.",
    steps: ["Shartlar", "Ma’lumotlaringiz", "E-pochtadagi kod"],
    keyPointsTitle: "E’tibor bering",
    keyPoints: [
      "Tekshiruv avtomatik bo‘lib, havolaning faqat ayni paytdagi holatini ko‘rsatadi. Hech bir xizmat barcha tahdidlarni aniqlay olmaydi.",
      "«Xavfsiz» yoki «Ishonchli» natijasi kafolat emas. Havolani ochganingizdan keyingi buzib kirish, zararli dastur, firibgarlik yoki har qanday zarar uchun — hatto havola xavfsiz deb baholangan bo‘lsa ham — Innova Networks, platforma va uning administratorlari javobgar emas.",
      "Havolani ochish, ma’lumot kiritish yoki to‘lov qilish to‘g‘risidagi qarorni siz qabul qilasiz. To‘lov so‘rovlari va o‘zgargan rekvizitlarni doimo telefon orqali tasdiqlang.",
    ],
    readFull: "Foydalanish shartlarini to‘liq o‘qish",
    checkboxBefore: "",
    termsLink: "Foydalanish shartlari",
    checkboxMiddle: " va ",
    privacyLink: "Maxfiylik siyosati",
    checkboxAfter: " bilan, jumladan javobgarlikni cheklash bandi bilan tanishdim va ularni qabul qilaman.",
    fullName: "Ism va familiya",
    fullNamePlaceholder: "masalan, Aziz Karimov",
    email: "E-pochtangiz",
    emailPlaceholder: "name@company.uz",
    emailLocked: "Kod akkauntingiz e-pochtasiga yuboriladi.",
    continue: "Davom etish",
    codeTitle: "E-pochtangizni tasdiqlang",
    codeSent: (email) => `${email} manziliga 6 xonali kod yubordik. Kod 10 daqiqa amal qiladi. Xat ko‘rinmasa, «Spam» papkasini tekshiring.`,
    codeLabel: "Xatdagi kod",
    verify: "Tasdiqlash",
    resend: "Yangi kod yuborish",
    resendIn: (s) => `Yangi kod ${s} soniyadan keyin`,
    changeEmail: "E-pochtani o‘zgartirish",
    doneTitle: "Rahmat!",
    doneText: "Ma’lumotlaringiz tasdiqlandi. Tekshiruv boshlanmoqda.",
    close: "Yopish",
    errors: {
      acceptRequired: "Foydalanish shartlari va Maxfiylik siyosatini qabul qilish uchun belgini qo‘ying.",
      nameInvalid: "Haqiqiy ism va familiyangizni kiriting (faqat harflar).",
      emailInvalid: "To‘g‘ri e-pochta manzilini kiriting.",
      emailDisposable: "Vaqtinchalik e-pochta manzillari qabul qilinmaydi. Haqiqiy e-pochtangizni kiriting.",
      emailNoMail: "Bu e-pochta domeni xat qabul qila olmaydi. Manzilni tekshiring.",
      tooMany: "Urinishlar juda ko‘p. Bir necha daqiqa kutib, qaytadan urinib ko‘ring.",
      sendFailed: "Hozir kodni yuborib bo‘lmadi. Bir daqiqadan so‘ng qayta urinib ko‘ring.",
      noPending: "Qaytadan boshlang: ma’lumotlaringizni kiriting va kod so‘rang.",
      codeInvalid: (left) => `Kod noto‘g‘ri. Qolgan urinishlar: ${left}.`,
      codeExpired: "Kodning amal qilish muddati tugadi. Yangisini so‘rang.",
      codeLocked: "Noto‘g‘ri kodlar juda ko‘p. Yangi kod so‘rang.",
      staleTerms: "Foydalanish shartlari yangilandi. Sahifani yangilang va yangi tahrirni qabul qiling.",
      required: "Birinchi tekshiruvdan oldin Foydalanish shartlarini qabul qiling va ma’lumotlaringizni tasdiqlang.",
      verifyRequired: "Yuborgan kodimiz bilan e-pochta manzilingizni tasdiqlang.",
      network: "Tarmoq xatosi. Ulanishni tekshirib, qaytadan urinib ko‘ring.",
    },
    mail: {
      subject: "Innova Checker tasdiqlash kodi",
      body: (name, code) => `Assalomu alaykum, ${name}!\n\nInnova Checker tasdiqlash kodingiz: ${code}\n\nKod 10 daqiqa amal qiladi. Uni hech kimga bermang.\nAgar bu kodni siz so‘ramagan bo‘lsangiz, xatga e’tibor bermang.\n\nInnova Checker · Innova Networks`,
    },
  },
});
