import type { Metadata } from "next";
import { privatePageMetadata } from "../../metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Orders",
  description: "Review PawPal store orders and delivery status for the current device.",
  path: "/store/orders",
});

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
