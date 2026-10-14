import type { Metadata } from "next";
import { privatePageMetadata } from "@/app/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Checkout",
  description: "Complete a PawPal store checkout securely.",
  path: "/store/checkout",
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
