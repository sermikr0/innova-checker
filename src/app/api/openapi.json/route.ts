import { jsonError, jsonOk, route } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { env } from "@/server/env";
import { openApiSpec } from "@/server/openapi";

// The API map is useful to attackers too, so it is private unless API_DOCS_PUBLIC=true.
export const GET = route(async () => {
  if (!env().API_DOCS_PUBLIC) {
    const s = await getSession();
    if (!s || s.user.role !== "SUPER_ADMIN") return jsonError(404, "NOT_FOUND", "Not found.");
  }
  return jsonOk(openApiSpec(env().APP_URL));
});
