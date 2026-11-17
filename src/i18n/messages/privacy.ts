import { defineMessages } from "../config";
import type { LegalDoc } from "./legal-types";

const en: LegalDoc = {
  metaTitle: "Privacy policy",
  metaDescription: "How Innova Checker collects, uses and protects personal data and the links you check.",
  eyebrow: "Legal",
  title: "Privacy policy",
  subtitle: "How Innova Checker handles personal data and submitted links.",
  updated: "Version 2026-11-17 · effective 17 November 2026",
  summaryTitle: "In short",
  summary: [
    "We ask for your name and e-mail before your first check and confirm the e-mail with a one-time code.",
    "We keep the links you check, their reports, and technical data such as IP address, country and device identifiers.",
    "Links may be sent to threat-intelligence providers for analysis. We never sell personal data.",
  ],
  sections: [
    {
      id: "controller",
      title: "1. Who is responsible",
      paragraphs: [
        "Innova Networks, Tashkent, Republic of Uzbekistan, operates Innova Checker and decides how personal data are processed. Contact: support@innovanetworks.uz. We process personal data in accordance with the Law of the Republic of Uzbekistan “On Personal Data”.",
      ],
    },
    {
      id: "collect",
      title: "2. What we collect",
      paragraphs: [],
      items: [
        "Identification before the first check: your first and last name and e-mail address, whether and when the e-mail was confirmed, and the one-time code (stored only as a keyed hash and deleted after use or expiry).",
        "Evidence of accepting the Terms of Use: date and time, Terms version, interface language, IP address, country, browser (user agent) and a device identifier.",
        "Account data, if you register: name, work e-mail, company, password (stored only as an Argon2id hash), role, subscriptions and payments.",
        "Usage data: the links you check, the resulting reports, the time of each check, the country of the request (from our network provider Cloudflare) and a keyed hash of the IP address.",
        "Device and session data: registered devices, a device identifier derived from browser characteristics (stored only as a keyed hash), sign-in times and IP addresses.",
        "Messages you send through the contact form.",
      ],
    },
    {
      id: "links",
      title: "3. How submitted links are processed",
      paragraphs: [
        "Submitted links are fetched by our isolated scanner, which never runs page scripts and never runs or keeps downloaded files. When configured, links are also sent to threat-intelligence providers (Google Safe Browsing, VirusTotal, URLhaus, PhishTank, AbuseIPDB), which process them under their own terms. Do not submit links that contain confidential information you are not allowed to share, such as personal tokens or private documents.",
      ],
    },
    {
      id: "use",
      title: "4. Why we use the data",
      paragraphs: [],
      items: [
        "to provide checks, reports, accounts and subscriptions;",
        "to confirm that you are a real person and enforce free-check, subscription and device limits;",
        "to protect the Service and its users against abuse, fraud and attacks;",
        "to keep evidence that you accepted the Terms of Use;",
        "to produce aggregated statistics (for example, which scam domains are circulating) and to improve detection;",
        "to answer your messages and send service e-mails such as verification codes and password resets.",
      ],
      after: ["We do not sell personal data and do not use it for advertising."],
    },
    {
      id: "basis",
      title: "5. Consent",
      paragraphs: [
        "We process personal data on the basis of the consent you give when you accept the Terms of Use, and to perform our agreement with you. You may withdraw consent by writing to support@innovanetworks.uz; after that we may no longer be able to provide the Service to you, and we may keep the evidence of earlier acceptance as long as required to protect our rights.",
      ],
    },
    {
      id: "sharing",
      title: "6. Who receives the data",
      paragraphs: [
        "Our infrastructure providers (cloud hosting by Amazon Web Services and network services by Cloudflare), threat-intelligence providers for submitted links, payment providers for payments, and our e-mail provider for verification codes. They receive only what is needed for their task. We disclose data to authorities only where required by law. Our servers may be located outside the Republic of Uzbekistan.",
      ],
    },
    {
      id: "retention",
      title: "7. How long we keep data",
      paragraphs: [
        "Check history is kept while your account exists or until you delete it from your dashboard. Identification and acceptance records are kept while you use the Service and for up to three years after your last use, as evidence of acceptance. Unconfirmed verification codes expire after 10 minutes. Security and audit logs are kept as long as needed to operate and protect the Service.",
      ],
    },
    {
      id: "security",
      title: "8. Security",
      paragraphs: [
        "Passwords are hashed with Argon2id. Session, device and verification tokens are stored only as hashes. Connections are encrypted with TLS. Access to administrative functions is restricted to authorised staff and logged.",
      ],
    },
    {
      id: "rights",
      title: "9. Your rights",
      paragraphs: [
        "You can ask what data we hold about you, ask us to correct or delete them, and withdraw consent. Account holders can update their profile, delete check history and sign out of devices in the dashboard. Write to support@innovanetworks.uz; we answer within 30 days.",
      ],
    },
    {
      id: "changes",
      title: "10. Changes",
      paragraphs: ["We may update this policy. The current version and date are shown at the top of this page; material changes are announced on the website."],
    },
  ],
};

