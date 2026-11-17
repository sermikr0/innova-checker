import { defineMessages } from "../config";
import type { LegalDoc } from "./legal-types";

const en: LegalDoc = {
  metaTitle: "Terms of Use",
  metaDescription: "Terms of Use of Innova Checker: how the link-checking service works, its limits, and the limitation of liability of Innova Networks.",
  eyebrow: "Legal",
  title: "Terms of Use",
  subtitle: "Please read these Terms carefully. They explain what Innova Checker can and cannot do, and limit our liability.",
  updated: "Version 2026-11-17 · effective 17 November 2026",
  summaryTitle: "The most important points",
  summary: [
    "Innova Checker gives an automated assessment of a link at the moment of the check. No service can detect every threat, and a link can change after it was checked.",
    "A “Trusted”, “Safe” or “Low risk” verdict is NOT a guarantee that a link, website, file, sender or payment request is safe or genuine.",
    "Innova Networks, the Innova Checker platform, its owners and administrators are NOT liable if you are hacked, infected, defrauded or suffer any other loss after opening a link — including a link our service rated as safe.",
    "You alone decide whether to open a link, enter information, download a file or make a payment. Always verify payment requests and changed bank details through an independent channel.",
    "Before your first check you give your real first and last name and an e-mail address that you confirm with a code. We keep a record of your acceptance of these Terms.",
  ],
  sections: [
    {
      id: "about",
      title: "1. About these Terms",
      paragraphs: [
        "These Terms of Use (the “Terms”) govern your use of Innova Checker — the website urlchecker.uz, its user and administrator areas, its API and all related services (together, the “Service” or the “Platform”). The Service is operated by Innova Networks, Tashkent, Republic of Uzbekistan (“Innova Networks”, “we”, “us”, “our”).",
        "These Terms are a binding agreement between you and Innova Networks. If you use the Service on behalf of a company or another organisation, you confirm that you are authorised to accept these Terms on its behalf, and “you” also means that organisation.",
      ],
    },
    {
      id: "acceptance",
      title: "2. Acceptance of the Terms",
      paragraphs: [
        "You accept these Terms by ticking the box “I have read and accept the Terms of Use and the Privacy Policy” and confirming your details, or by creating an account, or by otherwise using the Service. If you do not agree with any part of these Terms, do not use the Service.",
        "Your electronic acceptance has the same legal effect as a handwritten signature to the extent permitted by the legislation of the Republic of Uzbekistan. As evidence of acceptance we record the date and time, the version of the Terms, the interface language, your first and last name, your e-mail address and whether it was confirmed, your IP address and country, your browser and a device identifier.",
      ],
    },
    {
      id: "definitions",
      title: "3. Definitions",
      paragraphs: ["In these Terms:"],
      items: [
        "“Check” — one submission of a link (URL) to the Service for automated analysis.",
        "“Report” — the result of a Check: the verdict, the risk score, the individual findings and the related explanations.",
        "“Verdict” — the overall rating shown in a Report: Trusted, Safe, Low risk, Suspicious, High risk, Scam (including “100% Scam” for addresses on our blacklist) or Inconclusive.",
        "“User” — any person who uses the Service, with or without an account; “Visitor” — a User without an account.",
        "“Third-party sources” — external threat-intelligence providers, public phishing and malware lists, domain registries and other data sources the Service relies on.",
      ],
    },
    {
      id: "service",
      title: "4. What the Service does",
      paragraphs: [
        "The Service analyses a submitted link automatically, without opening it in your browser. Depending on configuration, it examines the structure of the address, domain registration data, DNS records, the TLS/SSL certificate, redirects, the content of the page, file downloads, Third-party sources and the Innova database of verified and blacklisted domains, and combines the findings into a Verdict and a risk score.",
        "The Service may be offered free of charge within limits we set, or under a paid subscription. We may add, change or remove features, analysis modules, Third-party sources and limits at any time.",
      ],
    },
    {
      id: "limits",
      title: "5. Nature and limits of the results",
      paragraphs: [
        "Every Report is an automated, probabilistic assessment made at the moment of the Check, based only on the information available to the Service at that moment. It is decision support, not a statement of fact.",
        "No automated service can detect every threat. In particular, attackers may:",
      ],
      items: [
        "show harmless content to scanners and malicious content to real victims (cloaking), or target only certain countries, devices, browsers or times;",
        "use newly registered domains, or hijacked pages on legitimate and well-known websites;",
        "activate a malicious page or file only after a delay, after the Check, or only once;",
        "hide malicious content behind logins, CAPTCHAs, forms, scripts or further links;",
        "change the content of a link at any moment, so that a link that was clean during the Check becomes malicious afterwards;",
        "rely on social engineering — a fake invoice, a changed bank account, a forged load or payment request — which a technical check of the link cannot reveal.",
      ],
      after: [
        "Therefore a “Trusted”, “Safe” or “Low risk” Verdict, or the absence of warnings, means only that the Service did not find signs of danger at the time of the Check. It is NOT a guarantee, certification, warranty or recommendation that the link, the website, any file, the sender or any transaction is safe, lawful or genuine.",
        "Verdicts such as “Scam”, “High risk” or “Suspicious” may occasionally be wrong (false positives). Data from Third-party sources may be incomplete, delayed or incorrect, and we do not control it.",
        "The Service does not replace your own judgement, your organisation’s security policies, antivirus and endpoint protection, verification of the sender through an independent channel, or professional advice.",
      ],
    },
    {
      id: "responsibilities",
      title: "6. Your responsibilities",
      paragraphs: ["When you use the Service you agree that:"],
      items: [
        "you alone decide whether to open a link, enter any information, download or run a file, or make a payment, and you bear the consequences of that decision;",
        "you will never enter passwords, codes or payment details on a website only because the Service rated it as safe;",
        "you will verify every payment request, change of bank details and unusual instruction by calling the sender on a number you already know — this is the most common fraud in logistics;",
        "you will keep your operating system, browser and security software up to date, and follow your organisation’s security rules;",
        "you will report suspected incidents to your IT or security team and, where appropriate, to the competent authorities without delay;",
        "you will keep your account credentials and devices secure and are responsible for all activity under your account and on your devices.",
      ],
    },
    {
      id: "warranty",
      title: "7. No warranties",
      paragraphs: [
        "The Service and all Reports are provided “as is” and “as available”. To the maximum extent permitted by applicable law, Innova Networks gives no warranties of any kind, express or implied, including warranties of accuracy, completeness, timeliness, fitness for a particular purpose, uninterrupted or error-free operation, or that the Service will detect every threat.",
      ],
    },
    {
      id: "liability",
      title: "8. Limitation of liability",
      paragraphs: [
        "8.1. To the maximum extent permitted by the legislation of the Republic of Uzbekistan, Innova Networks, the Innova Checker platform, its owners, founders, directors, officers, employees, administrators, contractors, partners and data providers (the “Innova parties”) are not liable for any direct, indirect, incidental, special, consequential or punitive damage or loss arising out of or in connection with the use of the Service or of its Reports, or the inability to use them, including in particular:",
      ],
      items: [
        "hacking, unauthorised access to or takeover of your accounts, e-mail, messengers, devices, networks or systems;",
        "infection with viruses, ransomware, spyware or other malicious software;",
        "theft, loss, leakage, encryption or corruption of personal, commercial or any other data;",
        "financial loss, including fraudulent payments and transfers, lost or stolen cargo, lost profit, revenue, contracts or business opportunities;",
        "business interruption, damage to reputation, fines, and claims of third parties.",
      ],
      after: [
        "8.2. This applies EVEN IF the damage was caused by a link that the Service rated “Trusted”, “Safe”, “Low risk” or “Inconclusive”, or did not flag at all, and even if the Innova parties were told that such damage was possible. You use the Service and act on its Reports entirely at your own risk.",
        "8.3. Where liability cannot be excluded by law, the total liability of the Innova parties for all claims together is limited to the amount you actually paid for the Service during the three (3) months before the event that gave rise to the claim. For free use of the Service the Innova parties bear no liability, to the extent permitted by law.",
        "8.4. Nothing in these Terms limits liability that cannot be limited under applicable law, such as liability for intentional wrongdoing.",
      ],
    },
    {
      id: "indemnity",
      title: "9. Indemnification",
      paragraphs: [
        "You agree to compensate the Innova parties for any losses, costs (including reasonable legal costs) and claims of third parties that arise from your breach of these Terms, your misuse of the Service, or your violation of the law or of the rights of others.",
      ],
    },
    {
      id: "acceptable-use",
      title: "10. Acceptable use",
      paragraphs: ["You must not:"],
      items: [
        "use the Service to attack, probe, overload or gain unauthorised access to any system, or to test malicious links you created;",
        "bypass or try to bypass free-check limits, device limits, e-mail verification or other restrictions — for example with false names or e-mail addresses, multiple identities, automated tools or changing networks;",
        "submit links in bulk with scripts or bots, or copy the Service’s data, except through an API access we granted to you;",
        "attack, reverse-engineer, disrupt or test the security of the Platform without our written permission;",
        "submit links whose disclosure is unlawful or breaches confidentiality obligations you owe to others;",
        "resell or publish Reports as your own service, or use them to make false statements about third parties, without our written permission.",
      ],
      after: ["We may restrict, suspend or terminate access of anyone who breaches these rules, without refund to the extent permitted by law."],
    },
    {
      id: "identity",
      title: "11. Your details, e-mail verification and accounts",
      paragraphs: [
        "Before the first Check you must give your real first and last name and a working e-mail address that belongs to you, and confirm the e-mail address with the one-time code we send to it. You must provide accurate and current information. We may refuse or stop the Service if information is false or misleading.",
        "Accounts and subscriptions are personal to the person or organisation that holds them and are limited to the number of devices in the chosen plan. Sharing credentials beyond that limit is not allowed.",
      ],
    },
    {
      id: "payments",
      title: "12. Free use, subscriptions and payments",
      paragraphs: [
        "The free allowance (for example, a number of free Checks per day or in total) is set by us and may change at any time without notice.",
        "Paid subscriptions are priced in Uzbekistani so‘m and paid through the payment methods offered in the Service (such as Click or bank cards). A subscription is activated for the account and device from which it was paid, for the period and number of devices of the chosen plan. Prices may change for future periods. Payments for activated subscriptions are not refundable, except where a refund is required by law.",
      ],
    },
    {
      id: "privacy",
      title: "13. Personal data",
      paragraphs: [
        "To provide the Service we process your first and last name, e-mail address, IP address and country, browser and device identifiers, the links you check and their Reports, and the record of your acceptance of these Terms. We use these data to provide and secure the Service, to enforce limits, to prevent abuse, to keep evidence of acceptance, and to improve the Service. Links you submit may be sent to Third-party sources for analysis.",
        "By accepting these Terms you consent to this processing in accordance with the Law of the Republic of Uzbekistan “On Personal Data” and our Privacy Policy, which is part of these Terms. You may withdraw consent by contacting us; after that we may no longer be able to provide the Service to you.",
      ],
    },
    {
      id: "ip",
      title: "14. Intellectual property",
      paragraphs: [
        "The Platform, its software, design, databases, texts and the format of Reports belong to Innova Networks or its licensors. We grant you a limited, non-exclusive, non-transferable right to use the Service and Reports for your own or your organisation’s internal purposes in accordance with these Terms.",
      ],
    },
    {
      id: "third-parties",
      title: "15. Third-party websites and services",
      paragraphs: [
        "Links you check, and the websites, files and services behind them, belong to third parties. We do not control them and are not responsible for their content, availability, security or practices. The same applies to Third-party sources and payment providers, which operate under their own terms.",
      ],
    },
    {
      id: "availability",
      title: "16. Availability and changes to the Service",
      paragraphs: [
        "We aim to keep the Service available but do not guarantee uninterrupted operation. The Service may be unavailable because of maintenance, updates, failures of hosting, network or Third-party sources, or for reasons beyond our control. We may change or discontinue the Service or any part of it.",
      ],
    },
    {
      id: "termination",
      title: "17. Suspension and termination",
      paragraphs: [
        "You may stop using the Service at any time. We may suspend or terminate your access, revoke devices or delete accounts if you breach these Terms, if required by law, or to protect the Service and other Users. Sections 5 to 9, 14 and 19 continue to apply after termination.",
      ],
    },
    {
      id: "changes",
      title: "18. Changes to these Terms",
      paragraphs: [
        "We may update these Terms. The current version and its date are shown at the top of this page. When we make material changes, you will be asked to accept the new version before your next Check. If you continue to use the Service after accepting, the new version applies.",
      ],
    },
    {
      id: "law",
      title: "19. Governing law and disputes",
      paragraphs: [
        "These Terms are governed by the legislation of the Republic of Uzbekistan. Disputes are first resolved by negotiation: send a written claim to support@innovanetworks.uz, and we will reply within 30 days. If the dispute is not resolved, it is settled by the competent court of the Republic of Uzbekistan at the location of Innova Networks (Tashkent), unless the law provides otherwise.",
      ],
    },
    {
      id: "misc",
      title: "20. Final provisions",
      paragraphs: [
        "If any provision of these Terms is found invalid or unenforceable, the remaining provisions stay in force, and the invalid provision is applied to the maximum extent permitted. Our failure to enforce a provision is not a waiver. These Terms, together with the Privacy Policy and the description of the chosen plan, are the entire agreement between you and us about the Service.",
        "These Terms are published in Uzbek, Russian and English. If the language versions differ, the Uzbek version prevails.",
      ],
    },
    {
      id: "contact",
      title: "21. Contact",
      paragraphs: ["Innova Networks, Tashkent, Republic of Uzbekistan. E-mail: support@innovanetworks.uz."],
    },
  ],
};

