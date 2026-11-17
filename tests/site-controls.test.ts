import { describe, expect, it, vi } from "vitest";
import { freePolicyLong, freePolicyShort, siteAccessFrom } from "../src/lib/site-access";

// In-memory stand-in for the FreeScanUsage table (key + period → used).
const rows = new Map<string, number>();
const id = (w: { key: string; period: string }) => `${w.key}|${w.period}`;
vi.mock("../src/server/db", () => ({
  prisma: {
    freeScanUsage: {
      createMany: async ({ data }: { data: { key: string; period: string }[] }) => {
        for (const d of data) if (!rows.has(id(d))) rows.set(id(d), 0);
        return { count: data.length };
      },
      updateMany: async ({ where, data }: { where: { key: string; period: string; used: { lt?: number; gt?: number } }; data: { used: { increment?: number; decrement?: number } } }) => {
        const used = rows.get(id(where));
        if (used === undefined || (where.used.lt !== undefined && !(used < where.used.lt)) || (where.used.gt !== undefined && !(used > where.used.gt))) return { count: 0 };
        rows.set(id(where), used + (data.used.increment ?? 0) - (data.used.decrement ?? 0));
        return { count: 1 };
      },
      findUnique: async ({ where }: { where: { key_period: { key: string; period: string } } }) => {
        const used = rows.get(id(where.key_period));
        return used === undefined ? null : { used };
      },
    },
  },
}));

const { claimFreeScan, freeScansLeft, quotaPeriod } = await import("../src/server/scans/free-quota");

describe("site access switches", () => {
  const base = { loginEnabled: true, registrationEnabled: true, pricingVisible: true, freeScanMode: "TOTAL", freeScanLimit: 1 };
  it("closes registration whenever client sign-in is off", () => {
    expect(siteAccessFrom(base)).toMatchObject({ login: true, register: true, pricing: true });
    expect(siteAccessFrom({ ...base, loginEnabled: false })).toMatchObject({ login: false, register: false });
    expect(siteAccessFrom({ ...base, registrationEnabled: false })).toMatchObject({ login: true, register: false });
    expect(siteAccessFrom({ ...base, pricingVisible: false }).pricing).toBe(false);
  });

  it("describes every free-check policy", () => {
    expect(freePolicyShort({ freeMode: "UNLIMITED", freeLimit: 0 })).toBe("Unlimited free checks");
    expect(freePolicyShort({ freeMode: "DAILY", freeLimit: 3 })).toBe("3 free checks every day");
    expect(freePolicyShort({ freeMode: "DAILY", freeLimit: 1 })).toBe("1 free check every day");
    expect(freePolicyShort({ freeMode: "TOTAL", freeLimit: 1 })).toBe("1 free scan");
    expect(freePolicyShort({ freeMode: "TOTAL", freeLimit: 0 })).toBe("Subscription required");
    expect(freePolicyLong({ freeMode: "DAILY", freeLimit: 2 })).toMatch(/2 free checks per day, renewed at 00:00 Tashkent time/);
  });
});

describe("free-check quota", () => {
  it("uses the Tashkent calendar day for the daily mode", () => {
    // 19:30 UTC is already the next day in Tashkent (UTC+5).
    expect(quotaPeriod("DAILY", new Date("2026-11-17T19:30:00Z"))).toBe("2026-11-18");
    expect(quotaPeriod("DAILY", new Date("2026-11-17T18:59:00Z"))).toBe("2026-11-17");
    expect(quotaPeriod("TOTAL")).toBe("total");
    expect(quotaPeriod("UNLIMITED")).toBeNull();
  });

  it("allows exactly the configured number of checks and can give one back", async () => {
    const q = { freeScanMode: "DAILY" as const, freeScanLimit: 2 };
    expect(await freeScansLeft(q, "dev-a")).toBe(2);
    const first = await claimFreeScan(q, "dev-a");
    expect(first).toBeTypeOf("function");
    expect(await claimFreeScan(q, "dev-a")).toBeTypeOf("function");
    expect(await claimFreeScan(q, "dev-a")).toBeNull();
    expect(await freeScansLeft(q, "dev-a")).toBe(0);
    await first!();
    expect(await freeScansLeft(q, "dev-a")).toBe(1);
    // Another device has its own allowance.
    expect(await claimFreeScan(q, "dev-b")).toBeTypeOf("function");
  });

  it("never limits the unlimited mode and refuses everything at zero", async () => {
    expect(await claimFreeScan({ freeScanMode: "UNLIMITED", freeScanLimit: 0 }, "dev-c")).toBeTypeOf("function");
    expect(await freeScansLeft({ freeScanMode: "UNLIMITED", freeScanLimit: 0 }, "dev-c")).toBeNull();
    expect(await claimFreeScan({ freeScanMode: "TOTAL", freeScanLimit: 0 }, "dev-c")).toBeNull();
  });
});