const ru: LegalDoc = {
  metaTitle: "Политика конфиденциальности",
  metaDescription: "Как Innova Checker собирает, использует и защищает персональные данные и проверяемые Вами ссылки.",
  eyebrow: "Правовая информация",
  title: "Политика конфиденциальности",
  subtitle: "Как Innova Checker обращается с персональными данными и переданными ссылками.",
  updated: "Редакция 2026-11-17 · действует с 17 ноября 2026 г.",
  summaryTitle: "Кратко",
  summary: [
    "Перед первой проверкой мы запрашиваем Ваши имя и адрес электронной почты и подтверждаем адрес электронной почты одноразовым кодом.",
    "Мы храним проверяемые Вами ссылки, отчёты по ним, а также технические данные, такие как IP-адрес, страна и идентификаторы устройства.",
    "Ссылки могут направляться поставщикам данных об угрозах для анализа. Мы никогда не продаём персональные данные.",
  ],
  sections: [
    {
      id: "controller",
      title: "1. Кто отвечает за обработку данных",
      paragraphs: [
        "Innova Networks, г. Ташкент, Республика Узбекистан, является оператором Innova Checker и определяет порядок обработки персональных данных. Контакты: support@innovanetworks.uz. Мы обрабатываем персональные данные в соответствии с Законом Республики Узбекистан «О персональных данных».",
      ],
    },
    {
      id: "collect",
      title: "2. Какие данные мы собираем",
      paragraphs: [],
      items: [
        "Идентификационные данные перед первой проверкой: Ваши имя и фамилия, адрес электронной почты, сведения о том, был ли подтверждён адрес электронной почты и когда, а также одноразовый код (хранится только в виде хеша с ключом и удаляется после использования или истечения срока действия).",
        "Доказательства принятия Условий использования: дата и время, редакция Условий, язык интерфейса, IP-адрес, страна, браузер (user agent) и идентификатор устройства.",
        "Данные учётной записи, если Вы регистрируетесь: имя, рабочий адрес электронной почты, компания, пароль (хранится только в виде хеша Argon2id), роль, подписки и платежи.",
        "Данные об использовании: проверяемые Вами ссылки, полученные отчёты, время каждой проверки, страна, из которой поступил запрос (по данным нашего сетевого провайдера Cloudflare), и хеш IP-адреса с ключом.",
        "Данные об устройствах и сеансах: зарегистрированные устройства, идентификатор устройства, сформированный на основе характеристик браузера (хранится только в виде хеша с ключом), время входа в систему и IP-адреса.",
        "Сообщения, которые Вы направляете через форму обратной связи.",
      ],
    },
    {
      id: "links",
      title: "3. Как обрабатываются переданные ссылки",
      paragraphs: [
        "Переданные ссылки загружаются нашим изолированным сканером, который никогда не выполняет скрипты страниц и никогда не запускает и не хранит загруженные файлы. При соответствующей настройке ссылки также направляются поставщикам данных об угрозах (Google Safe Browsing, VirusTotal, URLhaus, PhishTank, AbuseIPDB), которые обрабатывают их на основании собственных условий. Не передавайте ссылки, содержащие конфиденциальную информацию, которую Вы не вправе раскрывать, например персональные токены или закрытые документы.",
      ],
    },
    {
      id: "use",
      title: "4. Для чего мы используем данные",
      paragraphs: [],
      items: [
        "для предоставления проверок, отчётов, учётных записей и подписок;",
        "для подтверждения того, что Вы являетесь реальным человеком, и для контроля за соблюдением лимитов бесплатных проверок, подписок и количества устройств;",
        "для защиты Сервиса и его пользователей от злоупотреблений, мошенничества и атак;",
        "для хранения доказательств принятия Вами Условий использования;",
        "для формирования обобщённой статистики (например, о том, какие мошеннические домены находятся в обращении) и совершенствования механизмов выявления угроз;",
        "для ответа на Ваши сообщения и направления служебных писем, таких как коды подтверждения и письма для сброса пароля.",
      ],
      after: ["Мы не продаём персональные данные и не используем их в рекламных целях."],
    },
    {
      id: "basis",
      title: "5. Согласие",
      paragraphs: [
        "Мы обрабатываем персональные данные на основании согласия, которое Вы даёте при принятии Условий использования, а также в целях исполнения заключённого с Вами соглашения. Вы вправе отозвать согласие, направив письмо по адресу support@innovanetworks.uz; после этого мы можем утратить возможность предоставлять Вам Сервис, при этом мы вправе хранить доказательства ранее совершённого принятия Условий в течение срока, необходимого для защиты наших прав.",
      ],
    },
    {
      id: "sharing",
      title: "6. Кто получает данные",
      paragraphs: [
        "Наши поставщики инфраструктурных услуг (облачный хостинг — Amazon Web Services, сетевые услуги — Cloudflare), поставщики данных об угрозах — в отношении переданных ссылок, платёжные провайдеры — в отношении платежей, а также наш поставщик услуг электронной почты — для отправки кодов подтверждения. Они получают только те данные, которые необходимы для выполнения их задач. Мы раскрываем данные государственным органам только в случаях, предусмотренных законом. Наши серверы могут располагаться за пределами Республики Узбекистан.",
      ],
    },
    {
      id: "retention",
      title: "7. Сроки хранения данных",
      paragraphs: [
        "История проверок хранится, пока существует Ваша учётная запись, или до тех пор, пока Вы не удалите её в личном кабинете. Записи об идентификации и о принятии Условий хранятся в течение всего периода использования Вами Сервиса и до трёх лет после последнего использования в качестве доказательства принятия Условий. Срок действия неподтверждённых кодов подтверждения истекает через 10 минут. Журналы безопасности и аудита хранятся в течение срока, необходимого для эксплуатации и защиты Сервиса.",
      ],
    },
    {
      id: "security",
      title: "8. Безопасность",
      paragraphs: [
        "Пароли хешируются с использованием алгоритма Argon2id. Токены сеансов, устройств и подтверждения хранятся только в виде хешей. Соединения шифруются с использованием протокола TLS. Доступ к административным функциям предоставляется только уполномоченным сотрудникам и регистрируется в журналах.",
      ],
    },
    {
      id: "rights",
      title: "9. Ваши права",
      paragraphs: [
        "Вы вправе запросить сведения о том, какие данные о Вас мы храним, потребовать их исправления или удаления, а также отозвать согласие. Владельцы учётных записей могут обновлять свой профиль, удалять историю проверок и завершать сеансы на устройствах в личном кабинете. Пишите на support@innovanetworks.uz; мы отвечаем в течение 30 дней.",
      ],
    },
    {
      id: "changes",
      title: "10. Изменения",
      paragraphs: ["Мы вправе обновлять настоящую Политику. Действующая редакция и её дата указаны в верхней части настоящей страницы; о существенных изменениях сообщается на веб-сайте."],
    },
  ],
};

