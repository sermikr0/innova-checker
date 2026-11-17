import { describe, expect, it } from "vitest";
import { listingFor, matchLogistics } from "@/server/threat-intel/logistics";

const none = () => false;

describe("logistics classifier", () => {
  it("recognises brands and lures without matching ordinary words", () => {
    expect(matchLogistics("pm-dostawadhl29015.cyou")?.rule.brand).toBe("DHL");
    expect(matchLogistics("usps.com-trackqay.top")?.rule.brand).toBe("USPS");
    expect(matchLogistics("inpost-capital.org")?.inRegistrable).toBe(true);
    expect(matchLogistics("contractcloudsecure.com")).toBeNull();
    expect(matchLogistics("permission-check.example.com")).toBeNull();
    expect(matchLogistics("bafkreih57dhl7w4risoad.ipfs.example.org")).toBeNull();
  });
});

describe("listing rules", () => {
  it("lists the registrable domain when the attacker owns it", () => {
    expect(listingFor("usps.com-trackqay.top", { brandInRegistrable: false, isOfficial: none })).toEqual({ domain: "com-trackqay.top", scope: "DOMAIN" });
    expect(listingFor("dhl-pl.top", { isOfficial: none })).toEqual({ domain: "dhl-pl.top", scope: "DOMAIN" });
  });

  it("never lists a whole hosting platform", () => {
    expect(listingFor("dhl-express-dev.firebaseapp.com", { isOfficial: none })).toEqual({ domain: "dhl-express-dev.firebaseapp.com", scope: "HOST" });
    expect(listingFor("storage.googleapis.com", { url: "https://storage.googleapis.com/b/dhl.html", isOfficial: none })).toEqual({ domain: "https://storage.googleapis.com/b/dhl.html", scope: "URL" });
    expect(listingFor("storage.googleapis.com", { isOfficial: none })).toBeNull();
  });

  it("lists only the URL on a compromised ordinary site", () => {
    expect(listingFor("bakery-example.com", { url: "https://bakery-example.com/wp-content/dhl/index.php", isOfficial: none })).toEqual({ domain: "https://bakery-example.com/wp-content/dhl/index.php", scope: "URL" });
    expect(listingFor("support-tracking.ijcai-22.org", { isOfficial: none })).toEqual({ domain: "support-tracking.ijcai-22.org", scope: "HOST" });
  });

  it("only lists exact URLs on official domains", () => {
    const official = (h: string) => h === "docs.google.com";
    expect(listingFor("docs.google.com", { url: "https://docs.google.com/forms/d/x", isOfficial: official })?.scope).toBe("URL");
    expect(listingFor("docs.google.com", { isOfficial: official })).toBeNull();
  });
});
