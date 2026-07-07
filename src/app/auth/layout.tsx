import type { Metadata } from "next";
import { privatePageMetadata } from "../metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Sign in",
  description: "Sign in to manage PawPal profiles, smart tags, store orders, and app-connected settings.",
  path: "/auth",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
