"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Layers,
  LifeBuoy,
  MapPin,
  MessageCircle,
  PawPrint,
  Radio,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  WifiOff,
} from "lucide-react";
import WeatherTicker from "./WeatherTicker";
import { fetchQuests, Quest } from "@/lib/fetchQuests";
import { fetchPlaces, Place } from "@/lib/fetchPlaces";
import { fetchPosts, MapPost } from "@/lib/fetchPosts";
import GlobeTutorial from "./GlobeTutorial";
import ChatBottomSheet from "./ChatBottomSheet";
import GlobeStaticPreview from "./GlobeStaticPreview";
import { createPawPalMapMarkerElement } from "@/lib/createPawPalMapMarkerElement";

/* ── Quest type → emoji mapping ── */
const QUEST_EMOJI: Record<string, string> = {
  walk: "🐕", care: "💛", knowledge: "📖", share: "📣",
  skill: "🛠️", transport: "🚗", foster: "🏠", vet_accompany: "🏥",
};

const QUEST_LABEL: Record<string, string> = {
  walk: "Walk help",
  care: "Care need",
  knowledge: "Advice",
  share: "Share",
  skill: "Skill help",
  transport: "Transport",
  foster: "Foster",
  vet_accompany: "Vet buddy",
};

/* ── Place type → emoji mapping ── */
const PLACE_EMOJI: Record<string, string> = {
  vet: "🏥", groomer: "✂️", pet_shop: "🛒", park: "🌳",
  dog_park: "🐾", cafe: "☕", shelter: "🏠", kennel: "🐶",
  training: "🎓", stable: "🐴", aquarium_shop: "🐠", exotic_vet: "🦎",
  zoo: "🦁", wildlife_centre: "🦅", other: "📍",
};

const POST_ICON: Record<string, string> = {
  food: "🍽️",
  vet: "🏥",
  store: "🛒",
  adoption: "🐾",
  lostAndFound: "🔍",
  walk: "🚶",
  custom: "✨",
};

const POST_LABEL: Record<string, string> = {
  food: "Food",
  vet: "Vet",
  store: "Store",
  adoption: "Adoption",
  lostAndFound: "Lost & Found",
  walk: "Walk",
  custom: "Update",
};

const POST_COLOR: Record<string, string> = {
  food: "var(--color-paw-warning)",
  vet: "var(--color-paw-success)",
  store: "var(--color-paw-accent)",
  adoption: "var(--color-paw-danger)",
  lostAndFound: "var(--color-paw-accent)",
  walk: "var(--color-paw-primary)",
  custom: "var(--color-paw-trust)",
};

type MapWithSky = maplibregl.Map & {
  setSky?: (sky: { "atmosphere-blend": number }) => void;
};

const DEFAULT_USER_LOCATION = { lat: 51.05, lng: 3.72 };
const NEARBY_RADIUS_KM = 15;
const WEBGL_FALLBACK_MESSAGE = "Live map rendering is unavailable in this browser.";
const STATUS_BADGE_CLASS: Record<StatusTone, string> = {
  real: "border-paw-trust/30 bg-paw-trust-soft text-paw-trust",
  demo: "border-paw-warning/35 bg-paw-warning-soft text-paw-body",
  limited: "border-paw-accent/30 bg-paw-accent-soft text-paw-accent",
  static: "border-paw-primary/30 bg-paw-primary-soft text-paw-primary",
};

type StatusTone = "real" | "demo" | "limited" | "static";

