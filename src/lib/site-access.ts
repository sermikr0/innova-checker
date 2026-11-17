// Website access switches and the free-scan policy, shared by server and client code.

export type FreeScanModeKey = "UNLIMITED" | "DAILY" | "TOTAL";

export type SiteAccess = {
  /** Clients may sign in (Super Admins always can). */
  login: boolean;
  /** New accounts may be created: needs both registration and client sign-in. */
  register: boolean;
  /** Plans and prices are shown and checkout is open. */
  pricing: boolean;
  freeMode: FreeScanModeKey;
  freeLimit: number;
};

export function siteAccessFrom(s: { loginEnabled: boolean; registrationEnabled: boolean; pricingVisible: boolean; freeScanMode: string; freeScanLimit: number }): SiteAccess {
  return {
    login: s.loginEnabled,
    register: s.loginEnabled && s.registrationEnabled,
    pricing: s.pricingVisible,
    freeMode: s.freeScanMode as FreeScanModeKey,
    freeLimit: s.freeScanLimit,
  };
}

const plural = (n: number, word: string) => `${n} free ${word}${n === 1 ? "" : "s"}`;

/** Short line under the scan box, e.g. "3 free checks every day". */
export function freePolicyShort(a: Pick<SiteAccess, "freeMode" | "freeLimit">): string {
  if (a.freeMode === "UNLIMITED") return "Unlimited free checks";
  if (a.freeLimit <= 0) return "Subscription required";
  return a.freeMode === "DAILY" ? `${plural(a.freeLimit, "check")} every day` : plural(a.freeLimit, "scan");
}

/** One-sentence explanation for FAQ answers and notices. */
export function freePolicyLong(a: Pick<SiteAccess, "freeMode" | "freeLimit">): string {
  if (a.freeMode === "UNLIMITED") return "Checking links is currently free and unlimited for everyone. Fair-use limits only stop automated abuse.";
  if (a.freeLimit <= 0) return "Checking links requires an active subscription plan.";
  if (a.freeMode === "DAILY") return `Every device gets ${plural(a.freeLimit, "check")} per day, renewed at 00:00 Tashkent time. A subscription plan removes the limit.`;
  return `Every device gets ${plural(a.freeLimit, "check")} to try the full analysis. After that, a subscription plan is required.`;
}
