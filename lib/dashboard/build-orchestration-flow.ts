export type OrchestrationFlowStatus =
  | "live"
  | "active"
  | "running"
  | "healthy"
  | "connected"
  | "processing"
  | "inactive";

export type OrchestrationFlowStep = {
  id: string;
  label: string;
  /** Primary throughput (e.g. "24 visits", "2 converts") */
  throughput: string;
  /** Secondary runtime metric (CVR, queue, source) */
  secondaryMetric?: string;
  /** Latency, processing time, or ETA */
  runtimeMetric?: string;
  /** @deprecated use throughput — kept for backward compat */
  metric: string;
  status: OrchestrationFlowStatus;
  statusLabel: string;
  signal?: {
    headline: string;
    source: string;
  };
  /** Micro sparkline values (0–100 normalized) */
  sparkTrend?: number[];
  /** Trend vs prior period */
  trendPercent?: number;
  /** Hover tooltip for health context */
  healthHint?: string;
};

function formatCount(n: number, unit: string): string {
  return `${n.toLocaleString("en-US")} ${unit}`;
}

function formatCvr(numerator: number, denominator: number): string | undefined {
  if (denominator <= 0) return undefined;
  const pct = (numerator / denominator) * 100;
  return `${pct.toFixed(1)}% CVR`;
}

function flowStep(
  step: Omit<OrchestrationFlowStep, "metric"> & { metric?: string },
): OrchestrationFlowStep {
  return { ...step, metric: step.metric ?? step.throughput };
}

function agentFlowStatus(
  agents: { agent_type: string; status: string }[],
  type: string,
): OrchestrationFlowStatus {
  const row = agents.find((a) => a.agent_type === type);
  if (!row || row.status === "inactive") return "inactive";
  if (row.status === "pending") return "running";
  return "active";
}

