import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet the PawPal team in Ghent and learn how the app, website, and NFC smart tags connect daily walks, safety, and local pet care.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

