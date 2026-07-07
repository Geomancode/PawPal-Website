import type { Metadata } from "next";
import { publicPageMetadata } from "../metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Live Pet Globe",
  description:
    "Explore PawPal's interactive map for nearby pet places, community missions, weather, and local pet help around Ghent and beyond.",
  path: "/globe",
});

export default function GlobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
