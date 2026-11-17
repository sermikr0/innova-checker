import { describe, expect, it, vi } from "vitest";
import { LOCALES, pickLocale } from "../src/i18n/config";
import { consentText } from "../src/i18n/messages/consent";
import { termsText } from "../src/i18n/messages/terms";
import { privacyText } from "../src/i18n/messages/privacy";
import { labelFor, noticeFor } from "../src/lib/verdict";
import { freePolicyShort } from "../src/lib/site-access";
import { formatUzs, timeAgo } from "../src/lib/format";

// The consent service imports server-only modules; only its pure helpers are tested here.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {} }), headers: async () => new Headers() }));
vi.mock("../src/server/db", () => ({ prisma: {} }));
const { maskEmail, normalizeFullName } = await import("../src/server/consent/service");

describe("interface language", () => {
  it("follows Accept-Language and falls back to Uzbek", () => {
    expect(pickLocale("ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(pickLocale("en-US,en;q=0.9")).toBe("en");
    expect(pickLocale("uz-Latn-UZ,uz;q=0.9,ru;q=0.8")).toBe("uz");
    expect(pickLocale("de-DE,fr;q=0.5")).toBe("uz");
    expect(pickLocale("de;q=0.9,en;q=0.5,ru;q=0.7")).toBe("ru");
    expect(pickLocale(null)).toBe("uz");
  });

  it("has every verdict, policy and amount in all three languages", () => {
    expect(labelFor("MALICIOUS", true, "uz")).toBe("100% firibgarlik");
    expect(labelFor("SAFE", false, "ru")).toBe("Безопасно");
    expect(noticeFor("MALICIOUS", false, false, "en")).toMatch(/^SCAM/);
    expect(freePolicyShort({ freeMode: "DAILY", freeLimit: 3 }, "uz")).toBe("Har kuni 3 ta bepul tekshiruv");
    expect(freePolicyShort({ freeMode: "DAILY", freeLimit: 2 }, "ru")).toBe("2 бесплатные проверки в день");
    expect(freePolicyShort({ freeMode: "TOTAL", freeLimit: 5 }, "ru")).toBe("5 бесплатных проверок");
    expect(formatUzs(150000, "uz")).toMatch(/150.000 so‘m/);
    expect(timeAgo(new Date(), "ru")).toBe("только что");
  });

  it("keeps the legal texts complete in every language", () => {
    for (const doc of [termsText, privacyText]) {
      const ids = doc.en.sections.map((s) => s.id).join();
      for (const l of LOCALES) {
        expect(doc[l].sections.map((s) => s.id).join()).toBe(ids);
        doc[l].sections.forEach((s, i) => {
          expect(s.paragraphs.length).toBe(doc.en.sections[i].paragraphs.length);
          expect(s.items?.length).toBe(doc.en.sections[i].items?.length);
        });
      }
    }
    // The limitation of liability must exist in every translation.
    expect(termsText.ru.sections.find((s) => s.id === "liability")?.title).toMatch(/ответственност/i);
    expect(termsText.uz.sections.find((s) => s.id === "liability")?.title).toMatch(/javobgarlik/i);
  });

  it("writes Uzbek with ‘ and ’, never an ASCII apostrophe", () => {
    const uz = JSON.stringify([termsText.uz, privacyText.uz, consentText.uz.keyPoints]);
    expect(uz).not.toMatch(/[a-z]'[a-z]/i);
  });
});

describe("identification before the first check", () => {
  it("accepts real first and last names in any script", () => {
    expect(normalizeFullName("  Aziz   Karimov ")).toBe("Aziz Karimov");
    expect(normalizeFullName("Азиз Каримов")).toBe("Азиз Каримов");
    expect(normalizeFullName("G‘ayrat O‘tkirov")).toBe("G‘ayrat O‘tkirov");
    expect(normalizeFullName("Anna-Maria O'Neil")).toBe("Anna-Maria O'Neil");
    expect(normalizeFullName("Aziz")).toBeNull();
    expect(normalizeFullName("test 123")).toBeNull();
    expect(normalizeFullName("<script> x")).toBeNull();
  });

  it("masks e-mail addresses shown back to the visitor", () => {
    expect(maskEmail("saidakbar@gmail.com")).toBe("sa••••••@gmail.com");
    expect(maskEmail("ab@x.uz")).toBe("a••@x.uz");
  });

  it("puts the verification code in the e-mail in the visitor's language", () => {
    expect(consentText.ru.mail.body("Азиз", "123456")).toContain("123456");
    expect(consentText.uz.mail.subject).toBe("Innova Checker tasdiqlash kodi");
  });
});
