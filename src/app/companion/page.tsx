import type { Metadata } from "next";
import { privatePageMetadata } from "../metadata";
import CompanionClientParts from "./CompanionClientParts";

export const metadata: Metadata = privatePageMetadata({
  title: "Cyber companion",
  description: "Spend time with your pet’s AI companion. Share memories, choose what it remembers, and keep your conversations together.",
  path: "/companion",
});

export default function CompanionPage() {
  return <CompanionClientParts />;
}
