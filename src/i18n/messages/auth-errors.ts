import { defineMessages } from "../config";

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

/** Messages returned by the /api/auth/* routes, and the password-reset e-mail. */
export const authErrorsText = defineMessages({
  en: {
    loginRateLimited: "Too many sign-in attempts from this network. Please wait and try again.",
    accountLocked: (minutes: number) => `Too many failed attempts for this account. Try again in about ${minutes} minute(s) or reset your password.`,
    invalidCredentials: "Incorrect e-mail or password.",
    accountDisabled: "This account has been deactivated. Contact your administrator.",
    loginDisabled: "Sign-in is temporarily unavailable. Please try again later or contact Innova Networks.",
    registrationDisabled: "Self-registration is currently disabled. Contact Innova Networks for an account.",
    registerRateLimited: "Too many sign-ups from this network. Please try again later.",
    emailTaken: "An account with this e-mail already exists. Log in instead.",
    emailTakenField: "An account with this e-mail already exists.",
    forgotRateLimited: "Too many requests. Please try again later.",
    resetLinkSent: "If an account exists for this e-mail, a password-reset link has been sent.",
    invalidToken: "This reset link is invalid or has expired. Request a new one.",
    resetEmailSubject: "Reset your Innova Checker password",
    resetEmailBody: (name: string, minutes: number, link: string) =>
      `Hello ${name},\n\nUse the link below to set a new password. It expires in ${minutes} minutes and can be used once.\n\n${link}\n\nIf you did not request this, ignore this e-mail; your password stays unchanged.\n\nInnova Checker by Innova Networks`,
  },
  ru: {
    loginRateLimited: "Слишком много попыток входа из этой сети. Подождите и попробуйте снова.",
    accountLocked: (minutes: number) => `Слишком много неудачных попыток входа в этот аккаунт. Повторите попытку примерно через ${minutes} ${ruPlural(minutes, "минуту", "минуты", "минут")} или сбросьте пароль.`,
    invalidCredentials: "Неверная эл. почта или пароль.",
    accountDisabled: "Этот аккаунт деактивирован. Обратитесь к администратору.",
    loginDisabled: "Вход временно недоступен. Попробуйте позже или свяжитесь с Innova Networks.",
    registrationDisabled: "Самостоятельная регистрация сейчас отключена. Чтобы получить аккаунт, свяжитесь с Innova Networks.",
    registerRateLimited: "Слишком много регистраций из этой сети. Попробуйте позже.",
    emailTaken: "Аккаунт с этой эл. почтой уже существует. Войдите в него.",
    emailTakenField: "Аккаунт с этой эл. почтой уже существует.",
    forgotRateLimited: "Слишком много запросов. Попробуйте позже.",
    resetLinkSent: "Если аккаунт с этой эл. почтой существует, на неё отправлена ссылка для сброса пароля.",
    invalidToken: "Ссылка для сброса недействительна или устарела. Запросите новую.",
    resetEmailSubject: "Сброс пароля Innova Checker",
    resetEmailBody: (name: string, minutes: number, link: string) =>
      `Здравствуйте, ${name}!\n\nЧтобы задать новый пароль, перейдите по ссылке ниже. Она действует ${minutes} ${ruPlural(minutes, "минуту", "минуты", "минут")} и может быть использована только один раз.\n\n${link}\n\nЕсли вы не запрашивали сброс пароля, просто проигнорируйте это письмо: ваш пароль останется прежним.\n\nInnova Checker от Innova Networks`,
  },
  uz: {
    loginRateLimited: "Ushbu tarmoqdan kirishga urinishlar juda ko‘p. Biroz kutib, qayta urinib ko‘ring.",
    accountLocked: (minutes: number) => `Ushbu akkauntga kirish uchun muvaffaqiyatsiz urinishlar juda ko‘p. Taxminan ${minutes} daqiqadan so‘ng qayta urinib ko‘ring yoki parolni tiklang.`,
    invalidCredentials: "E-pochta yoki parol noto‘g‘ri.",
    accountDisabled: "Bu akkaunt faolsizlantirilgan. Administratoringizga murojaat qiling.",
    loginDisabled: "Kirish vaqtincha mavjud emas. Keyinroq urinib ko‘ring yoki Innova Networks bilan bog‘laning.",
    registrationDisabled: "Mustaqil ro‘yxatdan o‘tish hozircha o‘chirilgan. Akkaunt olish uchun Innova Networks bilan bog‘laning.",
    registerRateLimited: "Ushbu tarmoqdan ro‘yxatdan o‘tishlar soni juda ko‘p. Keyinroq urinib ko‘ring.",
    emailTaken: "Bu e-pochta bilan akkaunt allaqachon mavjud. Iltimos, tizimga kiring.",
    emailTakenField: "Bu e-pochta bilan akkaunt allaqachon mavjud.",
    forgotRateLimited: "So‘rovlar juda ko‘p. Keyinroq urinib ko‘ring.",
    resetLinkSent: "Agar bu e-pochta bilan akkaunt mavjud bo‘lsa, unga parolni tiklash havolasi yuborildi.",
    invalidToken: "Bu tiklash havolasi yaroqsiz yoki muddati tugagan. Yangisini so‘rang.",
    resetEmailSubject: "Innova Checker parolini tiklash",
    resetEmailBody: (name: string, minutes: number, link: string) =>
      `Assalomu alaykum, ${name}!\n\nYangi parol o‘rnatish uchun quyidagi havolaga o‘ting. Havola ${minutes} daqiqa amal qiladi va faqat bir marta ishlatilishi mumkin.\n\n${link}\n\nAgar buni siz so‘ramagan bo‘lsangiz, ushbu xatni e’tiborsiz qoldiring: parolingiz o‘zgarmaydi.\n\nInnova Checker — Innova Networks mahsuloti`,
  },
});