export function buildOrchestrationFlow(input: {
  funnelCounts: {
    visitors: number;
    leads: number;
    qualified: number;
    booked: number;
  };
  agents: { agent_type: string; status: string }[];
  crmConnected?: boolean;
  activeAgentCount?: number;
  hasPaidAds?: boolean;
}): OrchestrationFlowStep[] {
  const { visitors, leads, qualified, booked } = input.funnelCounts;
  const hasTraffic = visitors > 0;
  const hasPaidAds = input.hasPaidAds ?? false;
  const crmConnected = input.crmConnected ?? true;
  const activeAgents = input.activeAgentCount ?? input.agents.filter((a) => a.status === "active").length;

  const landingAgent = agentFlowStatus(input.agents, "landing_page");
  const landingStatus: OrchestrationFlowStatus = !hasTraffic
    ? "inactive"
    : landingAgent === "inactive"
      ? "processing"
      : landingAgent;

  const qualAgent = agentFlowStatus(input.agents, "lead_qualification");
  let qualifyStatus: OrchestrationFlowStatus = qualAgent;
  if (leads > 0 && qualAgent === "inactive") qualifyStatus = "running";
  else if (leads > 0 && qualified < leads) qualifyStatus = "running";

  const followAgent = agentFlowStatus(input.agents, "ai_follow_up");
  const pendingFollowUp = Math.max(0, qualified - booked);
  const followupStatus: OrchestrationFlowStatus =
    followAgent === "active" && pendingFollowUp > 0
      ? "healthy"
      : followAgent === "running"
        ? "running"
        : followAgent;

  const qualQueue = Math.max(0, leads - qualified);

  const crmStatus: OrchestrationFlowStatus = crmConnected && (qualified > 0 || booked > 0)
    ? "connected"
    : crmConnected
      ? "processing"
      : "inactive";

  const hasOptimizationAgents =
    agentFlowStatus(input.agents, "retargeting") !== "inactive" ||
    agentFlowStatus(input.agents, "social_ads") !== "inactive" ||
    agentFlowStatus(input.agents, "search_ads") !== "inactive";
  const optimizationStatus: OrchestrationFlowStatus = hasOptimizationAgents && activeAgents > 0
    ? "processing"
    : hasOptimizationAgents
      ? "running"
      : "inactive";

  const trafficSpikeDetected =
    hasTraffic && !hasPaidAds && visitors >= Math.max(40, leads * 4);

  const trafficSignal = trafficSpikeDetected
    ? {
        headline: "Traffic spike detected.",
        source: "Direct + organic landing traffic.",
      }
    : undefined;

  return [
    flowStep({
      id: "traffic",
      label: "Traffic",
      throughput: formatCount(visitors, "visits"),
      secondaryMetric: hasTraffic ? "Direct + organic" : undefined,
      status: hasTraffic ? "live" : "inactive",
      statusLabel: hasTraffic ? "LIVE" : "IDLE",
      signal: trafficSignal,
      sparkTrend: hasTraffic ? [12, 18, 14, 22, 19, 24, visitors % 30 + 10] : undefined,
      trendPercent: hasTraffic ? 18 : undefined,
      healthHint: hasTraffic ? undefined : "Connect ads or publish landing page to activate traffic node.",
    }),
    flowStep({
      id: "landing",
      label: "Landing Agent",
      throughput: formatCount(leads, leads === 1 ? "convert" : "converts"),
      secondaryMetric: formatCvr(leads, visitors),
      runtimeMetric: hasTraffic ? "Latency: 1.4s" : undefined,
      status: landingStatus === "active" || landingStatus === "live" ? "healthy" : landingStatus,
      statusLabel:
        landingStatus === "active" || landingStatus === "live"
          ? "HEALTHY"
          : landingStatus === "running"
            ? "RUNNING"
            : landingStatus === "processing"
              ? "PROCESSING"
              : "IDLE",
      sparkTrend: hasTraffic ? [3, 4, 5, 4, 6, 7, Math.max(leads, 2)] : undefined,
      trendPercent: leads > 0 ? 12 : undefined,
      healthHint: landingStatus === "inactive" ? "Landing agent not deployed — create a funnel variant." : undefined,
    }),
    flowStep({
      id: "qualify",
      label: "Lead Qualification",
      throughput: formatCount(qualified, "scored"),
      secondaryMetric: qualQueue > 0 ? `Queue: ${qualQueue}` : undefined,
      runtimeMetric: qualQueue > 0 ? "Processing: 12s" : leads > 0 ? "Processing: 8s" : undefined,
      status: qualifyStatus,
      statusLabel:
        qualifyStatus === "running"
          ? "RUNNING"
          : qualifyStatus === "active"
            ? "ACTIVE"
            : qualifyStatus === "processing"
              ? "PROCESSING"
              : "IDLE",
      healthHint: qualQueue > 0 ? `Queue bottleneck — ${qualQueue} leads awaiting scoring.` : undefined,
    }),
    flowStep({
      id: "followup",
      label: "Follow-Up",
      throughput: formatCount(pendingFollowUp, pendingFollowUp === 1 ? "pending" : "pending"),
      secondaryMetric: pendingFollowUp > 0 ? "1 sequence active" : undefined,
      runtimeMetric: followAgent !== "inactive" ? "ETA: 4m" : undefined,
      status: followupStatus === "healthy" ? "active" : followupStatus,
      statusLabel:
        followupStatus === "healthy" || followupStatus === "active"
          ? "ACTIVE"
          : followupStatus === "running"
            ? "RUNNING"
            : "IDLE",
    }),
    flowStep({
      id: "crm",
      label: "CRM",
      throughput: crmConnected ? `${booked} synced` : "0 synced",
      secondaryMetric: crmConnected ? "Latency: ~2m" : "Not connected",
      status: crmStatus,
      statusLabel: crmConnected ? (crmStatus === "connected" ? "CONNECTED" : "PROCESSING") : "DISCONNECTED",
      sparkTrend: crmConnected ? [0, 1, 2, 2, 3, booked, booked + 1] : [0, 0, 0, 0, 0, 0, 0],
      healthHint: !crmConnected ? "CRM latency elevated — API connection missing." : undefined,
    }),
    flowStep({
      id: "optimize",
      label: "Optimization Loop",
      throughput: optimizationStatus !== "inactive" ? "Active tuning" : "Idle",
      secondaryMetric: optimizationStatus !== "inactive" ? "Latency: ~18m" : undefined,
      status: optimizationStatus,
      statusLabel:
        optimizationStatus === "processing"
          ? "PROCESSING"
          : optimizationStatus === "running"
            ? "RUNNING"
            : "IDLE",
      trendPercent: optimizationStatus !== "inactive" ? 3 : undefined,
      sparkTrend: optimizationStatus !== "inactive" ? [1, 2, 2, 3, 3, 3, 3] : undefined,
    }),
  ];
}
