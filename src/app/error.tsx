"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="surface max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">An unexpected error occurred. Please try again. If the problem continues, contact support.</p>
        <button type="button" onClick={reset} className="btn-orange mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
          <RotateCcw className="size-4" /> Try again
        </button>
      </div>
    </main>
  );
}
