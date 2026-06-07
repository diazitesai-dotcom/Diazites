import { formatDistanceToNow } from "date-fns";

import { AnalyticsTrafficClient } from "@/components/analytics/analytics-traffic-client";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createSystemEventRepository } from "@/repositories/system-event.repository";

export const dynamic = "force-dynamic";

function buildTrafficSeries(rows: { created_at: string }[]) {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const out: { label: string; visits: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      visits: byDay.get(key) ?? 0,
    });
  }
  return out;
}

function formatAgentTitle(agentKey: string, actionType: string) {
  return `${agentKey.replace(/_/g, " ")} · ${actionType.replace(/_/g, " ")}`;
}

export default async function AnalyticsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-4">
        <PageHeader
          eyebrow="Analytics"
          title="Analytics — Traffic"
          description="Site traffic, lead capture, and agent activity."
        />
        <p className="text-sm text-muted-foreground">Complete onboarding to view analytics.</p>
      </div>
    );
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [{ data: weekLeads }, { count: totalLeads }, { data: agentLogs }, { data: leadEvents }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("created_at")
        .eq("business_id", business.id)
        .gte("created_at", since.toISOString()),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabase
        .from("agent_activity_logs")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(20),
      createSystemEventRepository(supabase).listByBusiness(business.id, 30),
    ]);

  const trafficSeries = buildTrafficSeries(weekLeads ?? []);

  const agentActivities = (agentLogs ?? []).map((log) => ({
    id: String(log.id),
    title: formatAgentTitle(String(log.agent_key), String(log.action_type)),
    detail:
      typeof (log.payload as Record<string, unknown>)?.message === "string"
        ? String((log.payload as Record<string, unknown>).message)
        : String(log.action_type).replace(/_/g, " "),
    time: formatDistanceToNow(new Date(String(log.created_at)), { addSuffix: true }),
    agentKey: String(log.agent_key),
  }));

  const leadUpdates = (leadEvents ?? [])
    .filter((ev) =>
      ["LEAD_CREATED", "LEAD_STATUS_CHANGED", "PIPELINE_STAGE_ENTERED", "LANDING_PAGE_SUBMISSION"].includes(
        String(ev.event_type),
      ),
    )
    .slice(0, 20)
    .map((ev) => ({
      id: String(ev.id),
      title: String(ev.event_type).replace(/_/g, " "),
      detail: JSON.stringify(ev.payload ?? {}).slice(0, 120),
      time: formatDistanceToNow(new Date(String(ev.created_at)), { addSuffix: true }),
    }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4">
      <PageHeader
        eyebrow="Analytics"
        title="Analytics — Traffic"
        description="Site traffic, lead capture volume, and agent activity across your workspace."
      />
      <AnalyticsTrafficClient
        trafficSeries={trafficSeries}
        totalLeads={totalLeads ?? 0}
        leadsThisWeek={weekLeads?.length ?? 0}
        agentActivities={agentActivities}
        leadUpdates={leadUpdates}
      />
    </div>
  );
}
