"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { StoreOrder, StoreOrdersPage } from "@/lib/storeOrders";

export function useStoreOrders() {
  const { user, loading: authLoading, authGeneration, getSessionForGeneration } = useAuth();
  const owner = !authLoading ? user?.id ?? null : null;
  const [request, setRequest] = useState<{ generation: number; prefix: StoreOrder[]; cursor: StoreOrdersPage["next_cursor"]; revision: number }>({ generation: -1, prefix: [], cursor: null, revision: 0 });
  const [result, setResult] = useState<{ generation: number; items: StoreOrder[]; cursor: StoreOrdersPage["next_cursor"]; hasMore: boolean; loading: boolean; error: boolean } | null>(null);
  const cursor = request.generation === authGeneration ? request.cursor : null;
  const prefix = request.generation === authGeneration ? request.prefix : null;

  useEffect(() => {
    const token = getSessionForGeneration(authGeneration)?.access_token;
    if (!owner || !token) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted || !getSessionForGeneration(authGeneration)) return;
      setResult((old) => ({ generation: authGeneration, items: old?.generation === authGeneration ? old.items : [],
        cursor: old?.generation === authGeneration ? old.cursor : null,
        hasMore: old?.generation === authGeneration ? old.hasMore : false, loading: true, error: false }));
    });
    const url = '/api/store/orders' + (cursor ? '?before=' + encodeURIComponent(JSON.stringify(cursor)) : '');
    fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('orders-unavailable');
        return await response.json() as StoreOrdersPage;
      })
      .then((page) => {
        if (controller.signal.aborted || !getSessionForGeneration(authGeneration)) return;
        setResult({ generation: authGeneration,
          items: [...(prefix ?? []), ...page.items],
          cursor: page.next_cursor, hasMore: page.has_more, loading: false, error: false });
      })
      .catch(() => {
        if (controller.signal.aborted || !getSessionForGeneration(authGeneration)) return;
        setResult((old) => ({ generation: authGeneration, items: old?.generation === authGeneration ? old.items : [],
          cursor: old?.generation === authGeneration ? old.cursor : null, hasMore: old?.generation === authGeneration ? old.hasMore : false,
          loading: false, error: true }));
      });
    return () => controller.abort();
  }, [owner, authGeneration, getSessionForGeneration, cursor, prefix, request.revision]);

  // This guard runs during render, before effect cleanup, so an account switch
  // never renders the old owner's rows while the new request is starting.
  const current = owner && result?.generation === authGeneration ? result : null;
  return {
    signedIn: Boolean(owner), authLoading, orders: current?.items ?? [],
    loading: Boolean(owner) && (!current || current.loading), error: current?.error ?? false,
    hasMore: current?.hasMore ?? false,
    retry: () => setRequest((old) => ({ generation: authGeneration, prefix: prefix ?? [], cursor, revision: old.revision + 1 })),
    loadMore: () => {
      if (!current?.loading && current?.hasMore && current.cursor) {
        setRequest((old) => ({ generation: authGeneration, prefix: current.items, cursor: current.cursor, revision: old.revision + 1 }));
      }
    },
  };
}
