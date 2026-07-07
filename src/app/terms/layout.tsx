import type { Metadata } from "next";
import { publicPageMetadata } from "../metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms of Service",
  description:
    "Review PawPal terms for the website, store, public pet safety flows, community features, and app-connected experiences.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
