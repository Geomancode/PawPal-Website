"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { watchPublicResourceHistory } from "@/lib/publicResourceHistory";

function HistoryWatcher() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const watcher = useRef<ReturnType<typeof watchPublicResourceHistory> | null>(null);
  useEffect(() => {
    const subscription = watchPublicResourceHistory(window);
    watcher.current = subscription;
    return () => {
      subscription.dispose();
      watcher.current = null;
    };
  }, []);
  useEffect(() => { watcher.current?.update(); }, [pathname, query]);
  return null;
}

export default function PublicResourceNavigation() {
  return <Suspense fallback={null}><HistoryWatcher /></Suspense>;
}
