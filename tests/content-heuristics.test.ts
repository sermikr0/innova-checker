import { describe, expect, it } from "vitest";
import { analyzeContent } from "@/server/scanner/modules/content";
import type { SafeResponse } from "@/server/scanner/net/safe-http";
import { DEFAULT_SCANNER_SETTINGS } from "@/server/scanner/data/defaults";

function page(url: string, html: string, status = 200) {
  const response: SafeResponse = {
    url, status, statusText: "", headers: { "content-type": "text/html" }, setCookies: [], remoteAddress: null, tls: null,
    contentType: "text/html", bodyKind: "text", body: Buffer.from(html), bytesRead: html.length, truncated: false,
    sha256: null, hashComplete: false, decodeError: null, elapsedMs: 1,
  };
  return analyzeContent({ response, finalUrl: url, settings: DEFAULT_SCANNER_SETTINGS }).findings;
}
const get = (fs: ReturnType<typeof page>, code: string) => fs.find((f) => f.code === code);

describe("content heuristics", () => {
  it("treats Cloudflare's phishing interstitial as critical evidence", () => {
    const fs = page("https://doc.example.surf/x", "<title>Suspected Phishing | Cloudflare</title><body>Warning Suspected Phishing. This website has been reported for potential phishing. Ignore &amp; Proceed. Cloudflare Ray ID: 1</body>", 403);
    const f = get(fs, "CONTENT_PROVIDER_WARNING");
    expect(f?.severity).toBe("CRITICAL");
    expect(f?.weight).toBeGreaterThanOrEqual(80);
  });

  it("scores a brand sign-in page on free hosting higher than a plain mention", () => {
    const hosted = get(page("https://kucoin-help.gitbook.io/us", "<title>KúCōiñ® - Login - Sign in</title><body>hello</body>"), "CONTENT_BRAND_CLAIM");
    expect(hosted?.weight).toBe(45);
    const news = get(page("https://news.example.org/a", "<title>Weekly logistics news</title><h1>Market update</h1><body><img alt='Get it on Google Play' src='/p.png'></body>"), "CONTENT_BRAND_CLAIM");
    expect(news?.weight ?? 0).toBe(0);
  });

  it("ignores tracking pixels and store badges from brand domains", () => {
    const fs = page("https://shop.example.kz/", "<title>Shop</title><body><img src='https://mc.yandex.ru/watch/123'><img src='https://www.facebook.com/tr?id=1'><img alt='Telegram' src='/tg.svg'></body>");
    expect(get(fs, "CONTENT_HOTLINK")).toBeUndefined();
    expect(get(fs, "CONTENT_BRAND_CLAIM")?.weight ?? 0).toBe(0);
  });

  it("still flags a cloned page that loads a brand's logo", () => {
    const fs = page("https://secure-check.example.top/", "<title>Account</title><body><img src='https://www.paypal.com/images/logo-paypal.png'></body>");
    expect(get(fs, "CONTENT_HOTLINK")?.weight).toBeGreaterThan(0);
  });
});
