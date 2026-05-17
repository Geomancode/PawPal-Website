"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

const GlobeT = dynamic(() => import("react-globe.gl").then((m) => m.default), {
  ssr: false,
});

// Bright, warm pastel colors — Pawlace-inspired
const PASTEL_COLORS = [
  "#FFE0B2", "#FFCC80", "#FFD54F", "#FFF9C4", "#DCEDC8",
  "#C8E6C9", "#B2DFDB", "#B3E5FC", "#BBDEFB", "#D1C4E9",
  "#F8BBD0", "#FFCDD2", "#FFE082", "#E6EE9C", "#80DEEA",
  "#A5D6A7", "#EF9A9A", "#CE93D8", "#90CAF9", "#FFF59D",
];

export default function GlobeComponent() {
  const globeEl = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [countries, setCountries] = useState<any[]>([]);

  // Globe material — warm cream for oceans, strong emissive to prevent dark look
  const globeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial();
    mat.color = new THREE.Color("#FFF8F0");       // warm cream ocean
    mat.emissive = new THREE.Color("#FFF4E8");     // warm emissive glow
    mat.emissiveIntensity = 0.4;                   // strong glow to avoid dark
    mat.shininess = 15;
    mat.specular = new THREE.Color("#FFFFFF");
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

    // Inject extra light to brighten the globe
    const scene = globe.scene();
    if (scene) {
      const ambientLight = new THREE.AmbientLight(0xFFF8F0, 1.8);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);
    }

    return () => {
      window.removeEventListener("resize", updateSize);
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
        atmosphereColor="#F5A623"
        atmosphereAltitude={0.15}
        showGraticules={false}
        // Hex polygons for countries — bright friendly look
        hexPolygonsData={countries}
        hexPolygonGeoJsonGeometry={"geometry" as any}
        hexPolygonColor={(d: any) => {
          const idx = (d?.properties?.MAPCOLOR7 || 0) % PASTEL_COLORS.length;
          return PASTEL_COLORS[idx];
        }}
        hexPolygonResolution={3}
        hexPolygonMargin={0.3}
        hexPolygonAltitude={0.008}
      />
    </div>
  );
}
