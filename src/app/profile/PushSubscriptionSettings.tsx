"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PawIcon from "@/components/icons/PawIcon";
import type { ProfileTranslation } from "./ProfileWorkspaceView";

type PushStatus = "checking" | "unsupported" | "available" | "denied" | "enabled" | "error";

type PushSubscriptionSettingsProps = {
  accessToken: string | null;
  t: ProfileTranslation;
};

function browserSupportsPush() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(Array.from(rawData, (char) => char.charCodeAt(0)));
}

async function getWritableServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

function subscriptionPayload(subscription: PushSubscription) {
  return typeof subscription.toJSON === "function" ? subscription.toJSON() : subscription;
}

export default function PushSubscriptionSettings({ accessToken, t }: PushSubscriptionSettingsProps) {
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [status, setStatus] = useState<PushStatus>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!browserSupportsPush()) {
      setStatus("unsupported");
      setMessage(t("pushUnsupportedMessage"));
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      setMessage(t("pushBlockedMessage"));
      return;
    }

    if (Notification.permission !== "granted") {
      setStatus("available");
      setMessage(t("pushAvailableMessage"));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      setStatus(existing ? "enabled" : "available");
      setMessage(
        existing
          ? t("pushActiveMessage")
          : t("pushAllowedMessage"),
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t("pushReadStatusError"));
    }
  }, [t]);

  useEffect(() => {
    refreshStatus().catch((error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t("pushReadStatusError"));
    });
  }, [refreshStatus, t]);

  const viewModel = useMemo(() => {
    switch (status) {
      case "unsupported":
        return {
          icon: <PawIcon name="offline" className="h-5 w-5" aria-hidden="true" />,
          eyebrow: t("pushUnsupportedEyebrow"),
          title: t("pushUnsupportedTitle"),
          tone: "bg-paw-danger-soft text-paw-on-danger-soft",
          action: t("pushUnavailableAction"),
          disabled: true,
        };
      case "denied":
        return {
          icon: <PawIcon name="safetyAlert" className="h-5 w-5" aria-hidden="true" />,
          eyebrow: t("pushBlockedEyebrow"),
          title: t("pushBlockedTitle"),
          tone: "bg-paw-warning-soft text-paw-on-warning-soft",
          action: t("pushBlockedAction"),
          disabled: true,
        };
      case "enabled":
        return {
          icon: <PawIcon name="confirm" className="h-5 w-5" aria-hidden="true" />,
          eyebrow: t("pushEnabledEyebrow"),
          title: t("pushEnabledTitle"),
          tone: "bg-paw-success-soft text-paw-on-success-soft",
          action: t("pushDisableAction"),
          disabled: false,
        };
      case "error":
        return {
          icon: <PawIcon name="notifyOff" className="h-5 w-5" aria-hidden="true" />,
          eyebrow: t("pushErrorEyebrow"),
          title: t("pushErrorTitle"),
          tone: "bg-paw-danger-soft text-paw-on-danger-soft",
          action: t("pushTryAgainAction"),
          disabled: false,
        };
      case "checking":
        return {
          icon: <PawIcon name="spinner" className="h-5 w-5 animate-spin" aria-hidden="true" />,
          eyebrow: t("pushCheckingEyebrow"),
          title: t("pushCheckingTitle"),
          tone: "bg-paw-primary-soft text-paw-on-primary-soft",
          action: t("pushCheckingAction"),
          disabled: true,
        };
      default:
        return {
          icon: <PawIcon name="notifyActive" className="h-5 w-5" aria-hidden="true" />,
          eyebrow: t("pushAvailableEyebrow"),
          title: t("pushAvailableTitle"),
          tone: "bg-paw-primary-soft text-paw-on-primary-soft",
          action: t("pushEnableAction"),
          disabled: false,
        };
    }
  }, [status, t]);

  const saveSubscription = async (subscription: PushSubscription) => {
    if (!accessToken) {
      throw new Error(t("pushSignInAgainError"));
    }

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ subscription: subscriptionPayload(subscription) }),
    });

    if (!response.ok) {
      throw new Error(t("pushSaveSubscriptionError"));
    }
  };

  const removeSubscription = async (endpoint: string) => {
    if (!accessToken) {
      throw new Error(t("pushSignInAgainError"));
    }

    const response = await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      throw new Error(t("pushRemoveSubscriptionError"));
    }
  };

  const enablePush = async () => {
    if (!publicVapidKey.trim()) {
      throw new Error(t("pushNotConfiguredError"));
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission === "denied") {
      setStatus("denied");
      setMessage(t("pushBlockedMessage"));
      return;
    }

    const registration = await getWritableServiceWorkerRegistration();
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey.trim()),
      }));

    await saveSubscription(subscription);
    setStatus("enabled");
    setMessage(t("pushActiveMessage"));
  };

  const disablePush = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      setStatus("available");
      setMessage(t("pushOffMessage"));
      return;
    }

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await removeSubscription(endpoint);
    setStatus("available");
    setMessage(t("pushOffMessage"));
  };

  const handleAction = async () => {
    if (status === "unsupported" || status === "denied" || status === "checking") return;

    setBusy(true);
    setMessage(null);
    try {
      if (status === "enabled") {
        await disablePush();
      } else {
        await enablePush();
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t("pushUpdateError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="profile-readiness-card mb-6"
      aria-labelledby="push-settings-heading"
      data-testid="push-settings"
      data-push-state={status}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-paw-md ${viewModel.tone}`}>
            {viewModel.icon}
          </div>
          <div className="min-w-0">
            <p className="text-paw-type-caption font-black uppercase tracking-[0.12em] text-paw-primary">
              {viewModel.eyebrow}
            </p>
            <h2 id="push-settings-heading" className="mt-1 text-paw-type-h2 font-extrabold text-paw-ink">
              {viewModel.title}
            </h2>
            <p className="mt-1 max-w-2xl text-paw-type-body leading-6 text-paw-body">
              {message ?? t("pushDefaultDescription")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAction}
          disabled={busy || viewModel.disabled}
          className={`profile-action-button ${
            status === "enabled" || status === "denied" || status === "unsupported"
              ? "profile-action-button-secondary"
              : "profile-action-button-primary"
          } shrink-0`}
        >
          {busy ? <PawIcon name="spinner" className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PawIcon name="notify" className="h-4 w-4" aria-hidden="true" />}
          {busy ? t("profileSaving") : viewModel.action}
        </button>
      </div>
    </section>
  );
}
