import type { Metadata } from "next";
import { publicPageMetadata } from "@/app/metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how PawPal handles account, pet profile, location, store, and community data with controlled sharing and privacy-first public safety pages.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
