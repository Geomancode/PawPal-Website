"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import GlobeStaticPreview from "./GlobeStaticPreview";
import { useI18n } from "@/i18n/I18nProvider";
import { facingScore, passesFacingHysteresis } from "@/lib/globeFacing";
import type { HomeGlobePost } from "@/lib/homeGlobePosts";
import { useHomeGlobePosts } from "@/lib/useHomeGlobePosts";

const GlobeT = dynamic(() => import("react-globe.gl").then((m) => m.default), {
  ssr: false,
});

interface GlobeControls {
  enableZoom: boolean;
  enablePan?: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableDamping: boolean;
  dampingFactor: number;
  minDistance?: number;
  maxDistance?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
  zoomToCursor?: boolean;
  getDistance?: () => number;
  update?: () => void;
  mouseButtons?: {
    LEFT?: unknown;
    MIDDLE?: unknown;
    RIGHT?: unknown;
  };
  touches?: {
    ONE?: unknown;
    TWO?: unknown;
  };
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

interface GlobeRef {
  controls: () => GlobeControls | undefined;
  pointOfView: {
    (): GlobePointOfView;
    (view: GlobePointOfView, transitionMs?: number): void;
  };
  renderer?: () => { domElement?: HTMLCanvasElement } | undefined;
  scene?: () => RuntimeScene | undefined;
}

type GlobePointOfView = {
  lat?: number;
  lng?: number;
  altitude?: number;
};

type RuntimeScene = {
  add: (object: unknown) => void;
  remove: (object: unknown) => void;
};

type RuntimeTexture = {
  colorSpace: string;
  wrapS: unknown;
  wrapT: unknown;
  needsUpdate: boolean;
  dispose: () => void;
};

type RuntimeMesh = {
  name: string;
  rotation: { y: number };
  geometry: { dispose: () => void };
  material: { dispose: () => void } | Array<{ dispose: () => void }>;
};

type MarkerRuntimeState = {
  geometricVisible: boolean;
  facingVisible: boolean;
  visible: boolean;
  score: number;
};

const EARTH_RELIEF_TEXTURE_URL = "/earth-natural-relief.jpg";
const LOCKED_GLOBE_ALTITUDE = 1.82;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const FEATURED_SCORE_EPSILON = 1e-10;
const AUTO_ROTATE_RESUME_DELAY_MS = 1200;
const GLOBE_RENDERER_CONFIG = {
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
} as const;

const PIN_ICON_EMOJI: Readonly<Record<string, string>> = {
  food: "🍽️",
  vet: "🏥",
  store: "🛒",
  adoption: "🐾",
  lostAndFound: "🔍",
  walk: "🚶",
  custom: "✨",
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

function isConcreteCssColor(value: string) {
  return /^(#(?:[0-9a-f]{3,8})|rgba?\(|hsla?\()/i.test(value.trim());
}

function readConcreteCssColorToken(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.color = fallback;
  probe.style.color = `var(${name}, ${fallback})`;
  probe.style.position = "fixed";
  probe.style.pointerEvents = "none";
  probe.style.visibility = "hidden";
  document.documentElement.appendChild(probe);

  const resolvedColor = window.getComputedStyle(probe).color.trim();
  probe.remove();

  return isConcreteCssColor(resolvedColor) ? resolvedColor : fallback;
}

function parseRgbChannel(value: string) {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue)) return null;
  const channel = value.endsWith("%") ? (numericValue / 100) * 255 : numericValue;
  return Math.round(Math.max(0, Math.min(255, channel)));
}

function parseHexColor(value: string): RgbColor | null {
  const hex = value.trim().replace(/^#/, "");
  if (![3, 4, 6, 8].includes(hex.length)) return null;
  const normalized = hex.length <= 4
    ? hex
        .slice(0, 3)
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : hex.slice(0, 6);
  const parsed = Number.parseInt(normalized, 16);
  if (!Number.isFinite(parsed)) return null;
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function parseRgbColor(value: string): RgbColor | null {
  const rgbMatch = value.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) return parseHexColor(value);

  const channels = rgbMatch[1]
    .replaceAll(",", " ")
    .replace("/", " ")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map(parseRgbChannel);

  if (channels.length !== 3 || channels.some((channel) => channel === null)) {
    return null;
  }

  return {
    r: channels[0] ?? 255,
    g: channels[1] ?? 255,
    b: channels[2] ?? 255,
  };
}

function cssColorWithAlpha(color: string, alpha: number) {
  const rgb = parseRgbColor(color) ?? { r: 255, g: 255, b: 255 };
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(clampedAlpha.toFixed(3))})`;
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

function useReducedMotionPreference() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const random = seededRandom(20260526);
  const cloudColor = readConcreteCssColorToken("--color-paw-panel-low", "#ffffff");
  const cloudStop = (alpha: number) => cssColorWithAlpha(cloudColor, alpha);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = "blur(5px)";

  for (let i = 0; i < 130; i += 1) {
    const x = random() * canvas.width;
    const y = 38 + random() * (canvas.height - 76);
    const width = 34 + random() * 145;
    const height = 8 + random() * 34;
    const opacity = 0.08 + random() * 0.2;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, width);
    gradient.addColorStop(0, cloudStop(opacity));
    gradient.addColorStop(0.55, cloudStop(opacity * 0.45));
    gradient.addColorStop(1, "transparent");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((random() - 0.5) * 0.55);
    ctx.scale(1, height / width);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, width, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const threeRuntime = THREE as typeof THREE & {
    CanvasTexture: new (image: HTMLCanvasElement) => RuntimeTexture;
    SRGBColorSpace: string;
    RepeatWrapping: unknown;
    ClampToEdgeWrapping: unknown;
  };
  const texture = new threeRuntime.CanvasTexture(canvas);
  texture.colorSpace = threeRuntime.SRGBColorSpace;
  texture.wrapS = threeRuntime.RepeatWrapping;
  texture.wrapT = threeRuntime.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export default function GlobeComponent() {
  const { path, t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeEl = useRef<GlobeRef | null>(null);
  const markerElementsRef = useRef(new Map<string, HTMLAnchorElement>());
  const markerStatesRef = useRef(new Map<string, MarkerRuntimeState>());
  const postRankRef = useRef(new Map<string, number>());
  const latestPostsRef = useRef<HomeGlobePost[]>([]);
  const latestPovRef = useRef({ lat: 0, lng: 0 });
  const featuredPostIdRef = useRef<string | null>(null);
  const interactionPostIdRef = useRef<string | null>(null);
  const autoRotateResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathRef = useRef(path);
  const markerCopyRef = useRef({
    comments: t("homeGlobeCommentsLabel"),
    likes: t("homeGlobeLikesLabel"),
    linkPrefix: t("homeGlobePostLinkLabel"),
    snippetFallback: t("homeGlobeSnippetFallback"),
  });
  const [dimensions, setDimensions] = useState({ width: 420, height: 420 });
  const [canUseWebGL, setCanUseWebGL] = useState<boolean | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [atmosphereColor, setAtmosphereColor] = useState("#4A90D9");
  const shouldReduceMotion = useReducedMotionPreference();
  const shouldAnimateGlobe = canUseWebGL === true && !shouldReduceMotion && isInView && isDocumentVisible;
  const shouldAnimateGlobeRef = useRef(shouldAnimateGlobe);
  const { posts, retry: retryPosts, state: postsState } = useHomeGlobePosts({
    canUseWebGL: canUseWebGL === true,
    globeReady: isGlobeReady,
    hasEnteredView,
    isDocumentVisible,
  });
  const globeState = canUseWebGL === null ? "checking" : canUseWebGL ? (shouldAnimateGlobe ? "animated" : "paused") : "fallback";

  useEffect(() => {
    latestPostsRef.current = posts;
    pathRef.current = path;
    markerCopyRef.current = {
      comments: t("homeGlobeCommentsLabel"),
      likes: t("homeGlobeLikesLabel"),
      linkPrefix: t("homeGlobePostLinkLabel"),
      snippetFallback: t("homeGlobeSnippetFallback"),
    };
    shouldAnimateGlobeRef.current = shouldAnimateGlobe;
  }, [path, posts, shouldAnimateGlobe, t]);

  const applyAutoRotateState = useCallback(() => {
    const controls = globeEl.current?.controls();
    if (!controls) return;
    const shouldRotate = shouldAnimateGlobeRef.current && interactionPostIdRef.current === null;
    controls.autoRotate = shouldRotate;
    controls.autoRotateSpeed = shouldRotate ? 0.35 : 0;
    controls.update?.();
  }, []);

  const applyMarkerVisibility = useCallback((element: HTMLAnchorElement, visible: boolean) => {
    element.classList.toggle("is-visible", visible);
    element.classList.toggle("is-hidden", !visible);
    element.setAttribute("aria-hidden", visible ? "false" : "true");
    element.tabIndex = visible ? 0 : -1;
    element.style.pointerEvents = visible ? "auto" : "none";
    element.inert = !visible;
  }, []);

  const setFeaturedMarker = useCallback((postId: string | null) => {
    if (featuredPostIdRef.current === postId) return;

    const previousElement = featuredPostIdRef.current
      ? markerElementsRef.current.get(featuredPostIdRef.current)
      : null;
    previousElement?.classList.remove("is-featured");
    previousElement?.removeAttribute("data-featured");

    featuredPostIdRef.current = postId;
    if (!postId) return;

    const nextElement = markerElementsRef.current.get(postId);
    nextElement?.classList.add("is-featured");
    nextElement?.setAttribute("data-featured", "true");
  }, []);

  const selectFeaturedMarker = useCallback(() => {
    const promotedPostId = interactionPostIdRef.current;
    if (promotedPostId && markerStatesRef.current.get(promotedPostId)?.visible) {
      setFeaturedMarker(promotedPostId);
      return;
    }

    let nextFeaturedId: string | null = null;
    let nextFeaturedScore = Number.NEGATIVE_INFINITY;
    let nextFeaturedRank = Number.POSITIVE_INFINITY;

    for (const post of latestPostsRef.current) {
      const state = markerStatesRef.current.get(post.id);
      if (!state?.visible) continue;
      const rank = postRankRef.current.get(post.id) ?? Number.POSITIVE_INFINITY;
      if (
        state.score > nextFeaturedScore + FEATURED_SCORE_EPSILON ||
        (Math.abs(state.score - nextFeaturedScore) <= FEATURED_SCORE_EPSILON &&
          rank < nextFeaturedRank)
      ) {
        nextFeaturedId = post.id;
        nextFeaturedScore = state.score;
        nextFeaturedRank = rank;
      }
    }

    setFeaturedMarker(nextFeaturedId);
  }, [setFeaturedMarker]);

  const promoteMarker = useCallback((postId: string) => {
    if (!markerStatesRef.current.get(postId)?.visible) return;
    if (autoRotateResumeTimerRef.current) {
      clearTimeout(autoRotateResumeTimerRef.current);
      autoRotateResumeTimerRef.current = null;
    }
    interactionPostIdRef.current = postId;
    setFeaturedMarker(postId);
    applyAutoRotateState();
  }, [applyAutoRotateState, setFeaturedMarker]);

  const scheduleMarkerRestore = useCallback((postId: string) => {
    if (interactionPostIdRef.current !== postId) return;
    if (autoRotateResumeTimerRef.current) clearTimeout(autoRotateResumeTimerRef.current);
    autoRotateResumeTimerRef.current = setTimeout(() => {
      if (interactionPostIdRef.current !== postId) return;
      interactionPostIdRef.current = null;
      autoRotateResumeTimerRef.current = null;
      selectFeaturedMarker();
      applyAutoRotateState();
    }, AUTO_ROTATE_RESUME_DELAY_MS);
  }, [applyAutoRotateState, selectFeaturedMarker]);

  const createMarkerElement = useCallback((data: object) => {
    const post = data as HomeGlobePost;
    const existingElement = markerElementsRef.current.get(post.id);
    if (existingElement) return existingElement;

    const copy = markerCopyRef.current;
    const marker = document.createElement("a");
    marker.className = "home-globe-marker is-hidden";
    marker.dataset.homeGlobeMarker = "true";
    marker.dataset.postId = post.id;
    marker.href = pathRef.current(`/post/${encodeURIComponent(post.id)}`);
    marker.draggable = false;
    marker.setAttribute("aria-label", `${copy.linkPrefix} ${post.location_label}`);

    const visual = document.createElement("span");
    visual.className = "home-globe-marker-visual";

    const pin = document.createElement("span");
    pin.className = "home-globe-marker-pin";
    pin.setAttribute("aria-hidden", "true");

    const icon = document.createElement("span");
    icon.className = "home-globe-marker-icon";
    const iconKey = post.pin_icon && PIN_ICON_EMOJI[post.pin_icon]
      ? post.pin_icon
      : post.category;
    icon.textContent = PIN_ICON_EMOJI[iconKey] ?? PIN_ICON_EMOJI.custom;
    pin.appendChild(icon);

    const interactionDot = document.createElement("span");
    interactionDot.className = "home-globe-marker-interaction-dot";
    pin.appendChild(interactionDot);

    const card = document.createElement("span");
    card.className = "home-globe-marker-card-content";

    const location = document.createElement("span");
    location.className = "home-globe-marker-location";
    location.textContent = post.location_label;

    const snippet = document.createElement("span");
    snippet.className = "home-globe-marker-snippet";
    snippet.textContent = post.snippet?.trim() || copy.snippetFallback;

    const stats = document.createElement("span");
    stats.className = "home-globe-marker-stats";
    stats.setAttribute(
      "aria-label",
      `${post.like_count} ${copy.likes}, ${post.comment_count} ${copy.comments}`,
    );

    const likes = document.createElement("span");
    likes.textContent = `♥ ${post.like_count}`;
    const comments = document.createElement("span");
    comments.textContent = `● ${post.comment_count}`;
    stats.append(likes, comments);
    card.append(location, snippet, stats);
    visual.append(pin, card);
    marker.appendChild(visual);

    const score = facingScore(
      { lat: post.display_lat, lng: post.display_lng },
      latestPovRef.current,
    );
    markerElementsRef.current.set(post.id, marker);
    markerStatesRef.current.set(post.id, {
      geometricVisible: false,
      facingVisible: passesFacingHysteresis(score, false),
      visible: false,
      score,
    });
    applyMarkerVisibility(marker, false);

    let isHovered = false;
    let isFocused = false;
    const restoreWhenInactive = () => {
      if (!isHovered && !isFocused) scheduleMarkerRestore(post.id);
    };
    marker.addEventListener("mouseenter", () => {
      isHovered = true;
      promoteMarker(post.id);
    });
    marker.addEventListener("mouseleave", () => {
      isHovered = false;
      restoreWhenInactive();
    });
    marker.addEventListener("focus", () => {
      isFocused = true;
      promoteMarker(post.id);
    });
    marker.addEventListener("blur", () => {
      isFocused = false;
      restoreWhenInactive();
    });
    return marker;
  }, [applyMarkerVisibility, promoteMarker, scheduleMarkerRestore]);

  const updateMarkerFacing = useCallback((view: GlobePointOfView) => {
    if (
      typeof view.lat !== "number" ||
      !Number.isFinite(view.lat) ||
      typeof view.lng !== "number" ||
      !Number.isFinite(view.lng)
    ) {
      return;
    }

    const pov = { lat: view.lat, lng: view.lng };
    latestPovRef.current = pov;

    for (const post of latestPostsRef.current) {
      const state = markerStatesRef.current.get(post.id);
      if (!state) continue;
      const score = facingScore(
        { lat: post.display_lat, lng: post.display_lng },
        pov,
      );
      const facingVisible = passesFacingHysteresis(score, state.facingVisible);
      state.score = score;
      if (state.facingVisible === facingVisible) continue;

      state.facingVisible = facingVisible;
      const visible = state.geometricVisible && facingVisible;
      if (state.visible === visible) continue;
      state.visible = visible;
      const element = markerElementsRef.current.get(post.id);
      if (element) applyMarkerVisibility(element, visible);
    }

    selectFeaturedMarker();
  }, [applyMarkerVisibility, selectFeaturedMarker]);

  const modifyMarkerGeometricVisibility = useCallback((element: HTMLElement, isVisible: boolean) => {
    const marker = element as HTMLAnchorElement;
    const postId = marker.dataset.postId;
    if (!postId) return;
    const state = markerStatesRef.current.get(postId);
    if (!state || state.geometricVisible === isVisible) return;

    state.geometricVisible = isVisible;
    const visible = isVisible && state.facingVisible;
    if (state.visible !== visible) {
      state.visible = visible;
      applyMarkerVisibility(marker, visible);
    }
    selectFeaturedMarker();
  }, [applyMarkerVisibility, selectFeaturedMarker]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      const webgl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setCanUseWebGL(Boolean(webgl));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const syncAtmosphereColor = () => {
      setAtmosphereColor(readConcreteCssColorToken("--color-paw-primary", "#4A90D9"));
    };
    syncAtmosphereColor();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", syncAtmosphereColor);
    return () => mediaQuery.removeEventListener("change", syncAtmosphereColor);
  }, []);

  // Size the WebGL canvas from its CSS slot so the atmosphere can breathe without a clipping mask.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = (width: number, height: number) => {
      const size = Math.round(Math.min(width, height));
      if (size > 0) {
        setDimensions((current) => (
          current.width === size && current.height === size
            ? current
            : { width: size, height: size }
        ));
      }
    };

    updateSize(element.clientWidth, element.clientHeight);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateSize(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => {
        setIsInView(true);
        setHasEnteredView(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = Boolean(entry?.isIntersecting);
        setIsInView(intersecting);
        if (intersecting) setHasEnteredView(true);
      },
      { threshold: 0.08 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  // Globe controls — set up after mount + keep zoom disabled.
  useEffect(() => {
    const disableGlobeZoom = () => {
      const globe = globeEl.current;
      if (!globe) return;

      // Camera distance keeps the globe size fixed while preserving the full atmosphere.
      globe.pointOfView({ altitude: LOCKED_GLOBE_ALTITUDE }, 0);

      // Controls
      const controls = globe.controls();
      if (controls) {
        const threeRuntime = THREE as typeof THREE & {
          MOUSE: { ROTATE: unknown };
          TOUCH: { ROTATE: unknown };
        };

        controls.enableZoom = false;
        controls.enablePan = false;
        const lockedDistance = controls.getDistance?.();
        if (typeof lockedDistance === "number" && Number.isFinite(lockedDistance)) {
          controls.minDistance = lockedDistance;
          controls.maxDistance = lockedDistance;
        }
        controls.minZoom = 1;
        controls.maxZoom = 1;
        controls.zoomSpeed = 0;
        controls.zoomToCursor = false;
        controls.mouseButtons = {
          LEFT: threeRuntime.MOUSE.ROTATE,
          MIDDLE: threeRuntime.MOUSE.ROTATE,
          RIGHT: threeRuntime.MOUSE.ROTATE,
        };
        controls.touches = {
          ONE: threeRuntime.TOUCH.ROTATE,
          TWO: threeRuntime.TOUCH.ROTATE,
        };
        const shouldRotate = shouldAnimateGlobe && interactionPostIdRef.current === null;
        controls.autoRotate = shouldRotate;
        controls.autoRotateSpeed = shouldRotate ? 0.35 : 0;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minPolarAngle = Math.PI / 3.5;
        controls.maxPolarAngle = Math.PI - Math.PI / 3.5;
        controls.update?.();
      }
    };

    // Globe internals can settle/reset asynchronously, so keep reapplying the no-zoom contract.
    const timer = setTimeout(disableGlobeZoom, 300);
    const interval = setInterval(disableGlobeZoom, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [shouldAnimateGlobe]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const BLOCK_OPTS: AddEventListenerOptions = { passive: false, capture: true };

    const kill = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
    };

    const blockZoom = (e: Event) => kill(e);
    const blockMultiTouch = (e: Event) => {
      const te = e as TouchEvent;
      if (te.touches?.length > 1) kill(e);
    };

    const ZOOM_EVENTS = ["wheel", "dblclick", "gesturestart", "gesturechange", "gestureend"] as const;
    const TOUCH_EVENTS = ["touchstart", "touchmove"] as const;

    const attachTo = (target: EventTarget) => {
      ZOOM_EVENTS.forEach((evt) =>
        target.addEventListener(evt, blockZoom, BLOCK_OPTS),
      );
      TOUCH_EVENTS.forEach((evt) =>
        target.addEventListener(evt, blockMultiTouch, BLOCK_OPTS),
      );
    };

    const detachFrom = (target: EventTarget) => {
      ZOOM_EVENTS.forEach((evt) =>
        target.removeEventListener(evt, blockZoom, BLOCK_OPTS),
      );
      TOUCH_EVENTS.forEach((evt) =>
        target.removeEventListener(evt, blockMultiTouch, BLOCK_OPTS),
      );
    };

    attachTo(element);

    // ── Canvas may mount asynchronously — observe for it ─────────────
    let canvas: HTMLCanvasElement | null =
      (globeEl.current?.renderer?.()?.domElement as HTMLCanvasElement | undefined) ??
      element.querySelector("canvas");

    if (canvas) attachTo(canvas);

    const observer = new MutationObserver(() => {
      const c =
        (globeEl.current?.renderer?.()?.domElement as HTMLCanvasElement | undefined) ??
        element.querySelector("canvas");
      if (c && c !== canvas) {
        if (canvas) detachFrom(canvas);
        canvas = c;
        attachTo(canvas);
      }
    });
    observer.observe(element, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      detachFrom(element);
      if (canvas) detachFrom(canvas);
    };
  }, []);

  const keepGlobeZoomLocked = useCallback((view: GlobePointOfView) => {
    updateMarkerFacing(view);
    if (
      typeof view.altitude === "number" &&
      Math.abs(view.altitude - LOCKED_GLOBE_ALTITUDE) > 0.001
    ) {
      globeEl.current?.pointOfView({ altitude: LOCKED_GLOBE_ALTITUDE }, 0);
    }
  }, [updateMarkerFacing]);

  const handleGlobeReady = useCallback(() => {
    // The library can emit ready before React assigns the imperative ref.
    // Preserve the one-shot readiness gate even in that narrow window.
    setIsGlobeReady(true);
    const globe = globeEl.current;
    if (!globe) return;
    globe.pointOfView({ altitude: LOCKED_GLOBE_ALTITUDE }, 0);
    updateMarkerFacing(globe.pointOfView());
    applyAutoRotateState();
  }, [applyAutoRotateState, updateMarkerFacing]);

  useEffect(() => {
    const ranks = new Map<string, number>();
    posts.forEach((post, index) => ranks.set(post.id, index));
    postRankRef.current = ranks;

    if (posts.length === 0) {
      setFeaturedMarker(null);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const view = globeEl.current?.pointOfView();
      if (view) updateMarkerFacing(view);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [posts, setFeaturedMarker, updateMarkerFacing]);

  useEffect(
    () => () => {
      if (autoRotateResumeTimerRef.current) {
        clearTimeout(autoRotateResumeTimerRef.current);
      }
      markerElementsRef.current.clear();
      markerStatesRef.current.clear();
    },
    [],
  );

  // Subtle procedural cloud shell, separate from the relief texture.
  useEffect(() => {
    if (!shouldAnimateGlobe) return;

    let frame = 0;
    let clouds: RuntimeMesh | null = null;
    let cloudScene: RuntimeScene | null = null;
    let texture: RuntimeTexture | null = null;

    const timer = setTimeout(() => {
      const scene = globeEl.current?.scene?.();
      if (!scene) return;
      cloudScene = scene;

      texture = createCloudTexture();
      if (!texture) return;

      const threeRuntime = THREE as typeof THREE & {
        SphereGeometry: new (radius: number, widthSegments: number, heightSegments: number) => { dispose: () => void };
        MeshLambertMaterial: new (options: Record<string, unknown>) => { dispose: () => void };
        Mesh: new (geometry: unknown, material: unknown) => RuntimeMesh;
        AdditiveBlending: unknown;
      };
      const geometry = new threeRuntime.SphereGeometry(101.1, 96, 96);
      const material = new threeRuntime.MeshLambertMaterial({
        map: texture as never,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: threeRuntime.AdditiveBlending,
      });

      clouds = new threeRuntime.Mesh(geometry, material);
      clouds.name = "pawpal-cloud-layer";
      scene.add(clouds);

      const animateClouds = () => {
        if (clouds) clouds.rotation.y += 0.00055;
        frame = requestAnimationFrame(animateClouds);
      };
      animateClouds();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
      if (clouds) {
        cloudScene?.remove(clouds);
        clouds.geometry.dispose();
        if (Array.isArray(clouds.material)) {
          clouds.material.forEach((material) => material.dispose());
        } else {
          clouds.material.dispose();
        }
      }
      texture?.dispose();
    };
  }, [shouldAnimateGlobe]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full touch-none select-none items-center justify-center cursor-grab active:cursor-grabbing"
      role="region"
      aria-label={t("homeGlobeRegionLabel")}
      data-testid="home-globe"
      data-globe-state={globeState}
      data-posts-state={postsState}
      data-marker-count={posts.length}
      data-webgl={canUseWebGL === null ? "checking" : canUseWebGL ? "available" : "unavailable"}
      data-reduced-motion={shouldReduceMotion ? "true" : "false"}
      data-in-view={isInView ? "true" : "false"}
      data-has-entered-view={hasEnteredView ? "true" : "false"}
      data-document-visible={isDocumentVisible ? "true" : "false"}
    >
      {canUseWebGL === null ? (
        <GlobeStaticPreview
          className="home-globe-static-preview"
          statusLabel={t("homeGlobeLoadingPreviewLabel")}
          ariaLabel={t("homeGlobeLoadingPreviewLabel")}
          pulseStatus={!shouldReduceMotion}
        />
      ) : canUseWebGL ? (
        <>
          <GlobeT
            ref={globeEl}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl={EARTH_RELIEF_TEXTURE_URL}
            bumpImageUrl={EARTH_RELIEF_TEXTURE_URL}
            bumpScale={0.028}
            showGlobe={true}
            backgroundColor="rgba(0, 0, 0, 0)"
            atmosphereColor={atmosphereColor}
            atmosphereAltitude={0.2}
            showGraticules={false}
            animateIn={false}
            rendererConfig={GLOBE_RENDERER_CONFIG}
            onGlobeReady={handleGlobeReady}
            onZoom={keepGlobeZoomLocked}
            htmlElementsData={posts}
            htmlLat="display_lat"
            htmlLng="display_lng"
            htmlAltitude={0.018}
            htmlElement={createMarkerElement}
            htmlElementVisibilityModifier={modifyMarkerGeometricVisibility}
            htmlTransitionDuration={0}
          />
          {postsState === "empty" ? (
            <p className="home-globe-posts-status" role="status">
              {t("homeGlobeEmptyLabel")}
            </p>
          ) : postsState === "error" ? (
            <div
              className="home-globe-posts-status flex items-center gap-2"
              role="status"
              style={{ maxWidth: "16.5rem", pointerEvents: "auto" }}
            >
              <span>{t("homeGlobeErrorLabel")}</span>
              <button
                type="button"
                className="inline-flex min-h-paw-min-tap shrink-0 items-center justify-center rounded-paw-pill border border-paw-outline-variant bg-paw-panel px-3 font-black text-paw-ink transition hover:border-paw-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                data-testid="home-globe-retry"
                onClick={retryPosts}
              >
                Try again
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <GlobeStaticPreview
          className="home-globe-static-preview"
          statusLabel={t("homeGlobeStaticPreviewLabel")}
          ariaLabel={t("homeGlobeStaticPreviewLabel")}
          pulseStatus={false}
        />
      )}
    </div>
  );
}
