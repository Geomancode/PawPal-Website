import type { Metadata } from "next";
import { publicPageMetadata } from "../metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Community Guidelines",
  description:
    "Read PawPal community guidelines for respectful conduct, prohibited content, location privacy, reports, moderation, and appeals.",
  path: "/guidelines",
});

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
