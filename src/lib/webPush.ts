import webpush from "web-push";

export type StoredWebPushSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

let vapidConfigured = false;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function configureWebPush() {
  if (vapidConfigured) return;

  webpush.setVapidDetails(
    requiredEnv("VAPID_SUBJECT"),
    requiredEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    requiredEnv("VAPID_PRIVATE_KEY"),
  );
  vapidConfigured = true;
}

export function toWebPushSubscription(subscription: StoredWebPushSubscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

export function isExpiredPushEndpoint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    ((error as { statusCode?: number }).statusCode === 404 ||
      (error as { statusCode?: number }).statusCode === 410)
  );
}

