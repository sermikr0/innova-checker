import { describe, expect, it } from "vitest";
import { guardListing, officialLooking, popularityRank } from "@/server/threat-intel/guard";

// The popular-domains file is read from prisma/data when present.
describe("false-positive guard", () => {
  it("never lists Google country sites or their service hosts", () => {
    expect(popularityRank("google.rs")).toBe(1);
    expect(guardListing({ domain: "maps.google.rs", scope: "HOST" }, 1).action).toBe("drop");
    expect(guardListing({ domain: "google.no", scope: "DOMAIN" }, 1).action).toBe("drop");
  });

  it("never lists government or education domains", () => {
    expect(guardListing({ domain: "s.kemkes.go.id", scope: "HOST" }, 1).action).toBe("drop");
    expect(guardListing({ domain: "diplomatie.gov.mr", scope: "DOMAIN" }, 1).action).toBe("drop");
    expect(guardListing({ domain: "albcschool.edu", scope: "DOMAIN" }, 1).action).toBe("drop");
  });

  it("keeps attacker tenant sites on platforms but not the platform itself", () => {
    expect(guardListing({ domain: "reviewfiledocu2023.myportfolio.com", scope: "HOST" }, 1).action).toBe("keep");
    expect(guardListing({ domain: "uspsservicetrack.blogspot.com.es", scope: "HOST" }, 1).action).toBe("keep");
    expect(guardListing({ domain: "netlify.app", scope: "DOMAIN" }, 1).action).toBe("drop");
  });

  it("keeps unknown throw-away domains and exact phishing URLs", () => {
    expect(guardListing({ domain: "inpost.autos", scope: "DOMAIN" }, 1).action).toBe("keep");
    expect(guardListing({ domain: "https://maps.google.lt/url?q=https://evil.b-cdn.net/", scope: "URL" }, 0).action).toBe("keep");
    expect(guardListing({ domain: "https://www.google.com/", scope: "URL" }, 0).action).toBe("drop");
  });

  it("flags carrier-looking domains for certificate verification", () => {
    expect(officialLooking("dhlparcel.se")).toBe(true);
    expect(officialLooking("fedex.co.il")).toBe(true);
    expect(officialLooking("random-shop.com")).toBe(false);
  });
});
