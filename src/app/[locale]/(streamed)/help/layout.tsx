import type { Metadata } from "next";
import { publicPageMetadata } from "@/app/metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Help Center",
  description:
    "Get PawPal support for NFC tags, public pet profiles, accounts, community features, and safety workflows.",
  path: "/help",
});

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
