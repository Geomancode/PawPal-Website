"use client";

import { useEffect } from "react";

export default function PwaRuntime() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const canRegister = window.location.protocol === "https:" || window.location.hostname === "localhost";
    if (!canRegister) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Install still falls back to the browser menu when registration is unavailable. */
    });
  }, []);

  return null;
}
