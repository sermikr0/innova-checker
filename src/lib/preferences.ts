import { z } from "zod";

export const preferencesSchema = z.object({
  reportDetail: z.enum(["summary", "full"]).default("summary"),
  historyPageSize: z.union([z.literal(10), z.literal(25), z.literal(50)]).default(25),
  autoOpenReport: z.boolean().default(true),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export function readPreferences(raw: unknown): Preferences {
  const r = preferencesSchema.safeParse(raw ?? {});
  return r.success ? r.data : preferencesSchema.parse({});
}
