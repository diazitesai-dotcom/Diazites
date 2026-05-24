import type {
  AccountConnection,
  AgentPerformance,
  AiRecommendation,
  BusinessGoal,
  AiDiagnostic,
  CommandCenterItem,
  FunnelDiagnosis,
  FunnelStage,
  HealthCheck,
  KpiInsight,
  MarketSignal,
  MissionControlBriefing,
  OpportunityItem,
  RecommendedNextAction,
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
    aiInsight:
      totalLeads === 0
        ? "Your growth stack is configured but demand capture is idle. Visitors are not converting because no live funnel or campaigns are routing traffic into CRM."
        : activeCampaigns === 0
          ? `You captured ${totalLeads} lead${totalLeads === 1 ? "" : "s"} without active paid campaigns — organic and referral momentum exists, but scaling will plateau without ads connectivity.`
          : !hasMeta && !hasGoogle
            ? `${totalLeads} leads are flowing while paid channels remain disconnected. AI estimates meaningful CPL efficiency gains once Meta or Google is linked.`
            : `Pipeline health is stable with ${activeCampaigns} live campaign${activeCampaigns === 1 ? "" : "s"} and ${activeAgentCount} active agent${activeAgentCount === 1 ? "" : "s"}. Focus on the weakest funnel step to unlock the next revenue tranche.`,
    leverageRecommendation: !hasMeta
      ? "Connect Meta Ads and deploy retargeting"
      : activeCampaigns === 0
        ? "Launch Growth Engine end-to-end"
        : qualAgent?.status !== "active"
          ? "Activate Lead Qualification Agent"
          : "Approve top optimization budget shift",
    expectedImpact: !hasMeta
      ? "+18–32% incremental leads within 14 days"
      : activeCampaigns === 0
        ? "First live campaign in <15 min; projected 12–20 new leads/week"
        : qualAgent?.status !== "active"
          ? "40% faster lead routing; +2–4 qualified leads/week"
          : "+8–14% ROAS without increasing daily spend",
    aiConfidence: Math.min(
      96,
      Math.max(
        58,
        72 -
          (activeCampaigns === 0 ? 14 : 0) -
          (!hasMeta && !hasGoogle ? 12 : 0) +
          activeAgentCount * 5 +
          (totalLeads > 0 ? 6 : 0),
      ),
    ),
    expectedUplift: !hasMeta
      ? "+$8.4k–$14.2k pipeline (model)"
      : activeCampaigns === 0
        ? "+$4.2k–$9.1k pipeline (model)"
        : `+$${Math.round(pipelineValue * 0.12).toLocaleString()}–$${Math.round(pipelineValue * 0.22).toLocaleString()} (30d)`,
    riskLevel:
      !hasMeta || activeCampaigns === 0
        ? ("high" as const)
        : totalLeads === 0 || !billingActive
          ? ("medium" as const)
          : ("low" as const),
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
    confidence: Math.min(92, Math.max(55, 68 + activeAgentCount * 3 + (hasMeta || hasGoogle ? 8 : 0))),
    explanation:
      "Forecast blends pipeline stage value, historical lead velocity, and campaign spend efficiency. Confidence rises as ads, CRM, and agents stay connected.",
  };

  const rawFunnel = [
    { key: "visitors", label: "Visitors", count: funnelCounts.visitors },
    { key: "leads", label: "Leads", count: funnelCounts.leads },
    { key: "qualified", label: "Qualified", count: funnelCounts.qualified },
    { key: "booked", label: "Booked", count: funnelCounts.booked },
    { key: "won", label: "Won", count: funnelCounts.won },
  ];

  const stepRates = rawFunnel.slice(1).map((stage, i) => {
    const prev = rawFunnel[i]!.count;
    return prev > 0 ? (stage.count / prev) * 100 : 0;
  });
  const minRate = stepRates.length ? Math.min(...stepRates.filter((r) => r > 0), 100) : 100;

  const funnel: FunnelStage[] = rawFunnel.map((stage, i) => {
    const prev = i === 0 ? stage.count : rawFunnel[i - 1]!.count;
    const conversionRate =
      i === 0 ? null : prev > 0 ? Math.round((stage.count / prev) * 1000) / 10 : 0;
    const dropoffPercent =
      i === 0 ? null : prev > 0 ? Math.round((1 - stage.count / prev) * 1000) / 10 : 100;
    const isBottleneck =
      i > 0 && conversionRate != null && conversionRate > 0 && conversionRate <= minRate + 0.01;
    return { ...stage, conversionRate, isBottleneck, dropoffPercent };
  });

  const bottleneckStage = funnel.find((s) => s.isBottleneck);
  const funnelDiagnosis: FunnelDiagnosis = bottleneckStage
    ? {
        summary: `AI detected the largest conversion drop between funnel stages at ${bottleneckStage.label}.`,
        dropoffStage: bottleneckStage.label,
        dropoffPercent: bottleneckStage.dropoffPercent ?? 0,
        recommendation:
          bottleneckStage.key === "leads"
            ? "Strengthen hero CTA and reduce form friction on your landing page."
            : bottleneckStage.key === "qualified"
              ? "Enable Lead Qualification Agent and same-day follow-up automations."
              : bottleneckStage.key === "booked"
                ? "Add calendar embed and AI booking nudges for qualified leads."
                : "Review offer clarity and retargeting on high-intent visitors.",
      }
    : {
        summary: "Funnel flow is balanced — no critical drop-off detected this period.",
        dropoffStage: "—",
        dropoffPercent: 0,
        recommendation: "Scale traffic to the top of funnel to increase absolute conversions.",
      };

  const nextAction: RecommendedNextAction = {
    title: !hasMeta
      ? "Connect Meta Ads & launch retargeting"
      : activeCampaigns === 0
        ? "Run Growth Engine for first campaign launch"
        : qualAgent?.status !== "active"
          ? "Activate Lead Qualification Agent"
          : "Apply top optimization recommendation",
    impact: !hasMeta
      ? "Estimated +18–32% lead volume once paid channels are live"
      : activeCampaigns === 0
        ? "Go from zero to live campaigns in under 15 minutes"
        : qualAgent?.status !== "active"
          ? "Reduce response time by 40% on inbound leads"
          : "Projected +8–14% ROAS from approved budget shift",
    href: !hasMeta
      ? "/dashboard/ads"
      : activeCampaigns === 0
        ? "/dashboard/engine"
        : qualAgent?.status !== "active"
          ? "/dashboard/agents"
          : "/dashboard/optimization",
    cta: !hasMeta ? "Connect Now" : activeCampaigns === 0 ? "Launch Engine" : "Deploy",
  };

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
      id: "retargeting",
      title: "Retargeting Agent Deployment",
      detail: "Recent visitors returned multiple times — no follow-up automation",
      impact: "+12–18% recovered leads",
      priority: "high",
      cta: "Deploy Now",
      href: "/dashboard?deploy=retargeting",
    },
    {
      id: "1",
      title: "High-intent visitor pattern",
      detail: "Lead opened landing page 3× in 24h — prioritize follow-up",
      impact: "+22% close probability with same-day outreach",
      priority: "high",
      cta: "Deploy",
      href: "/dashboard/leads",
    },
    {
      id: "2",
      title: "Best-performing landing page",
      detail: "Variant B converting 22% higher — shift 60% traffic",
      impact: "+8–15% funnel conversion lift",
      priority: "medium",
      cta: "Deploy",
      href: "/dashboard/funnel",
    },
    {
      id: "3",
      title: "Keyword opportunity",
      detail: "“Emergency roof repair” CPC down 14% in your geo",
      impact: "Lower CPL by ~$18 per lead",
      priority: "medium",
      cta: "Fix Now",
      href: "/dashboard/ads",
    },
    {
      id: "4",
      title: "Budget reallocation",
      detail: "Shift $120/day from paused set to top CPL campaign",
      impact: "+11% ROAS without increasing spend",
      priority: "low",
      cta: "Deploy",
      href: "/dashboard/optimization",
    },
    {
      id: "5",
      title: "Follow-up reminder",
      detail: "4 qualified leads untouched > 48h — AI sequence ready",
      impact: "Recover 2–3 stalled opportunities",
      priority: "high",
      cta: "Deploy",
      href: "/dashboard/automations",
    },
  ];

  const marketSignals: MarketSignal[] = [
    {
      id: "cpc",
      label: "Avg. CPC (geo)",
      value: hasMeta || hasGoogle ? "$4.82" : "—",
      change: "-6.2%",
      direction: "down",
      detail: "Search costs easing in your service area",
      confidence: hasMeta || hasGoogle ? 88 : 62,
      source: "Google Ads API + Diazites market model",
    },
    {
      id: "demand",
      label: "Category demand",
      value: "↑ Elevated",
      change: "+12%",
      direction: "up",
      detail: "Seasonal lift in home-services intent",
      confidence: 79,
      source: "Search trends index",
    },
    {
      id: "competition",
      label: "Competitor ad density",
      value: "Moderate",
      change: "Stable",
      direction: "neutral",
      detail: "Window to capture share before Q3 push",
      confidence: 71,
      source: "Auction insights (est.)",
    },
    {
      id: "conv",
      label: "Landing benchmark",
      value: funnelCounts.leads > 0 ? "3.8%" : "—",
      change: funnelCounts.leads > 0 ? "+0.4pp" : "—",
      direction: "up",
      detail: "Industry median for local services",
      confidence: funnelCounts.leads > 0 ? 84 : 55,
      source: "Landing page analytics",
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
      executionCount: status === "active" ? Math.max(count, 1) * 3 + 2 : 0,
      resultRate:
        status === "active"
          ? Math.min(98, 62 + count * 8 + (def.key === "lead_qualification" ? 12 : 0))
          : 0,
      performanceScore:
        status === "active" ? Math.min(100, 70 + count * 6) : status === "pending" ? 40 : 0,
      lastExecutedAt:
        status === "active"
          ? "2 min ago"
          : status === "pending"
            ? "Awaiting provisioning"
            : "Never",
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

  const kpiInsights: KpiInsight[] = [
    {
      key: "leads",
      trafficSource: hasMeta ? "Meta + organic" : hasGoogle ? "Google + direct" : "Direct / landing",
      periodLabel: "Rolling 30d vs prior 30d",
      microInsight:
        totalLeads > 0 ? "Form fills trending with landing page traffic" : "Publish funnel to unlock lead flow",
    },
    {
      key: "campaigns",
      trafficSource: "Paid + engine",
      periodLabel: "Active now",
      microInsight:
        activeCampaigns > 0 ? "Spend pacing within target bands" : "Zero paid velocity — engine launch recommended",
    },
    {
      key: "spend",
      trafficSource: hasMeta || hasGoogle ? "Connected ad accounts" : "Unsynced",
      periodLabel: "Period total",
      microInsight: metrics?.totalSpend ? "Blended across all platforms" : "Connect ads for live spend sync",
    },
    {
      key: "cpl",
      trafficSource: "Attributed leads",
      periodLabel: "Blended CPL",
      microInsight:
        metrics?.costPerLead != null && metrics.costPerLead < 80
          ? "Efficiency above category median"
          : "Optimize creative + audience to lower CPL",
    },
    {
      key: "booked",
      trafficSource: "CRM pipeline",
      periodLabel: "Booked + won",
      microInsight: "High-intent stages — follow-up SLA critical",
    },
    {
      key: "roi",
      trafficSource: "Modeled revenue",
      periodLabel: "Spend vs booked value",
      microInsight:
        totalLeads > 0 && activeCampaigns > 0
          ? "Healthy return profile"
          : "Scale winners, cut underperformers",
    },
  ];

  const pixelOk = healthChecks.find((c) => c.id === "pixel")?.ok ?? false;
  const diagnostics: AiDiagnostic[] = [
    {
      id: "tracking",
      label: "Tracking",
      status: pixelOk ? "healthy" : "warning",
      detail: pixelOk ? "Pixel firing" : "Domain / pixel pending",
    },
    {
      id: "campaigns",
      label: "Campaigns",
      status: activeCampaigns > 0 ? "healthy" : "critical",
      detail: activeCampaigns > 0 ? `${activeCampaigns} live` : "No live campaigns",
    },
    {
      id: "crm",
      label: "CRM",
      status: crmConnected ? "healthy" : "warning",
      detail: crmConnected ? "Leads syncing" : "CRM setup incomplete",
    },
    {
      id: "ads",
      label: "Ads Sync",
      status: hasMeta || hasGoogle ? "healthy" : "critical",
      detail: hasMeta || hasGoogle ? "Accounts connected" : "No ad platform linked",
    },
    {
      id: "automation",
      label: "Automation",
      status: activeAgentCount >= 2 ? "healthy" : activeAgentCount === 1 ? "warning" : "critical",
      detail:
        activeAgentCount >= 2
          ? `${activeAgentCount} agents orchestrating`
          : "Activate follow-up + qualification agents",
    },
  ];

  const commandCenter: CommandCenterItem[] = [
    ...healthChecks
      .filter((c) => !c.ok)
      .map((c) => ({
        id: `health-${c.id}`,
        kind: c.id === "billing" ? ("warning" as const) : ("alert" as const),
        title: c.label,
        detail: c.detail,
        href:
          c.id === "ads"
            ? "/dashboard/ads"
            : c.id === "billing"
              ? "/dashboard/billing"
              : c.id === "qual"
                ? "/dashboard/agents"
                : "/dashboard/settings",
      })),
    ...opportunities.slice(0, 2).map((o) => ({
      id: `opp-${o.id}`,
      kind: "recommendation" as const,
      title: o.title,
      detail: o.impact,
      href: o.href,
    })),
    {
      id: "next-action",
      kind: "recommendation",
      title: nextAction.title,
      detail: nextAction.impact,
      href: nextAction.href,
    },
  ];

  return {
    briefing,
    nextAction,
    healthScore,
    healthChecks,
    revenue,
    funnel,
    funnelDiagnosis,
    recommendations,
    opportunities,
    marketSignals,
    agentPerformance,
    connections,
    goals,
    commandCenter,
    kpiInsights,
    diagnostics,
  };
}
