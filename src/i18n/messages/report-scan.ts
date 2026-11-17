import { defineMessages } from "../config";

// Scan progress screen, pending / failed states and the risk gauge
// (components/scan/scan-progress.tsx, scan-pending.tsx, scan-failed.tsx, verdict.tsx).
// Stage names come from lib/verdict.ts (stageLabel).

type Stage = "validate" | "domain" | "reputation" | "redirects" | "ssl" | "content" | "intel";

type ScanText = {
  metaTitle: string;
  /** Terminal-style log line printed when a stage finishes. */
  stageLog: Record<Stage, string>;
  queued: string;
  analyzing: string;
  seconds: (s: string) => string;
  complete: string;
  stageDone: string;
  stageRunning: string;
  stageQueued: string;
  waitingForWorker: string;
  isolated: string;
  noScripts: string;
  browserSafe: string;
  lostTrack: string;
  startNew: string;
  failedTitle: string;
  failedDefault: string;
  failedNote: string;
  scanAnother: string;
  gaugeLabel: (score: number, verdict: string) => string;
};

export const scanText = defineMessages<ScanText>({
  en: {
    metaTitle: "Security report",
    stageLog: {
      validate: "URL parsed, normalized and checked against SSRF policy",
      domain: "DNS records resolved (A, AAAA, MX, NS, TXT, CAA)",
      reputation: "Registration data and reputation lists evaluated",
      redirects: "Redirect chain followed in isolated fetcher",
      ssl: "TLS handshake completed, certificate inspected",
      content: "Page content and downloads analyzed statically",
      intel: "Threat-intelligence providers consulted",
    },
    queued: "Queued for analysis",
    analyzing: "Analyzing",
    seconds: (s) => `${s}s`,
    complete: "complete",
    stageDone: "Done",
    stageRunning: "Running",
    stageQueued: "Queued",
    waitingForWorker: "(waiting for a free worker)",
    isolated: "Isolated server-side scan",
    noScripts: "No scripts executed",
    browserSafe: "Your browser never opens the link",
    lostTrack: "We lost track of this scan.",
    startNew: "Start a new scan",
    failedTitle: "The scan could not be completed",
    failedDefault: "An unexpected error occurred while analyzing this URL.",
    failedNote: "A failed scan is not a verdict. Do not treat the link as safe.",
    scanAnother: "Scan Another URL",
    gaugeLabel: (score, verdict) => `Risk score ${score} of 100, ${verdict}`,
  },
  ru: {
    metaTitle: "Отчёт о безопасности",
    stageLog: {
      validate: "Адрес разобран, нормализован и проверен по политике SSRF",
      domain: "DNS-записи получены (A, AAAA, MX, NS, TXT, CAA)",
      reputation: "Регистрационные данные и списки репутации проверены",
      redirects: "Цепочка перенаправлений пройдена в изолированной среде",
      ssl: "TLS-рукопожатие выполнено, сертификат проверен",
      content: "Содержимое страницы и загрузки проанализированы статически",
      intel: "Базы угроз проверены",
    },
    queued: "В очереди на анализ",
    analyzing: "Идёт анализ",
    seconds: (s) => `${s} с`,
    complete: "готово",
    stageDone: "Готово",
    stageRunning: "Выполняется",
    stageQueued: "В очереди",
    waitingForWorker: "(ожидание свободного обработчика)",
    isolated: "Изолированная проверка на сервере",
    noScripts: "Скрипты не выполняются",
    browserSafe: "Ваш браузер не открывает ссылку",
    lostTrack: "Мы потеряли связь с этой проверкой.",
    startNew: "Начать новую проверку",
    failedTitle: "Не удалось завершить проверку",
    failedDefault: "При анализе этой ссылки произошла непредвиденная ошибка.",
    failedNote: "Неудачная проверка — это не вердикт. Не считайте ссылку безопасной.",
    scanAnother: "Проверить другую ссылку",
    gaugeLabel: (score, verdict) => `Оценка риска ${score} из 100, ${verdict}`,
  },
  uz: {
    metaTitle: "Xavfsizlik hisoboti",
    stageLog: {
      validate: "Havola tahlil qilindi, normallashtirildi va SSRF siyosati bo‘yicha tekshirildi",
      domain: "DNS yozuvlari olindi (A, AAAA, MX, NS, TXT, CAA)",
      reputation: "Ro‘yxatdan o‘tish ma’lumotlari va obro‘ ro‘yxatlari baholandi",
      redirects: "Yo‘naltirishlar zanjiri izolyatsiyalangan muhitda kuzatildi",
      ssl: "TLS ulanishi o‘rnatildi, sertifikat tekshirildi",
      content: "Sahifa mazmuni va yuklanmalar statik tahlil qilindi",
      intel: "Tahdidlar bazalari tekshirildi",
    },
    queued: "Tahlil navbatida",
    analyzing: "Tahlil qilinmoqda",
    seconds: (s) => `${s} s`,
    complete: "bajarildi",
    stageDone: "Tayyor",
    stageRunning: "Bajarilmoqda",
    stageQueued: "Navbatda",
    waitingForWorker: "(bo‘sh ishlovchi kutilmoqda)",
    isolated: "Serverda izolyatsiyalangan tekshiruv",
    noScripts: "Skriptlar ishga tushirilmaydi",
    browserSafe: "Brauzeringiz havolani ochmaydi",
    lostTrack: "Bu tekshiruv holatini kuzatib bo‘lmadi.",
    startNew: "Yangi tekshiruv boshlash",
    failedTitle: "Tekshiruvni yakunlab bo‘lmadi",
    failedDefault: "Bu havolani tahlil qilishda kutilmagan xato yuz berdi.",
    failedNote: "Muvaffaqiyatsiz tekshiruv — bu xulosa emas. Havolani xavfsiz deb hisoblamang.",
    scanAnother: "Boshqa havolani tekshirish",
    gaugeLabel: (score, verdict) => `Xavf balli ${score}/100, ${verdict}`,
  },
});
