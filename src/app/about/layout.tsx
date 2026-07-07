import type { Metadata } from "next";
import { publicPageMetadata } from "../metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "About",
  description:
    "Meet the PawPal team in Ghent and learn how the app, website, and NFC smart tags connect daily walks, safety, and local pet care.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
