"use client";

import dynamic from "next/dynamic";
import { Globe2 } from "lucide-react";

const MapGlobeComponent = dynamic(() => import("@/components/GlobeFullPage"), {
  ssr: false,
  loading: () => (
    <div className="globe-loading-shell flex h-screen w-full items-center justify-center bg-paw-ink px-4">
      <div className="globe-loading-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-paw-lg bg-white/10 text-paw-trust">
          <Globe2 className="h-8 w-8 animate-pulse" aria-hidden="true" />
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="globe-loading-bar h-full rounded-full" />
        </div>
        <p className="mt-4 text-sm font-bold text-white/70">Loading PawPal Globe</p>
        <p className="mt-1 text-xs text-white/42">
          Preparing map layers, weather context, and nearby pet support.
        </p>
      </div>
    </div>
  ),
});

export default function GlobePage() {
  return (
    <>
      <h1 className="sr-only">PawPal Globe</h1>
      <MapGlobeComponent />
    </>
  );
}
