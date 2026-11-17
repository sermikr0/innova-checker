// Developer CLI: runs the analysis engine against one URL without the database.
// Usage: npx tsx scripts/scan-cli.ts <url> [--json]
import { analyze, InMemoryCache } from "../src/server/scanner/engine";
import { DEFAULT_SCANNER_SETTINGS } from "../src/server/scanner/data/defaults";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("usage: tsx scripts/scan-cli.ts <url> [--json]");
    process.exit(2);
  }
  const report = await analyze(url, DEFAULT_SCANNER_SETTINGS, {
    cache: new InMemoryCache(),
    keys: {
      googleSafeBrowsing: process.env.GOOGLE_SAFE_BROWSING_API_KEY || undefined,
      virusTotal: process.env.VIRUSTOTAL_API_KEY || undefined,
      urlhaus: process.env.URLHAUS_AUTH_KEY || undefined,
      phishTank: process.env.PHISHTANK_APP_KEY || undefined,
      abuseIpdb: process.env.ABUSEIPDB_API_KEY || undefined,
    },
    onStage: (s) => {
      process.stderr.write(`  · ${s}\n`);
    },
  });
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`\n${report.normalizedUrl}\n→ ${report.verdict}  score=${report.riskScore} (${report.riskLevel})  confidence=${report.confidence}%  ${report.durationMs}ms`);
  console.log(`  ${report.summary}`);
  console.log(`  final: ${report.finalUrl}`);
  console.log(`  modules: ${report.modules.map((m) => `${m.key}:${m.status}`).join(" ")}`);
  for (const f of report.findings.filter((f) => f.status !== "PASS")) {
    console.log(`  [${f.status.padEnd(14)}] ${f.module.padEnd(9)} ${f.code.padEnd(26)} w=${String(f.weight).padStart(3)} ${f.result}`);
  }
}
main().catch((e) => {
  console.error("ERROR:", e?.message ?? e);
  process.exit(1);
});
