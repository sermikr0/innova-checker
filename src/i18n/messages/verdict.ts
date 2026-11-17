import { defineMessages } from "../config";

type Verdict = "TRUSTED" | "SAFE" | "LOW_RISK" | "SUSPICIOUS" | "HIGH_RISK" | "MALICIOUS" | "INCONCLUSIVE";
type Status = "PASS" | "INFO" | "WARN" | "FAIL" | "ERROR" | "UNAVAILABLE" | "NOT_CONFIGURED" | "SKIPPED";
type Severity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Intel = "CLEAN" | "MALICIOUS" | "SUSPICIOUS" | "UNKNOWN" | "NOT_CONFIGURED" | "DISABLED" | "UNAVAILABLE" | "ERROR";
type Stage = "validate" | "domain" | "reputation" | "redirects" | "ssl" | "content" | "intel";

type VerdictText = {
  label: Record<Verdict, string>;
  tagline: Record<Verdict, string>;
  notice: Record<Verdict, string>;
  blacklistLabel: string;
  blacklistTagline: string;
  blacklistNotice: string;
  deadLinkTagline: string;
  deadLinkNotice: string;
  checkStatus: Record<Status, string>;
  severity: Record<Severity, string>;
  intelStatus: Record<Intel, string>;
  stages: Record<Stage, string>;
};

