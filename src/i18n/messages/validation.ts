import { defineMessages } from "../config";

// Russian needs one / few / many forms.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

/**
 * Form validation messages. The English texts are the messages of the shared zod
 * schemas in src/lib/validation.ts (and what the API returns); localizeValidation()
 * there maps them to the visitor's language for display.
 */
export const validationText = defineMessages({
  en: {
    emailTooLong: "E-mail is too long.",
    emailInvalid: "Enter a valid e-mail address.",
    passwordRequired: "Enter a password.",
    passwordTooLong: "Use at most 128 characters.",
    passwordEnter: "Enter your password.",
    currentPasswordRequired: "Enter your current password.",
    passwordsMismatch: "Passwords do not match.",
    fullNameRequired: "Full name is required.",
    fullNameTooLong: "Full name is too long.",
    companyNameRequired: "Company name is required.",
    companyNameTooLong: "Company name is too long.",
    nameRequired: "Name is required.",
    nameTooLong: "Name is too long.",
    subjectRequired: "Subject is required.",
    messageTooShort: "Please write at least 10 characters.",
    messageTooLong: "Message is too long.",
    passwordMin: (n: number) => `Use at least ${n} characters.`,
  },
  ru: {
    emailTooLong: "Адрес эл. почты слишком длинный.",
    emailInvalid: "Введите корректный адрес эл. почты.",
    passwordRequired: "Введите пароль.",
    passwordTooLong: "Используйте не более 128 символов.",
    passwordEnter: "Введите пароль.",
    currentPasswordRequired: "Введите текущий пароль.",
    passwordsMismatch: "Пароли не совпадают.",
    fullNameRequired: "Укажите имя и фамилию.",
    fullNameTooLong: "Имя и фамилия слишком длинные.",
    companyNameRequired: "Укажите название компании.",
    companyNameTooLong: "Название компании слишком длинное.",
    nameRequired: "Укажите имя.",
    nameTooLong: "Имя слишком длинное.",
    subjectRequired: "Укажите тему.",
    messageTooShort: "Напишите не менее 10 символов.",
    messageTooLong: "Сообщение слишком длинное.",
    passwordMin: (n: number) => `Используйте не менее ${n} ${ruPlural(n, "символа", "символов", "символов")}.`,
  },
  uz: {
    emailTooLong: "E-pochta manzili juda uzun.",
    emailInvalid: "To‘g‘ri e-pochta manzilini kiriting.",
    passwordRequired: "Parolni kiriting.",
    passwordTooLong: "Ko‘pi bilan 128 ta belgidan foydalaning.",
    passwordEnter: "Parolingizni kiriting.",
    currentPasswordRequired: "Joriy parolingizni kiriting.",
    passwordsMismatch: "Parollar mos kelmadi.",
    fullNameRequired: "Ism va familiyani kiriting.",
    fullNameTooLong: "Ism va familiya juda uzun.",
    companyNameRequired: "Kompaniya nomini kiriting.",
    companyNameTooLong: "Kompaniya nomi juda uzun.",
    nameRequired: "Ismingizni kiriting.",
    nameTooLong: "Ism juda uzun.",
    subjectRequired: "Mavzuni kiriting.",
    messageTooShort: "Kamida 10 ta belgi yozing.",
    messageTooLong: "Xabar juda uzun.",
    passwordMin: (n: number) => `Kamida ${n} ta belgidan foydalaning.`,
  },
});
