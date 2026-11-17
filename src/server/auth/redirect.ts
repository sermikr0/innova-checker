/** Only same-site relative paths are accepted as post-login destinations. */
export function safeNextPath(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || next.length > 300) return fallback;
  return next;
}
