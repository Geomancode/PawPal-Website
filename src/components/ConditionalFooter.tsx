"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { stripLocalePrefix } from "@/i18n/routing";

/** Pages where the footer should NOT appear (full-screen layouts) */
const HIDE_ON = ["/globe"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_ON.includes(stripLocalePrefix(pathname))) return null;
  return <Footer />;
}
