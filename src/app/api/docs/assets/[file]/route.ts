import { readFile } from "node:fs/promises";
import path from "node:path";

// Swagger UI's own static files, served from the installed package so no CDN is needed.
const FILES: Record<string, string> = { "swagger-ui.css": "text/css; charset=utf-8", "swagger-ui-bundle.js": "text/javascript; charset=utf-8" };

export async function GET(_req: Request, ctx: RouteContext<"/api/docs/assets/[file]">) {
  const { file } = await ctx.params;
  const type = FILES[file];
  if (!type) return new Response("Not found", { status: 404 });
  const body = await readFile(path.join(process.cwd(), "node_modules", "swagger-ui-dist", file));
  return new Response(body, { headers: { "content-type": type, "cache-control": "public, max-age=86400" } });
}
