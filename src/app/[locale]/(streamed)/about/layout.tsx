import type { Metadata } from "next";
import { enMessages } from "@/i18n/messages";
import { publicPageMetadata } from "@/app/metadata";

export const metadata: Metadata = publicPageMetadata({
  title: enMessages.aboutMetadataTitle,
  description: enMessages.aboutMetadataDescription,
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
