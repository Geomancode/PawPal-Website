"use client";

import { RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="deep-page-shell flex min-h-[100dvh] items-center justify-center bg-paw-page px-5 py-28 text-paw-ink">
      <div className="mx-auto w-full max-w-xl">
        <StatusMessage tone="danger" title="PawPal could not load this page">
          {error.message || "A connection or rendering issue interrupted this view."}
        </StatusMessage>
        <Button type="button" size="lg" onClick={reset} className="mt-5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </section>
  );
}
