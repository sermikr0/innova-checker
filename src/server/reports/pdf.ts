import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { MODULE_LABELS, MODULE_ORDER, type ReportDTO } from "@/lib/report-types";
import { REPORT_DISCLAIMER } from "@/lib/report-text";
import { isBlacklisted, isDeadLink, labelFor, noticeFor, taglineFor, type VerdictKey } from "@/lib/verdict";

// Server-side PDF rendering with pdf-lib's built-in Helvetica (WinAnsi). Text that
// cannot be encoded is transliterated or replaced, never dropped silently.

const A4: [number, number] = [595.28, 841.89];
const M = 46;
const W = A4[0] - M * 2;

const C = {
  ink: rgb(0.07, 0.07, 0.08),
  body: rgb(0.2, 0.2, 0.23),
  muted: rgb(0.45, 0.45, 0.5),
  line: rgb(0.88, 0.88, 0.9),
  band: rgb(0.043, 0.043, 0.051),
  orange: rgb(1, 0.42, 0),
  white: rgb(1, 1, 1),
};

const VERDICT_RGB: Record<VerdictKey, RGB> = {
  TRUSTED: rgb(0.1, 0.6, 0.55),
  SAFE: rgb(0.13, 0.62, 0.33),
  LOW_RISK: rgb(0.4, 0.62, 0.1),
  SUSPICIOUS: rgb(0.82, 0.6, 0.02),
  HIGH_RISK: rgb(0.92, 0.42, 0.1),
  MALICIOUS: rgb(0.86, 0.18, 0.18),
  INCONCLUSIVE: rgb(0.45, 0.45, 0.5),
};

const STATUS_RGB: Record<string, RGB> = {
  PASS: rgb(0.13, 0.62, 0.33),
  INFO: rgb(0.2, 0.45, 0.85),
  WARN: rgb(0.8, 0.55, 0.02),
  FAIL: rgb(0.86, 0.18, 0.18),
  ERROR: rgb(0.86, 0.18, 0.18),
  UNAVAILABLE: rgb(0.45, 0.45, 0.5),
  NOT_CONFIGURED: rgb(0.45, 0.45, 0.5),
  SKIPPED: rgb(0.45, 0.45, 0.5),
};

function clean(s: string): string {
  return s
    .replace(/[“”«»„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[→⇒]/g, "->")
    .replace(/·/g, "-")
    .replace(/[✓✔]/g, "v")
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "?");
}

class Writer {
  doc: PDFDocument;
  page!: PDFPage;
  y = 0;
  constructor(
    doc: PDFDocument,
    readonly regular: PDFFont,
    readonly bold: PDFFont,
    readonly mono: PDFFont,
  ) {
    this.doc = doc;
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - M;
  }
  ensure(h: number) {
    if (this.y - h < M + 24) this.newPage();
  }
  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const out: string[] = [];
    for (const para of clean(text).split("\n")) {
      let line = "";
      for (const word of para.split(/(\s+)/)) {
        const candidate = line + word;
        if (font.widthOfTextAtSize(candidate, size) <= width) {
          line = candidate;
          continue;
        }
        if (line.trim()) out.push(line.trimEnd());
        // Hard-break very long tokens such as URLs and hashes.
        let w = word.trimStart();
        while (font.widthOfTextAtSize(w, size) > width) {
          let i = w.length;
          while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > width) i--;
          out.push(w.slice(0, i));
          w = w.slice(i);
        }
        line = w;
      }
      if (line.trim() || !out.length) out.push(line.trimEnd());
    }
    return out;
  }
  text(text: string, o: { font?: PDFFont; size?: number; color?: RGB; x?: number; width?: number; gap?: number } = {}) {
    const font = o.font ?? this.regular;
    const size = o.size ?? 10;
    const x = o.x ?? M;
    const lh = size * 1.38;
    for (const line of this.wrap(text, font, size, o.width ?? W - (x - M))) {
      this.ensure(lh);
      this.page.drawText(line, { x, y: this.y - size, size, font, color: o.color ?? C.body });
      this.y -= lh;
    }
    this.y -= o.gap ?? 0;
  }
  rule(gap = 8) {
    this.ensure(gap * 2);
    this.y -= gap;
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: M + W, y: this.y }, thickness: 0.6, color: C.line });
    this.y -= gap;
  }
  heading(text: string) {
    this.ensure(40);
    this.y -= 10;
    this.page.drawRectangle({ x: M, y: this.y - 14, width: 3, height: 14, color: C.orange });
    this.page.drawText(clean(text), { x: M + 10, y: this.y - 12, size: 13, font: this.bold, color: C.ink });
    this.y -= 24;
  }
  keyValues(rows: [string, string][]) {
    const kw = 120;
    for (const [k, v] of rows) {
      const lines = this.wrap(v || "-", this.regular, 9.5, W - kw);
      this.ensure(lines.length * 13 + 2);
      this.page.drawText(clean(k), { x: M, y: this.y - 9.5, size: 9.5, font: this.bold, color: C.muted });
      for (const l of lines) {
        this.page.drawText(l, { x: M + kw, y: this.y - 9.5, size: 9.5, font: this.regular, color: C.ink });
        this.y -= 13;
      }
      this.y -= 2;
    }
  }
}