const uz: LegalDoc = {
  metaTitle: "Maxfiylik siyosati",
  metaDescription: "Innova Checker shaxsga doir ma’lumotlarni va Siz tekshiradigan havolalarni qanday to‘plashi, ulardan qanday foydalanishi va ularni qanday himoya qilishi.",
  eyebrow: "Huquqiy ma’lumot",
  title: "Maxfiylik siyosati",
  subtitle: "Innova Checker shaxsga doir ma’lumotlar va yuborilgan havolalar bilan qanday ishlaydi.",
  updated: "2026-11-17 tahriri · 2026-yil 17-noyabrdan amal qiladi",
  summaryTitle: "Qisqacha",
  summary: [
    "Birinchi tekshiruvdan oldin biz Sizning ismingiz va elektron pochta manzilingizni so‘raymiz hamda elektron pochta manzilini bir martalik kod orqali tasdiqlaymiz.",
    "Biz Siz tekshiradigan havolalarni, ularning hisobotlarini, shuningdek IP-manzil, mamlakat va qurilma identifikatorlari kabi texnik ma’lumotlarni saqlaymiz.",
    "Havolalar tahlil uchun tahdidlar to‘g‘risidagi ma’lumotlar provayderlariga yuborilishi mumkin. Biz hech qachon shaxsga doir ma’lumotlarni sotmaymiz.",
  ],
  sections: [
    {
      id: "controller",
      title: "1. Ma’lumotlarni qayta ishlashga kim mas’ul",
      paragraphs: [
        "Toshkent shahri, O‘zbekiston Respublikasida joylashgan Innova Networks Innova Checker operatori hisoblanadi va shaxsga doir ma’lumotlarni qayta ishlash tartibini belgilaydi. Aloqa: support@innovanetworks.uz. Biz shaxsga doir ma’lumotlarni O‘zbekiston Respublikasining «Shaxsga doir ma’lumotlar to‘g‘risida»gi Qonuniga muvofiq qayta ishlaymiz.",
      ],
    },
    {
      id: "collect",
      title: "2. Biz qanday ma’lumotlarni to‘playmiz",
      paragraphs: [],
      items: [
        "Birinchi tekshiruvdan oldingi identifikatsiya: ismingiz va familiyangiz, elektron pochta manzilingiz, elektron pochta tasdiqlanganligi va qachon tasdiqlanganligi, shuningdek bir martalik kod (faqat kalitli xesh ko‘rinishida saqlanadi va foydalanilgandan yoki amal qilish muddati tugagandan keyin o‘chiriladi).",
        "Foydalanish shartlari qabul qilinganligining dalillari: sana va vaqt, Shartlar tahriri, interfeys tili, IP-manzil, mamlakat, brauzer (user agent) va qurilma identifikatori.",
        "Ro‘yxatdan o‘tganingizda hisob qaydnomasi ma’lumotlari: ism, ishchi elektron pochta manzili, kompaniya, parol (faqat Argon2id xeshi ko‘rinishida saqlanadi), rol, obunalar va to‘lovlar.",
        "Foydalanish to‘g‘risidagi ma’lumotlar: Siz tekshiradigan havolalar, olingan hisobotlar, har bir tekshiruv vaqti, so‘rov yuborilgan mamlakat (tarmoq provayderimiz Cloudflare ma’lumotlariga ko‘ra) va IP-manzilning kalitli xeshi.",
        "Qurilma va seans ma’lumotlari: ro‘yxatdan o‘tkazilgan qurilmalar, brauzer xususiyatlari asosida shakllantirilgan qurilma identifikatori (faqat kalitli xesh ko‘rinishida saqlanadi), tizimga kirish vaqtlari va IP-manzillar.",
        "Siz aloqa shakli orqali yuboradigan xabarlar.",
      ],
    },
    {
      id: "links",
      title: "3. Yuborilgan havolalar qanday qayta ishlanadi",
      paragraphs: [
        "Yuborilgan havolalar bizning izolyatsiya qilingan skanerimiz tomonidan yuklab olinadi; u hech qachon sahifa skriptlarini bajarmaydi va yuklab olingan fayllarni hech qachon ishga tushirmaydi va saqlamaydi. Tegishli sozlamalar mavjud bo‘lganda, havolalar tahdidlar to‘g‘risidagi ma’lumotlar provayderlariga (Google Safe Browsing, VirusTotal, URLhaus, PhishTank, AbuseIPDB) ham yuboriladi, ular havolalarni o‘z shartlari asosida qayta ishlaydi. Siz oshkor qilishga haqli bo‘lmagan maxfiy ma’lumotlarni (masalan, shaxsiy tokenlar yoki yopiq hujjatlarni) o‘z ichiga olgan havolalarni yubormang.",
      ],
    },
    {
      id: "use",
      title: "4. Ma’lumotlardan nima maqsadda foydalanamiz",
      paragraphs: [],
      items: [
        "tekshiruvlar, hisobotlar, hisob qaydnomalari va obunalarni taqdim etish uchun;",
        "Sizning haqiqiy shaxs ekanligingizni tasdiqlash hamda bepul tekshiruvlar, obunalar va qurilmalar soni bo‘yicha cheklovlarga rioya etilishini ta’minlash uchun;",
        "Xizmatni va uning foydalanuvchilarini suiiste’mollik, firibgarlik va hujumlardan himoya qilish uchun;",
        "Foydalanish shartlarini qabul qilganingiz to‘g‘risidagi dalillarni saqlash uchun;",
        "umumlashtirilgan statistika tayyorlash (masalan, qaysi firibgarlik domenlari muomalada ekanligi to‘g‘risida) va tahdidlarni aniqlash sifatini oshirish uchun;",
        "xabarlaringizga javob berish va tasdiqlash kodlari hamda parolni tiklash xatlari kabi xizmat xatlarini yuborish uchun.",
      ],
      after: ["Biz shaxsga doir ma’lumotlarni sotmaymiz va ulardan reklama maqsadlarida foydalanmaymiz."],
    },
    {
      id: "basis",
      title: "5. Rozilik",
      paragraphs: [
        "Biz shaxsga doir ma’lumotlarni Siz Foydalanish shartlarini qabul qilishda bergan roziligingiz asosida, shuningdek Siz bilan tuzilgan kelishuvni bajarish maqsadida qayta ishlaymiz. Siz support@innovanetworks.uz manziliga yozib, rozilikni qaytarib olishingiz mumkin; shundan so‘ng biz Sizga Xizmatni taqdim eta olmasligimiz mumkin, shuningdek avvalroq Shartlar qabul qilinganligi to‘g‘risidagi dalillarni huquqlarimizni himoya qilish uchun zarur bo‘lgan muddat davomida saqlashimiz mumkin.",
      ],
    },
    {
      id: "sharing",
      title: "6. Ma’lumotlarni kimlar oladi",
      paragraphs: [
        "Infratuzilma provayderlarimiz (Amazon Web Services bulutli xostingi va Cloudflare tarmoq xizmatlari), yuborilgan havolalar bo‘yicha tahdidlar to‘g‘risidagi ma’lumotlar provayderlari, to‘lovlar bo‘yicha to‘lov provayderlari hamda tasdiqlash kodlarini yuborish uchun elektron pochta provayderimiz. Ular faqat o‘z vazifasini bajarish uchun zarur bo‘lgan ma’lumotlarni oladi. Biz ma’lumotlarni davlat organlariga faqat qonunda talab qilingan hollarda oshkor qilamiz. Serverlarimiz O‘zbekiston Respublikasi hududidan tashqarida joylashgan bo‘lishi mumkin.",
      ],
    },
    {
      id: "retention",
      title: "7. Ma’lumotlarni saqlash muddatlari",
      paragraphs: [
        "Tekshiruvlar tarixi hisob qaydnomangiz mavjud bo‘lgan davrda yoki Siz uni shaxsiy kabinetingizdan o‘chirib tashlaguningizga qadar saqlanadi. Identifikatsiya va Shartlar qabul qilinganligi to‘g‘risidagi yozuvlar Shartlar qabul qilinganligining dalili sifatida Siz Xizmatdan foydalanadigan butun davr mobaynida va oxirgi foydalanishingizdan keyin uch yilgacha saqlanadi. Tasdiqlanmagan tasdiqlash kodlarining amal qilish muddati 10 daqiqadan keyin tugaydi. Xavfsizlik va audit jurnallari Xizmatning ishlashini ta’minlash va uni himoya qilish uchun zarur bo‘lgan muddat davomida saqlanadi.",
      ],
    },
    {
      id: "security",
      title: "8. Xavfsizlik",
      paragraphs: [
        "Parollar Argon2id algoritmi yordamida xeshlanadi. Seans, qurilma va tasdiqlash tokenlari faqat xesh ko‘rinishida saqlanadi. Ulanishlar TLS protokoli yordamida shifrlanadi. Ma’muriy funksiyalarga kirish faqat vakolatli xodimlar bilan cheklangan va jurnalda qayd etib boriladi.",
      ],
    },
    {
      id: "rights",
      title: "9. Sizning huquqlaringiz",
      paragraphs: [
        "Siz biz Siz haqingizda qanday ma’lumotlarni saqlayotganimizni so‘rashingiz, ularni tuzatishni yoki o‘chirishni talab qilishingiz hamda rozilikni qaytarib olishingiz mumkin. Hisob qaydnomasi egalari shaxsiy kabinetda o‘z profilini yangilashlari, tekshiruvlar tarixini o‘chirishlari va qurilmalardagi seanslarni yakunlashlari mumkin. support@innovanetworks.uz manziliga yozing; biz 30 kun ichida javob beramiz.",
      ],
    },
    {
      id: "changes",
      title: "10. O‘zgartirishlar",
      paragraphs: ["Biz ushbu siyosatni yangilashimiz mumkin. Amaldagi tahrir va uning sanasi ushbu sahifaning yuqori qismida ko‘rsatilgan; muhim o‘zgartirishlar haqida veb-saytda e’lon qilinadi."],
    },
  ],
};

/** Privacy policy. English is the master text; ru and uz are translations of it. */
export const privacyText = defineMessages<LegalDoc>({ en, ru, uz });
