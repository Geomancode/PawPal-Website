"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/locales";
import { localizedPath } from "@/i18n/routing";

import {
  adminReportsSessionCookieName,
  loadPendingReports,
  verifyAdminAccess,
} from "./server";
import type { ReportResolutionAction } from "./types";

const validActions = new Set<ReportResolutionAction>([
  "dismissed",
  "content_removed",
  "user_banned",
]);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function syncAdminReportsSession(
  accessToken: string,
  locale: Locale = defaultLocale,
) {
  if (!isLocale(locale)) {
    return { ok: false, allowed: false, message: "Unsupported moderation action." };
  }
  const cookieStore = await cookies();
  const admin = await verifyAdminAccess(accessToken);

  if (admin.kind === "unauthenticated") {
    expireAdminReportsCookie(cookieStore);
    return {
      ok: false,
      allowed: false,
      message: admin.message,
    };
  }

  if (admin.kind === "error") {
    return {
      ok: false,
      allowed: false,
      message: admin.message,
    };
  }

  // A bridge for a new identity also removes stale tokens from other locale paths.
  expireAdminReportsCookie(cookieStore);
  cookieStore.set(adminReportsSessionCookieName(locale), accessToken, {
    httpOnly: true,
    maxAge: 55 * 60,
    path: localizedPath("/admin/reports", locale),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return {
    ok: true,
    allowed: admin.kind === "authorized",
    message:
      admin.kind === "authorized"
        ? null
        : "This account is not a PawPal admin.",
  };
}

export async function clearAdminReportsSession() {
  const cookieStore = await cookies();
  expireAdminReportsCookie(cookieStore);
}

// Explicit browser identity is required for data and mutations. The path-scoped
// cookie remains only a navigation bridge; it cannot authorize an old page.
export async function loadReportsAction(accessToken: string, page: number) {
  if (typeof accessToken !== "string" || !accessToken.trim() ||
      !Number.isSafeInteger(page) || page < 1) {
    return { ok: false as const, message: "Sign in again before resolving reports." };
  }
  const result = await loadPendingReports(accessToken, page);
  if (result.kind === "ready") {
    return { ok: true as const, viewerId: result.viewerId, payload: result.payload };
  }
  return {
    ok: false as const,
    message: result.kind === "forbidden"
      ? "PawPal admin privileges are required."
      : result.message,
  };
}

export async function resolveReportAction(
  reportId: string,
  action: ReportResolutionAction,
  accessToken: string,
  viewerId: string,
) {
  if (typeof reportId !== "string" || !uuidPattern.test(reportId)) {
    return {
      ok: false,
      message: "Invalid report id.",
    };
  }

  if (!validActions.has(action)) {
    return {
      ok: false,
      message: "Unsupported moderation action.",
    };
  }

  if (typeof accessToken !== "string" || !accessToken.trim() ||
      typeof viewerId !== "string" || !uuidPattern.test(viewerId)) {
    return {
      ok: false,
      message: "Sign in again before resolving reports.",
    };
  }

  const admin = await verifyAdminAccess(accessToken);

  if (admin.kind === "unauthenticated") {
    return {
      ok: false,
      message: admin.message,
    };
  }

  if (admin.kind === "forbidden") {
    return {
      ok: false,
      message: "PawPal admin privileges are required.",
    };
  }

  if (admin.kind === "error") {
    return {
      ok: false,
      message: admin.message,
    };
  }

  if (admin.userId !== viewerId) {
    return { ok: false, message: "Sign in again before resolving reports." };
  }

  const { error } = await admin.client.rpc("admin_resolve_report", {
    report_id: reportId,
    action,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/reports");

  return {
    ok: true,
    message: moderationSuccessMessage(action),
  };
}

function moderationSuccessMessage(action: ReportResolutionAction) {
  switch (action) {
    case "dismissed":
      return "Report dismissed.";
    case "content_removed":
      return "Report resolved and content removed.";
    case "user_banned":
      return "Report resolved and user banned.";
  }
}

function expireAdminReportsCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  // Never widen the token cookie to "/". Each supported locale has one
  // exact reports-only path; clearing also covers the historical English path.
  for (const locale of locales) {
    cookieStore.set(adminReportsSessionCookieName(locale), "", {
      httpOnly: true,
      maxAge: 0,
      path: localizedPath("/admin/reports", locale),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
