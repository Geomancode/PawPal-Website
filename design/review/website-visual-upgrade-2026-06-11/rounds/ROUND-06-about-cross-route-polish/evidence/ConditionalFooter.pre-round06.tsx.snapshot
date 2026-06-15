"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/** Pages where the footer should NOT appear (full-screen layouts) */
const HIDE_ON = ["/globe"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_ON.includes(pathname)) return null;
  return <Footer />;
}
