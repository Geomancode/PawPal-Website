import type { Metadata } from "next";
import { privatePageMetadata } from "../metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Admin",
  description: "Private PawPal administration workspace.",
  path: "/admin",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
