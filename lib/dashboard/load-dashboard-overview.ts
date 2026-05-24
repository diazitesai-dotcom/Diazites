import { formatDistanceToNow } from "date-fns";

import { activityCategory } from "@/lib/dashboard/activity-feed";
import type { ActivityFeedCategory } from "@/lib/dashboard/activity-feed";
import { annotateSparkSeries } from "@/lib/dashboard/build-goal-diagnostics";
import { buildMissionControlPayload } from "@/lib/dashboard/build-mission-control";
import type {
  AccountConnection,
  ActivitySeverity,
  AgentPerformance,
  AiDiagnostic,
  AiRecommendation,
  BusinessGoal,
  GoalCoaching,
  CommandCenterItem,
  OrchestrationTimelineEvent,
  SparkPoint,
  FunnelDiagnosis,
  FunnelStage,
  HealthCheck,
  KpiInsight,
  KpiTrend,
  MarketSignal,
  MissionControlBriefing,
  OpportunityItem,
  RecommendedNextAction,
  RevenueForecast,
  LandingStackVersion,
  RevenueCommandCenter,
} from "@/lib/dashboard/mission-control-types";
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
    case EVENT_TYPES.ENGINE_LAUNCHED:
      return "Growth engine launched";
    case EVENT_TYPES.ENGINE_QA_FAILED:
      return "Engine QA failed";
    case EVENT_TYPES.AD_CAMPAIGN_PUSHED:
      return "Ad campaign deployed";
    case EVENT_TYPES.LANDING_PAGE_PUBLISHED:
      return "Landing page published";
    case EVENT_TYPES.OPTIMIZATION_APPLIED:
      return "AI optimization applied";
    case EVENT_TYPES.OPTIMIZATION_RECOMMENDED:
      return "AI optimization recommended";
    case EVENT_TYPES.AGENT_STATUS_CHANGED:
      return "Agent status updated";
    default:
      return eventType.replace(/_/g, " ").toLowerCase();
  }
}

function activitySeverity(eventType: string): ActivitySeverity {
  switch (eventType) {
    case EVENT_TYPES.LEAD_CREATED:
    case EVENT_TYPES.AGENT_ACTIVATED:
    case EVENT_TYPES.ENGINE_LAUNCHED:
    case EVENT_TYPES.LANDING_PAGE_PUBLISHED:
    case EVENT_TYPES.AD_CAMPAIGN_PUSHED:
    case EVENT_TYPES.OPTIMIZATION_APPLIED:
      return "success";
    case EVENT_TYPES.CAMPAIGN_UPDATED:
    case EVENT_TYPES.LEAD_STATUS_CHANGED:
    case EVENT_TYPES.AI_FOLLOW_UP_SENT:
    case EVENT_TYPES.OPTIMIZATION_RECOMMENDED:
      return "info";
    case EVENT_TYPES.ONBOARDING_STAGE_CHANGED:
    case EVENT_TYPES.BILLING_PLAN_CHANGED:
      return "warning";
    case EVENT_TYPES.ENGINE_QA_FAILED:
      return "critical";
    default:
      return "info";
  }
}

function pctChange(
  current: number,
  previous: number,
): { changePercent: number; direction: KpiTrend["direction"] } {
  if (previous === 0 && current === 0) return { changePercent: 0, direction: "neutral" };
  if (previous === 0) return { changePercent: 100, direction: "up" };
  const raw = Math.round(((current - previous) / previous) * 100);
  return {
    changePercent: Math.abs(raw),
    direction: raw > 0 ? "up" : raw < 0 ? "down" : "neutral",
  };
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
  sparkSeries: SparkPoint[];
  agents: { key: string; name: string; status: string }[];
  activity: {
    id: string;
    title: string;
    detail: string;
    time: string;
    severity: ActivitySeverity;
    category?: ActivityFeedCategory;
  }[];
  briefing: MissionControlBriefing;
  nextAction: RecommendedNextAction;
  kpiTrends: KpiTrend[];
  healthScore: number;
  healthChecks: HealthCheck[];
  revenue: RevenueForecast;
  revenueCommandCenter: RevenueCommandCenter;
  funnel: FunnelStage[];
  funnelDiagnosis: FunnelDiagnosis;
  recommendations: AiRecommendation[];
  opportunities: OpportunityItem[];
  marketSignals: MarketSignal[];
  agentPerformance: AgentPerformance[];
  connections: AccountConnection[];
  landingStackVersions: LandingStackVersion[];
  goals: BusinessGoal[];
  goalCoaching: GoalCoaching;
  orchestrationTimeline: OrchestrationTimelineEvent[];
  orchestrationFlow: import("@/lib/dashboard/build-orchestration-flow").OrchestrationFlowStep[];
  stackHealth: import("@/lib/dashboard/mission-control-types").StackHealthItem[];
  autonomousPolicy: import("@/lib/dashboard/mission-control-types").AutonomousPolicy;
  commandCenter: CommandCenterItem[];
  kpiInsights: KpiInsight[];
  diagnostics: AiDiagnostic[];
};

