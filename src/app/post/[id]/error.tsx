"use client";

import PublicRouteError from "@/components/PublicRouteError";

export default function PostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicRouteError error={error} reset={reset} resourceName="post" />;
}
