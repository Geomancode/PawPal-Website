"use client";

import { AuthProvider } from "@/components/AuthProvider";
import ConsoleWarningFilter from "@/components/ConsoleWarningFilter";
import PwaRuntime from "@/components/PwaRuntime";
import PublicResourceNavigation from "@/components/PublicResourceNavigation";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConsoleWarningFilter />
      <PwaRuntime />
      <PublicResourceNavigation />
      {children}
    </AuthProvider>
  );
}
