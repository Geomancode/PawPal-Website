"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button, StatusMessage } from "@/components/ui";
import { reportError } from "@/lib/errorReporting";

type PublicRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  resourceName: string;
};

export default function PublicRouteError({
  error,
  reset,
  resourceName,
}: PublicRouteErrorProps) {
  useEffect(() => {
    reportError(error, {
      source: "public-route-error-boundary",
      resource: resourceName,
      digest: error.digest,
    });
  }, [error, resourceName]);

  return (
    <section
      className="deep-page-shell flex min-h-[100dvh] items-center justify-center bg-paw-page px-5 py-28 text-paw-ink"
      data-testid="public-route-error"
    >
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-brand text-3xl font-extrabold leading-tight sm:text-4xl">
          PawPal could not load this {resourceName}
        </h1>
        <StatusMessage tone="danger" className="mt-4">
          A temporary connection or service problem interrupted this page. Please try again.
        </StatusMessage>
        <Button
          type="button"
          size="lg"
          className="mt-5"
          data-testid="public-route-retry"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </section>
  );
}
