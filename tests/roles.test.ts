import { describe, expect, it } from "vitest";
import { ROLE_LABELS, hasUnlimitedAccess, isAdminRole } from "@/lib/roles";

describe("roles", () => {
  it("grants unlimited usage to admins and unlimited users only", () => {
    expect(hasUnlimitedAccess("SUPER_ADMIN")).toBe(true);
    expect(hasUnlimitedAccess("UNLIMITED")).toBe(true);
    expect(hasUnlimitedAccess("USER")).toBe(false);
  });
  it("keeps the admin panel for Super Admins only", () => {
    expect(isAdminRole("UNLIMITED")).toBe(false);
    expect(isAdminRole("SUPER_ADMIN")).toBe(true);
    expect(ROLE_LABELS.UNLIMITED).toBe("Unlimited user");
  });
});
