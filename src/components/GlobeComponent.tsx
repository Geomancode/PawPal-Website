"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

const GlobeT = dynamic(() => import("react-globe.gl").then((m) => m.default), {
  ssr: false,
});

// 25 pet labels
const PET_LABELS = [
  { lat: 48.86, lng: 2.35, emoji: "🐩", name: "Paris Poodle" },
  { lat: 51.51, lng: -0.13, emoji: "🐕", name: "London Corgi" },
  { lat: 40.71, lng: -74.01, emoji: "🐱", name: "NYC Cat" },
  { lat: 35.68, lng: 139.69, emoji: "🐕‍🦺", name: "Tokyo Shiba" },
  { lat: -33.87, lng: 151.21, emoji: "🐨", name: "Sydney Koala" },
  { lat: 55.75, lng: 37.62, emoji: "🐻", name: "Moscow Bear" },
  { lat: -22.91, lng: -43.17, emoji: "🦜", name: "Rio Parrot" },
  { lat: 30.04, lng: 31.24, emoji: "🐪", name: "Cairo Camel" },
  { lat: 1.35, lng: 103.82, emoji: "🐒", name: "Singapore Monkey" },
  { lat: 19.43, lng: -99.13, emoji: "🦎", name: "Mexico Iguana" },
  { lat: -34.60, lng: -58.38, emoji: "🐧", name: "BA Penguin" },
  { lat: 28.61, lng: 77.21, emoji: "🐘", name: "Delhi Elephant" },
  { lat: 37.57, lng: 126.98, emoji: "🐕", name: "Seoul Jindo" },
  { lat: 52.52, lng: 13.41, emoji: "🦔", name: "Berlin Hedgehog" },
  { lat: 41.90, lng: 12.50, emoji: "🐈", name: "Rome Cat" },
  { lat: -1.29, lng: 36.82, emoji: "🦁", name: "Nairobi Lion" },
  { lat: 59.33, lng: 18.07, emoji: "🐻‍❄️", name: "Stockholm Bear" },
  { lat: 31.23, lng: 121.47, emoji: "🐼", name: "Shanghai Panda" },
  { lat: -33.93, lng: 18.42, emoji: "🐧", name: "Cape Penguin" },
  { lat: 64.15, lng: -21.94, emoji: "🐋", name: "Iceland Whale" },
  { lat: 13.76, lng: 100.50, emoji: "🐘", name: "Bangkok Elephant" },
  { lat: 43.65, lng: -79.38, emoji: "🦫", name: "Toronto Beaver" },
  { lat: -37.81, lng: 144.96, emoji: "🦘", name: "Melbourne Roo" },
  { lat: 25.20, lng: 55.27, emoji: "🐫", name: "Dubai Camel" },
  { lat: 35.69, lng: 51.39, emoji: "🐈", name: "Tehran Persian Cat" },
];

// Pastel colors for countries
const PASTEL_COLORS = [
  "#a8e6cf", "#dcedc1", "#ffd3b6", "#ffaaa5", "#ff8b94",
  "#b5ead7", "#c7ceea", "#e2f0cb", "#ffdac1", "#f0e6ef",
  "#d4f0f0", "#cce2cb", "#fcf6bd", "#d0e8f2", "#e8d5b7",
  "#f3d1dc", "#bde0fe", "#c1fba4", "#ffc6ff", "#caffbf",
];

export default function GlobeComponent() {
  const globeEl = useRef<any>(null);
  const labelElements = useRef<Map<HTMLElement, any>>(new Map());
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [countries, setCountries] = useState<any[]>([]);

  const handleLabelClick = useCallback(() => {
    window.location.href = "/globe";
  }, []);

  // Globe material — light pastel blue for oceans
  const globeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial();
    mat.color = new THREE.Color("#dbeafe"); // pastel blue ocean
    mat.emissive = new THREE.Color("#dbeafe");
    mat.emissiveIntensity = 0.15;
    mat.shininess = 5;
    return mat;
  }, []);

  // Fetch world GeoJSON data
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
      .then((r) => r.json())
      .then((data) => {
        setCountries(data.features || []);
      })
      .catch(() => {
        // fallback: show globe without countries
      });
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const s = Math.min(window.innerWidth * 0.45, 600);
      setDimensions({ width: s, height: s });
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    if (!globeEl.current) return;
    const globe = globeEl.current;

    // Disable zoom, only allow drag-rotate
    const controls = globe.controls();
    if (controls) {
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
    }
    globe.pointOfView({ altitude: 2.2 });

    // Label visibility — check dot product with camera
    let running = true;
    const checkVisibility = () => {
      if (!running || !globeEl.current) return;
      try {
        const camera = globeEl.current.camera();
        const cameraPos = camera.position.clone().normalize();
        const R = globeEl.current.getGlobeRadius();

        labelElements.current.forEach((data, el) => {
          const phi = (90 - data.lat) * (Math.PI / 180);
          const theta = (90 - data.lng) * (Math.PI / 180);
          const x = R * Math.sin(phi) * Math.cos(theta);
          const y = R * Math.cos(phi);
          const z = R * Math.sin(phi) * Math.sin(theta);
          const labelDir = new THREE.Vector3(x, y, z).normalize();
          const dot = labelDir.dot(cameraPos);

          if (dot < 0.15) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
          } else {
            const fade = Math.min(1, (dot - 0.15) / 0.25);
            el.style.opacity = String(fade);
            el.style.pointerEvents = "auto";
          }
        });
      } catch {
        // ignore
      }
      requestAnimationFrame(checkVisibility);
    };

    const timeout = setTimeout(() => requestAnimationFrame(checkVisibility), 1500);

    return () => {
      running = false;
      window.removeEventListener("resize", updateSize);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex items-center justify-center cursor-grab active:cursor-grabbing">
      <GlobeT
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={null as any}
        showGlobe={true}
        globeMaterial={globeMaterial}
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#93c5fd"
        atmosphereAltitude={0.12}
        showGraticules={false}
        // Hex polygons for countries — cartoonish look
        hexPolygonsData={countries}
        hexPolygonGeoJsonGeometry={"geometry" as any}
        hexPolygonColor={(d: any) => {
          const idx = (d?.properties?.MAPCOLOR7 || 0) % PASTEL_COLORS.length;
          return PASTEL_COLORS[idx];
        }}
        hexPolygonResolution={3}
        hexPolygonMargin={0.4}
        hexPolygonAltitude={0.005}
        // Pet labels
        htmlElementsData={PET_LABELS}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.05}
        htmlElement={(d: any) => {
          const el = document.createElement("div");
          el.style.transition = "opacity 0.25s ease";
          el.innerHTML = `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 44px;
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              font-size: 18px;
              cursor: pointer;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='scale(1.3)'"
            onmouseout="this.style.transform='scale(1)'"
            title="${d.name}"
            >
              ${d.emoji}
            </div>
          `;
          el.style.pointerEvents = "auto";
          el.style.cursor = "pointer";
          el.addEventListener("click", () => handleLabelClick());
          labelElements.current.set(el, d);
          return el;
        }}
      />
    </div>
  );
}
