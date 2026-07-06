import * as Sentry from "@sentry/nextjs";

export type ErrorReportContext = Record<
  string,
  string | number | boolean | null | undefined
>;

type NormalizedError = {
  name: string;
  message: string;
  stack?: string;
};

function sentryDsn() {
  if (typeof process === "undefined") return "";
  return process.env.SENTRY_DSN?.trim() ?? "";
}

function stringifyUnknown(value: unknown) {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      stack: error.stack,
    };
  }

  return {
    name: "NonError",
    message: stringifyUnknown(error),
  };
}

export function reportError(error: unknown, context: ErrorReportContext = {}) {
  const normalized = normalizeError(error);
  const payload = {
    timestamp: new Date().toISOString(),
    context,
    error: normalized,
  };

  try {
    if (sentryDsn()) {
      Sentry.captureException(error, { extra: context });
      return;
    }

    console.error("[error-report]", payload);
  } catch (reportingError) {
    console.error("[error-report] failed to report error", reportingError);
  }
}
