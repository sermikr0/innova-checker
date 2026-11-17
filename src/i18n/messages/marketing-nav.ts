import { defineMessages } from "../config";

type NavKey = "features" | "howItWorks" | "pricing" | "about" | "contact";
type FooterLinkKey = "scanner" | "features" | "howItWorks" | "pricing" | "about" | "contact" | "register" | "login" | "privacy" | "terms";

type MarketingNavText = {
  /** Top navigation (desktop and mobile). */
  links: Record<NavKey, string>;
  mainNavLabel: string;
  adminPanel: string;
  dashboard: string;
  logIn: string;
  getStarted: string;
  checkLink: string;
  mobile: {
    openMenu: string;
    menuTitle: string;
    navLabel: string;
    openDashboard: string;
    createFreeAccount: string;
  };
  footer: {
    about: string;
    location: string;
    columns: { product: string; company: string; legal: string };
    links: Record<FooterLinkKey, string>;
    rights: string;
    disclaimer: string;
  };
};

/** Marketing navbar, mobile menu and footer. */
export const marketingNavText = defineMessages<MarketingNavText>({
  en: {
    links: { features: "Features", howItWorks: "How it works", pricing: "Pricing", about: "About", contact: "Contact" },
    mainNavLabel: "Main",
    adminPanel: "Admin panel",
    dashboard: "Dashboard",
    logIn: "Log in",
    getStarted: "Get started",
    checkLink: "Check a link",
    mobile: {
      openMenu: "Open menu",
      menuTitle: "Menu",
      navLabel: "Mobile",
      openDashboard: "Open dashboard",
      createFreeAccount: "Create free account",
    },
    footer: {
      about: "Innova Checker is a URL security intelligence service by Innova Networks, built for logistics companies, freight forwarders and the teams who open their links.",
      location: "Tashkent, Uzbekistan",
      columns: { product: "Product", company: "Company", legal: "Legal" },
      links: {
        scanner: "URL Scanner",
        features: "Features",
        howItWorks: "How it works",
        pricing: "Pricing",
        about: "About",
        contact: "Contact",
        register: "Create account",
        login: "Log in",
        privacy: "Privacy policy",
        terms: "Terms of service",
      },
      rights: "All rights reserved.",
      disclaimer: "No automated scanner can guarantee a website is 100% safe.",
    },
  },
  ru: {
    links: { features: "Возможности", howItWorks: "Как это работает", pricing: "Цены", about: "О нас", contact: "Контакты" },
    mainNavLabel: "Основная навигация",
    adminPanel: "Админ-панель",
    dashboard: "Кабинет",
    logIn: "Войти",
    getStarted: "Начать",
    checkLink: "Проверить ссылку",
    mobile: {
      openMenu: "Открыть меню",
      menuTitle: "Меню",
      navLabel: "Мобильная навигация",
      openDashboard: "Открыть кабинет",
      createFreeAccount: "Создать бесплатный аккаунт",
    },
    footer: {
      about: "Innova Checker — сервис анализа безопасности ссылок от Innova Networks для логистических компаний, экспедиторов и их сотрудников, которые открывают ссылки.",
      location: "Ташкент, Узбекистан",
      columns: { product: "Продукт", company: "Компания", legal: "Правовая информация" },
      links: {
        scanner: "URL-сканер",
        features: "Возможности",
        howItWorks: "Как это работает",
        pricing: "Цены",
        about: "О нас",
        contact: "Контакты",
        register: "Зарегистрироваться",
        login: "Войти",
        privacy: "Политика конфиденциальности",
        terms: "Условия использования",
      },
      rights: "Все права защищены.",
      disclaimer: "Ни один автоматический сканер не может гарантировать, что сайт безопасен на 100%.",
    },
  },
  uz: {
    links: { features: "Imkoniyatlar", howItWorks: "Qanday ishlaydi", pricing: "Narxlar", about: "Biz haqimizda", contact: "Aloqa" },
    mainNavLabel: "Asosiy menyu",
    adminPanel: "Admin panel",
    dashboard: "Kabinet",
    logIn: "Kirish",
    getStarted: "Boshlash",
    checkLink: "Havolani tekshirish",
    mobile: {
      openMenu: "Menyuni ochish",
      menuTitle: "Menyu",
      navLabel: "Mobil menyu",
      openDashboard: "Kabinetni ochish",
      createFreeAccount: "Bepul ro‘yxatdan o‘tish",
    },
    footer: {
      about: "Innova Checker — Innova Networks tomonidan logistika kompaniyalari, ekspeditorlar va havolalarni ochadigan xodimlar uchun yaratilgan URL xavfsizligi tahlili xizmati.",
      location: "Toshkent, O‘zbekiston",
      columns: { product: "Mahsulot", company: "Kompaniya", legal: "Huquqiy ma’lumot" },
      links: {
        scanner: "URL skaneri",
        features: "Imkoniyatlar",
        howItWorks: "Qanday ishlaydi",
        pricing: "Narxlar",
        about: "Biz haqimizda",
        contact: "Aloqa",
        register: "Ro‘yxatdan o‘tish",
        login: "Kirish",
        privacy: "Maxfiylik siyosati",
        terms: "Foydalanish shartlari",
      },
      rights: "Barcha huquqlar himoyalangan.",
      disclaimer: "Hech bir avtomatik skaner saytning 100% xavfsizligiga kafolat bera olmaydi.",
    },
  },
});
