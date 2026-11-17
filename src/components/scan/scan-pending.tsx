"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScanProgress } from "./scan-progress";

/** Shown while a scan is still running; refreshes the server page when it finishes. */
export function ScanPending({ id, url }: { id: string; url: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ stages: string[]; status: string }>({ stages: [], status: "PENDING" });
  const [lost, setLost] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const j = await res.json();
        if (!alive) return;
        if (j.status === "COMPLETED" || j.status === "FAILED") {
          router.refresh();
          return;
        }
        setState({ stages: j.stages ?? [], status: j.status });
        timer = setTimeout(tick, 800);
      } catch {
        if (alive) setLost(true);
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {lost ? (
        <div className="surface rounded-2xl p-8 text-center">
          <p className="text-white">We lost track of this scan.</p>
          <Link href="/" className="mt-4 inline-block text-orange hover:underline">Start a new scan</Link>
        </div>
      ) : (
        <ScanProgress url={url} stages={state.stages} status={state.status} />
      )}
    </div>
  );
}
