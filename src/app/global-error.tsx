"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { reportError } from "@/lib/errorReporting";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, {
      source: "global-error-boundary",
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffdf9] px-5 py-16 text-[#24342f]">
          <section className="w-full max-w-xl rounded-[8px] border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-red-700">
              Application error
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-[#1d2c27]">
              PawPal could not recover this view
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#52605b]">
              A rendering or connection issue interrupted the app shell.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-[8px] bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