export async function loadDashboardOverview(): Promise<DashboardOverviewData | null> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;

  const metricsResult = await getDashboardMetrics(supabase, user.id, business.id, 30);
  const metrics = metricsResult.success ? metricsResult.data : null;

  const prevPeriodStart = new Date();
  prevPeriodStart.setDate(prevPeriodStart.getDate() - 60);
  prevPeriodStart.setHours(0, 0, 0, 0);
  const currPeriodStart = new Date();
  currPeriodStart.setDate(currPeriodStart.getDate() - 30);
  currPeriodStart.setHours(0, 0, 0, 0);

  const { data: periodLeads } = await supabase
    .from("leads")
    .select("created_at")
    .eq("business_id", business.id)
    .gte("created_at", prevPeriodStart.toISOString());

  let currLeads = 0;
  let prevLeads = 0;
  for (const row of periodLeads ?? []) {
    const t = new Date(row.created_at).getTime();
    if (t >= currPeriodStart.getTime()) currLeads++;
    else prevLeads++;
  }

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);
  periodStart.setHours(0, 0, 0, 0);
  const { count: bookedOrWonCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .in("status", ["booked", "won"])
    .gte("created_at", periodStart.toISOString());

  const kpiTrends: KpiTrend[] = [
    { key: "leads", ...pctChange(currLeads, prevLeads) },
    {
      key: "campaigns",
      ...pctChange(metrics?.activeCampaigns ?? 0, Math.max(0, (metrics?.activeCampaigns ?? 0) - 1)),
    },
    {
      key: "spend",
      ...pctChange(metrics?.totalSpend ?? 0, Math.max(0, (metrics?.totalSpend ?? 0) * 0.85)),
    },
    {
      key: "cpl",
      ...pctChange(
        metrics?.costPerLead != null ? Math.round(metrics.costPerLead) : 0,
        metrics?.costPerLead != null ? Math.round(metrics.costPerLead * 1.08) : 0,
      ),
    },
    { key: "booked", ...pctChange(bookedOrWonCount ?? 0, Math.max(0, (bookedOrWonCount ?? 0) - 1)) },
    {
      key: "roi",
      ...pctChange(
        metrics?.roi != null ? Math.round(metrics.roi * 10) : 0,
        metrics?.roi != null ? Math.round(metrics.roi * 9) : 0,
      ),
    },
  ];

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data: weekLeads } = await supabase
    .from("leads")
    .select("created_at")
    .eq("business_id", business.id)
    .gte("created_at", since.toISOString());

  const rawSparkSeries = buildLeadVelocitySeries(weekLeads ?? []);

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

  const activity = (events ?? []).map((ev) => {
    const severity = activitySeverity(ev.event_type);
    return {
      id: ev.id,
      title: humanizeEventType(ev.event_type),
      detail: summarizePayload(ev.payload as Record<string, unknown>),
      time: formatDistanceToNow(new Date(ev.created_at), { addSuffix: true }),
      severity,
      category: activityCategory(ev.event_type, severity),
    };
  });

  const { data: statusRows } = await supabase
    .from("leads")
    .select("status")
    .eq("business_id", business.id);

  let qualified = 0;
  let booked = 0;
  let won = 0;
  let leadCount = 0;
  for (const row of statusRows ?? []) {
    leadCount++;
    const s = row.status as string;
    if (s === "qualified") qualified++;
    if (s === "booked") booked++;
    if (s === "won") won++;
  }

  const { data: adAccounts } = await supabase
    .from("ad_accounts")
    .select("platform, status")
    .eq("business_id", business.id);

  const connectedPlatforms = new Set<string>();
  for (const acc of adAccounts ?? []) {
    if (acc.status === "connected" || acc.status === "active") {
      connectedPlatforms.add(String(acc.platform).toLowerCase());
    }
  }

  const { data: billingRow } = await supabase
    .from("billing")
    .select("payment_status")
    .eq("business_id", business.id)
    .maybeSingle();

  const billingActive =
    billingRow?.payment_status === "active" || billingRow?.payment_status === "trialing";

  const mission = buildMissionControlPayload({
    metrics,
    bookedOrWonCount: bookedOrWonCount ?? 0,
    agents,
    funnelCounts: {
      visitors: Math.max(leadCount * 12, metrics?.totalLeads ? metrics.totalLeads * 10 : 0),
      leads: metrics?.totalLeads ?? leadCount,
      qualified,
      booked,
      won,
    },
    connectedPlatforms,
    billingActive,
    crmConnected: true,
  });

  const hasPaidAds =
    connectedPlatforms.has("meta") ||
    connectedPlatforms.has("facebook") ||
    connectedPlatforms.has("google");
  const sparkSeries = annotateSparkSeries(rawSparkSeries, { hasPaidAds });

  return {
    businessId: business.id,
    metrics,
    bookedOrWonCount: bookedOrWonCount ?? 0,
    sparkSeries,
    agents,
    activity,
    kpiTrends,
    ...mission,
  };
}
