import { describe, expect, it } from "vitest";
import { analyzeUrl } from "@/server/scanner/modules/url-analysis";
import { normalizeInputUrl } from "@/server/scanner/normalize";
import { DEFAULT_SCANNER_SETTINGS } from "@/server/scanner/data/defaults";
import { globMatch, tokenMatchesKeyword } from "@/server/scanner/util";
import { parseCsv } from "@/server/domain-intel/service";

const find = (url: string, code: string) => analyzeUrl(normalizeInputUrl(url), DEFAULT_SCANNER_SETTINGS).findings.find((f) => f.code === code);

describe("URL heuristics", () => {
  it("flags brand impersonation but not the official domain", () => {
    expect(find("https://highway-security-example.com/", "URL_BRAND")?.status).toBe("FAIL");
    expect(find("https://www.dhl.com.secure-track.example.org/", "URL_BRAND")?.status).toBe("FAIL");
    expect(find("https://highway.com/", "URL_BRAND")?.status).toBe("INFO");
  });
  it("detects homographs, embedded credentials and recipient e-mails", () => {
    expect(find("https://xn--pple-43d.com/", "URL_HOMOGRAPH")?.severity).toBe("CRITICAL");
    expect(find("https://www.dhl.com@evil.example/", "URL_CREDENTIALS")?.status).toBe("FAIL");
    expect(find("http://bucket.s3-website-us-east-1.amazonaws.com/x.html?r=ZGlzcGF0Y2gxQHRoZWVhZ2xlLnVz.abc", "URL_RECIPIENT_EMAIL")?.result).toContain("dispatch1@theeagle.us");
  });
  it("does not treat cloud tenants as the cloud vendor's brand", () => {
    const r = analyzeUrl(normalizeInputUrl("http://sfvnooyf-ijndgf.s3-website-us-east-1.amazonaws.com/"), DEFAULT_SCANNER_SETTINGS);
    expect(r.data.trusted).toBe(false);
    expect(r.data.officialBrand).toBeNull();
    expect(r.data.hostingPlatform).toBeTruthy();
  });
  it("keyword and glob helpers avoid common false positives", () => {
    expect(tokenMatchesKeyword("groups", "ups")).toBe(false);
    expect(tokenMatchesKeyword("upstrack", "ups")).toBe(true);
    expect(tokenMatchesKeyword("pineapple", "apple")).toBe(false);
    expect(globMatch("*-dhl-*", "track-dhl-parcel.com")).toBe(true);
    expect(globMatch("*-dhl-*", "dhl.com")).toBe(false);
  });
  it("parses CSV with quotes and embedded commas", () => {
    expect(parseCsv('domain,notes\nexample.com,"a, ""quoted"" note"\n')).toEqual([["domain", "notes"], ["example.com", 'a, "quoted" note']]);
  });
});
