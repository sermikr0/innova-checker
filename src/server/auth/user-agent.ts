/** Human-readable device label from a User-Agent. Informational only, never trusted. */
export function describeUserAgent(ua: string): string {
  const s = ua || "";
  const browser =
    /Edg\//.test(s) ? "Edge"
    : /OPR\/|Opera/.test(s) ? "Opera"
    : /YaBrowser/.test(s) ? "Yandex Browser"
    : /Firefox\//.test(s) ? "Firefox"
    : /Chrome\//.test(s) ? "Chrome"
    : /Safari\//.test(s) ? "Safari"
    : /curl|wget|python|node|axios|Go-http/i.test(s) ? "API client"
    : "Browser";
  const os =
    /Windows NT/.test(s) ? "Windows"
    : /Android/.test(s) ? "Android"
    : /iPhone|iPad|iPod/.test(s) ? "iOS"
    : /Mac OS X|Macintosh/.test(s) ? "macOS"
    : /CrOS/.test(s) ? "ChromeOS"
    : /Linux/.test(s) ? "Linux"
    : "Unknown OS";
  return `${browser} on ${os}`;
}
