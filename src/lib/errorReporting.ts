import * as Sentry from "@sentry/nextjs";

export type ErrorReportContext = Record<
  string,
  string | number | boolean | null | undefined
>;

const redacted = "[REDACTED]";
const sensitiveKey = /^(?:authorization|proxyauthorization|cookie|setcookie|apikey|xapikey|accesstoken|refreshtoken|idtoken|token|password|clientsecret|servicerolekey|secret|signature|sig)$/i;
function isSensitiveKey(key: string) {
  return sensitiveKey.test(key.replace(/[-_\s]/g, ""));
}

function redactText(value: string): string {
  return value
    // Query strings and fragments may contain signed URLs or callback tokens.
    .replace(/https?:\/\/[^\s<>"')]+/gi, (raw) => {
      try {
        const url = new URL(raw);
        url.username = "";
        url.password = "";
        if (url.search) url.search = "?redacted";
        if (url.hash) url.hash = "#redacted";
        return url.toString();
      } catch {
        return "[REDACTED_URL]";
      }
    })
    .replace(/\b(?:Bearer|Basic)\s+[^\s,"'}]+/gi, redacted)
    .replace(/(["']?(?:authorization|proxy[-_]?authorization|cookie|set[-_]?cookie)["']?\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\r\n,}]+)/gi, `$1${redacted}`)
    .replace(/(["']?(?:access[-_]?token|refresh[-_]?token|id[-_]?token|api[-_]?key|x[-_]?api[-_]?key|client[-_]?secret|service[-_]?role[-_]?key|password|token|secret|signature|sig)["']?\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;&}\]]+)/gi, `$1${redacted}`)
    .replace(/\b(?:sk_(?:live|test)_[A-Za-z0-9_]+|sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, redacted);
}

function safeString(value: unknown): string {
  try {
    if (typeof value === "string") return redactText(value);
    const seen = new WeakSet<object>();
    return redactText(JSON.stringify(value, (key, item) => {
      if (isSensitiveKey(key)) return redacted;
      if (item && typeof item === "object") {
        if (seen.has(item)) return "[Circular]";
        seen.add(item);
      }
      return item;
    }) ?? String(value));
  } catch {
    return "Unserializable error";
  }
}

function sanitizedError(error: unknown): Error {
  // Do not pass the original object/cause/custom properties to an external SDK.
  const safe = new Error(error instanceof Error ? redactText(error.message) : safeString(error));
  safe.name = error instanceof Error ? redactText(error.name) : "NonError";
  if (error instanceof Error && error.stack) safe.stack = redactText(error.stack);
  return safe;
}

function sanitizedContext(context: ErrorReportContext): ErrorReportContext {
  return Object.fromEntries(Object.entries(context).map(([key, value]) => [
    redactText(key),
    isSensitiveKey(key) ? redacted : safeContextValue(value),
  ]));
}

function safeContextValue(value: unknown): ErrorReportContext[string] {
  if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
  // The public type is scalar; still sanitize unexpected nested runtime values.
  return safeString(value);
}

export function reportError(error: unknown, context: ErrorReportContext = {}) {
  try {
    const safeError = sanitizedError(error);
    const safeContext = sanitizedContext(context);
    if (typeof process !== "undefined" && process.env.SENTRY_DSN?.trim()) {
      Sentry.captureException(safeError, { extra: safeContext });
      return;
    }
    console.error("[error-report]", {
      timestamp: new Date().toISOString(),
      context: safeContext,
      error: { name: safeError.name, message: safeError.message, stack: safeError.stack },
    });
  } catch {
    // Even inspecting the rejected value may invoke a hostile getter. Never
    // read or print the original error/context or the reporting exception here.
    try {
      console.error("[error-report] failed to report error", {
        name: "ErrorReportingFailure",
        message: "Error report could not be safely prepared or delivered.",
      });
    } catch {
      // The last local sink itself is unavailable; reporting must not break UI.
      return;
    }
  }
}