function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-paw-sm border px-2 py-1 text-[10px] font-black leading-none ${STATUS_BADGE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

function StatusRow({
  icon,
  label,
  value,
  tone,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: StatusTone;
  badge: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-paw-sm border border-paw-border/70 bg-white/72 px-2.5 py-2">
      <span className="mt-0.5 text-paw-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black text-paw-ink">{label}</span>
          <StatusBadge tone={tone}>{badge}</StatusBadge>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold leading-4 text-paw-muted">{value}</p>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
}

function isWebGLFailureMessage(message: string): boolean {
  return /webgl|web gl|context|canvas|gpu/i.test(message);
}

function getPostCategoryKey(post: MapPost): string {
  return post.pin_icon || post.category || "custom";
}

function getPostLabel(post: MapPost): string {
  const key = getPostCategoryKey(post);
  if (key === "custom") return post.custom_category_label?.trim() || POST_LABEL.custom;
  return POST_LABEL[key] ?? key.replace(/_/g, " ");
}

function formatPostDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncatePostContent(content: string | null, maxLength = 74): string {
  const normalized = (content ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function hasUsableWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });

    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function GlobeFallbackView({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <div className="globe-fallback-stage">
      <section className="globe-fallback-copy" aria-labelledby="globe-fallback-title">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-paw-trust">PawPal Globe</p>
          <StatusBadge tone="static">STATIC PREVIEW</StatusBadge>
        </div>
        <h2 id="globe-fallback-title" className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
          Map preview is still ready
        </h2>
        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/72 sm:text-base">
          {reason} This is a labeled static preview, not live map activity. You can still review the PawPal pet-safety flow, smart tags, and local help paths while WebGL is unavailable.
        </p>
        <div className="globe-fallback-truth-grid mt-5 grid max-w-2xl gap-2 sm:grid-cols-3">
          <div className="globe-fallback-truth-card rounded-paw-sm border border-white/14 bg-white/8 p-3">
            <StatusBadge tone="static">STATIC</StatusBadge>
            <p className="globe-fallback-truth-copy mt-2 text-xs font-bold leading-5 text-white/70">Rendered without WebGL or live map controls.</p>
          </div>
          <div className="globe-fallback-truth-card rounded-paw-sm border border-white/14 bg-white/8 p-3">
            <StatusBadge tone="demo">DEMO</StatusBadge>
            <p className="globe-fallback-truth-copy mt-2 text-xs font-bold leading-5 text-white/70">Preview pins and route lines are illustrative.</p>
          </div>
          <div className="globe-fallback-truth-card rounded-paw-sm border border-white/14 bg-white/8 p-3">
            <StatusBadge tone="real">REAL</StatusBadge>
            <p className="globe-fallback-truth-copy mt-2 text-xs font-bold leading-5 text-white/70">Store and help links keep their normal routes.</p>
          </div>
        </div>
        <div className="globe-fallback-actions mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onRetry} className="globe-fallback-action globe-fallback-action-primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try live map
          </button>
          <Link href="/store" className="globe-fallback-action">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Shop smart tags
          </Link>
          <Link href="/help" className="globe-fallback-action">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Local help
          </Link>
        </div>
      </section>

      <GlobeStaticPreview
        className="globe-fallback-preview"
        statusLabel="Static fallback · WebGL unavailable"
        pulseStatus={false}
      />
    </div>
  );
}

function createPopupContent(
  title: string,
  rows: Array<{ label?: string; value: string }>
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "system-ui";
  wrapper.style.minWidth = "160px";

  const heading = document.createElement("div");
  heading.style.fontWeight = "700";
  heading.style.fontSize = "14px";
  heading.style.marginBottom = "4px";
  heading.textContent = title;
  wrapper.appendChild(heading);

  rows.forEach((row) => {
    if (!row.value) return;
    const item = document.createElement("div");
    item.style.fontSize = "12px";
    item.style.color = "var(--color-paw-muted)";
    item.style.marginBottom = "2px";
    item.textContent = row.label ? `${row.label}: ${row.value}` : row.value;
    wrapper.appendChild(item);
  });

  return wrapper;
}

/* ─────────────────────────────────────────
   Component
   ───────────────────────────────────────── */
export default function MapGlobeComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [showQuests, setShowQuests] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showPosts, setShowPosts] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [posts, setPosts] = useState<MapPost[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyIssue, setNearbyIssue] = useState<string | null>(null);
  const [locationIssue, setLocationIssue] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [mapUnavailableReason, setMapUnavailableReason] = useState<string | null>(null);
  const [nearbyCenter, setNearbyCenter] = useState<{ lat: number; lng: number }>(DEFAULT_USER_LOCATION);
  const [locationSource, setLocationSource] = useState<"pilot" | "browser" | "fallback">("pilot");
  const questMarkersRef = useRef<maplibregl.Marker[]>([]);
  const placeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const postMarkersRef = useRef<maplibregl.Marker[]>([]);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Map center state for WeatherTicker ── */
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(DEFAULT_USER_LOCATION);
  const isDraggingRef = useRef(false);

  const nearbyQuestTags = useMemo(() => {
    const counts = new Map<string, number>();
    quests.forEach((quest) => {
      counts.set(quest.quest_type, (counts.get(quest.quest_type) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([type, count]) => ({
        type,
        count,
        emoji: QUEST_EMOJI[type] ?? "🐾",
        label: QUEST_LABEL[type] ?? type.replace(/_/g, " "),
      }))
      .sort((a, b) => b.count - a.count);
  }, [quests]);

  const nearbyItemCount = quests.length + places.length + posts.length;
  const nearbyStatus = useMemo(() => {
    if (nearbyLoading) {
      return {
        tone: "limited" as const,
        badge: "LOADING",
        value: "Fetching public missions, places, and posts near the current center.",
      };
    }
    if (nearbyIssue) {
      return {
        tone: "limited" as const,
        badge: "LIMITED",
        value: "Nearby endpoints are unavailable; existing map controls remain usable.",
      };
    }
    if (nearbyItemCount === 0) {
      return {
        tone: "real" as const,
        badge: "REAL",
        value: "Nearby endpoints returned no public pins for this area.",
      };
    }
    return {
      tone: "real" as const,
      badge: "REAL",
      value: `${nearbyItemCount} public pins fetched for the ${NEARBY_RADIUS_KM} km area.`,
    };
  }, [nearbyIssue, nearbyItemCount, nearbyLoading]);

  const centerStatus = useMemo(() => {
    if (locationSource === "browser") {
      return {
        tone: "real" as const,
        badge: "REAL",
        value: "Browser location was accepted; dragging the map refreshes nearby context.",
      };
    }
    if (locationSource === "fallback") {
      return {
        tone: "demo" as const,
        badge: "DEMO",
        value: "Using the Ghent pilot center because browser location is unavailable.",
      };
    }
    return {
      tone: "demo" as const,
      badge: "DEMO",
      value: "Starting from the Ghent pilot center until browser location is confirmed.",
    };
  }, [locationSource]);

  const mapHealth = isOffline || nearbyIssue
    ? {
        tone: "limited" as const,
        badge: "LIMITED",
        label: "Limited public map",
      }
    : {
        tone: "real" as const,
        badge: "REAL",
        label: "Real public map",
      };

  const loadNearbyData = useCallback(async (center: { lat: number; lng: number }) => {
    setNearbyLoading(true);
    setNearbyIssue(null);
    try {
      const [questRows, placeRows, postRows] = await Promise.all([
        fetchQuests({ ...center, radiusKm: NEARBY_RADIUS_KM, limit: 80 }),
        fetchPlaces({ ...center, radiusKm: NEARBY_RADIUS_KM, limit: 120 }),
        fetchPosts({ ...center, radiusKm: NEARBY_RADIUS_KM, limit: 120 }),
      ]);
      setQuests(questRows);
      setPlaces(placeRows);
      setPosts(postRows);
      setNearbyCenter(center);
    } catch {
      setQuests([]);
      setPlaces([]);
      setPosts([]);
      setNearbyIssue("Nearby data is unavailable. The map remains usable.");
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    const updateConnectionState = () => setIsOffline(!navigator.onLine);
    updateConnectionState();
    window.addEventListener("online", updateConnectionState);
    window.addEventListener("offline", updateConnectionState);
    return () => {
      window.removeEventListener("online", updateConnectionState);
      window.removeEventListener("offline", updateConnectionState);
    };
  }, []);

  const scheduleNearbyRefresh = useCallback((center: { lat: number; lng: number }) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      void loadNearbyData(center);
    }, 450);
  }, [loadNearbyData]);

  /* ── Update map center on drag end (debounced via ticker) ── */
  const updateMapCenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const nextCenter = { lat: center.lat, lng: center.lng };
    setMapCenter(nextCenter);
    scheduleNearbyRefresh(nextCenter);
  }, [scheduleNearbyRefresh]);

  /* ── Recenter map to user location ── */
  const handleRecenterRequest = useCallback(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 11,
      duration: 1500,
      essential: true,
    });
    setMapCenter(null); // Reset to user location mode
  }, [userLocation]);

  const handleRetryMap = useCallback(() => {
    setNearbyIssue(null);
    setLocationIssue(null);
    setMapUnavailableReason(null);
  }, []);

  const enterMapFallback = useCallback((reason = WEBGL_FALLBACK_MESSAGE) => {
    setMapUnavailableReason(reason);
  }, []);

  /* ── Load initial nearby data from Supabase ── */
  useEffect(() => {
    if (mapUnavailableReason) {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      setNearbyLoading(false);
      return;
    }

    scheduleNearbyRefresh(DEFAULT_USER_LOCATION);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleNearbyRefresh, mapUnavailableReason]);

  /* ── Initialize MapLibre ── */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || mapUnavailableReason) return;

    if (!hasUsableWebGL()) {
      enterMapFallback();
      return;
    }

    // Get user location for initial center
    const defaultCenter: [number, number] = [DEFAULT_USER_LOCATION.lng, DEFAULT_USER_LOCATION.lat];

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          name: "PawPal Map",
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {
            carto: {
              type: "raster",
              tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"],
              tileSize: 256,
              attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
            },
          },
          layers: [{ id: "carto-tiles", type: "raster", source: "carto", minzoom: 0, maxzoom: 20 }],
        },
        center: defaultCenter,
        zoom: 11,
        pitch: 30,
        maxPitch: 85,
        dragRotate: true,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      enterMapFallback(isWebGLFailureMessage(message) ? WEBGL_FALLBACK_MESSAGE : "The live map could not start.");
      return;
    }

    mapRef.current = map;
    let active = true;
    const isCurrentMap = () => active && mapRef.current === map;
    const animationFrames = new Set<number>();
    const requestGuardedFrame = (callback: () => void) => {
      const id = requestAnimationFrame(() => {
        animationFrames.delete(id);
        if (!isCurrentMap()) return;
        callback();
      });
      animationFrames.add(id);
      return id;
    };

    const handleMapError = (event: maplibregl.ErrorEvent) => {
      const message = event.error?.message ?? "";
      if (isWebGLFailureMessage(message)) {
        enterMapFallback();
        return;
      }
      setNearbyIssue("A map layer could not load. Try again with a stronger connection.");
    };

    map.on("error", handleMapError);
    const canvas = map.getCanvas();
    const handleContextFailure = (event: Event) => {
      if (event.cancelable) event.preventDefault();
      enterMapFallback();
    };
    canvas.addEventListener("webglcontextlost", handleContextFailure);
    canvas.addEventListener("webglcontextcreationerror", handleContextFailure);

    // Try to center on user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isCurrentMap()) return;
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocationIssue(null);
          setLocationSource("browser");
          setUserLocation(coords);
          setMapCenter(coords);
          void loadNearbyData(coords);
          map.flyTo({ center: [coords.lng, coords.lat], zoom: 11, duration: 1000 });
        },
        () => {
          if (!isCurrentMap()) return;
          setLocationSource("fallback");
          setUserLocation(DEFAULT_USER_LOCATION);
          setLocationIssue("Using Ghent as the starting point. Enable location for nearby results.");
        },
        { timeout: 8000 }
      );
    }

    map.scrollZoom.disable();
    const container = mapContainer.current;
    let zoomAccum = 0;
    let zoomRaf = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAccum += e.deltaY > 0 ? -1.0 : 1.0;
      if (!zoomRaf) {
        zoomRaf = requestGuardedFrame(() => {
          const cur = map.getZoom();
          map.easeTo({ zoom: Math.max(0, Math.min(20, cur + zoomAccum)), duration: 180, easing: (t) => t * (2 - t) });
          zoomAccum = 0;
          zoomRaf = 0;
        });
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });

    map.on("style.load", () => {
      if (!isCurrentMap()) return;
      map.setProjection({ type: "globe" });
      try { (map as MapWithSky).setSky?.({ "atmosphere-blend": 0.8 }); } catch { /* ok */ }

      let isInteracting = false;
      let velocityLng = 0;
      let velocityLat = 0;
      let lastCenter: { lng: number; lat: number } | null = null;
      let lastDragTime = 0;

      map.on("dragstart", () => {
        if (!isCurrentMap()) return;
        isInteracting = true;
        isDraggingRef.current = true;
        velocityLng = 0;
        velocityLat = 0;
        lastCenter = map.getCenter();
        lastDragTime = performance.now();
      });

      map.on("drag", () => {
        if (!isCurrentMap()) return;
        const now = performance.now();
        const dt = now - lastDragTime;
        if (dt > 0 && lastCenter) {
          const c = map.getCenter();
          velocityLng = ((c.lng - lastCenter.lng) / dt) * 16;
          velocityLat = ((c.lat - lastCenter.lat) / dt) * 16;
          lastCenter = c;
          lastDragTime = now;
        }
      });

      map.on("dragend", () => {
        if (!isCurrentMap()) return;
        isInteracting = false;
        isDraggingRef.current = false;
        // Update weather for new center position
        updateMapCenter();

        const friction = 0.94;
        function decelerate() {
          if (!isCurrentMap() || isInteracting) return;
          if (Math.abs(velocityLng) < 0.0003 && Math.abs(velocityLat) < 0.0003) { velocityLng = 0; velocityLat = 0; return; }
          const center = map.getCenter();
          center.lng += velocityLng;
          center.lat = Math.max(-85, Math.min(85, center.lat + velocityLat));
          map.setCenter(center);
          velocityLng *= friction; velocityLat *= friction;
          requestGuardedFrame(decelerate);
        }
        requestGuardedFrame(decelerate);
      });

      map.on("mousedown", () => { if (isCurrentMap()) isInteracting = true; });
      map.on("mouseup", () => { if (isCurrentMap()) isInteracting = false; });
      map.on("touchstart", () => { if (isCurrentMap()) isInteracting = true; });
      map.on("touchend", () => { if (isCurrentMap()) isInteracting = false; });

      // Also update weather after zoom (map center might shift slightly)
      map.on("zoomend", () => {
        if (isCurrentMap() && !isDraggingRef.current) {
          updateMapCenter();
        }
      });

      function spinGlobe() {
        if (!isCurrentMap()) return;
        if (!isInteracting && Math.abs(velocityLng) < 0.001 && map.getZoom() < 6) {
          const center = map.getCenter();
          center.lng -= 0.008;
          map.setCenter(center);
        }
        requestGuardedFrame(spinGlobe);
      }
      spinGlobe();
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    return () => {
      active = false;
      container.removeEventListener("wheel", onWheel);
      map.off("error", handleMapError);
      canvas.removeEventListener("webglcontextlost", handleContextFailure);
      canvas.removeEventListener("webglcontextcreationerror", handleContextFailure);
      animationFrames.forEach((frame) => cancelAnimationFrame(frame));
      animationFrames.clear();
      zoomRaf = 0;
      try {
        map.remove();
      } catch {
        /* MapLibre may already be tearing down after a context failure. */
      }
      mapRef.current = null;
    };
  }, [enterMapFallback, loadNearbyData, updateMapCenter, mapUnavailableReason]);

  /* ── Render Quest markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    questMarkersRef.current.forEach((m) => m.remove());
    questMarkersRef.current = [];
    if (!showQuests) return;
    quests.forEach((q) => {
      if (q.lat == null || q.lng == null) return;
      const emoji = QUEST_EMOJI[q.quest_type] || "🐾";
      const label = QUEST_LABEL[q.quest_type] ?? q.quest_type.replace(/_/g, " ");
      const distance = q.distance_km != null ? `${q.distance_km.toFixed(1)} km away` : "";
      const el = createPawPalMapMarkerElement({
        icon: emoji,
        color: "var(--color-paw-accent)",
        label,
        tone: "mission",
      });
      const popup = new maplibregl.Popup({ offset: 28, closeButton: false })
        .setDOMContent(createPopupContent(`${emoji} ${q.title || "Mission"}`, [
          { label: "Need", value: label },
          { label: "Status", value: q.status },
          { label: "Distance", value: distance },
          { label: "Reward", value: q.reward_type || "none" },
        ]));
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([q.lng, q.lat]).setPopup(popup).addTo(map);
      questMarkersRef.current.push(marker);
    });
  }, [quests, showQuests]);

  /* ── Render Place markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current = [];
    if (!showPlaces) return;
    places.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      const emoji = PLACE_EMOJI[p.place_type] || "📍";
      const el = createPawPalMapMarkerElement({
        icon: emoji,
        color: "var(--color-paw-trust)",
        tone: "place",
      });
      const ratingStr = p.rating_avg != null ? `⭐ ${Number(p.rating_avg).toFixed(1)}` : "";
      const distance = p.distance_km != null ? `${p.distance_km.toFixed(1)} km away` : "";
      const popup = new maplibregl.Popup({ offset: 28, closeButton: false })
        .setDOMContent(createPopupContent(`${emoji} ${p.name}`, [
          { label: "Type", value: p.place_type },
          { value: p.city ? `📍 ${p.city}` : "" },
          { label: "Distance", value: distance },
          { value: ratingStr },
        ]));
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
      placeMarkersRef.current.push(marker);
    });
  }, [places, showPlaces]);

  /* ── Render Post markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    postMarkersRef.current.forEach((m) => m.remove());
    postMarkersRef.current = [];
    if (!showPosts) return;
    posts.forEach((post) => {
      if (post.lat == null || post.lng == null) return;
      const key = getPostCategoryKey(post);
      const icon = POST_ICON[key] ?? POST_ICON.custom;
      const label = getPostLabel(post);
      const color = POST_COLOR[key] ?? POST_COLOR.custom;
      const content = truncatePostContent(post.content);
      const distance = post.distance_km != null ? `${post.distance_km.toFixed(1)} km away` : "";
      const activity = [
        post.like_count ? `${post.like_count} likes` : "",
        post.comment_count ? `${post.comment_count} comments` : "",
      ].filter(Boolean).join(" · ");
      const el = createPawPalMapMarkerElement({
        icon,
        color,
        label,
        tone: "post",
      });
      const popup = new maplibregl.Popup({ offset: 28, closeButton: false })
        .setDOMContent(createPopupContent(`${icon} ${label}`, [
          { value: content },
          { label: "Distance", value: distance },
          { label: "Posted", value: formatPostDate(post.created_at) },
          { value: activity },
        ]));
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([post.lng, post.lat]).setPopup(popup).addTo(map);
      postMarkersRef.current.push(marker);
    });
  }, [posts, showPosts]);

  return (
    <div className="globe-page-shell fixed inset-0 h-[100dvh] w-full overflow-hidden bg-paw-ink">
      {mapUnavailableReason ? (
        <GlobeFallbackView reason={mapUnavailableReason} onRetry={handleRetryMap} />
      ) : (
        <>
          <WeatherTicker
            mapCenter={mapCenter}
            onRecenterRequest={handleRecenterRequest}
          />
          <div ref={mapContainer} id="globe-map" className="absolute inset-0 w-full h-full" />

          {/* Public map status */}
          <div
            id="globe-status-panel"
            className="globe-hud-panel globe-nearby-panel absolute z-40 w-[min(340px,calc(100vw-2rem))] rounded-paw-lg border border-paw-border bg-paw-panel/90 p-3 shadow-paw-panel backdrop-blur-md"
            style={{ width: "clamp(12.75rem, calc(100vw - 10rem), 21.25rem)" }}
            aria-labelledby="globe-status-panel-title"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-paw-primary">PawPal Globe</p>
                <h2 id="globe-status-panel-title" className="mt-0.5 text-sm font-black text-paw-ink">
                  Public map status
                </h2>
                <p className="text-[11px] font-medium text-paw-muted">
                  {nearbyCenter.lat.toFixed(3)}, {nearbyCenter.lng.toFixed(3)} · {NEARBY_RADIUS_KM} km
                </p>
              </div>
              <StatusBadge tone={mapHealth.tone}>{mapHealth.badge}</StatusBadge>
            </div>

            <div className="mb-3 grid gap-1.5">
              <StatusRow
                icon={<Radio className="h-3.5 w-3.5" aria-hidden="true" />}
                label="Map source"
                value="CARTO and OpenStreetMap tiles with PawPal public overlays."
                tone="real"
                badge="REAL"
              />
              <StatusRow
                icon={<Compass className="h-3.5 w-3.5" aria-hidden="true" />}
                label="Center"
                value={centerStatus.value}
                tone={centerStatus.tone}
                badge={centerStatus.badge}
              />
              <StatusRow
                icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                label="Nearby data"
                value={nearbyStatus.value}
                tone={nearbyStatus.tone}
                badge={nearbyStatus.badge}
              />
              <StatusRow
                icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                label="Privacy"
                value="Public proof only; no live pet tracking is shown on this page."
                tone="real"
                badge="REAL"
              />
            </div>

            {(isOffline || locationIssue || nearbyIssue) && (
              <div className="mb-2 space-y-1.5">
                {isOffline && (
                  <p className="globe-inline-issue">
                    <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                    Offline mode. Live places and missions may be stale.
                  </p>
                )}
                {locationIssue && (
                  <p className="globe-inline-issue">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {locationIssue}
                  </p>
                )}
                {nearbyIssue && (
                  <p className="globe-inline-issue">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {nearbyIssue}
                  </p>
                )}
              </div>
            )}

            <div className="mt-3 border-t border-paw-border/70 pt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-black text-paw-ink">Nearby needs</p>
                <span className="rounded-paw-sm bg-paw-accent-soft px-2 py-1 text-[11px] font-black text-paw-accent">
                  {nearbyLoading ? "..." : quests.length}
                </span>
              </div>
            {nearbyQuestTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {nearbyQuestTags.slice(0, 6).map((tag) => (
                  <span key={tag.type} className="inline-flex items-center gap-1 rounded-paw-sm border border-paw-accent/20 bg-paw-accent-soft px-2.5 py-1 text-[11px] font-bold text-paw-body">
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                    <span className="text-paw-accent">{tag.count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-paw-muted">
                {nearbyLoading ? "Loading nearby needs..." : "No open needs in this area yet."}
              </p>
            )}
            </div>
          </div>

          {/* Layer Toggle */}
          <div id="globe-layers" className="globe-layer-stack absolute z-40 flex gap-1.5" role="group" aria-label="Toggle public map layers">
            <span className="inline-flex items-center gap-1 px-2 text-[11px] font-black text-paw-body">
              <Layers className="h-3.5 w-3.5 text-paw-primary" aria-hidden="true" />
              Layers
            </span>
            <button
              type="button"
              aria-pressed={showQuests}
              aria-label={`${showQuests ? "Hide" : "Show"} public mission pins`}
              onClick={() => setShowQuests(!showQuests)}
              className={`globe-layer-button flex min-h-11 items-center gap-2 rounded-paw-sm border px-3 py-2 text-xs font-bold transition-all ${showQuests ? "is-active-mission bg-paw-accent/90 text-white border-paw-accent" : "bg-paw-panel/80 text-paw-muted border-paw-border"}`}
            >
              <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
              Missions {quests.length > 0 && <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{quests.length}</span>}
            </button>
            <button
              type="button"
              aria-pressed={showPlaces}
              aria-label={`${showPlaces ? "Hide" : "Show"} public place pins`}
              onClick={() => setShowPlaces(!showPlaces)}
              className={`globe-layer-button flex min-h-11 items-center gap-2 rounded-paw-sm border px-3 py-2 text-xs font-bold transition-all ${showPlaces ? "is-active-place bg-paw-trust/90 text-white border-paw-trust" : "bg-paw-panel/80 text-paw-muted border-paw-border"}`}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Places {places.length > 0 && <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{places.length}</span>}
            </button>
            <button
              type="button"
              aria-pressed={showPosts}
              aria-label={`${showPosts ? "Hide" : "Show"} public post pins`}
              onClick={() => setShowPosts(!showPosts)}
              className={`globe-layer-button flex min-h-11 items-center gap-2 rounded-paw-sm border px-3 py-2 text-xs font-bold transition-all ${showPosts ? "is-active-post bg-paw-primary/90 text-white border-paw-primary" : "bg-paw-panel/80 text-paw-muted border-paw-border"}`}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Posts {posts.length > 0 && <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{posts.length}</span>}
            </button>
          </div>

          <div className="globe-status-strip">
            <span>{mapHealth.label}</span>
            <strong>{quests.length}</strong>
            <span>open needs</span>
            <strong>{places.length}</strong>
            <span>mapped places</span>
            <strong>{posts.length}</strong>
            <span>public posts</span>
            <strong>{centerStatus.badge}</strong>
            <span>center</span>
          </div>

          {/* AI Chat Bottom Sheet */}
          <ChatBottomSheet mapRef={mapRef} />

          {/* Tutorial overlay for first-time visitors */}
          <GlobeTutorial />
        </>
      )}
    </div>
  );
}
