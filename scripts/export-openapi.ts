// Writes the OpenAPI document to docs/openapi.json. Usage: npm run openapi:export
import { mkdirSync, writeFileSync } from "node:fs";
import { openApiSpec } from "../src/server/openapi";

mkdirSync("docs", { recursive: true });
writeFileSync("docs/openapi.json", `${JSON.stringify(openApiSpec(process.env.APP_URL ?? "http://localhost:3000"), null, 2)}\n`);
console.log("✓ docs/openapi.json written");
