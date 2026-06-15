"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

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

const EARTH_RELIEF_TEXTURE_URL = "/earth-natural-relief.jpg";
const LOCKED_GLOBE_ALTITUDE = 1.82;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const GLOBE_RENDERER_CONFIG = {
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
} as const;

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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = "blur(5px)";

  for (let i = 0; i < 130; i += 1) {
    const x = random() * canvas.width;
    const y = 38 + random() * (canvas.height - 76);
    const width = 34 + random() * 145;
    const height = 8 + random() * 34;
    const opacity = 0.08 + random() * 0.2;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, width);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    gradient.addColorStop(0.55, `rgba(255, 255, 255, ${opacity * 0.45})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeEl = useRef<GlobeRef | null>(null);
  const [dimensions, setDimensions] = useState({ width: 420, height: 420 });
  const [canUseWebGL, setCanUseWebGL] = useState<boolean | null>(null);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const shouldReduceMotion = useReducedMotionPreference();
  const shouldAnimateGlobe = canUseWebGL === true && !shouldReduceMotion && isInView && isDocumentVisible;
  const globeState = canUseWebGL === null ? "checking" : canUseWebGL ? (shouldAnimateGlobe ? "animated" : "paused") : "fallback";

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
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
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
        controls.autoRotate = shouldAnimateGlobe;
        controls.autoRotateSpeed = shouldAnimateGlobe ? 0.35 : 0;
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
    if (
      typeof view.altitude === "number" &&
      Math.abs(view.altitude - LOCKED_GLOBE_ALTITUDE) > 0.001
    ) {
      globeEl.current?.pointOfView({ altitude: LOCKED_GLOBE_ALTITUDE }, 0);
    }
  }, []);

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
      role="img"
      aria-label="Interactive PawPal Earth globe preview"
      data-testid="home-globe"
      data-globe-state={globeState}
      data-webgl={canUseWebGL === null ? "checking" : canUseWebGL ? "available" : "unavailable"}
      data-reduced-motion={shouldReduceMotion ? "true" : "false"}
      data-in-view={isInView ? "true" : "false"}
      data-document-visible={isDocumentVisible ? "true" : "false"}
    >
      {canUseWebGL === null ? (
        <div className={`${shouldReduceMotion ? "" : "animate-spin"} h-14 w-14 rounded-full border-4 border-paw-primary-soft border-t-paw-primary`} />
      ) : canUseWebGL ? (
        <GlobeT
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl={EARTH_RELIEF_TEXTURE_URL}
          bumpImageUrl={EARTH_RELIEF_TEXTURE_URL}
          bumpScale={0.028}
          showGlobe={true}
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#4A90D9"
          atmosphereAltitude={0.2}
          showGraticules={false}
          animateIn={false}
          rendererConfig={GLOBE_RENDERER_CONFIG}
          onZoom={keepGlobeZoomLocked}
        />
      ) : (
        <div
          className="globe-static-fallback"
          role="img"
          aria-label="PawPal Earth globe preview"
        />
      )}
    </div>
  );
}
