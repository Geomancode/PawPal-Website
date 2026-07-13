"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

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
  const { loader, t } = useRouteTranslations();
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
      {loader}
      {offline && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-paw-type-body font-extrabold">{t("pwaOfflineTitle")}</p>
            <p className="mt-1 text-paw-type-caption leading-5 text-paw-muted">
              {t("pwaOfflineDescription")}
            </p>
          </div>
          <span className="inline-flex h-9 items-center justify-center rounded-paw-sm bg-paw-warning-soft px-3 text-paw-type-caption font-extrabold text-paw-warning">
            {t("pwaReconnecting")}
          </span>
        </div>
      )}

      {!offline && updateReady && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-paw-type-body font-extrabold">{t("pwaUpdateReadyTitle")}</p>
            <p className="mt-1 text-paw-type-caption leading-5 text-paw-muted">
              {t("pwaUpdateReadyDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={applyUpdate}
            className="inline-flex h-11 items-center justify-center rounded-paw-md bg-paw-primary px-4 text-paw-type-body font-extrabold text-paw-accent-ink shadow-paw-action transition hover:bg-paw-primary-hover"
          >
            {t("pwaUpdateNow")}
          </button>
        </div>
      )}
    </div>
  );
}
