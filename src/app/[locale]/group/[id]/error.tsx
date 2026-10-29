"use client";

import PublicRouteError from "@/components/PublicRouteError";

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicRouteError error={error} reset={reset} resourceName="group" />;
}
