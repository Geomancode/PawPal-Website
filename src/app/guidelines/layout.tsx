import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "Read PawPal community guidelines for respectful conduct, prohibited content, location privacy, reports, moderation, and appeals.",
  alternates: {
    canonical: "/guidelines",
  },
};

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
