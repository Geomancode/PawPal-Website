import { NextResponse } from "next/server";
import { reportError } from "@/lib/errorReporting";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HealthCheckStatus = "ok" | "down";

type HealthResponse = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    supabase: HealthCheckStatus;
  };
};

async function probeSupabase(): Promise<HealthCheckStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const { error } = await supabaseServer
      .from("places")
      .select("id", { count: "exact", head: true })
      .limit(1)
      .abortSignal(controller.signal);

    if (error) {
      reportError(error, { route: "/api/health", check: "supabase" });
      return "down";
    }

    return "ok";
  } catch (error) {
    reportError(error, { route: "/api/health", check: "supabase" });
    return "down";
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  const supabase = await probeSupabase();
  const status = supabase === "ok" ? "ok" : "degraded";
  const body: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    checks: { supabase },
  };

  return NextResponse.json(body, {
    status: status === "ok" ? 200 : 503,
  });
}
