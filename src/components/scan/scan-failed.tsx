import Link from "next/link";
import { OctagonX, ScanSearch } from "lucide-react";
import { getT } from "@/i18n/server";
import { scanText } from "@/i18n/messages/report-scan";

export async function ScanFailed({ url, message, scanAgainHref }: { url: string; message: string | null; scanAgainHref: string }) {
  const t = await getT(scanText);
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className="surface rounded-3xl p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-v-malicious/10 ring-1 ring-v-malicious/30">
          <OctagonX className="size-7 text-v-malicious" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-white">{t.failedTitle}</h1>
        <p className="mt-2 font-mono text-sm break-all text-muted-foreground">{url}</p>
        <p className="mt-4 text-sm text-white/75">{message ?? t.failedDefault}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t.failedNote}</p>
        <Link href={scanAgainHref} className="btn-orange mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
          <ScanSearch className="size-4" /> {t.scanAnother}
        </Link>
      </div>
    </div>
  );
}
