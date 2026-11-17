import { describe, expect, it } from "vitest";
import { lookupKeys, matchRecords, normalizeRecordDomain, type DomainRecordRef } from "@/server/scanner/domain-db";

const rec = (domain: string, listType: DomainRecordRef["listType"], scope: DomainRecordRef["scope"] = "DOMAIN"): DomainRecordRef => ({
  id: `${listType}:${domain}`, domain, listType, scope, trustStatus: "X", platformName: null, companyName: null, category: null, officialUrl: null, verificationSource: null, verifiedAt: null, notes: null,
});

const DB = [
  rec("highway.com", "WHITELIST"),
  rec("gohighway.com", "WHITELIST"),
  rec("amazon.com", "WHITELIST"),
  rec("hgihway.com", "BLACKLIST"),
  rec("sfvnooyf-ijndgf.s3-website-us-east-1.amazonaws.com", "BLACKLIST", "HOST"),
  rec("https://compromised.example.org/wp-content/login.php", "BLACKLIST", "URL"),
  rec("avhighway.com", "SUSPICIOUS"),
];

describe("domain database matching", () => {
  it("exact and safe subdomain matches", () => {
    expect(matchRecords("https://highway.com/", DB)[0]).toMatchObject({ matchType: "exact", record: { domain: "highway.com" } });
    expect(matchRecords("https://relay.amazon.com/loadboard", DB)[0]).toMatchObject({ matchType: "subdomain", record: { domain: "amazon.com" } });
  });
  it("never trusts look-alikes that merely contain the brand", () => {
    for (const u of ["https://highway-security-example.com/", "https://gohighway-login-example.com/", "https://highway.com.evil.example/", "https://myhighway.com/"]) {
      expect(matchRecords(u, DB).filter((m) => m.record.listType === "WHITELIST")).toHaveLength(0);
    }
  });
  it("respects HOST scope and does not blacklist the whole cloud platform", () => {
    expect(matchRecords("http://sfvnooyf-ijndgf.s3-website-us-east-1.amazonaws.com/x.html", DB)[0]?.record.listType).toBe("BLACKLIST");
    expect(matchRecords("http://other-bucket.s3-website-us-east-1.amazonaws.com/", DB)).toHaveLength(0);
  });
  it("matches exact URL records only for that URL", () => {
    expect(matchRecords("https://compromised.example.org/wp-content/login.php#x", DB)[0]?.matchType).toBe("url");
    expect(matchRecords("https://compromised.example.org/", DB)).toHaveLength(0);
  });
  it("matches blacklisted typosquats and suspicious look-alikes", () => {
    expect(matchRecords("https://www.hgihway.com/login", DB)[0]?.record.listType).toBe("BLACKLIST");
    expect(matchRecords("https://avhighway.com/", DB)[0]?.record.listType).toBe("SUSPICIOUS");
  });
  it("produces parent lookup keys and normalises input", () => {
    expect(lookupKeys("a.b.example.com")).toEqual(["a.b.example.com", "b.example.com", "example.com"]);
    expect(normalizeRecordDomain("HTTPS://WWW.Highway.COM./path", "DOMAIN")).toBe("www.highway.com");
    expect(normalizeRecordDomain("example.com/login?x=1#y", "URL")).toBe("https://example.com/login?x=1");
  });
});
