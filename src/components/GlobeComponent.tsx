"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import GlobeT from "react-globe.gl";

// 25 shield labels distributed globally (including ocean animals)
const PET_LABELS = [
  { lat: 50.85, lng: 4.35, emoji: "🐱", name: "Brussels Cat" },
  { lat: 48.86, lng: 2.35, emoji: "🐩", name: "Paris Poodle" },
  { lat: 51.51, lng: -0.13, emoji: "🐕", name: "London Corgi" },
  { lat: 40.71, lng: -74.01, emoji: "🦮", name: "NYC Golden" },
  { lat: 35.68, lng: 139.69, emoji: "🐕", name: "Tokyo Shiba" },
  { lat: -33.87, lng: 151.21, emoji: "🐨", name: "Sydney Koala" },
  { lat: -33.93, lng: 18.42, emoji: "🐧", name: "Cape Penguin" },
  { lat: 45.0, lng: -40.0, emoji: "🐋", name: "Atlantic Whale" },
  { lat: 5.0, lng: -160.0, emoji: "🐢", name: "Pacific Turtle" },
  { lat: 55.75, lng: 37.62, emoji: "🐾", name: "Moscow Husky" },
  { lat: 19.43, lng: -99.13, emoji: "🐕", name: "Mexico Xolo" },
  { lat: -22.91, lng: -43.17, emoji: "🦜", name: "Rio Macaw" },
  { lat: 1.35, lng: 103.82, emoji: "🐠", name: "Singapore Fish" },
  { lat: 28.61, lng: 77.21, emoji: "🐘", name: "Delhi Elephant" },
  { lat: 31.23, lng: 121.47, emoji: "🐼", name: "Shanghai Panda" },
  { lat: 37.57, lng: 126.98, emoji: "🐕", name: "Seoul Jindo" },
  { lat: -1.29, lng: 36.82, emoji: "🦁", name: "Nairobi Lion" },
  { lat: 30.04, lng: 31.24, emoji: "🐫", name: "Cairo Camel" },
  { lat: 64.15, lng: -21.94, emoji: "🐴", name: "Iceland Horse" },
  { lat: -8.65, lng: 115.22, emoji: "🐒", name: "Bali Monkey" },
  { lat: -15.0, lng: -75.0, emoji: "🐬", name: "Peru Dolphin" },
  { lat: 25.0, lng: 55.0, emoji: "🐪", name: "Dubai Falcon" },
  { lat: 60.17, lng: 24.94, emoji: "🦌", name: "Helsinki Deer" },
  { lat: -45.0, lng: 170.0, emoji: "🐑", name: "NZ Sheep" },
  { lat: 10.0, lng: 80.0, emoji: "🐳", name: "Indian Whale" },
];

// three-globe's coordinate conversion: polar2Cartesian
function latLngToXYZ(lat: number, lng: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

export default function HomeGlobe() {
  const globeEl = useRef<any>(null);
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const labelElements = useRef<Map<HTMLElement, any>>(new Map());

  const handleLabelClick = useCallback(() => {
    router.push("/globe");
  }, [router]);

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      setDimensions({
        width: w > 768 ? Math.min(w * 0.45, 700) : w * 0.9,
        height: w > 768 ? Math.min(w * 0.45, 700) : w * 0.7,
      });
    };

    window.addEventListener("resize", updateSize);
    updateSize();

    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableZoom = false;
      controls.minDistance = 250;
      controls.maxDistance = 250;
    }

    // Visibility: hide labels on the back side of the globe using correct coordinate math
    const GLOBE_RADIUS = 100; // three-globe default
    let running = true;

    const checkVisibility = () => {
      if (!running || !globeEl.current) return;

      try {
        const camera = globeEl.current.camera();
        if (!camera) { requestAnimationFrame(checkVisibility); return; }

        const cp = camera.position;
        const camDist = Math.sqrt(cp.x * cp.x + cp.y * cp.y + cp.z * cp.z);

        labelElements.current.forEach((data, el) => {
          const pos = latLngToXYZ(data.lat, data.lng, GLOBE_RADIUS);
          // Dot product of point normal and camera direction
          const dot = (pos.x * cp.x + pos.y * cp.y + pos.z * cp.z) / (GLOBE_RADIUS * camDist);

          // dot=1 means directly facing camera, dot=0 is edge, dot<0 is back
          if (dot < 0.1) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
          } else if (dot < 0.3) {
            el.style.opacity = String(((dot - 0.1) / 0.2).toFixed(2));
            el.style.pointerEvents = "auto";
          } else {
            el.style.opacity = "1";
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
        globeImageUrl="/earth-pixel.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#93c5fd"
        atmosphereAltitude={0.12}
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
