export type ConsentChoice = "all" | "essential";

export const CONSENT_STORAGE_KEY = "pawpal-consent-v1";
export const CONSENT_CHANGE_EVENT = "pawpal-consent-change";

export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedChoice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return isConsentChoice(savedChoice) ? savedChoice : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function hasAnalyticsConsent() {
  return getConsent() === "all";
}

function isConsentChoice(value: string | null): value is ConsentChoice {
  return value === "all" || value === "essential";
}
