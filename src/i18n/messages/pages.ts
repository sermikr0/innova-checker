import { defineMessages } from "../config";

/** A heading with one highlighted (gradient) fragment; before/after may be empty. */
type HighlightTitle = { before: string; highlight: string; after: string };
type Card = { title: string; text: string };
type Stage = "validate" | "domain" | "reputation" | "redirects" | "ssl" | "content" | "intel";

type FeaturesText = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: HighlightTitle;
  heroSubtitle: string;
  platformEyebrow: string;
  platformTitle: string;
  /** Same order as the icons in features/page.tsx. */
  platform: Card[];
};

/** /features page. */
export const featuresText = defineMessages<FeaturesText>({
  en: {
    metaTitle: "Features",
    metaDescription: "Eight analysis engines, transparent evidence and a hardened scanning sandbox.",
    heroEyebrow: "Features",
    heroTitle: { before: "Detection depth of a ", highlight: "security team", after: "" },
    heroSubtitle: "Innova Checker runs eight specialised engines on every link and explains exactly what it found.",
    platformEyebrow: "Platform",
    platformTitle: "Built to be trusted by security teams",
    platform: [
      { title: "0–100 risk score", text: "Findings are weighted and combined into a single score and a verdict: Safe, Low Risk, Suspicious, High Risk, Malicious or Inconclusive." },
      { title: "Evidence for every check", text: "Each check records its status, result, explanation, raw evidence, data source and timestamp, so analysts can verify every conclusion." },
      { title: "SSRF-hardened sandbox", text: "Private, loopback, link-local and cloud-metadata addresses are refused at DNS resolution; redirects are validated hop by hop." },
      { title: "Downloads never executed", text: "Files are streamed through SHA-256 and signature checks in memory only, never written to disk, opened or run." },
      { title: "Modular provider adapters", text: "Threat-intelligence providers plug in through adapters and can be enabled or disabled independently by administrators." },
      { title: "Honest about coverage", text: "Unavailable or unconfigured checks are labelled as such and reduce the coverage figure; they are never reported as clean." },
    ],
  },
  ru: {
    metaTitle: "Возможности",
    metaDescription: "Восемь движков анализа, прозрачные доказательства и защищённая песочница для проверки ссылок.",
    heroEyebrow: "Возможности",
    heroTitle: { before: "Глубина анализа, как у ", highlight: "службы безопасности", after: "" },
    heroSubtitle: "Innova Checker прогоняет каждую ссылку через восемь специализированных движков и подробно объясняет, что именно обнаружено.",
    platformEyebrow: "Платформа",
    platformTitle: "Создана, чтобы ей доверяли службы безопасности",
    platform: [
      { title: "Оценка риска 0–100", text: "Результаты проверок взвешиваются и сводятся в единую оценку и вердикт: «Безопасно», «Низкий риск», «Подозрительно», «Высокий риск», «Мошенничество» или «Не определено»." },
      { title: "Доказательства по каждой проверке", text: "Для каждой проверки сохраняются статус, результат, пояснение, исходные данные, источник и время, поэтому аналитики могут перепроверить любой вывод." },
      { title: "Песочница с защитой от SSRF", text: "Частные, loopback-, link-local-адреса и адреса облачных метаданных блокируются ещё на этапе DNS-разрешения; каждое перенаправление проверяется отдельно." },
      { title: "Файлы никогда не запускаются", text: "Файлы проверяются потоково, только в памяти: вычисляется SHA-256 и проверяется сигнатура. Они никогда не записываются на диск, не открываются и не запускаются." },
      { title: "Модульные адаптеры источников", text: "Базы угроз подключаются через адаптеры, и администраторы могут включать и отключать каждую из них независимо." },
      { title: "Честно о покрытии", text: "Недоступные или ненастроенные проверки так и помечаются и снижают показатель покрытия; они никогда не выдаются за чистые." },
    ],
  },
  uz: {
    metaTitle: "Imkoniyatlar",
    metaDescription: "Sakkizta tahlil moduli, shaffof dalillar va himoyalangan tekshiruv muhiti (sandbox).",
    heroEyebrow: "Imkoniyatlar",
    heroTitle: { before: "", highlight: "Xavfsizlik xizmati", after: " darajasidagi chuqur tahlil" },
    heroSubtitle: "Innova Checker har bir havolani sakkizta ixtisoslashgan modulda tekshiradi va nima topilganini aniq tushuntirib beradi.",
    platformEyebrow: "Platforma",
    platformTitle: "Xavfsizlik jamoalari ishonishi uchun yaratilgan",
    platform: [
      { title: "0–100 xavf bali", text: "Topilmalar ahamiyatiga qarab yagona ballga va xulosaga jamlanadi: «Xavfsiz», «Past xavf», «Shubhali», «Yuqori xavf», «Firibgarlik» yoki «Aniqlanmadi»." },
      { title: "Har bir tekshiruv uchun dalil", text: "Har bir tekshiruvning holati, natijasi, izohi, xom dalillari, ma’lumot manbai va vaqti saqlanadi, shuning uchun tahlilchilar istalgan xulosani qayta tekshira oladi." },
      { title: "SSRF hujumlaridan himoyalangan muhit", text: "Xususiy, loopback, link-local va bulut metama’lumotlari manzillari DNS so‘rovi bosqichidayoq rad etiladi; har bir yo‘naltirish alohida tekshiriladi." },
      { title: "Fayllar hech qachon ishga tushirilmaydi", text: "Fayllar faqat xotirada oqim tarzida SHA-256 va signatura bo‘yicha tekshiriladi: ular diskka yozilmaydi, ochilmaydi va ishga tushirilmaydi." },
      { title: "Modulli manba adapterlari", text: "Tahdidlar bazalari adapterlar orqali ulanadi va administratorlar ularning har birini alohida yoqishi yoki o‘chirishi mumkin." },
      { title: "Qamrovni halol ko‘rsatamiz", text: "Ishlamagan yoki sozlanmagan tekshiruvlar aynan shunday belgilanadi va qamrov ko‘rsatkichini pasaytiradi; ular hech qachon «toza» deb ko‘rsatilmaydi." },
    ],
  },
});

