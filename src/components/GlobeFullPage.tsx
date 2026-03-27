"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import WeatherTicker from "./WeatherTicker";
import { fetchQuests, Quest } from "@/lib/fetchQuests";
import { fetchPlaces, Place } from "@/lib/fetchPlaces";
import { Search, Sparkles, X, MapPin, Navigation } from "lucide-react";
import GlobeTutorial from "./GlobeTutorial";

/* ── Quest type → emoji mapping ── */
const QUEST_EMOJI: Record<string, string> = {
  walk: "🐕", care: "💛", knowledge: "📖", share: "📣",
  skill: "🛠️", transport: "🚗", foster: "🏠", vet_accompany: "🏥",
};

/* ── Place type → emoji mapping ── */
const PLACE_EMOJI: Record<string, string> = {
  vet: "🏥", groomer: "✂️", pet_shop: "🛒", park: "🌳",
  dog_park: "🐾", cafe: "☕", shelter: "🏠", kennel: "🐶",
  training: "🎓", stable: "🐴", aquarium_shop: "🐠", exotic_vet: "🦎",
  zoo: "🦁", wildlife_centre: "🦅", other: "📍",
};

/* ── Marker badge style ── */
function createMarkerEl(emoji: string, color: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 36px; height: 36px;
    background: ${color};
    border: 2px solid white;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: transform 0.15s;
  `;
  el.textContent = emoji;
  el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
  el.onmouseleave = () => { el.style.transform = "scale(1)"; };
  return el;
}

/* ── Search Result Types ── */
interface SearchResponse {
  intent: string;
  results: any[];
  aiMessage: string;
}

/* ─────────────────────────────────────────
   Component
   ───────────────────────────────────────── */
export default function MapGlobeComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuests, setShowQuests] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const questMarkersRef = useRef<maplibregl.Marker[]>([]);
  const placeMarkersRef = useRef<maplibregl.Marker[]>([]);

  // AI Search state
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const searchMarkersRef = useRef<maplibregl.Marker[]>([]);

  /* ── Load data from Supabase ── */
  useEffect(() => {
    fetchQuests().then(setQuests);
    fetchPlaces().then(setPlaces);
  }, []);

  /* ── Initialize MapLibre ── */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

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
      center: [3.72, 51.05],
      zoom: 11,
      pitch: 30,
      maxPitch: 85,
      dragRotate: true,
    });

    mapRef.current = map;

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
      try { map.setSky({ "atmosphere-blend": 0.8 } as any); } catch { /* ok */ }

      let isInteracting = false;
      let velocityLng = 0;
      let velocityLat = 0;
      let lastCenter: { lng: number; lat: number } | null = null;
      let lastDragTime = 0;

      map.on("dragstart", () => { isInteracting = true; velocityLng = 0; velocityLat = 0; lastCenter = map.getCenter(); lastDragTime = performance.now(); });
      map.on("drag", () => { const now = performance.now(); const dt = now - lastDragTime; if (dt > 0 && lastCenter) { const c = map.getCenter(); velocityLng = ((c.lng - lastCenter.lng) / dt) * 16; velocityLat = ((c.lat - lastCenter.lat) / dt) * 16; lastCenter = c; lastDragTime = now; } });
      map.on("dragend", () => {
        isInteracting = false;
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
  }, []);

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
      const el = createMarkerEl(emoji, "#f59e0b");
      const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
        .setHTML(`<div style="font-family:system-ui;min-width:160px"><div style="font-weight:700;font-size:14px;margin-bottom:4px">${emoji} ${q.title || "Mission"}</div><div style="font-size:12px;color:#666;margin-bottom:2px">Type: <b>${q.quest_type}</b></div><div style="font-size:12px;color:#666;margin-bottom:2px">Status: <b>${q.status}</b></div><div style="font-size:12px;color:#666">Reward: <b>${q.reward_type || "none"}</b></div></div>`);
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
      const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
        .setHTML(`<div style="font-family:system-ui;min-width:160px"><div style="font-weight:700;font-size:14px;margin-bottom:4px">${emoji} ${p.name}</div><div style="font-size:12px;color:#666;margin-bottom:2px">Type: <b>${p.place_type}</b></div>${p.city ? `<div style="font-size:12px;color:#666;margin-bottom:2px">📍 ${p.city}</div>` : ""}${ratingStr ? `<div style="font-size:12px;color:#666">${ratingStr}</div>` : ""}</div>`);
      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
      placeMarkersRef.current.push(marker);
    });
  }, [places, showPlaces]);

  /* ── AI Search handler ── */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setShowPanel(true);

    // Clear previous search markers
    searchMarkersRef.current.forEach((m) => m.remove());
    searchMarkersRef.current = [];

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data: SearchResponse = await res.json();
      setSearchResult(data);

      // If results have lat/lng, add markers and fly to first one
      if (data.results?.length > 0 && mapRef.current) {
        const map = mapRef.current;
        const first = data.results[0];

        data.results.forEach((r: any) => {
          if (r.lat == null || r.lng == null) return;
          const el = createMarkerEl("⭐", "#8b5cf6");
          const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
            .setHTML(`<div style="font-family:system-ui;min-width:140px"><div style="font-weight:700;font-size:13px">⭐ ${r.title || r.name}</div><div style="font-size:11px;color:#666;margin-top:2px">${r.quest_type || r.place_type || ""}</div></div>`);
          const marker = new maplibregl.Marker({ element: el }).setLngLat([r.lng, r.lat]).setPopup(popup).addTo(map);
          searchMarkersRef.current.push(marker);
        });

        if (first.lat && first.lng) {
          map.flyTo({ center: [first.lng, first.lat], zoom: 14, duration: 2000 });
        }
      }
    } catch {
      setSearchResult({ intent: "error", results: [], aiMessage: "Sorry, something went wrong. Please try again!" });
    }

    setSearching(false);
  };

  const closePanel = () => {
    setShowPanel(false);
    searchMarkersRef.current.forEach((m) => m.remove());
    searchMarkersRef.current = [];
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <WeatherTicker />
      <div ref={mapContainer} id="globe-map" className="absolute inset-0 w-full h-full" />

      {/* Layer Toggle */}
      <div id="globe-layers" className="absolute top-[130px] right-4 z-40 flex flex-col gap-2">
        <button onClick={() => setShowQuests(!showQuests)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg backdrop-blur-md border ${showQuests ? "bg-amber-500/90 text-white border-amber-400" : "bg-white/70 text-gray-500 border-gray-200"}`}>
          🐾 Missions {quests.length > 0 && <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{quests.length}</span>}
        </button>
        <button onClick={() => setShowPlaces(!showPlaces)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg backdrop-blur-md border ${showPlaces ? "bg-blue-500/90 text-white border-blue-400" : "bg-white/70 text-gray-500 border-gray-200"}`}>
          📍 Places {places.length > 0 && <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{places.length}</span>}
        </button>
      </div>

      {/* AI Search Panel (results) */}
      {showPanel && searchResult && (
        <div className="absolute top-[130px] left-4 z-40 w-80 max-h-[60vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-amber-50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-bold text-gray-800">PawPal AI</span>
            </div>
            <button onClick={closePanel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {/* AI message */}
          <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed border-b border-gray-50 bg-gray-50/50">
            {searchResult.aiMessage}
          </div>

          {/* Search results list */}
          {searchResult.results.length > 0 && (
            <div className="overflow-y-auto flex-1">
              {searchResult.results.map((r: any, i: number) => (
                <button
                  key={r.id || i}
                  onClick={() => {
                    if (r.lat && r.lng && mapRef.current) {
                      mapRef.current.flyTo({ center: [r.lng, r.lat], zoom: 15, duration: 1500 });
                    }
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {r.quest_type ? (QUEST_EMOJI[r.quest_type] || "🐾") : (PLACE_EMOJI[r.place_type] || "📍")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.title || r.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.quest_type || r.place_type}{r.city ? ` · ${r.city}` : ""}</p>
                  </div>
                  {r.lat && r.lng && <Navigation className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom search bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
        <form
          id="globe-search"
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "28px",
            padding: "8px 8px 8px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 30px rgba(0,0,0,0.12)",
          }}
        >
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask AI or search missions, places, pets…"
            className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm font-light"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-gradient-to-r from-amber-500 to-violet-500 hover:from-amber-600 hover:to-violet-600 disabled:opacity-50 text-white px-5 py-2 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            {searching ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            {searching ? "Thinking…" : "Search"}
          </button>
        </form>
      </div>

      {/* Tutorial overlay for first-time visitors */}
      <GlobeTutorial />
    </div>
  );
}
