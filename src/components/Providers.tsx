"use client";

import { AuthProvider } from "@/components/AuthProvider";
import ConsoleWarningFilter from "@/components/ConsoleWarningFilter";
import PwaRuntime from "@/components/PwaRuntime";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConsoleWarningFilter />
      <PwaRuntime />
      {children}
    </AuthProvider>
  );
}
