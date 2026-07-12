"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, Card, CardContent, StatusMessage } from "@/components/ui";
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
      <body className="bg-paw-page text-paw-ink">
        <main className="deep-page-shell flex min-h-[100dvh] items-center justify-center bg-paw-page px-5 py-16 text-paw-ink">
          <Card className="w-full max-w-xl">
            <CardContent className="space-y-paw-lg">
            <StatusMessage tone="critical" title="Application error">
              A rendering or connection issue interrupted the app shell.
            </StatusMessage>
            <h1 className="text-2xl font-extrabold text-paw-ink">
              PawPal could not recover this view
            </h1>
            <p className="text-sm leading-6 text-paw-body">
              Try reloading this view. PawPal has recorded the error context for review.
            </p>
            <Button
              type="button"
              onClick={reset}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            </CardContent>
          </Card>
        </main>
      </body>
    </html>
  );
}
