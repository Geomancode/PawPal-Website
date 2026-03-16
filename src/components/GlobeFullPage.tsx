"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapGlobeComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
            tiles: [
              "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          },
        },
        layers: [
          {
            id: "carto-tiles",
            type: "raster",
            source: "carto",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      center: [4.35, 50.85],
      zoom: 4,
      pitch: 30,
      maxPitch: 85,
      dragRotate: true,
    });

    mapRef.current = map;

    // ── Fast scroll zoom ──
    // Disable native scrollZoom, replace with our own handler on the container
    // that calls easeTo — this is snappy at ALL zoom levels including globe.
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
          map.easeTo({
            zoom: Math.max(0, Math.min(20, cur + zoomAccum)),
            duration: 180,
            easing: (t) => t * (2 - t),
          });
          zoomAccum = 0;
          zoomRaf = 0;
        });
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });

    // ── Globe projection + atmosphere ──
    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
      try { map.setSky({ "atmosphere-blend": 0.8 } as any); } catch { /* ok */ }

      // ── Drag inertia ──
      let isInteracting = false;
      let velocityLng = 0;
      let velocityLat = 0;
      let lastCenter: { lng: number; lat: number } | null = null;
      let lastDragTime = 0;

      map.on("dragstart", () => {
        isInteracting = true;
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
        const friction = 0.94;
        function decelerate() {
          if (isInteracting) return;
          if (Math.abs(velocityLng) < 0.0003 && Math.abs(velocityLat) < 0.0003) {
            velocityLng = 0;
            velocityLat = 0;
            return;
          }
          const center = map.getCenter();
          center.lng += velocityLng;
          center.lat = Math.max(-85, Math.min(85, center.lat + velocityLat));
          map.setCenter(center);
          velocityLng *= friction;
          velocityLat *= friction;
          requestAnimationFrame(decelerate);
        }
        requestAnimationFrame(decelerate);
      });

      map.on("mousedown", () => { isInteracting = true; });
      map.on("mouseup", () => { isInteracting = false; });
      map.on("touchstart", () => { isInteracting = true; });
      map.on("touchend", () => { isInteracting = false; });

      // ── Slow idle rotation ──
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

    return () => {
      container.removeEventListener("wheel", onWheel);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Bottom search bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: "28px",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}>
          <span className="text-gray-400 text-lg">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for missions near you…"
            className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm font-light"
          />
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
