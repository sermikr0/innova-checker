import { describe, expect, it } from "vitest";
import { parseLooseDate, whoisFields } from "@/server/scanner/modules/domain";
import { CookieJar } from "@/server/scanner/modules/redirects";
import { analyzeUrl } from "@/server/scanner/modules/url-analysis";
import { normalizeInputUrl } from "@/server/scanner/normalize";
import { DEFAULT_SCANNER_SETTINGS } from "@/server/scanner/data/defaults";

describe("WHOIS parsing across registries", () => {
  it("reads KazNIC dotted labels", () => {
    const f = whoisFields("Domain Name............: kaspi.kz\nDomain created.........: 2007-12-28 09:47:49 (GMT+0:00)\nExpiration date........: 2034-12-28 09:47:49 (GMT+0:00)");
    expect(f.get("domain created")?.[0]).toBe("2007-12-28 09:47:49 (GMT+0:00)");
    expect(parseLooseDate(f.get("domain created")?.[0])?.toISOString().slice(0, 10)).toBe("2007-12-28");
  });

  it("reads JPRS bracketed labels", () => {
    const f = whoisFields("a. [Domain Name]                YAHOO.CO.JP\np. [Name Server]                ns01.yahoo.co.jp\n[Created on]                    2001/03/26");
    expect(f.get("name server")).toEqual(["ns01.yahoo.co.jp"]);
    expect(parseLooseDate(f.get("created on")?.[0])?.toISOString().slice(0, 10)).toBe("2001-03-26");
  });

  it("parses registro.br compact dates and skips comments", () => {
    const f = whoisFields("% created: 20000101\ncreated:     19990514 #161424\nexpires:     20270514");
    expect(f.get("created")).toEqual(["19990514 #161424"]);
    expect(parseLooseDate("19990514 #161424")?.toISOString().slice(0, 10)).toBe("1999-05-14");
  });
});

describe("Redirect cookie jar", () => {
  it("returns a cookie set by the same site on the next hop", () => {
    const jar = new CookieJar();
    jar.store(["__Secure-ETC=abc; path=/; domain=.ozon.ru; HttpOnly; Secure"], new URL("https://ozon.ru/"));
    expect(jar.header(new URL("https://www.ozon.ru/?__rr=1"))).toBe("__Secure-ETC=abc");
    expect(jar.header(new URL("http://ozon.ru/"))).toBeUndefined();
  });

  it("refuses cookies scoped to another site or a public suffix", () => {
    const jar = new CookieJar();
    jar.store(["a=1; domain=bank.com", "b=2; domain=co.uk", "c=3; domain=.evil.co.uk"], new URL("https://evil.co.uk/"));
    expect(jar.header(new URL("https://bank.com/"))).toBeUndefined();
    expect(jar.header(new URL("https://other.co.uk/"))).toBeUndefined();
    expect(jar.header(new URL("https://evil.co.uk/"))).toBe("c=3");
  });

  it("keeps host-only cookies on their host and drops expired ones", () => {
    const jar = new CookieJar();
    jar.store(["h=1", "gone=1"], new URL("https://shop.example.com/"));
    jar.store(["gone=; Max-Age=0"], new URL("https://shop.example.com/"));
    expect(jar.header(new URL("https://shop.example.com/x"))).toBe("h=1");
    expect(jar.header(new URL("https://www.example.com/"))).toBeUndefined();
  });
});

describe("IDN scoring", () => {
  const homograph = (url: string) => analyzeUrl(normalizeInputUrl(url), DEFAULT_SCANNER_SETTINGS).findings.find((f) => f.code === "URL_HOMOGRAPH");
  it("does not score a fully native-script domain", () => {
    expect(homograph("https://президент.рф/")?.weight).toBe(0);
  });
  it("still flags Cyrillic names under a Latin extension", () => {
    expect(homograph("https://пример.com/")?.weight).toBeGreaterThan(0);
  });
});
