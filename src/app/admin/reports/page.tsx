import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { buttonClassName, PageShell } from "@/components/ui";
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

  return (
    <PageShell
      className={`admin-page-shell min-h-screen pt-28 ${state.kind === "ready" ? "" : "admin-gate-shell"}`}
      headerClassName="admin-shell-header"
      eyebrow={
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          PawPal admin
        </span>
      }
      title="Moderation reports"
      description="Review pending community reports, inspect the reported target, and resolve each item with a dismiss, content removal, or user ban action."
      actions={
        <>
          <Link
            href="/"
            className={buttonClassName({ variant: "secondary" })}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
          <Link
            href="/admin/park-risks"
            className={buttonClassName({ variant: "ghost" })}
          >
            Park risks
          </Link>
        </>
      }
    >
      <ReportsClientParts state={state} />
    </PageShell>
  );
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
