"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeToOnlineStatus(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineStatus() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function getServerOnlineStatus() {
  return true;
}

export default function PwaRuntime() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const online = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    getServerOnlineStatus,
  );
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const offline = !online;

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const removeWindowListeners = () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };

    if (!("serviceWorker" in navigator)) return removeWindowListeners;
    if (isDevelopment) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((item) => item.unregister())))
        .catch(() => undefined);
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(keys.filter((key) => key.startsWith("pawpal-shell-")).map((key) => caches.delete(key))),
          )
          .catch(() => undefined);
      }
      return removeWindowListeners;
    }

    const canRegister = window.location.protocol === "https:" || window.location.hostname === "localhost";
    if (!canRegister) {
      return removeWindowListeners;
    }

    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        setRegistration(registration);
        if (registration.waiting) {
          setUpdateReady(true);
        }
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
        registration.update().catch(() => undefined);
      })
      .catch(() => {
        /* Service worker failures should not block the app shell. */
      });

    return () => {
      removeWindowListeners();
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [isDevelopment]);

  const applyUpdate = () => {
    if (!registration?.waiting) {
      window.location.reload();
      return;
    }
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  if (isDevelopment) return null;

  if (!offline && !updateReady) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[70] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 rounded-paw-lg border border-paw-border bg-paw-panel/95 p-4 text-paw-ink shadow-paw-panel backdrop-blur">
      {offline && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold">Offline mode</p>
            <p className="mt-1 text-xs leading-5 text-paw-muted">
              PawPal is showing cached pages until your connection returns.
            </p>
          </div>
          <span className="inline-flex h-9 items-center justify-center rounded-paw-sm bg-paw-warning-soft px-3 text-xs font-extrabold text-paw-warning">
            Reconnecting
          </span>
        </div>
      )}

      {!offline && updateReady && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold">PawPal update ready</p>
            <p className="mt-1 text-xs leading-5 text-paw-muted">
              Refresh to load the latest safety and store improvements.
            </p>
          </div>
          <button
            type="button"
            onClick={applyUpdate}
            className="inline-flex h-11 items-center justify-center rounded-paw-md bg-paw-primary-contrast px-4 text-sm font-extrabold text-white shadow-paw-action transition hover:bg-paw-primary-hover"
          >
            Update now
          </button>
        </div>
      )}
    </div>
  );
}
