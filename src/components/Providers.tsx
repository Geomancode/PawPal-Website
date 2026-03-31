"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
