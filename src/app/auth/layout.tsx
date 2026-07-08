import type { Metadata } from "next";
import { enMessages } from "@/i18n/messages";
import { privatePageMetadata } from "../metadata";

export const metadata: Metadata = privatePageMetadata({
  title: enMessages.authMetadataTitle,
  description: enMessages.authMetadataDescription,
  path: "/auth",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
