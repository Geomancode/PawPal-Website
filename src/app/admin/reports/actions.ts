"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  ADMIN_REPORTS_SESSION_COOKIE,
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

export async function syncAdminReportsSession(accessToken: string) {
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

  cookieStore.set(ADMIN_REPORTS_SESSION_COOKIE, accessToken, {
    httpOnly: true,
    maxAge: 55 * 60,
    path: "/admin/reports",
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

export async function resolveReportAction(
  reportId: string,
  action: ReportResolutionAction,
) {
  if (!uuidPattern.test(reportId)) {
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

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_REPORTS_SESSION_COOKIE)?.value;

  if (!accessToken) {
    return {
      ok: false,
      message: "Sign in again before resolving reports.",
    };
  }

  const admin = await verifyAdminAccess(accessToken);

  if (admin.kind === "unauthenticated") {
    expireAdminReportsCookie(cookieStore);
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
  cookieStore.set(ADMIN_REPORTS_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin/reports",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
