import type { Metadata } from "next";
import { enMessages } from "@/i18n/messages";
import { publicPageMetadata } from "../metadata";

export const metadata: Metadata = publicPageMetadata({
  title: enMessages.storeMetadataTitle,
  description: enMessages.storeMetadataDescription,
  path: "/store",
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
