// Browser device fingerprint, sent with sign-in, registration, payments and
// scans so the server can recognise the same machine in a private window or
// after cookies are cleared. Browsers never expose MAC addresses, so this is
// built from hardware and configuration traits that private mode leaves alone.
//
// Only stable traits are used: canvas and audio readouts are deliberately left
// out because Brave and Safari add per-session noise to them, and screen size
// and pixel ratio change with zoom or a second monitor.

export const DEVICE_HEADER = "x-innova-device";

const FONT_PROBES = [
  "Arial", "Arial Black", "Calibri", "Cambria", "Candara", "Comic Sans MS", "Consolas", "Courier New", "Georgia",
  "Helvetica", "Helvetica Neue", "Impact", "Lucida Console", "Menlo", "Monaco", "Palatino", "Segoe UI", "SF Pro Text",
  "Tahoma", "Times New Roman", "Trebuchet MS", "Ubuntu", "Verdana", "Roboto", "Noto Sans", "DejaVu Sans", "Liberation Sans",
];

function webgl(): { vendor: string; renderer: string; maxTexture: number } {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { vendor: "", renderer: "", maxTexture: 0 };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: String(ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)).slice(0, 120),
      renderer: String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).slice(0, 200),
      maxTexture: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0,
    };
  } catch {
    return { vendor: "", renderer: "", maxTexture: 0 };
  }
}

function installedFonts(): string[] {
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return [];
    const sample = "mmmmmmmmmmlli10OQ@#";
    const width = (font: string) => {
      ctx.font = `72px ${font}`;
      return ctx.measureText(sample).width;
    };
    const base = ["monospace", "serif", "sans-serif"].map(width);
    return FONT_PROBES.filter((f) => ["monospace", "serif", "sans-serif"].some((fallback, i) => width(`"${f}", ${fallback}`) !== base[i]));
  } catch {
    return [];
  }
}

function family(ua: string): { browser: string; os: string } {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /YaBrowser/.test(ua) ? "Yandex" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return { browser, os };
}

let cached: string | null = null;

/** Base64url-encoded JSON of the stable traits; the server hashes it with a secret. */
export function deviceFingerprint(): string {
  if (cached) return cached;
  if (typeof window === "undefined") return "";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const gl = webgl();
  const traits = {
    v: 1,
    ...family(nav.userAgent),
    platform: String(nav.platform ?? "").slice(0, 40),
    cores: nav.hardwareConcurrency ?? 0,
    memory: nav.deviceMemory ?? 0,
    touch: nav.maxTouchPoints ?? 0,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    lang: (nav.languages ?? [nav.language]).slice(0, 5).join(","),
    color: screen.colorDepth ?? 0,
    glVendor: gl.vendor,
    glRenderer: gl.renderer,
    glMaxTexture: gl.maxTexture,
    fonts: installedFonts().join(","),
  };
  const json = JSON.stringify(traits);
  cached = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return cached;
}

export function deviceHeaders(): Record<string, string> {
  const fp = deviceFingerprint();
  return fp ? { [DEVICE_HEADER]: fp } : {};
}
