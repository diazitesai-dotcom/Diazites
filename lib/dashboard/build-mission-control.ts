import type {
  AccountConnection,
  AgentPerformance,
  AiRecommendation,
  BusinessGoal,
  FunnelStage,
  HealthCheck,
  MissionControlBriefing,
  OpportunityItem,
  RevenueForecast,
} from "@/lib/dashboard/mission-control-types";
import { AGENTS } from "@/utils/constants";

type Metrics = {
  totalLeads: number;
  activeCampaigns: number;
  totalSpend: number;
  costPerLead: number | null;
  periodDays: number;
} | null;

type AgentRow = { key: string; name: string; status: string };

const AGENT_TASKS: Record<string, { task: string; metric: string }> = {
  lead_qualification: { task: "Scoring inbound leads", metric: "leads qualified" },
  social_ads: { task: "Monitoring Meta ad sets", metric: "campaigns optimized" },
  search_ads: { task: "Search keyword review", metric: "CPL improvements" },
  landing_page: { task: "Funnel conversion review", metric: "pages scored" },
  ai_follow_up: { task: "Follow-up sequences", metric: "messages sent" },
  retargeting: { task: "Audience retargeting", metric: "reach recovered" },
};

export function buildMissionControlPayload(input: {
  metrics: Metrics;
  bookedOrWonCount: number;
  agents: AgentRow[];
  funnelCounts: { visitors: number; leads: number; qualified: number; booked: number; won: number };
  connectedPlatforms: Set<string>;
  billingActive: boolean;
  crmConnected: boolean;
}) {
  const { metrics, agents, funnelCounts, connectedPlatforms, billingActive, crmConnected } = input;
  const totalLeads = metrics?.totalLeads ?? 0;
  const activeCampaigns = metrics?.activeCampaigns ?? 0;
  const activeAgentCount = agents.filter((a) => a.status === "active").length;
  const hasMeta = connectedPlatforms.has("meta") || connectedPlatforms.has("facebook");
  const hasGoogle = connectedPlatforms.has("google");
  const qualAgent = agents.find((a) => a.key === "lead_qualification");
  const retargetAgent = agents.find((a) => a.key === "retargeting");

  const pipelineValue = Math.max(
    funnelCounts.won * 4200 + funnelCounts.booked * 1800 + funnelCounts.qualified * 650,
    totalLeads * 420,
  );

  const briefing: MissionControlBriefing = {
    leadsCaptured: totalLeads,
    campaignStatus:
      activeCampaigns > 0
        ? `${activeCampaigns} campaign${activeCampaigns === 1 ? "" : "s"} live`
        : "No live campaigns — launch from Growth Engine",
    agentStatus:
      activeAgentCount > 0
        ? `${activeAgentCount} agent${activeAgentCount === 1 ? "" : "s"} active`
        : "Agents idle — activate specialists",
    missedOpportunity: !hasMeta && !hasGoogle
      ? "Ad accounts not connected — estimated 18–32% more leads left on table"
      : retargetAgent?.status !== "active"
        ? "Retargeting agent inactive — warm traffic not being recaptured"
        : totalLeads === 0
          ? "No leads captured yet — publish a landing page to start pipeline"
          : "Follow-up window open on recent high-intent leads",
    recommendedNextAction: !hasMeta
      ? "Connect Meta Ads and launch a retargeting test"
      : activeCampaigns === 0
        ? "Run Growth Engine to generate and launch first campaign"
        : qualAgent?.status !== "active"
          ? "Activate Lead Qualification Agent for faster routing"
          : "Review AI optimization recommendations",
  };

  const healthChecks: HealthCheck[] = [
    {
      id: "crm",
      label: "CRM connected",
      ok: crmConnected,
      detail: crmConnected ? "Leads CRM syncing" : "Complete onboarding",
    },
    {
      id: "qual",
      label: "Lead Qualification Agent",
      ok: qualAgent?.status === "active",
      detail:
        qualAgent?.status === "active" ? "Active and scoring leads" : "Activate in Agent Manager",
    },
    {
      id: "ads",
      label: "Ads account",
      ok: hasMeta || hasGoogle,
      detail: hasMeta || hasGoogle ? "Platform connected" : "Meta or Google missing",
    },
    {
      id: "pixel",
      label: "Pixel / domain tracking",
      ok: false,
      detail: "Pending — add pixel in Settings",
    },
    {
      id: "billing",
      label: "Billing",
      ok: billingActive,
      detail: billingActive ? "Plan active" : "Complete billing setup",
    },
  ];

  const healthScore = Math.round(
    (healthChecks.filter((c) => c.ok).length / healthChecks.length) * 100,
  );

  const revenue: RevenueForecast = {
    today: Math.round(pipelineValue * 0.012),
    sevenDay: Math.round(pipelineValue * 0.08),
    thirtyDay: Math.round(pipelineValue * 0.28),
    pipelineValue,
  };

  const funnel: FunnelStage[] = [
    { key: "visitors", label: "Visitors", count: funnelCounts.visitors },
    { key: "leads", label: "Leads", count: funnelCounts.leads },
    { key: "qualified", label: "Qualified", count: funnelCounts.qualified },
    { key: "booked", label: "Booked", count: funnelCounts.booked },
    { key: "won", label: "Won", count: funnelCounts.won },
  ];

  const recommendations: AiRecommendation[] = [
    {
      id: "retarget",
      title: "Activate Retargeting Agent",
      impact: "+12–18% recovered leads from site visitors",
      cta: "Deploy",
      href: "/dashboard/agents",
    },
    {
      id: "ads",
      title: "Connect Meta / Google Ads",
      impact: "Unlock paid acquisition + budget optimization",
      cta: "Fix Now",
      href: "/dashboard/ads",
    },
    {
      id: "lp",
      title: "Launch Landing Page A/B Test",
      impact: "+8–15% conversion lift on top funnel",
      cta: "Deploy",
      href: "/dashboard/funnel",
    },
  ];

  const opportunities: OpportunityItem[] = [
    {
      id: "1",
      title: "High-intent visitor pattern",
      detail: "Lead opened landing page 3× in 24h — prioritize follow-up",
      priority: "high",
    },
    {
      id: "2",
      title: "Best-performing landing page",
      detail: "Variant B converting 22% higher — shift 60% traffic",
      priority: "medium",
    },
    {
      id: "3",
      title: "Keyword opportunity",
      detail: "“Emergency roof repair” CPC down 14% in your geo",
      priority: "medium",
    },
    {
      id: "4",
      title: "Budget reallocation",
      detail: "Shift $120/day from paused set to top CPL campaign",
      priority: "low",
    },
    {
      id: "5",
      title: "Follow-up reminder",
      detail: "4 qualified leads untouched > 48h — AI sequence ready",
      priority: "high",
    },
  ];

  const agentPerformance: AgentPerformance[] = AGENTS.map((def) => {
    const row = agents.find((a) => a.key === def.key);
    const status = row?.status ?? "inactive";
    const meta = AGENT_TASKS[def.key] ?? { task: "Awaiting activation", metric: "actions" };
    const count =
      def.key === "lead_qualification"
        ? Math.max(0, funnelCounts.qualified)
        : def.key === "ai_follow_up"
          ? Math.max(0, Math.floor(totalLeads * 0.4))
          : status === "active"
            ? Math.max(1, activeCampaigns)
            : 0;

    return {
      key: def.key,
      name: def.name,
      status,
      currentTask: status === "active" ? meta.task : "Standby",
      resultMetric:
        status === "active" ? `${count} ${meta.metric}` : "Not deployed",
      lastActivity: status === "active" ? "Just now" : status === "pending" ? "Provisioning" : "—",
      href: "/dashboard/agents",
    };
  });

  const connections: AccountConnection[] = [
    {
      id: "meta",
      name: "Meta Ads",
      status: hasMeta ? "connected" : "missing",
      href: "/dashboard/ads",
    },
    {
      id: "google",
      name: "Google Ads",
      status: hasGoogle ? "connected" : "missing",
      href: "/dashboard/ads",
    },
    {
      id: "crm",
      name: "CRM",
      status: crmConnected ? "connected" : "pending",
      href: "/dashboard/leads",
    },
    {
      id: "stripe",
      name: "Stripe",
      status: billingActive ? "connected" : "pending",
      href: "/dashboard/billing",
    },
    {
      id: "analytics",
      name: "Analytics",
      status: "pending",
      href: "/dashboard/settings",
    },
    {
      id: "pixel",
      name: "Domain / Pixel",
      status: "missing",
      href: "/dashboard/settings",
    },
  ];

  const goals: BusinessGoal[] = [
    {
      id: "revenue",
      label: "Revenue goal",
      current: Math.round(pipelineValue * 0.35),
      target: 50000,
      unit: "currency",
    },
    {
      id: "leads",
      label: "Lead goal",
      current: totalLeads,
      target: Math.max(40, totalLeads + 12),
      unit: "count",
    },
    {
      id: "booked",
      label: "Booked calls",
      current: funnelCounts.booked + funnelCounts.won,
      target: 15,
      unit: "count",
    },
    {
      id: "campaigns",
      label: "Campaign launches",
      current: activeCampaigns,
      target: 3,
      unit: "count",
    },
  ];

  return {
    briefing,
    healthScore,
    healthChecks,
    revenue,
    funnel,
    recommendations,
    opportunities,
    agentPerformance,
    connections,
    goals,
  };
}
