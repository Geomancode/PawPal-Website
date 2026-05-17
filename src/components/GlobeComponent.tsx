"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

const GlobeT = dynamic(() => import("react-globe.gl").then((m) => m.default), {
  ssr: false,
});

// Warm, friendly pastel palette — illustrated map style
const COUNTRY_COLORS = [
  "#FFDAB9", // peach puff
  "#B5EAD7", // mint green
  "#FFD6A5", // light apricot
  "#C1E1C1", // pistachio
  "#FFC3A0", // melon
  "#A7D8DE", // soft teal
  "#FFE5B4", // papaya whip
  "#D4A5A5", // dusty rose
  "#98D8C8", // aqua mint
  "#F7DC6F", // soft gold
  "#AED9E0", // powder blue
  "#FAD02C", // warm yellow
  "#C5CAE9", // lavender blue
  "#FFAB91", // light coral
  "#A5D6A7", // soft green
  "#F8C8DC", // baby pink
  "#D1C4E9", // light purple
  "#FFE0B2", // warm sand
  "#B2EBF2", // light cyan
  "#DCEDC1", // lime cream
];

export default function GlobeComponent() {
  const globeEl = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 620, height: 620 });
  const [countries, setCountries] = useState<any[]>([]);

  // Globe material — warm cream ocean, bright and friendly
  const globeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial();
    mat.color = new THREE.Color("#E8F4FD");       // soft sky-blue ocean
    mat.emissive = new THREE.Color("#E8F4FD");
    mat.emissiveIntensity = 0.35;
    mat.shininess = 25;
    mat.specular = new THREE.Color("#FFFFFF");
    return mat;
  }, []);

  // Stable color function — assign color by country index
  const getCountryColor = useCallback((feat: any) => {
    const idx = (feat?.properties?.MAPCOLOR7 ?? 0) % COUNTRY_COLORS.length;
    return COUNTRY_COLORS[idx];
  }, []);

  // Fetch world GeoJSON data
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
      .then((r) => r.json())
      .then((data) => {
        setCountries(data.features || []);
      })
      .catch(() => {});
  }, []);

  // Responsive sizing — bigger globe
  useEffect(() => {
    const updateSize = () => {
      const s = Math.min(window.innerWidth * 0.5, 680);
      setDimensions({ width: s, height: s });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Globe controls — set up after mount + ensure rotation
  useEffect(() => {
    if (!globeEl.current) return;

    // Small delay to ensure globe internals are ready
    const timer = setTimeout(() => {
      const globe = globeEl.current;
      if (!globe) return;

      // Camera position — slightly closer for bigger appearance
      globe.pointOfView({ altitude: 1.8 });

      // Controls
      const controls = globe.controls();
      if (controls) {
        controls.enableZoom = false;       // disable scroll zoom
        controls.autoRotate = true;        // auto-rotate
        controls.autoRotateSpeed = 0.5;    // gentle rotation
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minPolarAngle = Math.PI / 3.5;   // limit vertical drag
        controls.maxPolarAngle = Math.PI - Math.PI / 3.5;
      }

      // Inject bright lighting into the scene
      const scene = globe.scene();
      if (scene) {
        // Remove default dim lights and add bright ones
        const ambient = new THREE.AmbientLight(0xFFFFFF, 2.0);
        scene.add(ambient);
        const sunLight = new THREE.DirectionalLight(0xFFF8F0, 1.0);
        sunLight.position.set(5, 3, 5);
        scene.add(sunLight);
        const fillLight = new THREE.DirectionalLight(0xE8F4FD, 0.5);
        fillLight.position.set(-3, -2, -3);
        scene.add(fillLight);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [countries]); // re-run when countries load

  return (
    <div className="flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
      <GlobeT
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={null as any}
        showGlobe={true}
        globeMaterial={globeMaterial}
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#F5C97F"
        atmosphereAltitude={0.18}
        showGraticules={false}
        /* ─── Solid polygon countries — cute illustrated map ─── */
        polygonsData={countries}
        polygonGeoJsonGeometry="geometry"
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(200, 180, 160, 0.15)"}
        polygonStrokeColor={() => "#FFFFFF"}
        polygonAltitude={0.012}
        polygonLabel={(d: any) => null}
        animateIn={true}
      />
    </div>
  );
}
