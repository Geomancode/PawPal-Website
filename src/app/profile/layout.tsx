import type { Metadata } from "next";
import { privatePageMetadata } from "../metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Profile",
  description: "Manage your PawPal account, pets, smart tag settings, and private profile details.",
  path: "/profile",
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