type HowItWorksText = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  pipelineEyebrow: string;
  pipelineTitle: string;
  stageDetails: Record<Stage, string>;
};

/** /how-it-works page. Stage names come from verdictText (stageLabel). */
export const howItWorksText = defineMessages<HowItWorksText>({
  en: {
    metaTitle: "How it works",
    metaDescription: "What happens when you submit a link to Innova Checker.",
    heroEyebrow: "How it works",
    heroTitle: "Three steps for your team, seven stages for our engine",
    heroSubtitle: "You paste a link. Innova Checker does the risky part on its own infrastructure and returns a transparent, evidence-backed report.",
    pipelineEyebrow: "Inside a scan",
    pipelineTitle: "The analysis pipeline",
    stageDetails: {
      validate: "The link is parsed and normalised. Defanged links are restored, non-web schemes are refused and internal or private destinations are rejected before any network activity.",
      domain: "DNS is queried for A, AAAA, CNAME, MX, NS, TXT, CAA and SOA records, including SPF and DMARC. Addresses pointing into private networks are flagged.",
      reputation: "Registration data is fetched over RDAP (WHOIS for ccTLDs without RDAP). Domain age, registry holds and administrator-defined suspicious patterns are evaluated.",
      redirects: "The isolated fetcher follows HTTP and meta-refresh redirects one hop at a time, re-checking every destination against the network policy and size/time limits.",
      ssl: "A separate TLS handshake reads the certificate chain, expiry, hostname coverage, issuer and negotiated protocol.",
      content: "The final page is parsed statically for forms, scripts, iframes, brand claims and exfiltration endpoints. File downloads are fingerprinted and classified by signature.",
      intel: "Configured threat-intelligence providers are queried with the URL, final destination, server IPs and file hash. Results are combined into the score and verdict.",
    },
  },
  ru: {
    metaTitle: "Как это работает",
    metaDescription: "Что происходит после того, как вы отправляете ссылку в Innova Checker.",
    heroEyebrow: "Как это работает",
    heroTitle: "Три шага для вашей команды, семь этапов для нашей системы",
    heroSubtitle: "Вы вставляете ссылку. Всю рискованную часть Innova Checker выполняет на своей инфраструктуре и возвращает прозрачный отчёт, подкреплённый доказательствами.",
    pipelineEyebrow: "Внутри проверки",
    pipelineTitle: "Этапы анализа",
    stageDetails: {
      validate: "Ссылка разбирается и приводится к стандартному виду. Обезвреженные (defanged) ссылки восстанавливаются, не веб-схемы отклоняются, а внутренние и частные адреса блокируются ещё до любого сетевого обращения.",
      domain: "В DNS запрашиваются записи A, AAAA, CNAME, MX, NS, TXT, CAA и SOA, включая SPF и DMARC. Адреса, указывающие во внутренние сети, помечаются.",
      reputation: "Регистрационные данные запрашиваются по RDAP (для национальных доменов без RDAP — через WHOIS). Оцениваются возраст домена, блокировки со стороны реестра и подозрительные шаблоны, заданные администратором.",
      redirects: "Изолированный загрузчик проходит HTTP- и meta-refresh-перенаправления по одному шагу и каждый раз заново сверяет адрес назначения с сетевой политикой и ограничениями по размеру и времени.",
      ssl: "Отдельное TLS-соединение считывает цепочку сертификатов, срок действия, соответствие имени хоста, издателя и согласованный протокол.",
      content: "Итоговая страница статически анализируется: формы, скрипты, iframe, имитация брендов и адреса для утечки данных. Для скачиваемых файлов вычисляется отпечаток, и они классифицируются по сигнатуре.",
      intel: "По подключённым базам угроз проверяются URL, конечный адрес, IP-адреса сервера и хеш файла. Результаты объединяются в оценку и вердикт.",
    },
  },
  uz: {
    metaTitle: "Qanday ishlaydi",
    metaDescription: "Havolani Innova Checker orqali tekshirganingizda nima sodir bo‘ladi.",
    heroEyebrow: "Qanday ishlaydi",
    heroTitle: "Jamoangiz uchun uch qadam, tizimimiz uchun yetti bosqich",
    heroSubtitle: "Siz havolani joylashtirasiz. Xavfli qismini Innova Checker o‘z infratuzilmasida bajaradi va dalillarga asoslangan shaffof hisobot qaytaradi.",
    pipelineEyebrow: "Tekshiruv ichida",
    pipelineTitle: "Tahlil bosqichlari",
    stageDetails: {
      validate: "Havola tahlil qilinib, standart ko‘rinishga keltiriladi. Zararsizlantirilgan (defanged) havolalar tiklanadi, veb bo‘lmagan sxemalar rad etiladi, ichki yoki xususiy manzillar esa hech qanday tarmoq so‘rovidan oldin bloklanadi.",
      domain: "DNS orqali A, AAAA, CNAME, MX, NS, TXT, CAA va SOA yozuvlari, jumladan SPF va DMARC so‘raladi. Xususiy tarmoqlarga yo‘naltirilgan manzillar belgilab qo‘yiladi.",
      reputation: "Ro‘yxatdan o‘tkazish ma’lumotlari RDAP orqali olinadi (RDAP qo‘llab-quvvatlanmaydigan milliy domenlar uchun — WHOIS orqali). Domen yoshi, reyestr cheklovlari va administrator belgilagan shubhali shablonlar baholanadi.",
      redirects: "Izolyatsiyalangan yuklovchi HTTP va meta-refresh yo‘naltirishlaridan birma-bir o‘tadi va har bir yangi manzilni tarmoq siyosati hamda hajm va vaqt cheklovlari bo‘yicha qayta tekshiradi.",
      ssl: "Alohida TLS ulanishi orqali sertifikatlar zanjiri, amal qilish muddati, xost nomiga mosligi, sertifikat beruvchi va kelishilgan protokol o‘qiladi.",
      content: "Yakuniy sahifa statik tahlil qilinadi: formalar, skriptlar, iframe elementlari, brendlarga taqlid va ma’lumot sizdiriladigan manzillar aniqlanadi. Yuklab olinadigan fayllarning izi olinadi va signatura bo‘yicha turkumlanadi.",
      intel: "Sozlangan tahdidlar bazalarida URL, yakuniy manzil, server IP manzillari va fayl xeshi tekshiriladi. Natijalar ball va xulosaga birlashtiriladi.",
    },
  },
});