const ru: LegalDoc = {
  metaTitle: "Условия использования",
  metaDescription: "Условия использования Innova Checker: принцип работы сервиса проверки ссылок, его ограничения и ограничение ответственности Innova Networks.",
  eyebrow: "Правовая информация",
  title: "Условия использования",
  subtitle: "Пожалуйста, внимательно ознакомьтесь с настоящими Условиями. В них разъясняется, что Innova Checker может и чего не может делать, а также ограничивается наша ответственность.",
  updated: "Редакция 2026-11-17 · действует с 17 ноября 2026 г.",
  summaryTitle: "Наиболее важные положения",
  summary: [
    "Innova Checker предоставляет автоматизированную оценку ссылки на момент проверки. Ни один сервис не способен выявить все угрозы, а ссылка может измениться после проведения проверки.",
    "Вердикт «Доверенный», «Безопасно» или «Низкий риск» НЕ является гарантией того, что ссылка, веб-сайт, файл, отправитель или платёжный запрос безопасны или подлинны.",
    "Innova Networks, платформа Innova Checker, её владельцы и администраторы НЕ несут ответственности, если Вы подверглись взлому, заражению вредоносным программным обеспечением, мошенничеству или понесли любые иные убытки после открытия ссылки — в том числе ссылки, которую наш сервис оценил как безопасную.",
    "Только Вы принимаете решение о том, открывать ли ссылку, вводить ли информацию, загружать ли файл или совершать ли платёж. Всегда проверяйте платёжные запросы и изменённые банковские реквизиты по независимому каналу связи.",
    "Перед первой проверкой Вы указываете свои настоящие имя и фамилию, а также адрес электронной почты, который подтверждаете кодом. Мы сохраняем запись о принятии Вами настоящих Условий.",
  ],
  sections: [
    {
      id: "about",
      title: "1. О настоящих Условиях",
      paragraphs: [
        "Настоящие Условия использования (далее — «Условия») регулируют использование Вами Innova Checker — веб-сайта urlchecker.uz, его пользовательских и административных разделов, его API и всех связанных с ними услуг (совместно — «Сервис» или «Платформа»). Оператором Сервиса является Innova Networks, г. Ташкент, Республика Узбекистан (далее — «Innova Networks», «мы», «нас», «наш»).",
        "Настоящие Условия являются обязательным соглашением между Вами и Innova Networks. Если Вы используете Сервис от имени компании или иной организации, Вы подтверждаете, что уполномочены принять настоящие Условия от её имени, и в этом случае под «Вами» понимается также такая организация.",
      ],
    },
    {
      id: "acceptance",
      title: "2. Принятие Условий",
      paragraphs: [
        "Вы принимаете настоящие Условия, проставив отметку в поле «Я прочитал(а) и принимаю Условия использования и Политику конфиденциальности» и подтвердив свои данные, либо создав учётную запись, либо иным образом используя Сервис. Если Вы не согласны с какой-либо частью настоящих Условий, не используйте Сервис.",
        "Принятие Вами Условий в электронной форме имеет ту же юридическую силу, что и собственноручная подпись, в той мере, в какой это допускается законодательством Республики Узбекистан. В качестве доказательства принятия Условий мы фиксируем дату и время, редакцию Условий, язык интерфейса, Ваши имя и фамилию, адрес электронной почты и сведения о его подтверждении, Ваш IP-адрес и страну, браузер и идентификатор устройства.",
      ],
    },
    {
      id: "definitions",
      title: "3. Определения",
      paragraphs: ["В настоящих Условиях используются следующие определения:"],
      items: [
        "«Проверка» — однократная передача ссылки (URL) в Сервис для автоматизированного анализа.",
        "«Отчёт» — результат Проверки: Вердикт, оценка риска, отдельные выявленные признаки и соответствующие пояснения.",
        "«Вердикт» — итоговая оценка, отображаемая в Отчёте: «Доверенный», «Безопасно», «Низкий риск», «Подозрительно», «Высокий риск», «Мошенничество» (включая «100% мошенничество» для адресов из нашего чёрного списка) или «Не определено».",
        "«Пользователь» — любое лицо, использующее Сервис, с учётной записью или без неё; «Посетитель» — Пользователь, не имеющий учётной записи.",
        "«Сторонние источники» — внешние поставщики данных об угрозах (threat intelligence), публичные списки фишинговых и вредоносных ресурсов, реестры доменных имён и иные источники данных, на которые опирается Сервис.",
      ],
    },
    {
      id: "service",
      title: "4. Функции Сервиса",
      paragraphs: [
        "Сервис автоматически анализирует переданную ссылку, не открывая её в Вашем браузере. В зависимости от настроек Сервис исследует структуру адреса, регистрационные данные домена, DNS-записи, сертификат TLS/SSL, перенаправления, содержимое страницы, загружаемые файлы, данные Сторонних источников и базу данных Innova о проверенных доменах и доменах, внесённых в чёрный список, после чего объединяет полученные результаты в Вердикт и оценку риска.",
        "Сервис может предоставляться бесплатно в установленных нами пределах либо на условиях платной подписки. Мы вправе в любое время добавлять, изменять или удалять функции, модули анализа, Сторонние источники и лимиты.",
      ],
    },
    {
      id: "limits",
      title: "5. Характер и ограничения результатов",
      paragraphs: [
        "Каждый Отчёт представляет собой автоматизированную вероятностную оценку, выполненную на момент Проверки исключительно на основе информации, доступной Сервису в этот момент. Отчёт является средством поддержки принятия решений, а не констатацией факта.",
        "Ни один автоматизированный сервис не способен выявить все угрозы. В частности, злоумышленники могут:",
      ],
      items: [
        "показывать безвредное содержимое сканерам, а вредоносное — реальным жертвам (клоакинг), либо нацеливаться только на определённые страны, устройства, браузеры или временные интервалы;",
        "использовать недавно зарегистрированные домены либо взломанные страницы на легитимных и широко известных веб-сайтах;",
        "активировать вредоносную страницу или файл лишь по истечении определённого времени, после Проверки или только однократно;",
        "скрывать вредоносное содержимое за формами входа в систему, CAPTCHA, веб-формами, скриптами или дополнительными ссылками;",
        "изменять содержимое ссылки в любой момент, вследствие чего ссылка, не содержавшая угроз во время Проверки, впоследствии становится вредоносной;",
        "использовать методы социальной инженерии — поддельный счёт, изменённые банковские реквизиты, поддельную заявку на перевозку груза или платёжный запрос, — которые не могут быть выявлены технической проверкой ссылки.",
      ],
      after: [
        "Поэтому Вердикт «Доверенный», «Безопасно» или «Низкий риск», равно как и отсутствие предупреждений, означает лишь то, что на момент Проверки Сервис не обнаружил признаков опасности. Он НЕ является гарантией, сертификацией, заверением или рекомендацией в отношении того, что ссылка, веб-сайт, какой-либо файл, отправитель или какая-либо сделка безопасны, законны или подлинны.",
        "Такие Вердикты, как «Мошенничество», «Высокий риск» или «Подозрительно», в отдельных случаях могут быть ошибочными (ложноположительные срабатывания). Данные Сторонних источников могут быть неполными, запаздывающими или неверными, и мы их не контролируем.",
        "Сервис не заменяет Ваше собственное суждение, политики информационной безопасности Вашей организации, антивирусные средства и средства защиты конечных устройств, проверку отправителя по независимому каналу связи или профессиональную консультацию.",
      ],
    },
    {
      id: "responsibilities",
      title: "6. Ваши обязанности",
      paragraphs: ["Используя Сервис, Вы соглашаетесь с тем, что:"],
      items: [
        "только Вы принимаете решение о том, открывать ли ссылку, вводить ли какую-либо информацию, загружать или запускать ли файл, совершать ли платёж, и Вы несёте последствия такого решения;",
        "Вы никогда не будете вводить пароли, коды или платёжные данные на веб-сайте лишь потому, что Сервис оценил его как безопасный;",
        "Вы будете проверять каждый платёжный запрос, каждое изменение банковских реквизитов и каждое необычное указание путём звонка отправителю по заранее известному Вам номеру телефона — это наиболее распространённый вид мошенничества в сфере логистики;",
        "Вы будете своевременно обновлять операционную систему, браузер и средства защиты, а также соблюдать правила информационной безопасности Вашей организации;",
        "Вы будете незамедлительно сообщать о предполагаемых инцидентах в ИТ-службу или службу информационной безопасности, а в соответствующих случаях — в компетентные органы;",
        "Вы будете обеспечивать защиту учётных данных Вашей учётной записи и Ваших устройств и несёте ответственность за все действия, совершённые с использованием Вашей учётной записи и на Ваших устройствах.",
      ],
    },
    {
      id: "warranty",
      title: "7. Отказ от гарантий",
      paragraphs: [
        "Сервис и все Отчёты предоставляются на условиях «как есть» и «по мере доступности». В максимальной степени, допустимой применимым законодательством, Innova Networks не предоставляет никаких гарантий, ни явных, ни подразумеваемых, включая гарантии точности, полноты, своевременности, пригодности для определённой цели, бесперебойной или безошибочной работы, а также гарантии того, что Сервис выявит все угрозы.",
      ],
    },
    {
      id: "liability",
      title: "8. Ограничение ответственности",
      paragraphs: [
        "8.1. В максимальной степени, допустимой законодательством Республики Узбекистан, Innova Networks, платформа Innova Checker, её владельцы, учредители, руководители, должностные лица, работники, администраторы, подрядчики, партнёры и поставщики данных (далее — «Лица Innova») не несут ответственности за какой-либо прямой, косвенный, случайный, специальный, последующий или штрафной ущерб либо убытки, возникшие в результате или в связи с использованием Сервиса или его Отчётов либо невозможностью их использования, включая, в частности:",
      ],
      items: [
        "взлом Ваших учётных записей, электронной почты, мессенджеров, устройств, сетей или систем, несанкционированный доступ к ним или захват контроля над ними;",
        "заражение вирусами, программами-вымогателями, шпионским или иным вредоносным программным обеспечением;",
        "хищение, утрату, утечку, шифрование или повреждение персональных, коммерческих или любых иных данных;",
        "финансовые убытки, в том числе мошеннические платежи и переводы, утраченный или похищенный груз, упущенную выгоду, утрату выручки, договоров или деловых возможностей;",
        "перерыв в предпринимательской деятельности, ущерб деловой репутации, штрафы и претензии третьих лиц.",
      ],
      after: [
        "8.2. Изложенное применяется ДАЖЕ В ТОМ СЛУЧАЕ, если ущерб был причинён ссылкой, которой Сервис присвоил Вердикт «Доверенный», «Безопасно», «Низкий риск» или «Не определено» либо которую Сервис вообще не отметил как опасную, а также в том случае, если Лица Innova были уведомлены о возможности причинения такого ущерба. Вы используете Сервис и действуете на основании его Отчётов исключительно на свой собственный риск.",
        "8.3. В случаях, когда ответственность не может быть исключена в силу закона, общий размер ответственности Лиц Innova по всем требованиям в совокупности ограничивается суммой, фактически уплаченной Вами за Сервис в течение трёх (3) месяцев, предшествовавших событию, послужившему основанием для предъявления требования. При бесплатном использовании Сервиса Лица Innova не несут никакой ответственности в той мере, в какой это допускается законом.",
        "8.4. Ничто в настоящих Условиях не ограничивает ответственность, которая не может быть ограничена в соответствии с применимым законодательством, в частности ответственность за умышленные противоправные действия.",
      ],
    },
    {
      id: "indemnity",
      title: "9. Возмещение убытков",
      paragraphs: [
        "Вы обязуетесь возместить Лицам Innova любые убытки, расходы (включая разумные расходы на юридическую помощь) и суммы по претензиям третьих лиц, возникшие вследствие нарушения Вами настоящих Условий, ненадлежащего использования Вами Сервиса либо нарушения Вами закона или прав других лиц.",
      ],
    },
    {
      id: "acceptable-use",
      title: "10. Допустимое использование",
      paragraphs: ["Вам запрещается:"],
      items: [
        "использовать Сервис для атак на какие-либо системы, их зондирования, перегрузки или получения несанкционированного доступа к ним, а также для тестирования созданных Вами вредоносных ссылок;",
        "обходить или пытаться обойти лимиты бесплатных проверок, ограничения по количеству устройств, подтверждение адреса электронной почты или иные ограничения — например, путём указания вымышленных имён или адресов электронной почты, использования нескольких наборов идентификационных данных, автоматизированных средств или смены сетей;",
        "передавать ссылки в массовом порядке с помощью скриптов или ботов либо копировать данные Сервиса, за исключением случаев использования предоставленного Вам нами доступа к API;",
        "атаковать Платформу, осуществлять её обратную разработку (реверс-инжиниринг), нарушать её работу или проверять её защищённость без нашего письменного разрешения;",
        "передавать ссылки, раскрытие которых является незаконным или нарушает Ваши обязательства по сохранению конфиденциальности перед другими лицами;",
        "перепродавать или публиковать Отчёты в качестве собственного сервиса либо использовать их для распространения ложных сведений о третьих лицах без нашего письменного разрешения.",
      ],
      after: ["Мы вправе ограничить, приостановить или прекратить доступ любого лица, нарушающего настоящие правила, без возврата денежных средств в той мере, в какой это допускается законом."],
    },
    {
      id: "identity",
      title: "11. Ваши данные, подтверждение адреса электронной почты и учётные записи",
      paragraphs: [
        "Перед первой Проверкой Вы обязаны указать свои настоящие имя и фамилию и действующий адрес электронной почты, принадлежащий Вам, а также подтвердить этот адрес одноразовым кодом, который мы на него направим. Вы обязаны предоставлять точную и актуальную информацию. Мы вправе отказать в предоставлении Сервиса или прекратить его предоставление, если информация является ложной или вводящей в заблуждение.",
        "Учётные записи и подписки являются персональными для лица или организации, которым они принадлежат, и ограничены количеством устройств, предусмотренным выбранным тарифным планом. Передача учётных данных сверх этого ограничения не допускается.",
      ],
    },
    {
      id: "payments",
      title: "12. Бесплатное использование, подписки и платежи",
      paragraphs: [
        "Объём бесплатного использования (например, количество бесплатных Проверок в день или в целом) устанавливается нами и может быть изменён в любое время без уведомления.",
        "Стоимость платных подписок устанавливается в узбекских сумах, а оплата производится с использованием способов оплаты, предлагаемых в Сервисе (например, Click или банковские карты). Подписка активируется для учётной записи и устройства, с которых была произведена оплата, на срок и для количества устройств, предусмотренных выбранным тарифным планом. Цены на будущие периоды могут изменяться. Платежи за активированные подписки возврату не подлежат, за исключением случаев, когда возврат предусмотрен законом.",
      ],
    },
    {
      id: "privacy",
      title: "13. Персональные данные",
      paragraphs: [
        "В целях предоставления Сервиса мы обрабатываем Ваши имя и фамилию, адрес электронной почты, IP-адрес и страну, идентификаторы браузера и устройства, проверяемые Вами ссылки и Отчёты по ним, а также запись о принятии Вами настоящих Условий. Мы используем эти данные для предоставления Сервиса и обеспечения его безопасности, контроля за соблюдением лимитов, предотвращения злоупотреблений, хранения доказательств принятия Условий и совершенствования Сервиса. Переданные Вами ссылки могут направляться в Сторонние источники для анализа.",
        "Принимая настоящие Условия, Вы даёте согласие на такую обработку в соответствии с Законом Республики Узбекистан «О персональных данных» и нашей Политикой конфиденциальности, которая является неотъемлемой частью настоящих Условий. Вы вправе отозвать согласие, обратившись к нам; после этого мы можем утратить возможность предоставлять Вам Сервис.",
      ],
    },
    {
      id: "ip",
      title: "14. Интеллектуальная собственность",
      paragraphs: [
        "Платформа, её программное обеспечение, дизайн, базы данных, тексты и формат Отчётов принадлежат Innova Networks или её лицензиарам. Мы предоставляем Вам ограниченное, неисключительное, непередаваемое право использовать Сервис и Отчёты для собственных внутренних целей или внутренних целей Вашей организации в соответствии с настоящими Условиями.",
      ],
    },
    {
      id: "third-parties",
      title: "15. Сторонние веб-сайты и сервисы",
      paragraphs: [
        "Проверяемые Вами ссылки, а также веб-сайты, файлы и сервисы, на которые они ведут, принадлежат третьим лицам. Мы не контролируем их и не несём ответственности за их содержание, доступность, безопасность или применяемую ими практику. То же самое относится к Сторонним источникам и платёжным провайдерам, которые действуют на основании собственных условий.",
      ],
    },
    {
      id: "availability",
      title: "16. Доступность Сервиса и его изменение",
      paragraphs: [
        "Мы стремимся обеспечивать доступность Сервиса, однако не гарантируем его бесперебойную работу. Сервис может быть недоступен вследствие технического обслуживания, обновлений, сбоев хостинга, сети или Сторонних источников, а также по причинам, не зависящим от нас. Мы вправе изменить Сервис или любую его часть либо прекратить их работу.",
      ],
    },
    {
      id: "termination",
      title: "17. Приостановление и прекращение доступа",
      paragraphs: [
        "Вы вправе в любое время прекратить использование Сервиса. Мы вправе приостановить или прекратить Ваш доступ, отозвать авторизацию устройств или удалить учётные записи, если Вы нарушаете настоящие Условия, если этого требует закон, либо в целях защиты Сервиса и других Пользователей. Разделы 5–9, 14 и 19 продолжают действовать после прекращения доступа.",
      ],
    },
    {
      id: "changes",
      title: "18. Изменение настоящих Условий",
      paragraphs: [
        "Мы вправе обновлять настоящие Условия. Действующая редакция и её дата указаны в верхней части настоящей страницы. При внесении существенных изменений Вам будет предложено принять новую редакцию перед следующей Проверкой. Если после принятия Вы продолжаете использовать Сервис, применяется новая редакция.",
      ],
    },
    {
      id: "law",
      title: "19. Применимое право и разрешение споров",
      paragraphs: [
        "Настоящие Условия регулируются законодательством Республики Узбекистан. Споры в первую очередь разрешаются путём переговоров: направьте письменную претензию по адресу support@innovanetworks.uz, и мы ответим в течение 30 дней. Если спор не будет урегулирован, он подлежит разрешению компетентным судом Республики Узбекистан по месту нахождения Innova Networks (г. Ташкент), если иное не предусмотрено законом.",
      ],
    },
    {
      id: "misc",
      title: "20. Заключительные положения",
      paragraphs: [
        "Если какое-либо положение настоящих Условий будет признано недействительным или не подлежащим исполнению, остальные положения сохраняют свою силу, а недействительное положение применяется в максимально допустимом объёме. Неприменение нами какого-либо положения не является отказом от соответствующего права. Настоящие Условия вместе с Политикой конфиденциальности и описанием выбранного тарифного плана составляют полное соглашение между Вами и нами в отношении Сервиса.",
        "Настоящие Условия опубликованы на узбекском, русском и английском языках. В случае расхождений между текстами на разных языках преимущественную силу имеет текст на узбекском языке.",
      ],
    },
    {
      id: "contact",
      title: "21. Контактная информация",
      paragraphs: ["Innova Networks, г. Ташкент, Республика Узбекистан. Электронная почта: support@innovanetworks.uz."],
    },
  ],
};

