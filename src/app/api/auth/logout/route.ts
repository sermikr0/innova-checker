import { assertSameOrigin, jsonOk, route } from "@/server/http";
import { destroySession } from "@/server/auth/session";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  await destroySession();
  return jsonOk({ ok: true, redirect: "/" });
});
