"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-destructive/50 bg-destructive/10 p-6">
        <h2 className="text-lg font-semibold text-destructive">Errore</h2>
        <p className="mt-2 text-sm text-foreground">{error.message}</p>
        {process.env.NODE_ENV === "development" && error.stack && (
          <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
            {error.stack}
          </pre>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Riprova
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
