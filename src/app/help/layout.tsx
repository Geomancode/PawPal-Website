import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Get PawPal support for NFC tags, public pet profiles, accounts, community features, and safety workflows.",
  alternates: {
    canonical: "/help",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}

