import { defineMessages } from "../config";

export type ModuleKey = "url" | "domain" | "dns" | "ssl" | "redirects" | "content" | "files" | "intel";
export type StepKey = "paste" | "analyze" | "verdict";
type ThreatKey = "tracking" | "waybills" | "customs" | "loadBoard" | "payment" | "shippingLine";
type PrincipleKey = "isolated" | "transparent" | "licensed" | "logistics";
/** Stable FAQ ids: the home page swaps in the configured free policy for "free". */
export type FaqId = "safe" | "checks" | "safeWrong" | "sources" | "free" | "devices" | "buy";

type Card = { title: string; text: string };
type FaqItem = { id: FaqId; q: string; a: string };

type HomeSectionsText = {
  modules: Record<ModuleKey, Card & { points: [string, string] }>;
  stats: {
    modules: { label: string; sub: string };
    checks: { label: string; sub: string };
    intel: { label: string; sub: string };
    scans: { label: string; sub: (threats: string) => string };
  };
  steps: Record<StepKey, Card>;
  why: {
    threatsTitle: string;
    threatsText: string;
    threats: Record<ThreatKey, Card>;
    designTitle: string;
    designText: string;
    principles: Record<PrincipleKey, Card>;
  };
  faq: FaqItem[];
  /** Appended to the configured free-policy sentence in the "free" FAQ answer. */
  faqFreeSuffix: string;
  cta: { title: string; text: string; freeScan: string; checkLink: string; createAccount: string };
};

