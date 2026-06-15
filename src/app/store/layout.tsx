import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Shop PawPal NFC safety tags and curated pet gear for smarter walks, faster owner contact, and daily care.",
  alternates: {
    canonical: "/store",
  },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}

