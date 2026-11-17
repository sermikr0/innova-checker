// Role helpers shared by server and client code.

export type RoleKey = "SUPER_ADMIN" | "UNLIMITED" | "USER";

export const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super Admin",
  UNLIMITED: "Unlimited user",
  USER: "User",
};

export const ROLE_OPTIONS: { value: RoleKey; label: string }[] = [
  { value: "USER", label: "User (needs a subscription)" },
  { value: "UNLIMITED", label: "Unlimited user (no subscription or device limit)" },
  { value: "SUPER_ADMIN", label: "Super Admin (full admin panel)" },
];

/** Administrators and unlimited users scan without a subscription, device limit or quota. */
export function hasUnlimitedAccess(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "UNLIMITED";
}

export function isAdminRole(role: string): boolean {
  return role === "SUPER_ADMIN";
}
