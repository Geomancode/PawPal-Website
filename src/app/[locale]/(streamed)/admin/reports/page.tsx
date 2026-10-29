import type { Metadata } from "next";
import { getServerMessages } from "@/i18n/serverMessages";
import { privatePageMetadata } from "@/app/metadata";
import { cookies } from "next/headers";

import {
  readAdminReportsSessionToken,
  verifyAdminAccess,
} from "@/app/admin/reports/server";
import ReportsClientParts from "@/app/admin/reports/ReportsClientParts";
import type { ReportsClientState } from "@/app/admin/reports/types";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, messages } = await getServerMessages((await params).locale);
  return privatePageMetadata({
    title: messages.adminReportsTitle,
    description: messages.adminReportsDescription,
    path: "/admin/reports",
    locale,
  });
}

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;
  const page = parsePage(params?.page);
  const cookieStore = await cookies();
  const accessToken = readAdminReportsSessionToken(cookieStore);
  let state: ReportsClientState;

  if (!accessToken) {
    state = {
      kind: "needs-session",
      page,
    };
  } else {
    const result = await verifyAdminAccess(accessToken);

    if (result.kind === "forbidden") {
      // A path cookie can belong to an earlier account. Render no private data,
      // but retain the auth bridge so a new authorized identity can recover.
      state = { kind: "forbidden", viewerId: result.userId, page,
        message: "PawPal admin privileges are required." };
    } else if (result.kind === "unauthenticated") {
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
        viewerId: result.userId,
        page,
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