const uz: LegalDoc = {
  metaTitle: "Foydalanish shartlari",
  metaDescription: "Innova Checker foydalanish shartlari: havolalarni tekshirish xizmatining ishlash tartibi, uning cheklovlari va Innova Networks javobgarligining cheklanishi.",
  eyebrow: "Huquqiy ma’lumot",
  title: "Foydalanish shartlari",
  subtitle: "Iltimos, ushbu Shartlar bilan diqqat bilan tanishib chiqing. Ularda Innova Checker nimalarni qila olishi va nimalarni qila olmasligi tushuntiriladi hamda bizning javobgarligimiz cheklanadi.",
  updated: "2026-11-17 tahriri · 2026-yil 17-noyabrdan amal qiladi",
  summaryTitle: "Eng muhim qoidalar",
  summary: [
    "Innova Checker havolaga tekshiruv vaqtidagi holati bo‘yicha avtomatlashtirilgan baho beradi. Hech bir xizmat barcha tahdidlarni aniqlay olmaydi, havola esa tekshiruvdan keyin o‘zgarishi mumkin.",
    "«Ishonchli», «Xavfsiz» yoki «Past xavf» xulosasi havola, veb-sayt, fayl, jo‘natuvchi yoki to‘lov so‘rovi xavfsiz yoki haqiqiy ekanligining kafolati EMAS.",
    "Agar Siz havolani ochganingizdan so‘ng — shu jumladan xizmatimiz xavfsiz deb baholagan havolani ochganingizdan so‘ng ham — xakerlik hujumiga uchrasangiz, qurilmangiz zararli dastur bilan zararlansa, firibgarlik qurboni bo‘lsangiz yoki boshqa har qanday zarar ko‘rsangiz, Innova Networks, Innova Checker platformasi, uning egalari va administratorlari javobgar EMAS.",
    "Havolani ochish, ma’lumot kiritish, faylni yuklab olish yoki to‘lovni amalga oshirish to‘g‘risidagi qarorni faqat Siz o‘zingiz qabul qilasiz. To‘lov so‘rovlarini va o‘zgartirilgan bank rekvizitlarini har doim mustaqil aloqa kanali orqali tekshiring.",
    "Birinchi tekshiruvdan oldin Siz o‘zingizning haqiqiy ismingiz va familiyangizni hamda kod orqali tasdiqlanadigan elektron pochta manzilingizni ko‘rsatasiz. Biz ushbu Shartlarni qabul qilganingiz to‘g‘risidagi yozuvni saqlaymiz.",
  ],
  sections: [
    {
      id: "about",
      title: "1. Ushbu Shartlar haqida",
      paragraphs: [
        "Ushbu Foydalanish shartlari (bundan buyon matnda — «Shartlar») Sizning Innova Checker xizmatidan foydalanishingizni tartibga soladi. Innova Checker deganda urlchecker.uz veb-sayti, uning foydalanuvchi va administrator bo‘limlari, API interfeysi hamda ular bilan bog‘liq barcha xizmatlar (birgalikda — «Xizmat» yoki «Platforma») tushuniladi. Xizmat operatori — Innova Networks, Toshkent shahri, O‘zbekiston Respublikasi (bundan buyon matnda — «Innova Networks», «biz», «bizni», «bizning»).",
        "Ushbu Shartlar Siz bilan Innova Networks o‘rtasidagi majburiy kuchga ega bo‘lgan kelishuv hisoblanadi. Agar Siz Xizmatdan kompaniya yoki boshqa tashkilot nomidan foydalansangiz, Siz ushbu Shartlarni uning nomidan qabul qilishga vakolatli ekanligingizni tasdiqlaysiz va bu holda «Siz» deganda ushbu tashkilot ham tushuniladi.",
      ],
    },
    {
      id: "acceptance",
      title: "2. Shartlarni qabul qilish",
      paragraphs: [
        "Siz ushbu Shartlarni «Foydalanish shartlari va Maxfiylik siyosati bilan tanishdim va ularni qabul qilaman» katagiga belgi qo‘yish va o‘z ma’lumotlaringizni tasdiqlash orqali yoki hisob qaydnomasini yaratish orqali yoxud Xizmatdan boshqacha tarzda foydalanish orqali qabul qilasiz. Agar Siz ushbu Shartlarning biror qismiga rozi bo‘lmasangiz, Xizmatdan foydalanmang.",
        "Shartlarni elektron shaklda qabul qilishingiz O‘zbekiston Respublikasi qonunchiligida yo‘l qo‘yiladigan doirada o‘z qo‘li bilan qo‘yilgan imzo bilan bir xil yuridik kuchga ega. Shartlar qabul qilinganligining dalili sifatida biz sana va vaqtni, Shartlar tahririni, interfeys tilini, ismingiz va familiyangizni, elektron pochta manzilingizni va u tasdiqlangan yoki tasdiqlanmaganligini, IP-manzilingiz va mamlakatingizni, brauzeringizni hamda qurilma identifikatorini qayd etamiz.",
      ],
    },
    {
      id: "definitions",
      title: "3. Atamalar",
      paragraphs: ["Ushbu Shartlarda quyidagi atamalar qo‘llaniladi:"],
      items: [
        "«Tekshiruv» — havolani (URL) avtomatlashtirilgan tahlil uchun Xizmatga bir marta yuborish.",
        "«Hisobot» — Tekshiruv natijasi: Xulosa, xavf ko‘rsatkichi, alohida aniqlangan belgilar va ularga oid izohlar.",
        "«Xulosa» — Hisobotda ko‘rsatiladigan umumiy baho: «Ishonchli», «Xavfsiz», «Past xavf», «Shubhali», «Yuqori xavf», «Firibgarlik» (shu jumladan, qora ro‘yxatimizdagi manzillar uchun «100% firibgarlik») yoki «Aniqlanmadi».",
        "«Foydalanuvchi» — Xizmatdan hisob qaydnomasi bilan yoki usiz foydalanuvchi har qanday shaxs; «Tashrif buyuruvchi» — hisob qaydnomasiga ega bo‘lmagan Foydalanuvchi.",
        "«Uchinchi shaxslar manbalari» — Xizmat tayanadigan tahdidlar to‘g‘risidagi ma’lumotlarning (threat intelligence) tashqi provayderlari, fishing va zararli resurslarning ommaviy ro‘yxatlari, domen nomlari reyestrlari va boshqa ma’lumot manbalari.",
      ],
    },
    {
      id: "service",
      title: "4. Xizmat nimalarni bajaradi",
      paragraphs: [
        "Xizmat yuborilgan havolani Sizning brauzeringizda ochmasdan, avtomatik tarzda tahlil qiladi. Sozlamalarga qarab, Xizmat manzil tuzilishini, domenning ro‘yxatdan o‘tkazilganligi to‘g‘risidagi ma’lumotlarni, DNS yozuvlarini, TLS/SSL sertifikatini, qayta yo‘naltirishlarni, sahifa mazmunini, yuklab olinadigan fayllarni, Uchinchi shaxslar manbalarini hamda tekshirilgan va qora ro‘yxatga kiritilgan domenlar bo‘yicha Innova ma’lumotlar bazasini o‘rganadi va olingan natijalarni Xulosa va xavf ko‘rsatkichiga birlashtiradi.",
        "Xizmat biz belgilagan cheklovlar doirasida bepul yoki pullik obuna asosida taqdim etilishi mumkin. Biz istalgan vaqtda funksiyalar, tahlil modullari, Uchinchi shaxslar manbalari va cheklovlarni qo‘shish, o‘zgartirish yoki olib tashlash huquqiga egamiz.",
      ],
    },
    {
      id: "limits",
      title: "5. Natijalarning xususiyati va chegaralari",
      paragraphs: [
        "Har bir Hisobot Tekshiruv vaqtida faqat o‘sha paytda Xizmat ixtiyorida bo‘lgan ma’lumotlar asosida amalga oshirilgan avtomatlashtirilgan, ehtimoliy baho hisoblanadi. U fakt tasdig‘i emas, balki qaror qabul qilishda yordamchi vosita hisoblanadi.",
        "Hech bir avtomatlashtirilgan xizmat barcha tahdidlarni aniqlay olmaydi. Xususan, tajovuzkorlar quyidagilarni amalga oshirishi mumkin:",
      ],
      items: [
        "skanerlarga zararsiz, haqiqiy qurbonlarga esa zararli mazmunni ko‘rsatish (kloaking) yoki faqat muayyan mamlakatlar, qurilmalar, brauzerlar yoki vaqt oraliqlarini nishonga olish;",
        "yangi ro‘yxatdan o‘tkazilgan domenlardan yoki qonuniy va taniqli veb-saytlardagi buzib egallab olingan sahifalardan foydalanish;",
        "zararli sahifa yoki faylni faqat ma’lum vaqt o‘tgach, Tekshiruvdan keyin yoki faqat bir marta faollashtirish;",
        "zararli mazmunni tizimga kirish oynalari, CAPTCHA, formalar, skriptlar yoki qo‘shimcha havolalar ortida yashirish;",
        "havola mazmunini istalgan vaqtda o‘zgartirish, buning natijasida Tekshiruv vaqtida toza bo‘lgan havola keyinchalik zararli bo‘lib qoladi;",
        "havolani texnik tekshirish orqali aniqlab bo‘lmaydigan ijtimoiy muhandislik usullaridan — soxta hisob-faktura, o‘zgartirilgan bank hisobvarag‘i, qalbaki yuk tashish buyurtmasi yoki to‘lov so‘rovidan — foydalanish.",
      ],
      after: [
        "Shu sababli «Ishonchli», «Xavfsiz» yoki «Past xavf» Xulosasi yoki ogohlantirishlarning mavjud emasligi faqat Tekshiruv vaqtida Xizmat xavf belgilarini aniqlamaganligini anglatadi. Bu havola, veb-sayt, har qanday fayl, jo‘natuvchi yoki har qanday bitim xavfsiz, qonuniy yoki haqiqiy ekanligiga oid kafolat, sertifikatlash, zamonat yoki tavsiya EMAS.",
        "«Firibgarlik», «Yuqori xavf» yoki «Shubhali» kabi Xulosalar ba’zan noto‘g‘ri bo‘lishi mumkin (yolg‘on ijobiy natijalar). Uchinchi shaxslar manbalaridan olingan ma’lumotlar to‘liq bo‘lmasligi, kechikishi yoki noto‘g‘ri bo‘lishi mumkin va biz ularni nazorat qilmaymiz.",
        "Xizmat Sizning shaxsiy mulohazangiz, tashkilotingizning axborot xavfsizligi siyosati, antivirus va oxirgi qurilmalarni himoya qilish vositalari, jo‘natuvchini mustaqil aloqa kanali orqali tekshirish yoki professional maslahat o‘rnini bosmaydi.",
      ],
    },
    {
      id: "responsibilities",
      title: "6. Sizning majburiyatlaringiz",
      paragraphs: ["Xizmatdan foydalanar ekansiz, Siz quyidagilarga rozilik bildirasiz:"],
      items: [
        "havolani ochish, biror ma’lumot kiritish, faylni yuklab olish yoki ishga tushirish yoxud to‘lovni amalga oshirish to‘g‘risidagi qarorni faqat Siz o‘zingiz qabul qilasiz va ushbu qarorning oqibatlari uchun o‘zingiz javob berasiz;",
        "Siz hech qachon parollar, kodlar yoki to‘lov ma’lumotlarini veb-saytga faqat Xizmat uni xavfsiz deb baholagani sababli kiritmaysiz;",
        "Siz har bir to‘lov so‘rovini, bank rekvizitlarining har bir o‘zgarishini va har bir g‘ayrioddiy ko‘rsatmani jo‘natuvchiga o‘zingizga oldindan ma’lum bo‘lgan telefon raqami orqali qo‘ng‘iroq qilib tekshirasiz — bu logistika sohasidagi eng keng tarqalgan firibgarlik turidir;",
        "Siz operatsion tizimingiz, brauzeringiz va himoya dasturlaringizni o‘z vaqtida yangilab borasiz hamda tashkilotingizning xavfsizlik qoidalariga rioya qilasiz;",
        "Siz gumon qilingan hodisalar haqida o‘z IT yoki axborot xavfsizligi xizmatingizga, zarur hollarda esa vakolatli organlarga kechiktirmasdan xabar berasiz;",
        "Siz hisob qaydnomangizga kirish ma’lumotlari va qurilmalaringiz xavfsizligini ta’minlaysiz hamda hisob qaydnomangiz orqali va qurilmalaringizda amalga oshirilgan barcha harakatlar uchun javobgar bo‘lasiz.",
      ],
    },
    {
      id: "warranty",
      title: "7. Kafolatlardan voz kechish",
      paragraphs: [
        "Xizmat va barcha Hisobotlar «qanday bo‘lsa, shundayligicha» va «mavjud bo‘lganicha» taqdim etiladi. Qo‘llaniladigan qonunchilikda ruxsat etilgan eng yuqori darajada Innova Networks hech qanday — aniq ifodalangan yoki nazarda tutilgan — kafolatlarni, shu jumladan aniqlik, to‘liqlik, o‘z vaqtidalik, muayyan maqsadga yaroqlilik, uzluksiz yoki xatosiz ishlash kafolatlarini, shuningdek Xizmat barcha tahdidlarni aniqlashi to‘g‘risidagi kafolatni bermaydi.",
      ],
    },
    {
      id: "liability",
      title: "8. Javobgarlikni cheklash",
      paragraphs: [
        "8.1. O‘zbekiston Respublikasi qonunchiligida ruxsat etilgan eng yuqori darajada Innova Networks, Innova Checker platformasi, uning egalari, ta’sischilari, direktorlari, mansabdor shaxslari, xodimlari, administratorlari, pudratchilari, hamkorlari va ma’lumot yetkazib beruvchilari (bundan buyon matnda — «Innova shaxslari») Xizmatdan yoki uning Hisobotlaridan foydalanish yoxud ulardan foydalana olmaslik natijasida yoki shu bilan bog‘liq holda yuzaga kelgan har qanday to‘g‘ridan-to‘g‘ri, bilvosita, tasodifiy, maxsus, oqibatli yoki jarima tusidagi zarar va yo‘qotishlar uchun, shu jumladan, xususan, quyidagilar uchun javobgar bo‘lmaydi:",
      ],
      items: [
        "hisob qaydnomalaringiz, elektron pochtangiz, messenjerlaringiz, qurilmalaringiz, tarmoqlaringiz yoki tizimlaringizni buzib kirish, ularga ruxsatsiz kirish yoki ularni egallab olish;",
        "viruslar, to‘lov talab qiluvchi dasturlar (ransomware), josuslik dasturlari yoki boshqa zararli dasturiy ta’minot bilan zararlanish;",
        "shaxsiy, tijoriy yoki boshqa har qanday ma’lumotlarning o‘g‘irlanishi, yo‘qolishi, sizib chiqishi, shifrlanishi yoki buzilishi;",
        "moliyaviy yo‘qotishlar, shu jumladan firibgarlik yo‘li bilan amalga oshirilgan to‘lovlar va o‘tkazmalar, yo‘qolgan yoki o‘g‘irlangan yuklar, boy berilgan foyda, daromad, shartnomalar yoki biznes imkoniyatlari;",
        "faoliyatning to‘xtab qolishi, ishchanlik obro‘siga yetkazilgan zarar, jarimalar va uchinchi shaxslarning da’volari.",
      ],
      after: [
        "8.2. Ushbu qoida HATTO zarar Xizmat tomonidan «Ishonchli», «Xavfsiz», «Past xavf» yoki «Aniqlanmadi» deb baholangan yoxud umuman xavfli deb belgilanmagan havola sababli yetkazilgan taqdirda ham, shuningdek Innova shaxslari bunday zarar yetkazilishi mumkinligi to‘g‘risida xabardor qilingan taqdirda ham qo‘llaniladi. Xizmatdan foydalanish va uning Hisobotlari asosida harakat qilish to‘liq Sizning o‘z tavakkalingiz bilan amalga oshiriladi.",
        "8.3. Javobgarlik qonunga ko‘ra istisno etilishi mumkin bo‘lmagan hollarda, Innova shaxslarining barcha talablar bo‘yicha jami javobgarligi talab qo‘yilishiga asos bo‘lgan voqeadan oldingi uch (3) oy davomida Siz Xizmat uchun haqiqatda to‘lagan summa bilan cheklanadi. Xizmatdan bepul foydalanilganda Innova shaxslari qonunda ruxsat etilgan doirada hech qanday javobgarlikni o‘z zimmasiga olmaydi.",
        "8.4. Ushbu Shartlardagi hech bir qoida qo‘llaniladigan qonunchilikka muvofiq cheklanishi mumkin bo‘lmagan javobgarlikni, masalan, qasddan qilingan huquqbuzarlik uchun javobgarlikni cheklamaydi.",
      ],
    },
    {
      id: "indemnity",
      title: "9. Zararni qoplash",
      paragraphs: [
        "Siz ushbu Shartlarni buzishingiz, Xizmatdan suiiste’mol qilib foydalanishingiz yoxud qonunni yoki boshqa shaxslarning huquqlarini buzishingiz natijasida yuzaga keladigan har qanday zararlar, xarajatlar (shu jumladan yuridik yordam uchun asosli xarajatlar) hamda uchinchi shaxslarning da’volari bo‘yicha summalarni Innova shaxslariga qoplashga rozilik bildirasiz.",
      ],
    },
    {
      id: "acceptable-use",
      title: "10. Ruxsat etilgan foydalanish",
      paragraphs: ["Sizga quyidagilar taqiqlanadi:"],
      items: [
        "Xizmatdan har qanday tizimga hujum qilish, uni razvedka qilish (zondlash), ortiqcha yuklash yoki unga ruxsatsiz kirish uchun, shuningdek o‘zingiz yaratgan zararli havolalarni sinab ko‘rish uchun foydalanish;",
        "bepul tekshiruvlar cheklovlari, qurilmalar soni bo‘yicha cheklovlar, elektron pochta manzilini tasdiqlash yoki boshqa cheklovlarni chetlab o‘tish yoki chetlab o‘tishga urinish — masalan, soxta ismlar yoki elektron pochta manzillarini ko‘rsatish, bir nechta identifikatsiya ma’lumotlari to‘plamidan, avtomatlashtirilgan vositalardan foydalanish yoki tarmoqlarni almashtirish orqali;",
        "skriptlar yoki botlar yordamida havolalarni ommaviy ravishda yuborish yoxud Xizmat ma’lumotlarini nusxalash, biz Sizga taqdim etgan API orqali kirish hollari bundan mustasno;",
        "bizning yozma ruxsatimizsiz Platformaga hujum qilish, uni teskari muhandislik (reverse engineering) usulida tahlil qilish, uning ishini buzish yoki xavfsizligini sinovdan o‘tkazish;",
        "oshkor etilishi qonunga zid bo‘lgan yoki Sizning boshqa shaxslar oldidagi maxfiylik majburiyatlaringizni buzadigan havolalarni yuborish;",
        "bizning yozma ruxsatimizsiz Hisobotlarni o‘z xizmatingiz sifatida qayta sotish yoki e’lon qilish yoxud ulardan uchinchi shaxslar to‘g‘risida yolg‘on ma’lumotlar tarqatish uchun foydalanish.",
      ],
      after: ["Biz ushbu qoidalarni buzgan har qanday shaxsning Xizmatdan foydalanish imkoniyatini qonunda ruxsat etilgan doirada pul mablag‘larini qaytarmasdan cheklash, to‘xtatib turish yoki tugatish huquqiga egamiz."],
    },
    {
      id: "identity",
      title: "11. Sizning ma’lumotlaringiz, elektron pochtani tasdiqlash va hisob qaydnomalari",
      paragraphs: [
        "Birinchi Tekshiruvdan oldin Siz o‘zingizning haqiqiy ismingiz va familiyangizni hamda Sizga tegishli bo‘lgan amaldagi elektron pochta manzilini ko‘rsatishingiz va ushbu manzilni biz unga yuboradigan bir martalik kod orqali tasdiqlashingiz shart. Siz aniq va dolzarb ma’lumotlarni taqdim etishingiz shart. Agar ma’lumotlar yolg‘on yoki chalg‘ituvchi bo‘lsa, biz Xizmatni taqdim etishni rad etishimiz yoki to‘xtatishimiz mumkin.",
        "Hisob qaydnomalari va obunalar ularga egalik qiluvchi shaxs yoki tashkilotga shaxsan tegishli bo‘lib, tanlangan tarif rejasida nazarda tutilgan qurilmalar soni bilan cheklanadi. Kirish ma’lumotlarini ushbu cheklovdan ortiq darajada boshqalarga berishga yo‘l qo‘yilmaydi.",
      ],
    },
    {
      id: "payments",
      title: "12. Bepul foydalanish, obunalar va to‘lovlar",
      paragraphs: [
        "Bepul foydalanish hajmi (masalan, kuniga yoki jami bepul Tekshiruvlar soni) biz tomonimizdan belgilanadi va istalgan vaqtda xabarnomasiz o‘zgartirilishi mumkin.",
        "Pullik obunalar narxi o‘zbek so‘mida belgilanadi va Xizmatda taklif etiladigan to‘lov usullari (masalan, Click yoki bank kartalari) orqali to‘lanadi. Obuna to‘lov amalga oshirilgan hisob qaydnomasi va qurilma uchun tanlangan tarif rejasida nazarda tutilgan muddatga va qurilmalar soniga faollashtiriladi. Kelgusi davrlar uchun narxlar o‘zgarishi mumkin. Faollashtirilgan obunalar uchun to‘lovlar qaytarilmaydi, qonunda qaytarish nazarda tutilgan hollar bundan mustasno.",
      ],
    },
    {
      id: "privacy",
      title: "13. Shaxsga doir ma’lumotlar",
      paragraphs: [
        "Xizmatni taqdim etish uchun biz Sizning ismingiz va familiyangiz, elektron pochta manzilingiz, IP-manzilingiz va mamlakatingiz, brauzer va qurilma identifikatorlari, Siz tekshiradigan havolalar va ularning Hisobotlari, shuningdek ushbu Shartlarni qabul qilganingiz to‘g‘risidagi yozuvni qayta ishlaymiz. Biz ushbu ma’lumotlardan Xizmatni taqdim etish va uning xavfsizligini ta’minlash, cheklovlarga rioya etilishini nazorat qilish, suiiste’molliklarning oldini olish, Shartlar qabul qilinganligi dalillarini saqlash va Xizmatni takomillashtirish uchun foydalanamiz. Siz yuborgan havolalar tahlil qilish uchun Uchinchi shaxslar manbalariga yuborilishi mumkin.",
        "Ushbu Shartlarni qabul qilish orqali Siz O‘zbekiston Respublikasining «Shaxsga doir ma’lumotlar to‘g‘risida»gi Qonuni va ushbu Shartlarning ajralmas qismi hisoblangan Maxfiylik siyosatimizga muvofiq bunday qayta ishlashga rozilik bildirasiz. Siz biz bilan bog‘lanib, rozilikni qaytarib olishingiz mumkin; shundan so‘ng biz Sizga Xizmatni taqdim eta olmasligimiz mumkin.",
      ],
    },
    {
      id: "ip",
      title: "14. Intellektual mulk",
      paragraphs: [
        "Platforma, uning dasturiy ta’minoti, dizayni, ma’lumotlar bazalari, matnlari va Hisobotlar formati Innova Networks yoki uning litsenziarlariga tegishli. Biz Sizga Xizmat va Hisobotlardan ushbu Shartlarga muvofiq o‘zingizning yoki tashkilotingizning ichki maqsadlari uchun foydalanish bo‘yicha cheklangan, nomutlaq, boshqa shaxsga o‘tkazilmaydigan huquqni beramiz.",
      ],
    },
    {
      id: "third-parties",
      title: "15. Uchinchi shaxslarning veb-saytlari va xizmatlari",
      paragraphs: [
        "Siz tekshiradigan havolalar, shuningdek ular orqali ochiladigan veb-saytlar, fayllar va xizmatlar uchinchi shaxslarga tegishli. Biz ularni nazorat qilmaymiz va ularning mazmuni, mavjudligi, xavfsizligi yoki amaliyoti uchun javobgar emasmiz. Xuddi shu qoida o‘z shartlari asosida faoliyat yurituvchi Uchinchi shaxslar manbalari va to‘lov provayderlariga nisbatan ham qo‘llaniladi.",
      ],
    },
    {
      id: "availability",
      title: "16. Xizmatning mavjudligi va unga o‘zgartirishlar kiritish",
      paragraphs: [
        "Biz Xizmatning doimiy mavjudligini ta’minlashga intilamiz, biroq uning uzluksiz ishlashini kafolatlamaymiz. Xizmat texnik xizmat ko‘rsatish, yangilanishlar, xosting, tarmoq yoki Uchinchi shaxslar manbalaridagi nosozliklar sababli yoxud bizga bog‘liq bo‘lmagan sabablarga ko‘ra mavjud bo‘lmasligi mumkin. Biz Xizmatni yoki uning istalgan qismini o‘zgartirish yoki uning faoliyatini to‘xtatish huquqiga egamiz.",
      ],
    },
    {
      id: "termination",
      title: "17. Foydalanishni to‘xtatib turish va tugatish",
      paragraphs: [
        "Siz istalgan vaqtda Xizmatdan foydalanishni to‘xtatishingiz mumkin. Agar Siz ushbu Shartlarni buzsangiz, agar bu qonunda talab qilinsa yoki Xizmatni va boshqa Foydalanuvchilarni himoya qilish maqsadida, biz Sizning Xizmatdan foydalanish imkoniyatingizni to‘xtatib turishimiz yoki tugatishimiz, qurilmalarga berilgan ruxsatni bekor qilishimiz yoki hisob qaydnomalarini o‘chirib tashlashimiz mumkin. 5–9, 14 va 19-bo‘limlar foydalanish tugatilgandan keyin ham o‘z kuchini saqlab qoladi.",
      ],
    },
    {
      id: "changes",
      title: "18. Ushbu Shartlarga o‘zgartirishlar kiritish",
      paragraphs: [
        "Biz ushbu Shartlarni yangilashimiz mumkin. Amaldagi tahrir va uning sanasi ushbu sahifaning yuqori qismida ko‘rsatilgan. Muhim o‘zgartirishlar kiritilganda, Sizdan navbatdagi Tekshiruvdan oldin yangi tahrirni qabul qilish so‘raladi. Agar Siz qabul qilganingizdan keyin Xizmatdan foydalanishni davom ettirsangiz, yangi tahrir qo‘llaniladi.",
      ],
    },
    {
      id: "law",
      title: "19. Qo‘llaniladigan huquq va nizolarni hal qilish",
      paragraphs: [
        "Ushbu Shartlar O‘zbekiston Respublikasi qonunchiligi bilan tartibga solinadi. Nizolar birinchi navbatda muzokaralar yo‘li bilan hal qilinadi: support@innovanetworks.uz manziliga yozma talabnoma (pretenziya) yuboring, biz unga 30 kun ichida javob beramiz. Agar nizo hal etilmasa, qonunda boshqacha tartib nazarda tutilmagan bo‘lsa, u Innova Networks joylashgan yerdagi (Toshkent shahri) O‘zbekiston Respublikasining vakolatli sudi tomonidan hal qilinadi.",
      ],
    },
    {
      id: "misc",
      title: "20. Yakuniy qoidalar",
      paragraphs: [
        "Agar ushbu Shartlarning biror qoidasi haqiqiy emas yoki ijro etib bo‘lmaydigan deb topilsa, qolgan qoidalar o‘z kuchida qoladi, haqiqiy emas deb topilgan qoida esa ruxsat etilgan eng yuqori darajada qo‘llaniladi. Biror qoidaning bajarilishini talab qilmaganligimiz tegishli huquqdan voz kechish hisoblanmaydi. Ushbu Shartlar Maxfiylik siyosati va tanlangan tarif rejasining tavsifi bilan birgalikda Xizmatga oid Siz bilan biz o‘rtasidagi to‘liq kelishuvni tashkil etadi.",
        "Ushbu Shartlar o‘zbek, rus va ingliz tillarida e’lon qilingan. Turli tillardagi matnlar o‘rtasida tafovutlar yuzaga kelgan taqdirda o‘zbek tilidagi matn ustun kuchga ega bo‘ladi.",
      ],
    },
    {
      id: "contact",
      title: "21. Aloqa ma’lumotlari",
      paragraphs: ["Innova Networks, Toshkent shahri, O‘zbekiston Respublikasi. Elektron pochta: support@innovanetworks.uz."],
    },
  ],
};

/** Full Terms of Use. English is the master text; ru and uz are translations of it. */
export const termsText = defineMessages<LegalDoc>({ en, ru, uz });