/** Shared marketing sections (components/marketing/sections.tsx). */
export const homeSectionsText = defineMessages<HomeSectionsText>({
  en: {
    modules: {
      url: { title: "URL analysis", text: "Structure, IP hosts, shorteners, homograph/IDN tricks, brand look-alikes, encoding anomalies, unusual ports and lure keywords.", points: ["Punycode & mixed-script detection", "Typo-squat matching against carrier brands"] },
      domain: { title: "Domain intelligence", text: "Registrar, creation and expiry dates and domain age from RDAP, with WHOIS fallback for ccTLDs such as .uz.", points: ["Newly-registered domain alerts", "Admin-managed blocklist patterns"] },
      dns: { title: "DNS records", text: "A, AAAA, CNAME, MX, NS, TXT, CAA, SOA, SPF and DMARC, plus fast-flux and internal-address rebinding indicators.", points: ["Free/dynamic DNS provider detection", "Mail-authentication posture"] },
      ssl: { title: "SSL/TLS certificate", text: "Chain validity, expiry, hostname match, issuer, certificate age and negotiated protocol and cipher.", points: ["Self-signed & mismatched certs", "Fresh-certificate signal"] },
      redirects: { title: "Redirect analysis", text: "Every hop of HTTP and meta-refresh redirects, loops, downgrades and destinations hidden in page scripts.", points: ["Short links resolved safely", "Blocked hops into private networks"] },
      content: { title: "Website content", text: "Static inspection of forms, scripts, iframes and external resources: no code from the page is ever executed.", points: ["Credential & card harvesting forms", "Telegram/Discord exfiltration in kits"] },
      files: { title: "File downloads", text: "File type by signature, double extensions, macro documents, disguised executables and SHA-256 fingerprints.", points: ["Never stored, opened or executed", "Hash lookups when intel is configured"] },
      intel: { title: "Threat intelligence", text: "Google Safe Browsing, VirusTotal, URLhaus, PhishTank and AbuseIPDB adapters, each enabled independently.", points: ["Shows “Not configured” honestly", "No fabricated provider verdicts"] },
    },
    stats: {
      modules: { label: "Analysis modules", sub: "run in parallel on every scan" },
      checks: { label: "Individual checks", sub: "each with evidence and source" },
      intel: { label: "Threat-intel integrations", sub: "enabled per deployment" },
      scans: { label: "URLs analyzed", sub: (threats) => `${threats} flagged as risky · live count` },
    },
    steps: {
      paste: { title: "Paste the link", text: "Copy the suspicious link from an e-mail, Telegram or WhatsApp message and paste it into Innova Checker. Defanged links like hxxp://example[.]com work too." },
      analyze: { title: "We analyze it in isolation", text: "Our server-side scanner resolves, fetches and inspects the destination behind strict network policies. Your browser never opens the link and no page code is executed." },
      verdict: { title: "Get a clear verdict", text: "Receive a 0–100 risk score, a verdict from Safe to Malicious, every check with its evidence and source, and practical next steps for your team." },
    },
    why: {
      threatsTitle: "Threats your team actually receives",
      threatsText: "Logistics staff open more external links than almost any other role. These are the lures we are built to catch.",
      threats: {
        tracking: { title: "Fake shipment tracking pages", text: "Look-alike DHL, FedEx, UPS and Maersk pages that steal logins or ask for redelivery fees." },
        waybills: { title: "Malicious waybills & invoices", text: "“Bill of lading” or “invoice” links that deliver ISO, LNK, macro or disguised executable files." },
        customs: { title: "Customs-fee scams", text: "Urgent requests to pay clearance or duty fees by card before a parcel is released." },
        loadBoard: { title: "Load-board & mailbox phishing", text: "Credential harvesting for Microsoft 365, load boards, TMS and carrier portals." },
        payment: { title: "Payment-redirection fraud", text: "Messages with links to “updated bank details” documents from look-alike partner domains." },
        shippingLine: { title: "Shipping-line impersonation", text: "Booking-confirmation and container-release lures using shipping-line branding." },
      },
      designTitle: "Security by design",
      designText: "A security tool must be secure itself. Innova Checker was engineered by the security team at Innova Networks.",
      principles: {
        isolated: { title: "Isolated scanning engine", text: "SSRF-hardened fetcher: private, loopback and cloud-metadata addresses are blocked at DNS-resolution time, redirects are re-validated hop by hop, sizes and timeouts are capped." },
        transparent: { title: "Transparent, never fabricated", text: "Every check shows its status, evidence, data source and timestamp. Providers without an API key are reported as “Not configured”, never as clean." },
        licensed: { title: "Licensed per device", text: "Subscriptions enforce device limits server-side, so a single-device plan really is one device. Administrators can revoke devices and sessions at any time." },
        logistics: { title: "Tuned for logistics", text: "Built-in knowledge of carrier, shipping-line, customs and payment brands that attackers impersonate to reach freight and dispatch teams." },
      },
    },
    faq: [
      { id: "safe", q: "Is it safe to paste a suspicious link into Innova Checker?", a: "Yes. The link is never opened in your browser. Our server fetches it inside an isolated scanner that blocks internal addresses, never executes page scripts and never runs or stores downloaded files." },
      { id: "checks", q: "What exactly does a scan check?", a: "Eight modules run on every scan: URL structure, domain registration and reputation, DNS records, SSL/TLS certificate, redirect chain, page content, file downloads and threat intelligence. The report lists every check with its result, evidence and source." },
      { id: "safeWrong", q: "Can a “Safe” verdict be wrong?", a: "Yes. No automated scanner can guarantee that a website is 100% safe. Attackers serve different content to different visitors and use brand-new infrastructure. Treat the verdict as strong evidence, not a guarantee, and follow your company's security policy." },
      { id: "sources", q: "Which threat-intelligence sources are used?", a: "Innova Checker integrates Google Safe Browsing, VirusTotal, URLhaus, PhishTank and AbuseIPDB. Each provider is used only when its API key is configured by the operator. Reports clearly mark providers that were not consulted." },
      { id: "free", q: "How many free checks do I get?", a: "The free allowance lets you try the full analysis. Continuous use requires a subscription so we can keep the scanning infrastructure and intelligence feeds running. Free-scan limits are enforced on the server, not just in your browser." },
      { id: "devices", q: "How do device limits work?", a: "Each plan allows a set number of devices (1 to 50). A device is registered when you sign in on a new browser. When the limit is reached, remove an old device from your dashboard or ask your administrator." },
      { id: "buy", q: "How can I buy a subscription?", a: "Online payments are not available yet; purchases will be enabled soon. Until then, contact Innova Networks and an administrator can activate a plan for your account." },
    ],
    faqFreeSuffix: "Free-scan limits are enforced on the server, not just in your browser.",
    cta: {
      title: "Stop phishing before it reaches your freight desk.",
      text: "Give every dispatcher, broker and accountant a fast, trustworthy way to check a link before they click it.",
      freeScan: "Run a free scan",
      checkLink: "Check a link",
      createAccount: "Create an account",
    },
  },
  ru: {
    modules: {
      url: { title: "Анализ URL", text: "Структура, IP-адреса вместо домена, сокращатели ссылок, гомографы и IDN-уловки, имитация брендов, аномалии кодирования, нестандартные порты и слова-приманки.", points: ["Обнаружение Punycode и смешанных алфавитов", "Поиск тайпсквоттинга под бренды перевозчиков"] },
      domain: { title: "Данные о домене", text: "Регистратор, даты регистрации и окончания, возраст домена по RDAP, с резервным WHOIS для национальных зон, например .uz.", points: ["Предупреждения о недавно зарегистрированных доменах", "Шаблоны блокировки, которые задаёт администратор"] },
      dns: { title: "DNS-записи", text: "A, AAAA, CNAME, MX, NS, TXT, CAA, SOA, SPF и DMARC, а также признаки fast-flux и DNS rebinding на внутренние адреса.", points: ["Обнаружение бесплатных и динамических DNS-сервисов", "Настройки аутентификации почты"] },
      ssl: { title: "SSL/TLS-сертификат", text: "Корректность цепочки, срок действия, соответствие имени хоста, издатель, возраст сертификата, согласованные протокол и шифр.", points: ["Самоподписанные и несовпадающие сертификаты", "Сигнал о только что выпущенном сертификате"] },
      redirects: { title: "Анализ перенаправлений", text: "Каждый шаг HTTP- и meta-refresh-перенаправлений, циклы, переход с HTTPS на HTTP и адреса, спрятанные в скриптах страницы.", points: ["Безопасное раскрытие коротких ссылок", "Блокировка переходов во внутренние сети"] },
      content: { title: "Содержимое сайта", text: "Статический анализ форм, скриптов, iframe и внешних ресурсов: код страницы никогда не выполняется.", points: ["Формы кражи паролей и данных карт", "Отправка данных в Telegram/Discord из фишинг-китов"] },
      files: { title: "Загружаемые файлы", text: "Тип файла по сигнатуре, двойные расширения, документы с макросами, замаскированные исполняемые файлы и отпечатки SHA-256.", points: ["Никогда не сохраняются, не открываются и не запускаются", "Проверка хешей, если подключены базы угроз"] },
      intel: { title: "Базы угроз", text: "Подключения к Google Safe Browsing, VirusTotal, URLhaus, PhishTank и AbuseIPDB, каждое включается отдельно.", points: ["Честно показывает «Не настроено»", "Никаких выдуманных вердиктов провайдеров"] },
    },
    stats: {
      modules: { label: "Модулей анализа", sub: "работают параллельно при каждой проверке" },
      checks: { label: "Отдельных проверок", sub: "у каждой есть доказательства и источник" },
      intel: { label: "Интеграций с базами угроз", sub: "включаются для каждой установки" },
      scans: { label: "Проверено ссылок", sub: (threats) => `Из них опасных: ${threats} · счётчик в реальном времени` },
    },
    steps: {
      paste: { title: "Вставьте ссылку", text: "Скопируйте подозрительную ссылку из письма, сообщения в Telegram или WhatsApp и вставьте её в Innova Checker. Обезвреженные ссылки вида hxxp://example[.]com тоже подойдут." },
      analyze: { title: "Мы анализируем её в изоляции", text: "Наш серверный сканер определяет адрес, загружает и проверяет страницу назначения за строгими сетевыми политиками. Ваш браузер никогда не открывает ссылку, а код страницы не выполняется." },
      verdict: { title: "Получите понятный вердикт", text: "Вы получите оценку риска от 0 до 100, вердикт от «Безопасно» до «Вредоносно», все проверки с доказательствами и источниками, а также практические рекомендации для вашей команды." },
    },
    why: {
      threatsTitle: "Угрозы, которые действительно приходят вашей команде",
      threatsText: "Сотрудники логистики открывают больше внешних ссылок, чем почти кто-либо ещё. Вот приманки, которые мы умеем распознавать.",
      threats: {
        tracking: { title: "Поддельные страницы отслеживания", text: "Копии страниц DHL, FedEx, UPS и Maersk, которые крадут логины или требуют оплатить повторную доставку." },
        waybills: { title: "Вредоносные накладные и счета", text: "Ссылки «коносамент» или «счёт», через которые приходят файлы ISO, LNK, документы с макросами или замаскированные исполняемые файлы." },
        customs: { title: "Мошенничество с таможенными сборами", text: "Срочные требования оплатить картой таможенное оформление или пошлину, иначе посылку не выдадут." },
        loadBoard: { title: "Фишинг бирж грузов и почты", text: "Кража учётных данных от Microsoft 365, бирж грузов, TMS и порталов перевозчиков." },
        payment: { title: "Подмена платёжных реквизитов", text: "Сообщения со ссылками на документы с «новыми банковскими реквизитами» с доменов, похожих на домены партнёров." },
        shippingLine: { title: "Подделка под судоходные линии", text: "Приманки с подтверждением бронирования и выпуском контейнера в фирменном стиле судоходных линий." },
      },
      designTitle: "Безопасность в основе",
      designText: "Инструмент безопасности сам должен быть безопасным. Innova Checker разработан командой безопасности Innova Networks.",
      principles: {
        isolated: { title: "Изолированный движок сканирования", text: "Загрузчик с защитой от SSRF: частные, loopback-адреса и адреса облачных метаданных блокируются ещё на этапе DNS-резолвинга, каждое перенаправление проверяется заново, размеры и тайм-ауты ограничены." },
        transparent: { title: "Прозрачно и без выдумок", text: "Каждая проверка показывает статус, доказательства, источник данных и время. Провайдеры без API-ключа отмечаются как «Не настроено», а не как чистые." },
        licensed: { title: "Лицензия на устройство", text: "Лимит устройств по подписке контролируется на сервере, поэтому тариф на одно устройство действительно работает только на одном. Администраторы могут в любой момент отозвать устройства и сеансы." },
        logistics: { title: "Настроен для логистики", text: "Встроенные знания о брендах перевозчиков, судоходных линий, таможни и платёжных систем, под которые маскируются злоумышленники, чтобы добраться до экспедиторов и диспетчеров." },
      },
    },
    faq: [
      { id: "safe", q: "Безопасно ли вставлять подозрительную ссылку в Innova Checker?", a: "Да. Ссылка никогда не открывается в вашем браузере. Наш сервер загружает её в изолированном сканере, который блокирует внутренние адреса, не выполняет скрипты страницы и никогда не запускает и не сохраняет скачанные файлы." },
      { id: "checks", q: "Что именно проверяется?", a: "При каждой проверке работают восемь модулей: структура URL, регистрация и репутация домена, DNS-записи, SSL/TLS-сертификат, цепочка перенаправлений, содержимое страницы, загружаемые файлы и базы угроз. В отчёте указана каждая проверка с результатом, доказательствами и источником." },
      { id: "safeWrong", q: "Может ли вердикт «Безопасно» быть ошибочным?", a: "Да. Ни один автоматический сканер не может гарантировать, что сайт безопасен на 100%. Злоумышленники показывают разным посетителям разное содержимое и используют совершенно новую инфраструктуру. Считайте вердикт весомым доводом, а не гарантией, и следуйте политике безопасности вашей компании." },
      { id: "sources", q: "Какие базы угроз используются?", a: "Innova Checker подключается к Google Safe Browsing, VirusTotal, URLhaus, PhishTank и AbuseIPDB. Каждый провайдер используется, только если оператор настроил его API-ключ. В отчётах чётко отмечено, какие провайдеры не запрашивались." },
      { id: "free", q: "Сколько бесплатных проверок я получу?", a: "Бесплатный лимит позволяет попробовать полный анализ. Для постоянного использования нужна подписка — она поддерживает работу инфраструктуры сканирования и баз угроз. Лимиты бесплатных проверок контролируются на сервере, а не только в вашем браузере." },
      { id: "devices", q: "Как работают лимиты устройств?", a: "Каждый тариф допускает определённое число устройств (от 1 до 50). Устройство регистрируется, когда вы входите в аккаунт в новом браузере. Если лимит исчерпан, удалите старое устройство в кабинете или обратитесь к администратору." },
      { id: "buy", q: "Как купить подписку?", a: "Онлайн-оплата пока недоступна, покупки скоро будут включены. А пока свяжитесь с Innova Networks — администратор активирует тариф для вашего аккаунта." },
    ],
    faqFreeSuffix: "Лимиты бесплатных проверок контролируются на сервере, а не только в вашем браузере.",
    cta: {
      title: "Остановите фишинг до того, как он дойдёт до вашего отдела перевозок.",
      text: "Дайте каждому диспетчеру, брокеру и бухгалтеру быстрый и надёжный способ проверить ссылку, прежде чем по ней перейти.",
      freeScan: "Проверить бесплатно",
      checkLink: "Проверить ссылку",
      createAccount: "Зарегистрироваться",
    },
  },
  uz: {
    modules: {
      url: { title: "URL tahlili", text: "Tuzilma, domen o‘rnidagi IP manzillar, havola qisqartirgichlar, gomograf va IDN nayranglari, brendlarga taqlid, kodlash anomaliyalari, nostandart portlar va aldov kalit so‘zlari.", points: ["Punycode va aralash alifbolarni aniqlash", "Tashuvchi brendlariga o‘xshatilgan domenlarni aniqlash"] },
      domain: { title: "Domen ma’lumotlari", text: "RDAP orqali registrator, ro‘yxatdan o‘tish va muddati tugash sanalari hamda domen yoshi; .uz kabi milliy zonalar uchun WHOIS zaxira manba sifatida ishlatiladi.", points: ["Yaqinda ro‘yxatdan o‘tgan domenlar haqida ogohlantirish", "Administrator boshqaradigan bloklash shablonlari"] },
      dns: { title: "DNS yozuvlari", text: "A, AAAA, CNAME, MX, NS, TXT, CAA, SOA, SPF va DMARC, shuningdek fast-flux va ichki manzillarga DNS rebinding belgilari.", points: ["Bepul va dinamik DNS xizmatlarini aniqlash", "Pochta autentifikatsiyasi holati"] },
      ssl: { title: "SSL/TLS sertifikati", text: "Zanjir to‘g‘riligi, amal qilish muddati, xost nomiga mosligi, beruvchi, sertifikat yoshi hamda kelishilgan protokol va shifr.", points: ["O‘z-o‘zidan imzolangan va mos kelmaydigan sertifikatlar", "Yangi chiqarilgan sertifikat belgisi"] },
      redirects: { title: "Yo‘naltirishlar tahlili", text: "HTTP va meta-refresh yo‘naltirishlarining har bir bosqichi, sikllar, HTTPS dan HTTP ga tushirish va sahifa skriptlarida yashirilgan manzillar.", points: ["Qisqa havolalar xavfsiz ochib beriladi", "Ichki tarmoqlarga o‘tishlar bloklanadi"] },
      content: { title: "Sayt mazmuni", text: "Formalar, skriptlar, iframe va tashqi resurslarni statik tekshirish: sahifadagi kod hech qachon ishga tushirilmaydi.", points: ["Parol va karta ma’lumotlarini o‘g‘irlovchi formalar", "Fishing to‘plamlarida Telegram/Discord orqali ma’lumot chiqarish"] },
      files: { title: "Yuklab olinadigan fayllar", text: "Imzo bo‘yicha fayl turi, qo‘sh kengaytmalar, makrosli hujjatlar, niqoblangan bajariladigan fayllar va SHA-256 izlari.", points: ["Hech qachon saqlanmaydi, ochilmaydi va ishga tushirilmaydi", "Tahdidlar bazalari ulanganda xesh bo‘yicha tekshiruv"] },
      intel: { title: "Tahdidlar bazalari", text: "Google Safe Browsing, VirusTotal, URLhaus, PhishTank va AbuseIPDB ulanishlari, har biri alohida yoqiladi.", points: ["“Sozlanmagan” holatini halol ko‘rsatadi", "Provayderlar nomidan to‘qib chiqarilgan xulosalar yo‘q"] },
    },
    stats: {
      modules: { label: "Tahlil modullari", sub: "har bir tekshiruvda parallel ishlaydi" },
      checks: { label: "Alohida tekshiruvlar", sub: "har biri dalil va manba bilan" },
      intel: { label: "Tahdidlar bazalari bilan integratsiya", sub: "har bir o‘rnatmada alohida yoqiladi" },
      scans: { label: "Tekshirilgan havolalar", sub: (threats) => `Shundan ${threats} tasi xavfli deb topildi · jonli hisob` },
    },
    steps: {
      paste: { title: "Havolani qo‘ying", text: "Shubhali havolani e-pochta, Telegram yoki WhatsApp xabaridan nusxalab, Innova Checker tekshiruv maydoniga qo‘ying. Zararsizlantirilgan havolalar (masalan, hxxp://example[.]com) ham qabul qilinadi." },
      analyze: { title: "Biz uni izolyatsiyada tahlil qilamiz", text: "Serverdagi skanerimiz qat’iy tarmoq siyosatlari ostida manzilni aniqlaydi, sahifani yuklaydi va tekshiradi. Brauzeringiz havolani hech qachon ochmaydi, sahifa kodi esa ishga tushirilmaydi." },
      verdict: { title: "Aniq xulosa oling", text: "0–100 oralig‘idagi xavf bahosi, “Xavfsiz”dan “Zararli”gacha bo‘lgan xulosa, har bir tekshiruvning dalili va manbasi hamda jamoangiz uchun amaliy tavsiyalarni olasiz." },
    },
    why: {
      threatsTitle: "Jamoangizga haqiqatan keladigan tahdidlar",
      threatsText: "Logistika xodimlari deyarli boshqa barcha kasb egalaridan ko‘ra ko‘proq tashqi havolalarni ochadi. Biz aynan shu aldov usullarini aniqlash uchun yaratilganmiz.",
      threats: {
        tracking: { title: "Soxta yuk kuzatish sahifalari", text: "DHL, FedEx, UPS va Maersk sahifalariga o‘xshatilgan, login ma’lumotlarini o‘g‘irlaydigan yoki qayta yetkazib berish uchun to‘lov so‘raydigan sahifalar." },
        waybills: { title: "Zararli yuk xatlari va hisob-fakturalar", text: "“Konosament” yoki “hisob-faktura” nomli havolalar orqali ISO, LNK, makrosli yoki niqoblangan bajariladigan fayllar tarqatiladi." },
        customs: { title: "Bojxona to‘lovi bilan firibgarlik", text: "Jo‘natma berilishidan oldin rasmiylashtirish yoki boj to‘lovini karta orqali shoshilinch to‘lash talablari." },
        loadBoard: { title: "Yuk birjalari va pochta qutilariga fishing", text: "Microsoft 365, yuk birjalari, TMS va tashuvchi portallari uchun login ma’lumotlarini o‘g‘irlash." },
        payment: { title: "To‘lov rekvizitlarini almashtirish", text: "Hamkor domenlariga o‘xshash manzillardan “yangilangan bank rekvizitlari” hujjatiga havola yuborilgan xabarlar." },
        shippingLine: { title: "Dengiz liniyalari nomidan firibgarlik", text: "Dengiz tashuvchilari brendidan foydalanilgan bron tasdig‘i va konteynerni chiqarish haqidagi aldov xabarlari." },
      },
      designTitle: "Xavfsizlik — tizim asosida",
      designText: "Xavfsizlik vositasining o‘zi ham xavfsiz bo‘lishi kerak. Innova Checker Innova Networks xavfsizlik jamoasi tomonidan ishlab chiqilgan.",
      principles: {
        isolated: { title: "Izolyatsiyalangan skanerlash tizimi", text: "SSRF hujumlaridan himoyalangan yuklovchi: xususiy, loopback va bulut metama’lumotlari manzillari DNS so‘rovi bosqichidayoq bloklanadi, har bir yo‘naltirish qayta tekshiriladi, hajm va kutish vaqti cheklangan." },
        transparent: { title: "Shaffof, hech narsa to‘qib chiqarilmaydi", text: "Har bir tekshiruv holati, dalili, ma’lumot manbasi va vaqtini ko‘rsatadi. API kaliti yo‘q provayderlar “toza” emas, “Sozlanmagan” deb ko‘rsatiladi." },
        licensed: { title: "Qurilma bo‘yicha litsenziya", text: "Obunadagi qurilmalar limiti server tomonida nazorat qilinadi, shuning uchun bitta qurilmalik tarif haqiqatan ham bitta qurilmada ishlaydi. Administratorlar istalgan vaqtda qurilma va seanslarni bekor qila oladi." },
        logistics: { title: "Logistika uchun moslashtirilgan", text: "Hujumchilar yuk va dispetcherlik jamoalariga yetib borish uchun taqlid qiladigan tashuvchi, dengiz liniyasi, bojxona va to‘lov brendlari haqidagi ichki bilimlar." },
      },
    },
    faq: [
      { id: "safe", q: "Shubhali havolani Innova Checker orqali tekshirish xavfsizmi?", a: "Ha. Havola brauzeringizda hech qachon ochilmaydi. Serverimiz uni ichki manzillarni bloklaydigan izolyatsiyalangan skanerda yuklaydi, sahifa skriptlarini bajarmaydi, yuklab olingan fayllarni esa hech qachon ishga tushirmaydi va saqlamaydi." },
      { id: "checks", q: "Tekshiruv aynan nimalarni tekshiradi?", a: "Har bir tekshiruvda sakkizta modul ishlaydi: URL tuzilmasi, domenning ro‘yxatdan o‘tishi va obro‘si, DNS yozuvlari, SSL/TLS sertifikati, yo‘naltirishlar zanjiri, sahifa mazmuni, yuklab olinadigan fayllar va tahdidlar bazalari. Hisobotda har bir tekshiruv natijasi, dalili va manbasi bilan ko‘rsatiladi." },
      { id: "safeWrong", q: "“Xavfsiz” xulosasi noto‘g‘ri bo‘lishi mumkinmi?", a: "Ha. Hech bir avtomatik skaner saytning 100% xavfsizligiga kafolat bera olmaydi. Hujumchilar turli tashrif buyuruvchilarga turli mazmun ko‘rsatadi va mutlaqo yangi infratuzilmadan foydalanadi. Xulosani kafolat emas, balki kuchli dalil sifatida qabul qiling va kompaniyangiz xavfsizlik siyosatiga amal qiling." },
      { id: "sources", q: "Qaysi tahdidlar bazalaridan foydalaniladi?", a: "Innova Checker Google Safe Browsing, VirusTotal, URLhaus, PhishTank va AbuseIPDB bilan integratsiyalangan. Har bir provayder faqat operator uning API kalitini sozlagan taqdirdagina ishlatiladi. Hisobotlarda qaysi provayderlarga so‘rov yuborilmagani aniq ko‘rsatiladi." },
      { id: "free", q: "Nechta bepul tekshiruv beriladi?", a: "Bepul limit to‘liq tahlilni sinab ko‘rish imkonini beradi. Doimiy foydalanish uchun obuna kerak — u skanerlash infratuzilmasi va tahdidlar bazalarining ishlashini ta’minlaydi. Bepul tekshiruv limitlari faqat brauzeringizda emas, serverda nazorat qilinadi." },
      { id: "devices", q: "Qurilmalar limiti qanday ishlaydi?", a: "Har bir tarif ma’lum miqdordagi qurilmaga ruxsat beradi (1 tadan 50 tagacha). Yangi brauzerda tizimga kirganingizda qurilma ro‘yxatga olinadi. Limit tugaganda Kabinetdan eski qurilmani o‘chiring yoki administratoringizga murojaat qiling." },
      { id: "buy", q: "Obunani qanday sotib olsam bo‘ladi?", a: "Onlayn to‘lov hozircha mavjud emas, xaridlar tez orada yoqiladi. Ungacha Innova Networks bilan bog‘laning — administrator hisobingiz uchun tarifni faollashtiradi." },
    ],
    faqFreeSuffix: "Bepul tekshiruv limitlari faqat brauzeringizda emas, serverda nazorat qilinadi.",
    cta: {
      title: "Fishingni yuk bo‘limingizga yetib bormasdan to‘xtating.",
      text: "Har bir dispetcher, broker va buxgalterga havolani bosishdan oldin uni tez va ishonchli tekshirish imkonini bering.",
      freeScan: "Bepul tekshirish",
      checkLink: "Havolani tekshirish",
      createAccount: "Ro‘yxatdan o‘tish",
    },
  },
});
