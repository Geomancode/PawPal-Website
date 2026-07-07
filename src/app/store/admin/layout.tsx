import type { Metadata } from "next";
import { privatePageMetadata } from "../../metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Store Admin",
  description: "Manage PawPal store catalog data and private commerce operations.",
  path: "/store/admin",
});

export default function StoreAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
