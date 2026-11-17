import { env } from "../env";

export const SESSION_COOKIE = "ic_session";
export const DEVICE_COOKIE = "ic_device";
export const ANON_COOKIE = "ic_anon";

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    // Secure whenever the app is served over HTTPS; plain-HTTP intranet installs keep working.
    secure: env().APP_URL.startsWith("https://"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
