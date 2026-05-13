import { NextResponse } from "next/server";

import { logAudit } from "@/lib/audit/log";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { runOptimizationSweep } from "@/services/optimization/optimization.service";

/**
 * Optimization cron entrypoint.
 *
 * Schedule this in `vercel.json` (or any cron runner) to hit /api/cron/optimize
 * on an interval (hourly recommended). The handler is protected by a shared
 * secret in the `Authorization: Bearer <CRON_SECRET>` header — set CRON_SECRET
 * in your env and configure the cron runner to send it. If CRON_SECRET is
 * unset we allow the request through for local dev only and log a warning.
 */
export async function GET(request: Request) {
  const expectedSecret = (process.env.CRON_SECRET ?? "").trim();
  if (expectedSecret.length > 0) {
    const header = request.headers.get("authorization") ?? "";
    const token = header.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : "";
    if (token !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error: "CRON_SECRET not configured. Refusing to run in production.",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const windowHoursParam = url.searchParams.get("window_hours");
  const windowHours = windowHoursParam ? Math.max(1, Number(windowHoursParam)) : 24;

  const supabase = createServiceRoleClient();
  const result = await runOptimizationSweep(supabase, { windowHours });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  await logAudit(supabase, {
    action: "optimization.sweep",
    metadata: { ...result.data, windowHours },
  });

  return NextResponse.json({ success: true, data: result.data });
}

export const POST = GET;
