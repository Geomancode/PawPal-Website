import type { Metadata } from "next";
import { publicPageMetadata } from "../metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Store",
  description:
    "Shop PawPal NFC safety tags and curated pet gear for smarter walks, faster owner contact, and daily care.",
  path: "/store",
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
