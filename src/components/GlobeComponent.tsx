"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

const GlobeT = dynamic(() => import("react-globe.gl").then((m) => m.default), {
  ssr: false,
});

// Pastel colors for countries
const PASTEL_COLORS = [
  "#a8e6cf", "#dcedc1", "#ffd3b6", "#ffaaa5", "#ff8b94",
  "#b5ead7", "#c7ceea", "#e2f0cb", "#ffdac1", "#f0e6ef",
  "#d4f0f0", "#cce2cb", "#fcf6bd", "#d0e8f2", "#e8d5b7",
  "#f3d1dc", "#bde0fe", "#c1fba4", "#ffc6ff", "#caffbf",
];

export default function GlobeComponent() {
  const globeEl = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [countries, setCountries] = useState<any[]>([]);

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
      />
    </div>
  );
}
