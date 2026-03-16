"use client";

import dynamic from "next/dynamic";

const MapGlobeComponent = dynamic(() => import("@/components/GlobeFullPage"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#050510] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
        <p className="text-white/30 text-sm font-light animate-pulse">Loading PawPal Globe…</p>
      </div>
    </div>
  ),
});

export default function GlobePage() {
  return <MapGlobeComponent />;
}