type AboutText = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: HighlightTitle;
  heroSubtitle: string;
  /** Same order as the icons in about/page.tsx. */
  values: Card[];
  closing: string;
};

/** /about page. */
export const aboutText = defineMessages<AboutText>({
  en: {
    metaTitle: "About",
    metaDescription: "Innova Checker is built by Innova Networks for logistics companies.",
    heroEyebrow: "About",
    heroTitle: { before: "Security built by people who ", highlight: "know logistics", after: "" },
    heroSubtitle: "Phishing aimed at freight teams is relentless: fake tracking pages, poisoned waybills, customs-fee scams and stolen load-board accounts. We built Innova Checker to stop it.",
    values: [
      { title: "Our mission", text: "Give every person in a logistics company a fast, trustworthy way to check a link before they click it, so a single message can no longer compromise a business." },
      { title: "Who we serve", text: "Freight forwarders, trucking and dispatch companies, customs brokers and the accounting and sales teams that work with them, in Uzbekistan and abroad." },
      { title: "Who we are", text: "Innova Networks is a Tashkent-based technology and security company. Innova Checker grew out of the protection we build for logistics offices every day." },
    ],
    closing:
      "Innova Checker is designed with the same rules we apply to our own infrastructure: least privilege, isolation of untrusted content, full audit trails and honest reporting. We never present a check as done when it was not.",
  },
  ru: {
    metaTitle: "О нас",
    metaDescription: "Innova Checker создан компанией Innova Networks для логистических компаний.",
    heroEyebrow: "О нас",
    heroTitle: { before: "Безопасность от тех, кто ", highlight: "знает логистику", after: "" },
    heroSubtitle: "Фишинг против логистических команд не прекращается: поддельные страницы отслеживания груза, заражённые накладные, мошенничество с таможенными платежами и украденные аккаунты на биржах грузов. Мы создали Innova Checker, чтобы это остановить.",
    values: [
      { title: "Наша миссия", text: "Дать каждому сотруднику логистической компании быстрый и надёжный способ проверить ссылку до того, как он по ней перейдёт, чтобы одно сообщение больше не могло поставить бизнес под угрозу." },
      { title: "Кому мы помогаем", text: "Экспедиторам, транспортным и диспетчерским компаниям, таможенным брокерам, а также бухгалтерии и отделам продаж, которые с ними работают, — в Узбекистане и за рубежом." },
      { title: "Кто мы", text: "Innova Networks — технологическая компания в сфере информационной безопасности из Ташкента. Innova Checker вырос из защиты, которую мы каждый день выстраиваем для логистических офисов." },
    ],
    closing:
      "Innova Checker построен по тем же правилам, что и наша собственная инфраструктура: минимальные привилегии, изоляция недоверенного содержимого, полный журнал аудита и честная отчётность. Мы никогда не выдаём проверку за выполненную, если она не была выполнена.",
  },
  uz: {
    metaTitle: "Biz haqimizda",
    metaDescription: "Innova Checker — Innova Networks tomonidan logistika kompaniyalari uchun yaratilgan xizmat.",
    heroEyebrow: "Biz haqimizda",
    heroTitle: { before: "", highlight: "Logistikani yaxshi biladigan", after: " jamoa yaratgan xavfsizlik" },
    heroSubtitle: "Yuk tashish jamoalariga qarshi fishing hujumlari to‘xtamaydi: soxta yuk kuzatuv sahifalari, zararli yuk xatlari, bojxona to‘lovlari bilan bog‘liq firibgarlik va o‘g‘irlangan yuk birjasi akkauntlari. Innova Checker aynan shunga chek qo‘yish uchun yaratilgan.",
    values: [
      { title: "Bizning maqsadimiz", text: "Logistika kompaniyasidagi har bir xodimga havolani ochishdan oldin uni tez va ishonchli tekshirish imkonini berish, toki birgina xabar butun biznesni xavf ostiga qo‘ya olmasin." },
      { title: "Kimlar uchun ishlaymiz", text: "Ekspeditorlik, yuk tashish va dispetcherlik kompaniyalari, bojxona brokerlari hamda ular bilan ishlaydigan buxgalteriya va savdo bo‘limlari uchun — O‘zbekistonda va xorijda." },
      { title: "Biz kimmiz", text: "Innova Networks — Toshkentdagi texnologiya va kiberxavfsizlik kompaniyasi. Innova Checker biz har kuni logistika ofislari uchun quradigan himoya tizimlari asosida yaratilgan." },
    ],
    closing:
      "Innova Checker o‘z infratuzilmamizda qo‘llaydigan qoidalar asosida yaratilgan: minimal huquqlar, ishonchsiz kontentni izolyatsiya qilish, to‘liq audit jurnali va halol hisobot. Biz bajarilmagan tekshiruvni hech qachon bajarilgan deb ko‘rsatmaymiz.",
  },
});
