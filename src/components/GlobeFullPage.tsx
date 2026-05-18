"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import WeatherTicker from "./WeatherTicker";
import { fetchQuests, Quest } from "@/lib/fetchQuests";
import { fetchPlaces, Place } from "@/lib/fetchPlaces";
import GlobeTutorial from "./GlobeTutorial";
import ChatBottomSheet from "./ChatBottomSheet";

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

type MapWithSky = maplibregl.Map & {
  setSky?: (sky: { "atmosphere-blend": number }) => void;
};

const DEFAULT_USER_LOCATION = { lat: 51.05, lng: 3.72 };
const NEARBY_RADIUS_KM = 15;

/* ── Marker badge style ── */
function createMarkerEl(emoji: string, color: string, label?: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    min-width: 36px; height: 36px;
    background: ${label ? "rgba(255,255,255,0.94)" : color};
    border: 2px solid ${label ? color : "white"};
    border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    gap: 6px;
    font-size: 18px; cursor: pointer;
    padding: ${label ? "0 10px 0 6px" : "0"};
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: transform 0.15s;
    color: #1f2937;
    white-space: nowrap;
  `;
  const icon = document.createElement("span");
  icon.style.cssText = `
    width: ${label ? "24px" : "32px"};
    height: ${label ? "24px" : "32px"};
    border-radius: 50%;
    background: ${color};
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    flex: 0 0 auto;
  `;
  icon.textContent = emoji;
  el.appendChild(icon);

  if (label) {
    const text = document.createElement("span");
    text.style.cssText = `
      max-width: 112px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
      font-weight: 800;
    `;
    text.textContent = label;
    el.appendChild(text);
  }

  el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
  el.onmouseleave = () => { el.style.transform = "scale(1)"; };
  return el;
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
    item.style.color = "#666";
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
  const [quests, setQuests] = useState<Quest[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyCenter, setNearbyCenter] = useState<{ lat: number; lng: number }>(DEFAULT_USER_LOCATION);
  const questMarkersRef = useRef<maplibregl.Marker[]>([]);
  const placeMarkersRef = useRef<maplibregl.Marker[]>([]);
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

  const loadNearbyData = useCallback(async (center: { lat: number; lng: number }) => {
    setNearbyLoading(true);
    const [questRows, placeRows] = await Promise.all([
      fetchQuests({ ...center, radiusKm: NEARBY_RADIUS_KM, limit: 80 }),
      fetchPlaces({ ...center, radiusKm: NEARBY_RADIUS_KM, limit: 120 }),
    ]);
    setQuests(questRows);
    setPlaces(placeRows);
    setNearbyCenter(center);
    setNearbyLoading(false);
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

  /* ── Load initial nearby data from Supabase ── */
  useEffect(() => {
    scheduleNearbyRefresh(DEFAULT_USER_LOCATION);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleNearbyRefresh]);

  /* ── Initialize MapLibre ── */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Get user location for initial center
    const defaultCenter: [number, number] = [DEFAULT_USER_LOCATION.lng, DEFAULT_USER_LOCATION.lat];

    const map = new maplibregl.Map({
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

    mapRef.current = map;

    // Try to center on user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setMapCenter(coords);
          void loadNearbyData(coords);
          map.flyTo({ center: [coords.lng, coords.lat], zoom: 11, duration: 1000 });
        },
        () => {
          setUserLocation(DEFAULT_USER_LOCATION);
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
        zoomRaf = requestAnimationFrame(() => {
          const cur = map.getZoom();
          map.easeTo({ zoom: Math.max(0, Math.min(20, cur + zoomAccum)), duration: 180, easing: (t) => t * (2 - t) });
          zoomAccum = 0;
          zoomRaf = 0;
        });
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });

    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
      try { (map as MapWithSky).setSky?.({ "atmosphere-blend": 0.8 }); } catch { /* ok */ }

      let isInteracting = false;
      let velocityLng = 0;
      let velocityLat = 0;
      let lastCenter: { lng: number; lat: number } | null = null;
      let lastDragTime = 0;

      map.on("dragstart", () => {
        isInteracting = true;
        isDraggingRef.current = true;
        velocityLng = 0;
        velocityLat = 0;
        lastCenter = map.getCenter();
        lastDragTime = performance.now();
      });

      map.on("drag", () => {
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
        isInteracting = false;
        isDraggingRef.current = false;
        // Update weather for new center position
        updateMapCenter();

        const friction = 0.94;
        function decelerate() {
          if (isInteracting) return;
          if (Math.abs(velocityLng) < 0.0003 && Math.abs(velocityLat) < 0.0003) { velocityLng = 0; velocityLat = 0; return; }
          const center = map.getCenter();
          center.lng += velocityLng;
          center.lat = Math.max(-85, Math.min(85, center.lat + velocityLat));
          map.setCenter(center);
          velocityLng *= friction; velocityLat *= friction;
          requestAnimationFrame(decelerate);
        }
        requestAnimationFrame(decelerate);
      });

      map.on("mousedown", () => { isInteracting = true; });
      map.on("mouseup", () => { isInteracting = false; });
      map.on("touchstart", () => { isInteracting = true; });
      map.on("touchend", () => { isInteracting = false; });

      // Also update weather after zoom (map center might shift slightly)
      map.on("zoomend", () => {
        if (!isDraggingRef.current) {
          updateMapCenter();
        }
      });

      function spinGlobe() {
        if (!isInteracting && Math.abs(velocityLng) < 0.001 && map.getZoom() < 6) {
          const center = map.getCenter();
          center.lng -= 0.008;
          map.setCenter(center);
        }
        requestAnimationFrame(spinGlobe);
      }
      spinGlobe();
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    return () => { container.removeEventListener("wheel", onWheel); map.remove(); mapRef.current = null; };
  }, [loadNearbyData, updateMapCenter]);

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
      const el = createMarkerEl(emoji, "#f59e0b", label);
      const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
        .setDOMContent(createPopupContent(`${emoji} ${q.title || "Mission"}`, [
          { label: "Need", value: label },
          { label: "Status", value: q.status },
          { label: "Distance", value: distance },
          { label: "Reward", value: q.reward_type || "none" },
        ]));
      const marker = new maplibregl.Marker({ element: el }).setLngLat([q.lng, q.lat]).setPopup(popup).addTo(map);
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
      const el = createMarkerEl(emoji, "#3b82f6");
      const ratingStr = p.rating_avg != null ? `⭐ ${Number(p.rating_avg).toFixed(1)}` : "";
      const distance = p.distance_km != null ? `${p.distance_km.toFixed(1)} km away` : "";
      const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
        .setDOMContent(createPopupContent(`${emoji} ${p.name}`, [
          { label: "Type", value: p.place_type },
          { value: p.city ? `📍 ${p.city}` : "" },
          { label: "Distance", value: distance },
          { value: ratingStr },
        ]));
      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
      placeMarkersRef.current.push(marker);
    });
  }, [places, showPlaces]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <WeatherTicker
        mapCenter={mapCenter}
        onRecenterRequest={handleRecenterRequest}
      />
      <div ref={mapContainer} id="globe-map" className="absolute inset-0 w-full h-full" />

      {/* Nearby need tags */}
      <div className="absolute top-[222px] left-4 z-40 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-white/60 bg-white/85 p-3 shadow-lg backdrop-blur-md sm:top-[130px]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">Nearby needs</p>
            <p className="text-[11px] font-medium text-gray-500">
              {nearbyCenter.lat.toFixed(3)}, {nearbyCenter.lng.toFixed(3)} · {NEARBY_RADIUS_KM} km
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
            {nearbyLoading ? "..." : quests.length}
          </span>
        </div>
        {nearbyQuestTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {nearbyQuestTags.slice(0, 6).map((tag) => (
              <span key={tag.type} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-gray-700">
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
                <span className="text-amber-700">{tag.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs font-medium text-gray-500">
            {nearbyLoading ? "Loading nearby needs..." : "No open needs in this area yet."}
          </p>
        )}
      </div>

      {/* Layer Toggle */}
      <div id="globe-layers" className="absolute top-[130px] right-4 z-40 flex flex-col gap-2">
        <button onClick={() => setShowQuests(!showQuests)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg backdrop-blur-md border ${showQuests ? "bg-amber-500/90 text-white border-amber-400" : "bg-white/70 text-gray-500 border-gray-200"}`}>
          🐾 Missions {quests.length > 0 && <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{quests.length}</span>}
        </button>
        <button onClick={() => setShowPlaces(!showPlaces)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg backdrop-blur-md border ${showPlaces ? "bg-blue-500/90 text-white border-blue-400" : "bg-white/70 text-gray-500 border-gray-200"}`}>
          📍 Places {places.length > 0 && <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{places.length}</span>}
        </button>
      </div>

      {/* AI Chat Bottom Sheet */}
      <ChatBottomSheet mapRef={mapRef} />

      {/* Tutorial overlay for first-time visitors */}
      <GlobeTutorial />
    </div>
  );
}
