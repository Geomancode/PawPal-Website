import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  ADMIN_REPORTS_SESSION_COOKIE,
  loadPendingReports,
} from "./server";
import ReportsClientParts from "./ReportsClientParts";
import type { ReportsClientState } from "./types";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Reports",
  description: "Review and resolve pending PawPal moderation reports.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;
  const page = parsePage(params?.page);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_REPORTS_SESSION_COOKIE)?.value;
  let state: ReportsClientState;

  if (!accessToken) {
    state = {
      kind: "needs-session",
      page,
    };
  } else {
    const result = await loadPendingReports(accessToken, page);

    if (result.kind === "forbidden") {
      notFound();
    }

    if (result.kind === "unauthenticated") {
      state = {
        kind: "session-expired",
        page,
        message: result.message,
      };
    } else if (result.kind === "error") {
      state = {
        kind: "error",
        page,
        message: result.message,
      };
    } else {
      state = {
        kind: "ready",
        payload: result.payload,
      };
    }
  }

  return <ReportsClientParts state={state} />;
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
