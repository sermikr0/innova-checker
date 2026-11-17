import { defineMessages } from "../config";

/** 404 page (src/app/not-found.tsx). */
export const notFoundText = defineMessages({
  en: {
    title: "This page could not be found",
    text: "The link may be wrong, or you may not have access to it.",
    back: "Back to Innova Checker",
  },
  ru: {
    title: "Страница не найдена",
    text: "Возможно, ссылка неверна или у вас нет к ней доступа.",
    back: "Вернуться в Innova Checker",
  },
  uz: {
    title: "Sahifa topilmadi",
    text: "Havola noto‘g‘ri bo‘lishi yoki sizda unga kirish huquqi bo‘lmasligi mumkin.",
    back: "Innova Checker bosh sahifasiga qaytish",
  },
});

/** Error boundary (src/app/error.tsx, client component). */
export const errorText = defineMessages({
  en: {
    title: "Something went wrong",
    text: "An unexpected error occurred. Please try again. If the problem continues, contact support.",
    retry: "Try again",
  },
  ru: {
    title: "Что-то пошло не так",
    text: "Произошла непредвиденная ошибка. Попробуйте ещё раз. Если проблема повторится, обратитесь в поддержку.",
    retry: "Повторить",
  },
  uz: {
    title: "Nimadir xato ketdi",
    text: "Kutilmagan xatolik yuz berdi. Qayta urinib ko‘ring. Muammo takrorlansa, qo‘llab-quvvatlash xizmatiga murojaat qiling.",
    retry: "Qayta urinish",
  },
});

/** Accessible names in src/components/brand/logo.tsx (client component). */
export const logoText = defineMessages({
  en: { homeLabel: "Innova Checker home" },
  ru: { homeLabel: "Innova Checker — главная страница" },
  uz: { homeLabel: "Innova Checker — bosh sahifa" },
});
