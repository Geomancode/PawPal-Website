"use client";

import { useEffect } from "react";

const FILTERED_WARNINGS = [
  "THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.",
];

export default function ConsoleWarningFilter() {
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const message = args.map(String).join(" ");
      if (FILTERED_WARNINGS.some((warning) => message.includes(warning))) {
        return;
      }
      originalWarn(...args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}

