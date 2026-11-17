import type { Finding } from "../types";
import type { SafeResponse } from "../net/safe-http";
import { makeFinding } from "../util";

// File-download analysis. Only the first bytes of a download are kept in memory for
// signature checks; the full body (up to maxDownloadBytes) is streamed through
// SHA-256. Files are never written to disk, opened or executed.

export type FileCategory =
  | "executable"
  | "script"
  | "shortcut"
  | "disk-image"
  | "installer"
  | "archive"
  | "office-macro"
  | "office"
  | "pdf"
  | "html"
  | "image"
  | "media"
  | "text"
  | "unknown";

export interface DownloadData {
  isDownload: boolean;
  url: string | null;
  filename: string | null;
  extension: string | null;
  extensions: string[];
  declaredMime: string | null;
  disposition: string | null;
  contentLength: number | null;
  bytesAnalyzed: number;
  truncated: boolean;
  detectedType: string | null;
  category: FileCategory | null;
  sha256: string | null;
  hashComplete: boolean;
  indicators: string[];
}

const EXT_CATEGORY: Record<string, FileCategory> = {
  exe: "executable", scr: "executable", com: "executable", pif: "executable", dll: "executable", cpl: "executable", sys: "executable", elf: "executable", bin: "executable", apk: "executable", xapk: "executable", dmg: "disk-image", app: "executable",
  msi: "installer", msix: "installer", msixbundle: "installer", appx: "installer", appxbundle: "installer", pkg: "installer", deb: "installer", rpm: "installer",
  js: "script", jse: "script", vbs: "script", vbe: "script", wsf: "script", wsh: "script", ps1: "script", psm1: "script", bat: "script", cmd: "script", hta: "script", sh: "script", py: "script", jar: "executable", reg: "script", scf: "script", inf: "script", chm: "script", xll: "office-macro",
  lnk: "shortcut", url: "shortcut", website: "shortcut", "library-ms": "shortcut", searchconnector: "shortcut",
  iso: "disk-image", img: "disk-image", vhd: "disk-image", vhdx: "disk-image",
  zip: "archive", rar: "archive", "7z": "archive", gz: "archive", tgz: "archive", tar: "archive", cab: "archive", ace: "archive", arj: "archive", xz: "archive", bz2: "archive", z: "archive",
  docm: "office-macro", xlsm: "office-macro", pptm: "office-macro", dotm: "office-macro", xltm: "office-macro", xlam: "office-macro", ppam: "office-macro",
  doc: "office", docx: "office", xls: "office", xlsx: "office", ppt: "office", pptx: "office", rtf: "office", odt: "office", ods: "office", one: "office",
  pdf: "pdf",
  html: "html", htm: "html", shtml: "html", svg: "html", xhtml: "html", mht: "html", mhtml: "html",
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", bmp: "image",
  mp4: "media", mp3: "media", mov: "media", avi: "media", webm: "media", wav: "media",
  txt: "text", csv: "text", json: "text", xml: "text",
};

const HIGH_RISK: FileCategory[] = ["executable", "script", "shortcut", "disk-image", "installer"];

