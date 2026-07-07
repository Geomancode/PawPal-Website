"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellOff, BellRing, CheckCircle, Loader2, ShieldAlert, WifiOff } from "lucide-react";

type PushStatus = "checking" | "unsupported" | "available" | "denied" | "enabled" | "error";

type PushSubscriptionSettingsProps = {
  accessToken: string | null;
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

export default function PushSubscriptionSettings({ accessToken }: PushSubscriptionSettingsProps) {
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [status, setStatus] = useState<PushStatus>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!browserSupportsPush()) {
      setStatus("unsupported");
      setMessage("This browser does not support Web Push notifications.");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      setMessage("Notifications are blocked in this browser. Enable them in site settings to receive PawPal alerts.");
      return;
    }

    if (Notification.permission !== "granted") {
      setStatus("available");
      setMessage("Enable browser push to receive PawPal alerts even when the website is closed.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      setStatus(existing ? "enabled" : "available");
      setMessage(
        existing
          ? "Browser push is active for this device."
          : "Notifications are allowed. Enable browser push for this device.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to read push subscription status.");
    }
  }, []);

  useEffect(() => {
    refreshStatus().catch((error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to read push subscription status.");
    });
  }, [refreshStatus]);

  const viewModel = useMemo(() => {
    switch (status) {
      case "unsupported":
        return {
          icon: <WifiOff className="h-5 w-5" aria-hidden="true" />,
          eyebrow: "Not supported",
          title: "Browser push unavailable",
          tone: "bg-paw-danger-soft text-paw-on-danger-soft",
          action: "Unavailable",
          disabled: true,
        };
      case "denied":
        return {
          icon: <ShieldAlert className="h-5 w-5" aria-hidden="true" />,
          eyebrow: "Blocked",
          title: "Notifications blocked",
          tone: "bg-paw-warning-soft text-paw-on-warning-soft",
          action: "Blocked",
          disabled: true,
        };
      case "enabled":
        return {
          icon: <CheckCircle className="h-5 w-5" aria-hidden="true" />,
          eyebrow: "Enabled",
          title: "Push notifications on",
          tone: "bg-paw-success-soft text-paw-on-success-soft",
          action: "Disable push",
          disabled: false,
        };
      case "error":
        return {
          icon: <BellOff className="h-5 w-5" aria-hidden="true" />,
          eyebrow: "Needs attention",
          title: "Push setup needs attention",
          tone: "bg-paw-danger-soft text-paw-on-danger-soft",
          action: "Try again",
          disabled: false,
        };
      case "checking":
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />,
          eyebrow: "Checking",
          title: "Checking notification status",
          tone: "bg-paw-primary-soft text-paw-on-primary-soft",
          action: "Checking",
          disabled: true,
        };
      default:
        return {
          icon: <BellRing className="h-5 w-5" aria-hidden="true" />,
          eyebrow: "Available",
          title: "Push notifications off",
          tone: "bg-paw-primary-soft text-paw-on-primary-soft",
          action: "Enable push",
          disabled: false,
        };
    }
  }, [status]);

  const saveSubscription = async (subscription: PushSubscription) => {
    if (!accessToken) {
      throw new Error("Sign in again before changing push settings.");
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
      throw new Error("PawPal could not save this browser subscription.");
    }
  };

  const removeSubscription = async (endpoint: string) => {
    if (!accessToken) {
      throw new Error("Sign in again before changing push settings.");
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
      throw new Error("PawPal could not remove this browser subscription.");
    }
  };

  const enablePush = async () => {
    if (!publicVapidKey.trim()) {
      throw new Error("Push notifications are not configured for this deployment.");
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission === "denied") {
      setStatus("denied");
      setMessage("Notifications are blocked in this browser. Enable them in site settings to receive PawPal alerts.");
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
    setMessage("Browser push is active for this device.");
  };

  const disablePush = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      setStatus("available");
      setMessage("Push notifications are off for this browser.");
      return;
    }

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await removeSubscription(endpoint);
    setStatus("available");
    setMessage("Push notifications are off for this browser.");
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
      setMessage(error instanceof Error ? error.message : "Push settings could not be updated.");
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
            <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-primary">
              {viewModel.eyebrow}
            </p>
            <h2 id="push-settings-heading" className="mt-1 text-xl font-extrabold text-paw-ink">
              {viewModel.title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-paw-body">
              {message ?? "Choose whether this browser should receive PawPal alerts."}
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
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bell className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Saving..." : viewModel.action}
        </button>
      </div>
    </section>
  );
}
