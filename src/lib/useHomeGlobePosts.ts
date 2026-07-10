"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeGlobePost } from "./homeGlobePosts";

export type HomeGlobePostsState = "idle" | "loading" | "ready" | "empty" | "error";

type HomeGlobePostsSnapshot = {
  posts: HomeGlobePost[];
  state: HomeGlobePostsState;
};

type UseHomeGlobePostsResult = HomeGlobePostsSnapshot & {
  retry: () => void;
};

type UseHomeGlobePostsOptions = {
  canUseWebGL: boolean;
  globeReady: boolean;
  hasEnteredView: boolean;
  isDocumentVisible: boolean;
};

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const INITIAL_SNAPSHOT: HomeGlobePostsSnapshot = { posts: [], state: "idle" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isClientHomeGlobePost(value: unknown): value is HomeGlobePost {
  if (!isRecord(value)) return false;

  const expiresAt = value.expires_at;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.display_lat === "number" &&
    Number.isFinite(value.display_lat) &&
    value.display_lat >= -90 &&
    value.display_lat <= 90 &&
    typeof value.display_lng === "number" &&
    Number.isFinite(value.display_lng) &&
    value.display_lng >= -180 &&
    value.display_lng <= 180 &&
    typeof value.region_key === "string" &&
    typeof value.location_label === "string" &&
    typeof value.category === "string" &&
    (value.pin_icon === null || typeof value.pin_icon === "string") &&
    (value.snippet === null || typeof value.snippet === "string") &&
    Number.isSafeInteger(value.like_count) &&
    (value.like_count as number) >= 0 &&
    Number.isSafeInteger(value.comment_count) &&
    (value.comment_count as number) >= 0 &&
    typeof value.created_at === "string" &&
    !Number.isNaN(Date.parse(value.created_at)) &&
    (expiresAt === null ||
      (typeof expiresAt === "string" && !Number.isNaN(Date.parse(expiresAt))))
  );
}

function keepUnexpiredPosts(payload: unknown) {
  if (!Array.isArray(payload)) {
    throw new TypeError("Home globe posts response must be an array.");
  }

  const now = Date.now();
  return payload
    .filter(isClientHomeGlobePost)
    .filter((post) => post.expires_at === null || Date.parse(post.expires_at) > now)
    .slice(0, 12);
}

export function useHomeGlobePosts({
  canUseWebGL,
  globeReady,
  hasEnteredView,
  isDocumentVisible,
}: UseHomeGlobePostsOptions): UseHomeGlobePostsResult {
  const [snapshot, setSnapshot] = useState<HomeGlobePostsSnapshot>(INITIAL_SNAPSHOT);
  const [requestVersion, setRequestVersion] = useState(0);
  const requestStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const retry = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    requestStartedRef.current = false;
    setSnapshot(INITIAL_SNAPSHOT);
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (
      requestStartedRef.current ||
      !canUseWebGL ||
      !globeReady ||
      !hasEnteredView ||
      !isDocumentVisible
    ) {
      return;
    }

    const idleWindow = window as IdleWindow;
    let idleHandle: number | null = null;
    let timerHandle: ReturnType<typeof setTimeout> | null = null;

    const fetchPosts = async () => {
      if (requestStartedRef.current || document.visibilityState !== "visible") return;
      requestStartedRef.current = true;
      setSnapshot({ posts: [], state: "loading" });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/home-globe-posts", {
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Home globe posts request failed: ${response.status}`);

        const posts = keepUnexpiredPosts(await response.json());
        setSnapshot({
          posts,
          state: posts.length > 0 ? "ready" : "empty",
        });
      } catch {
        if (controller.signal.aborted) return;
        setSnapshot({ posts: [], state: "error" });
      }
    };

    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(() => {
        void fetchPosts();
      }, { timeout: 1500 });
    } else {
      timerHandle = setTimeout(() => {
        void fetchPosts();
      }, 600);
    }

    return () => {
      if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timerHandle !== null) clearTimeout(timerHandle);
    };
  }, [canUseWebGL, globeReady, hasEnteredView, isDocumentVisible, requestVersion]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  return { ...snapshot, retry };
}