function detectSignature(buf: Buffer): { type: string; category: FileCategory } | null {
  const b = buf;
  const starts = (sig: number[], off = 0) => sig.every((v, i) => b[off + i] === v);
  if (b.length < 4) return null;
  if (starts([0x4d, 0x5a])) return { type: "Windows PE executable (MZ)", category: "executable" };
  if (starts([0x7f, 0x45, 0x4c, 0x46])) return { type: "ELF executable", category: "executable" };
  if (starts([0xcf, 0xfa, 0xed, 0xfe]) || starts([0xfe, 0xed, 0xfa, 0xce]) || starts([0xca, 0xfe, 0xba, 0xbe])) return { type: "Mach-O / Java class", category: "executable" };
  if (starts([0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00])) return { type: "Windows shortcut (LNK)", category: "shortcut" };
  if (b.length > 0x8006 && b.subarray(0x8001, 0x8006).toString("latin1") === "CD001") return { type: "ISO 9660 disk image", category: "disk-image" };
  if (starts([0x63, 0x6f, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x78])) return { type: "VHD disk image", category: "disk-image" };
  if (starts([0x76, 0x68, 0x64, 0x78, 0x66, 0x69, 0x6c, 0x65])) return { type: "VHDX disk image", category: "disk-image" };
  if (starts([0x25, 0x50, 0x44, 0x46])) return { type: "PDF document", category: "pdf" };
  if (starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    const s = b.toString("latin1");
    if (/_VBA_PROJECT|VBA\x00|Macros/i.test(s)) return { type: "OLE2 Office document with VBA macros", category: "office-macro" };
    if (/Installer|MsiDigitalSignature|\x05SummaryInformation[\s\S]{0,200}Installation Database/i.test(s)) return { type: "Windows Installer (MSI)", category: "installer" };
    return { type: "OLE2 compound document (legacy Office)", category: "office" };
  }
  if (starts([0x50, 0x4b, 0x03, 0x04])) {
    const s = b.toString("latin1");
    if (/vbaProject\.bin/i.test(s)) return { type: "Office Open XML with macros (vbaProject.bin)", category: "office-macro" };
    if (/AndroidManifest\.xml|classes\.dex/.test(s)) return { type: "Android application (APK)", category: "executable" };
    if (/META-INF\/MANIFEST\.MF/.test(s) && /\.class/.test(s)) return { type: "Java archive (JAR)", category: "executable" };
    if (/\[Content_Types\]\.xml/.test(s)) return { type: "Office Open XML document", category: "office" };
    if (/AppxManifest\.xml/.test(s)) return { type: "MSIX/AppX package", category: "installer" };
    if (/\.(exe|scr|lnk|js|vbs|hta|bat|cmd|ps1|iso|img|msi|jar|wsf)\b/i.test(s)) return { type: "ZIP archive containing executable content", category: "archive" };
    return { type: "ZIP archive", category: "archive" };
  }
  if (starts([0x52, 0x61, 0x72, 0x21])) return { type: "RAR archive", category: "archive" };
  if (starts([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return { type: "7-Zip archive", category: "archive" };
  if (starts([0x1f, 0x8b])) return { type: "GZIP archive", category: "archive" };
  if (starts([0x4d, 0x53, 0x43, 0x46])) return { type: "Microsoft Cabinet (CAB)", category: "archive" };
  if (starts([0x7b, 0x5c, 0x72, 0x74, 0x66])) return { type: "Rich Text Format (RTF)", category: "office" };
  if (starts([0xff, 0xd8, 0xff])) return { type: "JPEG image", category: "image" };
  if (starts([0x89, 0x50, 0x4e, 0x47])) return { type: "PNG image", category: "image" };
  if (starts([0x47, 0x49, 0x46, 0x38])) return { type: "GIF image", category: "image" };
  const head = b.subarray(0, 2048).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("#!")) return { type: "Script with shebang", category: "script" };
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return { type: "SVG image", category: "html" };
  if (head.startsWith("<!doctype html") || head.startsWith("<html") || head.startsWith("<script") || head.startsWith("<hta:")) return { type: "HTML document", category: "html" };
  if (/createobject\(|wscript\.shell|powershell(\.exe)?\s+-(e|enc|encodedcommand|nop|w hidden)/i.test(head)) return { type: "Windows script (VBS/JS/PowerShell)", category: "script" };
  return null;
}

function filenameFrom(disposition: string | null, url: URL): string | null {
  if (disposition) {
    const star = /filename\*\s*=\s*(?:UTF-8|ISO-8859-1)?''([^;]+)/i.exec(disposition);
    if (star) {
      try {
        return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
      } catch {
        /* fall through */
      }
    }
    const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
    if (plain) return plain[1].trim();
  }
  const last = url.pathname.split("/").filter(Boolean).pop();
  if (!last) return null;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export function analyzeDownload(ctx: { response: SafeResponse | null; finalUrl: string | null }): { data: DownloadData; findings: Finding[]; status: "ok" | "skipped" } {
  const { response } = ctx;
  const findings: Finding[] = [];
  const source = "Download inspection (signature + SHA-256, never executed)";
  const empty: DownloadData = { isDownload: false, url: ctx.finalUrl, filename: null, extension: null, extensions: [], declaredMime: null, disposition: null, contentLength: null, bytesAnalyzed: 0, truncated: false, detectedType: null, category: null, sha256: null, hashComplete: false, indicators: [] };

  if (!response || !ctx.finalUrl) {
    findings.push(makeFinding("download", { code: "DOWNLOAD_PRESENT", title: "File download", status: "SKIPPED", result: "No response to inspect", explanation: "The destination could not be retrieved, so download checks did not run.", source }));
    return { data: empty, findings, status: "skipped" };
  }

  const url = new URL(ctx.finalUrl);
  const disposition = response.headers["content-disposition"] ?? null;
  const filename = filenameFrom(disposition, url);
  const extensions = (filename ?? "").toLowerCase().split(".").slice(1).map((e) => e.replace(/[^a-z0-9-]/g, "")).filter(Boolean);
  const extension = extensions.at(-1) ?? null;
  const extCategory = extension ? EXT_CATEGORY[extension] ?? null : null;
  const isAttachment = !!disposition && /attachment/i.test(disposition);
  const isDownload = response.bodyKind === "binary" || isAttachment;

  if (!isDownload) {
    if (extCategory && HIGH_RISK.includes(extCategory)) {
      findings.push(makeFinding("download", { code: "DOWNLOAD_PRESENT", title: "File download", status: "INFO", result: `Link names a .${extension} file but returned a web page`, explanation: "The link path looks like an executable file, but the server answered with HTML (for example an error page or a download landing page).", evidence: { filename }, source }));
    } else {
      findings.push(makeFinding("download", { code: "DOWNLOAD_PRESENT", title: "File download", status: "PASS", result: "Opens a web page, not a file", explanation: "The link does not trigger a file download.", source }));
    }
    return { data: { ...empty, filename, extension, extensions }, findings, status: "ok" };
  }

  const sig = detectSignature(response.body);
  const category: FileCategory = sig?.category ?? extCategory ?? "unknown";
  const data: DownloadData = {
    isDownload: true,
    url: ctx.finalUrl,
    filename,
    extension,
    extensions,
    declaredMime: response.contentType || null,
    disposition,
    contentLength: response.headers["content-length"] ? Number(response.headers["content-length"]) : null,
    bytesAnalyzed: response.bytesRead,
    truncated: response.truncated,
    detectedType: sig?.type ?? null,
    category,
    sha256: response.sha256,
    hashComplete: response.hashComplete,
    indicators: [],
  };

  const label = `${filename ?? "file"}${sig ? ` (${sig.type})` : ""}`;
  if (HIGH_RISK.includes(category)) {
    findings.push(makeFinding("download", { code: "DOWNLOAD_TYPE", title: "Downloaded file type", status: "FAIL", severity: "HIGH", weight: 45, result: `Delivers ${category === "disk-image" ? "a disk image" : category === "shortcut" ? "a shortcut file" : category === "installer" ? "an installer" : category === "script" ? "a script" : "an executable"}: ${label}`, explanation: "Business links (invoices, waybills, shipment documents) never require running a program, script, shortcut or disk image. These file types are the main way malware is delivered by e-mail links.", evidence: { filename, detectedType: sig?.type, declaredMime: data.declaredMime }, source }));
  } else if (category === "office-macro") {
    findings.push(makeFinding("download", { code: "DOWNLOAD_TYPE", title: "Downloaded file type", status: "FAIL", severity: "HIGH", weight: 35, result: `Macro-enabled Office document: ${label}`, explanation: "Macro documents can run code when opened. Do not enable editing or content on files received through links.", evidence: { filename, detectedType: sig?.type }, source }));
  } else if (category === "archive") {
    const execInside = sig?.type.includes("executable content");
    findings.push(makeFinding("download", { code: "DOWNLOAD_TYPE", title: "Downloaded file type", status: "WARN", severity: execInside ? "HIGH" : "MEDIUM", weight: execInside ? 35 : 15, result: `Archive: ${label}`, explanation: execInside ? "The archive appears to contain executable or script files." : "Archives are used to smuggle executables past e-mail filters. Inspect the contents before opening anything inside.", evidence: { filename, detectedType: sig?.type }, source }));
  } else if (category === "html") {
    findings.push(makeFinding("download", { code: "DOWNLOAD_TYPE", title: "Downloaded file type", status: "WARN", severity: "MEDIUM", weight: 18, result: `HTML/SVG file download: ${label}`, explanation: "HTML and SVG attachments open locally in the browser, bypassing URL filters. They are commonly used for credential phishing and HTML smuggling.", source }));
  } else {
    findings.push(makeFinding("download", { code: "DOWNLOAD_TYPE", title: "Downloaded file type", status: "INFO", result: `${category === "unknown" ? "Unrecognized file" : label}`, explanation: "The link downloads a file. The file type is not one of the high-risk categories; still open it only if you expected it.", evidence: { filename, detectedType: sig?.type, declaredMime: data.declaredMime }, source }));
  }

  // Extension vs real content
  if (sig && extCategory && extCategory !== sig.category && HIGH_RISK.includes(sig.category) && !HIGH_RISK.includes(extCategory)) {
    findings.push(makeFinding("download", { code: "DOWNLOAD_MISMATCH", title: "File type disguise", status: "FAIL", severity: "CRITICAL", weight: 55, result: `Named .${extension} but is really ${sig.type}`, explanation: "The file name claims a harmless document type, but its content is executable. This disguise is deliberate.", evidence: { filename, detectedType: sig.type }, source }));
    data.indicators.push("extension/content mismatch");
  }
  const declared = (data.declaredMime ?? "").toLowerCase();
  if (sig && HIGH_RISK.includes(sig.category) && /pdf|image\/|msword|officedocument|text\//.test(declared)) {
    findings.push(makeFinding("download", { code: "DOWNLOAD_MIME_MISMATCH", title: "MIME type disguise", status: "FAIL", severity: "HIGH", weight: 40, result: `Declared ${declared}, actually ${sig.type}`, explanation: "The server labels the file as a document or image while it is executable content.", source }));
  }
  if (extensions.length >= 2) {
    const inner = extensions.at(-2) as string;
    if (EXT_CATEGORY[inner] && ["office", "pdf", "image", "text", "media"].includes(EXT_CATEGORY[inner]) && extCategory && HIGH_RISK.includes(extCategory)) {
      findings.push(makeFinding("download", { code: "DOWNLOAD_DOUBLE_EXT", title: "Double file extension", status: "FAIL", severity: "HIGH", weight: 35, result: filename ?? "", explanation: `"${filename}" ends in .${extension}. Windows hides known extensions by default, so it appears as a .${inner} document.`, source }));
      data.indicators.push("double extension");
    }
  }
  if (filename && /[‮‭‏]/.test(filename)) {
    findings.push(makeFinding("download", { code: "DOWNLOAD_RTLO", title: "Right-to-left override in file name", status: "FAIL", severity: "HIGH", weight: 40, result: "Hidden bidi character", explanation: "The file name contains an invisible character that reverses how the extension is displayed (e.g. invoice‮fdp.exe shows as invoiceexe.pdf).", source }));
  }
  if (category === "pdf") {
    const s = response.body.toString("latin1");
    const active = ["/JavaScript", "/JS", "/OpenAction", "/Launch", "/EmbeddedFile", "/AA", "/URI"].filter((k) => s.includes(k));
    if (active.some((k) => k !== "/URI")) {
      findings.push(makeFinding("download", { code: "DOWNLOAD_PDF_ACTIVE", title: "Active PDF content", status: "WARN", severity: "MEDIUM", weight: 20, result: active.join(", "), explanation: "The PDF contains auto-run actions, JavaScript, launch actions or embedded files (in the inspected portion).", source }));
    }
  }

  if (data.sha256) {
    findings.push(makeFinding("download", { code: "DOWNLOAD_HASH", title: "File hash (SHA-256)", status: "INFO", result: data.sha256, explanation: "Fingerprint of the downloaded file. Threat-intelligence providers are queried with this hash when configured.", evidence: { sha256: data.sha256, bytes: data.bytesAnalyzed }, source }));
  } else {
    findings.push(makeFinding("download", { code: "DOWNLOAD_HASH", title: "File hash (SHA-256)", status: "UNAVAILABLE", result: data.truncated ? "File exceeds the analysis size limit" : "Hash not computed", explanation: data.truncated ? `Only the first ${data.bytesAnalyzed.toLocaleString("en-US")} bytes were read, so a full-file hash is not available.` : "The download could not be fully read.", source }));
  }

  return { data, findings, status: "ok" };
}
