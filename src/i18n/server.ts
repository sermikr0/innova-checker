import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, pickLocale, type Locale, type Messages } from "./config";

/** Interface language of the current request (cookie first, then Accept-Language). */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return pickLocale((await headers()).get("accept-language"));
});

/** Text of one namespace in the request's language (server components, route handlers, actions). */
export async function getT<T>(messages: Messages<T>): Promise<T> {
  return messages[await getLocale()];
}
