import { describe, expect, it } from "vitest";
import { BlockedDestinationError, assertHostAllowed, isPublicIp } from "@/server/scanner/net/ip-policy";
import { InvalidUrlError, normalizeInputUrl } from "@/server/scanner/normalize";

describe("SSRF IP policy", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "64:ff9b::7f00:1", "2001:db8::1", "198.51.100.7"])("blocks %s", (ip) => {
    expect(isPublicIp(ip)).toBe(false);
  });
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])("allows public %s", (ip) => {
    expect(isPublicIp(ip)).toBe(true);
  });
  it.each(["localhost", "foo.localhost", "metadata.google.internal", "printer.local", "intranet", "x.home.arpa"])("blocks internal host %s", (h) => {
    expect(() => assertHostAllowed(h)).toThrow(BlockedDestinationError);
  });
});

describe("URL normalisation", () => {
  it("restores defanged links and assumes https", () => {
    expect(normalizeInputUrl("hxxp://example[.]com/path").normalized).toBe("http://example.com/path");
    expect(normalizeInputUrl("example.com").normalized).toBe("https://example.com/");
  });
  it.each(["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "http://0x7f000001/", "http://2130706433/", "http://[::1]/", "http://169.254.169.254/latest/meta-data/", ""])("rejects %s", (u) => {
    expect(() => normalizeInputUrl(u)).toThrow(InvalidUrlError);
  });
});
