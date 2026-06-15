"use client";

import dynamic from "next/dynamic";
import GlobeStaticPreview from "./GlobeStaticPreview";

const HomeGlobe = dynamic(() => import("./GlobeComponent"), {
  ssr: false,
  loading: () => <GlobeStaticPreview />,
});

export default function Globe() {
  return <HomeGlobe />;
}
