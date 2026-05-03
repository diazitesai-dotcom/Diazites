import { formatDistanceToNow } from "date-fns";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAgentRepository } from "@/repositories/agent.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createSystemEventRepository } from "@/repositories/system-event.repository";
import { getDashboardMetrics } from "@/services/reporting/reporting.service";
import { EVENT_TYPES } from "@/types/backend";
import { AGENTS } from "@/utils/constants";

function humanizeEventType(eventType: string): string {
  switch (eventType) {
    case EVENT_TYPES.LEAD_CREATED:
      return "New lead captured";
    case EVENT_TYPES.LEAD_STATUS_CHANGED:
      return "Lead stage updated";
    case EVENT_TYPES.LEAD_NOTE_ADDED:
      return "Note added to lead";
    case EVENT_TYPES.AGENT_ACTIVATED:
      return "Agent activated";
    case EVENT_TYPES.CAMPAIGN_CREATED:
      return "Campaign created";
    case EVENT_TYPES.CAMPAIGN_UPDATED:
      return "Campaign updated";
    case EVENT_TYPES.BILLING_PLAN_CHANGED:
      return "Billing plan updated";
    case EVENT_TYPES.ONBOARDING_STAGE_CHANGED:
      return "Onboarding progress";
    case EVENT_TYPES.AI_FOLLOW_UP_SENT:
      return "AI message sent";
    default:
      return eventType.replace(/_/g, " ").toLowerCase();
  }
}

function summarizePayload(payload: Record<string, unknown> | null): string {
  if (!payload || typeof payload !== "object") return "";
  const parts: string[] = [];
  if (typeof payload.source === "string") parts.push(payload.source);
  if (typeof payload.planName === "string") parts.push(`Plan: ${payload.planName}`);
  if (typeof payload.platform === "string") parts.push(payload.platform);
  if (typeof payload.status === "string") parts.push(String(payload.status));
  return parts.slice(0, 3).join(" · ") || "System event";
}

function buildLeadVelocitySeries(rows: { created_at: string }[]) {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const out: { d: string; v: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    out.push({ d: label, v: byDay.get(key) ?? 0 });
  }
  return out;
}

export type DashboardOverviewData = {
  businessId: string;
  metrics: {
    totalLeads: number;
    activeCampaigns: number;
    totalSpend: number;
    costPerLead: number | null;
    conversionRate: number | null;
    roi: number | null;
    periodDays: number;
  } | null;
  bookedOrWonCount: number;
  sparkSeries: { d: string; v: number }[];
  agents: { key: string; name: string; status: string }[];
  activity: { id: string; title: string; detail: string; time: string }[];
};

export async function loadDashboardOverview(): Promise<DashboardOverviewData | null> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;

  const metricsResult = await getDashboardMetrics(supabase, user.id, business.id, 30);
  const metrics = metricsResult.success ? metricsResult.data : null;

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);
  periodStart.setHours(0, 0, 0, 0);
  const { count: bookedOrWonCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .in("status", ["booked", "won"])
    .gte("created_at", periodStart.toISOString());

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data: weekLeads } = await supabase
    .from("leads")
    .select("created_at")
    .eq("business_id", business.id)
    .gte("created_at", since.toISOString());

  const sparkSeries = buildLeadVelocitySeries(weekLeads ?? []);

  const agentsRepo = createAgentRepository(supabase);
  const { data: agentRows } = await agentsRepo.listByBusiness(business.id);

  const agents = AGENTS.map((def) => {
    const row = agentRows?.find((r) => r.agent_type === def.key);
    return {
      key: def.key,
      name: def.name,
      status: row?.status ?? "inactive",
    };
  });

  const eventsRepo = createSystemEventRepository(supabase);
  const { data: events } = await eventsRepo.listByBusiness(business.id, 12);

  const activity = (events ?? []).map((ev) => ({
    id: ev.id,
    title: humanizeEventType(ev.event_type),
    detail: summarizePayload(ev.payload as Record<string, unknown>),
    time: formatDistanceToNow(new Date(ev.created_at), { addSuffix: true }),
  }));

  return {
    businessId: business.id,
    metrics,
    bookedOrWonCount: bookedOrWonCount ?? 0,
    sparkSeries,
    agents,
    activity,
  };
}
