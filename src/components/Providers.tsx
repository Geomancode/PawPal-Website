"use client";

import { AuthProvider } from "@/components/AuthProvider";
import PwaRuntime from "@/components/PwaRuntime";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PwaRuntime />
      {children}
    </AuthProvider>
  );
}
