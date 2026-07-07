import type { Metadata } from "next";
import { privatePageMetadata } from "../../metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Checkout Status",
  description: "Confirm the status of a PawPal checkout session.",
  path: "/store/success",
});

export default function StoreSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