function fmt(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export async function renderReportPdf(r: ReportDTO): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Innova Checker report - ${r.domain}`);
  doc.setAuthor("Innova Checker by Innova Networks");
  doc.setSubject(`URL security report for ${r.normalizedUrl}`);
  doc.setCreator("Innova Checker");
  doc.setCreationDate(new Date());
  const [regular, bold, mono] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold), doc.embedFont(StandardFonts.Courier)]);
  const w = new Writer(doc, regular, bold, mono);

  // Header band
  const bandH = 92;
  w.page.drawRectangle({ x: 0, y: A4[1] - bandH, width: A4[0], height: bandH, color: C.band });
  w.page.drawRectangle({ x: 0, y: A4[1] - bandH, width: A4[0], height: 2.5, color: C.orange });
  try {
    const png = await doc.embedPng(await fs.readFile(path.join(process.cwd(), "public/brand/innova-logo-white.png")));
    const h = 38;
    w.page.drawImage(png, { x: M, y: A4[1] - bandH / 2 - h / 2, width: (png.width / png.height) * h, height: h });
  } catch {
    w.page.drawText("INNOVA NETWORKS", { x: M, y: A4[1] - 52, size: 16, font: bold, color: C.white });
  }
  w.page.drawText("URL SECURITY REPORT", { x: A4[0] - M - bold.widthOfTextAtSize("URL SECURITY REPORT", 13), y: A4[1] - 44, size: 13, font: bold, color: C.white });
  const sub = "Innova Checker";
  w.page.drawText(sub, { x: A4[0] - M - regular.widthOfTextAtSize(sub, 9.5), y: A4[1] - 60, size: 9.5, font: regular, color: rgb(1, 0.6, 0.3) });
  w.y = A4[1] - bandH - 24;

  // Verdict box
  const verdict = (r.verdict ?? "INCONCLUSIVE") as VerdictKey;
  const blacklisted = isBlacklisted(r);
  const notice = noticeFor(verdict, isDeadLink(r), blacklisted);
  const vc = VERDICT_RGB[verdict];
  const boxH = 74;
  w.page.drawRectangle({ x: M, y: w.y - boxH, width: W, height: boxH, color: rgb(0.975, 0.975, 0.98), borderColor: C.line, borderWidth: 0.8 });
  w.page.drawRectangle({ x: M, y: w.y - boxH, width: 5, height: boxH, color: vc });
  w.page.drawText(clean(labelFor(verdict, blacklisted).toUpperCase()), { x: M + 20, y: w.y - 32, size: 20, font: bold, color: vc });
  w.page.drawText(clean(taglineFor(verdict, isDeadLink(r), blacklisted)), { x: M + 20, y: w.y - 50, size: 10, font: regular, color: C.muted });
  const score = `${r.riskScore ?? 0}`;
  w.page.drawText(score, { x: M + W - 150, y: w.y - 40, size: 30, font: bold, color: C.ink });
  w.page.drawText("/100 risk", { x: M + W - 150 + bold.widthOfTextAtSize(score, 30) + 4, y: w.y - 40, size: 10, font: regular, color: C.muted });
  w.page.drawText(clean(`Risk level: ${r.riskLevel ?? "-"}  |  Coverage: ${r.confidence ?? 0}%`), { x: M + W - 150, y: w.y - 58, size: 8.5, font: regular, color: C.muted });
  w.y -= boxH + 16;

  w.keyValues([
    ["Scanned URL", r.normalizedUrl],
    ...(r.finalUrl && r.finalUrl !== r.normalizedUrl ? ([["Final destination", r.finalUrl]] as [string, string][]) : []),
    ["Domain", r.registrableDomain ?? r.domain],
    ["Scan completed", fmt(r.completedAt)],
    ["Scan duration", r.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)} s` : "-"],
    ["Report ID", r.id],
  ]);
  if (r.summary) {
    w.y -= 6;
    w.text(r.summary, { size: 10.5, color: C.ink, gap: 4 });
  }
  w.text(notice, { font: bold, size: 10.5, color: rgb(0.8, 0.1, 0.1), gap: 4 });

  if (r.domainDb) {
    w.heading("Domain Intelligence Database");
    w.text(r.domainDb.reason, { size: 10, color: C.ink, gap: 3 });
    for (const m of r.domainDb.matches) {
      w.keyValues([
        ["List", `${m.record.listType} (${m.record.trustStatus.replace(/_/g, " ").toLowerCase()})`],
        ["Record", `${m.record.domain}${m.record.platformName ? ` - ${m.record.platformName}` : ""}${m.record.companyName ? ` (${m.record.companyName})` : ""}`],
        ["Matched host", `${m.host} (${m.matchType})`],
        ["Source", m.record.verificationSource ?? "-"],
        ["Verified", fmt(m.record.verifiedAt)],
      ]);
      w.y -= 4;
    }
  }

  // Sections
  for (const m of MODULE_ORDER) {
    const fs2 = r.findings.filter((f) => f.module === m);
    if (!fs2.length) continue;
    w.heading(MODULE_LABELS[m]);
    for (const f of fs2) {
      const tag = f.status.replace("_", " ");
      const titleLines = w.wrap(`${f.title}: ${f.result}`, bold, 9.5, W - 88);
      w.ensure(titleLines.length * 13 + 28);
      w.page.drawText(tag, { x: M, y: w.y - 9.5, size: 7.5, font: bold, color: STATUS_RGB[f.status] ?? C.muted });
      for (const l of titleLines) {
        w.page.drawText(l, { x: M + 88, y: w.y - 9.5, size: 9.5, font: bold, color: C.ink });
        w.y -= 13;
      }
      w.text(f.explanation, { x: M + 88, size: 8.5, color: C.body });
      w.text(`Source: ${f.source}  |  ${fmt(f.checkedAt)}${f.weight ? `  |  risk +${f.weight}` : ""}`, { x: M + 88, size: 7.5, color: C.muted, gap: 5 });
    }
  }

  w.heading("Security Recommendations");
  w.text(notice, { font: bold, size: 10, color: rgb(0.8, 0.1, 0.1), gap: 4 });
  r.recommendations.forEach((rec, i) => w.text(`${i + 1}. ${rec}`, { size: 10, color: C.ink, gap: 3 }));

  w.rule(10);
  w.text(`Disclaimer: ${REPORT_DISCLAIMER}`, { size: 8.5, color: C.muted });

  // Footers
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const t = clean(`Innova Checker by Innova Networks  -  Report ${r.id}  -  Page ${i + 1} of ${pages.length}`);
    p.drawText(t, { x: M, y: 24, size: 7.5, font: regular, color: C.muted });
  });

  return doc.save();
}
