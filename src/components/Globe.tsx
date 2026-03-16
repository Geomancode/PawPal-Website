"use client";

import dynamic from "next/dynamic";

const HomeGlobe = dynamic(() => import("./GlobeComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center min-h-[400px]">
      <div className="w-14 h-14 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  ),
});

export default function Globe() {
  return <HomeGlobe />;
}