/** Verdict labels, taglines and warnings shown with every result. */
export const verdictText = defineMessages<VerdictText>({
  en: {
    label: { TRUSTED: "Trusted", SAFE: "Safe", LOW_RISK: "Low Risk", SUSPICIOUS: "Suspicious", HIGH_RISK: "High Risk", MALICIOUS: "Scam", INCONCLUSIVE: "Inconclusive" },
    tagline: { TRUSTED: "Verified official domain", SAFE: "No threats detected", LOW_RISK: "Minor observations only", SUSPICIOUS: "Verify before opening", HIGH_RISK: "Treat as dangerous", MALICIOUS: "Do not open", INCONCLUSIVE: "Could not be fully analyzed" },
    notice: {
      TRUSTED: "Domain trusted, but stay alert at the next steps: if this site redirects you to another website or starts a file download, check that new link again.",
      SAFE: "No threats found, but stay alert: if the site redirects you to another website or starts a file download, check that new link again.",
      LOW_RISK: "Only minor issues found. If the site redirects you elsewhere, asks for your password or starts a download, check again before continuing.",
      SUSPICIOUS: "Suspicious link: do not enter passwords or payment details and do not open downloads until the sender is verified.",
      HIGH_RISK: "High risk: this link shows strong signs of a scam. Do not open it or enter any information.",
      MALICIOUS: "SCAM: this link is malicious. Do not open it and do not enter any information.",
      INCONCLUSIVE: "Could not verify this link. Treat it as unsafe until you confirm it with the sender.",
    },
    blacklistLabel: "100% Scam",
    blacklistTagline: "On the Innova scam blacklist",
    blacklistNotice: "100% SCAM: this address is on the Innova blacklist of confirmed phishing and scam sites. Do not open it, do not enter any information and do not download anything from it.",
    deadLinkTagline: "This address does not exist on the internet",
    deadLinkNotice: "Dead link: this address does not exist on the internet, so there is nothing to open. If it came in a message, do not trust it and confirm the exact link with the sender.",
    checkStatus: { PASS: "Pass", INFO: "Info", WARN: "Warning", FAIL: "Fail", ERROR: "Error", UNAVAILABLE: "Unavailable", NOT_CONFIGURED: "Not configured", SKIPPED: "Skipped" },
    severity: { CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low", NONE: "Info" },
    intelStatus: { CLEAN: "Clean", MALICIOUS: "Malicious", SUSPICIOUS: "Suspicious", UNKNOWN: "Unknown", NOT_CONFIGURED: "Not configured", DISABLED: "Disabled", UNAVAILABLE: "Unavailable", ERROR: "Error" },
    stages: { validate: "Validating URL", domain: "Analyzing domain", reputation: "Checking domain reputation", redirects: "Inspecting redirects", ssl: "Checking SSL certificate", content: "Analyzing website content", intel: "Checking threat intelligence" },
  },
  ru: {
    label: { TRUSTED: "Доверенный", SAFE: "Безопасно", LOW_RISK: "Низкий риск", SUSPICIOUS: "Подозрительно", HIGH_RISK: "Высокий риск", MALICIOUS: "Мошенничество", INCONCLUSIVE: "Не определено" },
    tagline: { TRUSTED: "Проверенный официальный домен", SAFE: "Угроз не обнаружено", LOW_RISK: "Только незначительные замечания", SUSPICIOUS: "Проверьте, прежде чем открывать", HIGH_RISK: "Считайте опасной", MALICIOUS: "Не открывайте", INCONCLUSIVE: "Не удалось полностью проанализировать" },
    notice: {
      TRUSTED: "Домен доверенный, но будьте внимательны дальше: если сайт перенаправит вас на другой сайт или начнёт скачивание файла, проверьте новую ссылку ещё раз.",
      SAFE: "Угроз не найдено, но будьте внимательны: если сайт перенаправит вас на другой сайт или начнёт скачивание файла, проверьте новую ссылку ещё раз.",
      LOW_RISK: "Найдены лишь незначительные проблемы. Если сайт перенаправит вас, попросит пароль или начнёт скачивание, проверьте ещё раз, прежде чем продолжать.",
      SUSPICIOUS: "Подозрительная ссылка: не вводите пароли и платёжные данные и не открывайте загрузки, пока не убедитесь в отправителе.",
      HIGH_RISK: "Высокий риск: у ссылки явные признаки мошенничества. Не открывайте её и не вводите никаких данных.",
      MALICIOUS: "МОШЕННИЧЕСТВО: это вредоносная ссылка. Не открывайте её и не вводите никаких данных.",
      INCONCLUSIVE: "Не удалось проверить ссылку. Считайте её небезопасной, пока не подтвердите у отправителя.",
    },
    blacklistLabel: "100% мошенничество",
    blacklistTagline: "В чёрном списке мошенников Innova",
    blacklistNotice: "100% МОШЕННИЧЕСТВО: этот адрес находится в чёрном списке Innova — подтверждённых фишинговых и мошеннических сайтов. Не открывайте его, не вводите никаких данных и ничего с него не скачивайте.",
    deadLinkTagline: "Такого адреса в интернете не существует",
    deadLinkNotice: "Несуществующая ссылка: такого адреса в интернете нет, открывать нечего. Если ссылка пришла в сообщении, не доверяйте ей и уточните точный адрес у отправителя.",
    checkStatus: { PASS: "Пройдено", INFO: "Инфо", WARN: "Внимание", FAIL: "Не пройдено", ERROR: "Ошибка", UNAVAILABLE: "Недоступно", NOT_CONFIGURED: "Не настроено", SKIPPED: "Пропущено" },
    severity: { CRITICAL: "Критично", HIGH: "Высокий", MEDIUM: "Средний", LOW: "Низкий", NONE: "Инфо" },
    intelStatus: { CLEAN: "Чисто", MALICIOUS: "Вредоносно", SUSPICIOUS: "Подозрительно", UNKNOWN: "Неизвестно", NOT_CONFIGURED: "Не настроено", DISABLED: "Отключено", UNAVAILABLE: "Недоступно", ERROR: "Ошибка" },
    stages: { validate: "Проверка адреса", domain: "Анализ домена", reputation: "Проверка репутации домена", redirects: "Проверка перенаправлений", ssl: "Проверка SSL-сертификата", content: "Анализ содержимого сайта", intel: "Проверка по базам угроз" },
  },
  uz: {
    label: { TRUSTED: "Ishonchli", SAFE: "Xavfsiz", LOW_RISK: "Past xavf", SUSPICIOUS: "Shubhali", HIGH_RISK: "Yuqori xavf", MALICIOUS: "Firibgarlik", INCONCLUSIVE: "Aniqlanmadi" },
    tagline: { TRUSTED: "Tasdiqlangan rasmiy domen", SAFE: "Tahdid aniqlanmadi", LOW_RISK: "Faqat kichik kamchiliklar", SUSPICIOUS: "Ochishdan oldin tekshiring", HIGH_RISK: "Xavfli deb hisoblang", MALICIOUS: "Ochmang", INCONCLUSIVE: "To‘liq tahlil qilib bo‘lmadi" },
    notice: {
      TRUSTED: "Domen ishonchli, lekin keyingi qadamlarda ehtiyot bo‘ling: agar sayt sizni boshqa saytga yo‘naltirsa yoki fayl yuklab olishni boshlasa, o‘sha yangi havolani yana tekshiring.",
      SAFE: "Tahdid topilmadi, lekin ehtiyot bo‘ling: agar sayt sizni boshqa saytga yo‘naltirsa yoki fayl yuklab olishni boshlasa, o‘sha yangi havolani yana tekshiring.",
      LOW_RISK: "Faqat kichik kamchiliklar topildi. Agar sayt sizni boshqa joyga yo‘naltirsa, parolingizni so‘rasa yoki yuklab olishni boshlasa, davom etishdan oldin yana tekshiring.",
      SUSPICIOUS: "Shubhali havola: yuboruvchi tasdiqlanmaguncha parol yoki to‘lov ma’lumotlarini kiritmang va yuklab olingan fayllarni ochmang.",
      HIGH_RISK: "Yuqori xavf: bu havolada firibgarlikning kuchli belgilari bor. Uni ochmang va hech qanday ma’lumot kiritmang.",
      MALICIOUS: "FIRIBGARLIK: bu havola zararli. Uni ochmang va hech qanday ma’lumot kiritmang.",
      INCONCLUSIVE: "Bu havolani tekshirib bo‘lmadi. Yuboruvchi bilan tasdiqlamaguningizcha uni xavfli deb hisoblang.",
    },
    blacklistLabel: "100% firibgarlik",
    blacklistTagline: "Innova firibgarlar qora ro‘yxatida",
    blacklistNotice: "100% FIRIBGARLIK: bu manzil Innova qora ro‘yxatida — tasdiqlangan fishing va firibgar saytlar qatorida. Uni ochmang, hech qanday ma’lumot kiritmang va undan hech narsa yuklab olmang.",
    deadLinkTagline: "Bunday manzil internetda mavjud emas",
    deadLinkNotice: "Mavjud bo‘lmagan havola: bunday manzil internetda yo‘q, ochadigan narsa yo‘q. Agar u xabarda kelgan bo‘lsa, unga ishonmang va aniq havolani yuboruvchidan so‘rang.",
    checkStatus: { PASS: "O‘tdi", INFO: "Ma’lumot", WARN: "Ogohlantirish", FAIL: "O‘tmadi", ERROR: "Xato", UNAVAILABLE: "Mavjud emas", NOT_CONFIGURED: "Sozlanmagan", SKIPPED: "O‘tkazib yuborildi" },
    severity: { CRITICAL: "Kritik", HIGH: "Yuqori", MEDIUM: "O‘rta", LOW: "Past", NONE: "Ma’lumot" },
    intelStatus: { CLEAN: "Toza", MALICIOUS: "Zararli", SUSPICIOUS: "Shubhali", UNKNOWN: "Noma’lum", NOT_CONFIGURED: "Sozlanmagan", DISABLED: "O‘chirilgan", UNAVAILABLE: "Mavjud emas", ERROR: "Xato" },
    stages: { validate: "Havola tekshirilmoqda", domain: "Domen tahlil qilinmoqda", reputation: "Domen obro‘si tekshirilmoqda", redirects: "Yo‘naltirishlar tekshirilmoqda", ssl: "SSL sertifikati tekshirilmoqda", content: "Sayt mazmuni tahlil qilinmoqda", intel: "Tahdidlar bazalari tekshirilmoqda" },
  },
});
