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
  /** Inline counter or state label (e.g. "132 visits", "synced") */
  metric: string;
  status: OrchestrationFlowStatus;
  statusLabel: string;
  signal?: {
    headline: string;
    source: string;
  };
};

function formatCount(n: number, unit: string): string {
  return `${n.toLocaleString("en-US")} ${unit}`;
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
  const sequenceCount = followAgent !== "inactive" ? Math.max(booked, Math.min(qualified, 3)) : 0;
  const followupStatus: OrchestrationFlowStatus =
    followAgent === "active" && sequenceCount > 0
      ? "healthy"
      : followAgent === "running"
        ? "running"
        : followAgent;

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
    {
      id: "traffic",
      label: "Traffic",
      metric: formatCount(visitors, "visits"),
      status: hasTraffic ? "live" : "inactive",
      statusLabel: hasTraffic ? "LIVE" : "IDLE",
      signal: trafficSignal,
    },
    {
      id: "landing",
      label: "Landing Agent",
      metric: formatCount(leads, "converts"),
      status: landingStatus,
      statusLabel:
        landingStatus === "live"
          ? "LIVE"
          : landingStatus === "active"
            ? "ACTIVE"
            : landingStatus === "running"
              ? "RUNNING"
              : landingStatus === "processing"
                ? "PROCESSING"
                : "IDLE",
    },
    {
      id: "qualify",
      label: "Lead Qualification",
      metric: formatCount(qualified, "scored"),
      status: qualifyStatus,
      statusLabel:
        qualifyStatus === "running"
          ? "RUNNING"
          : qualifyStatus === "active"
            ? "ACTIVE"
            : qualifyStatus === "processing"
              ? "PROCESSING"
              : "IDLE",
    },
    {
      id: "followup",
      label: "Follow-Up",
      metric: formatCount(sequenceCount, "sequences"),
      status: followupStatus,
      statusLabel:
        followupStatus === "healthy"
          ? "HEALTHY"
          : followupStatus === "running"
            ? "RUNNING"
            : followupStatus === "active"
              ? "ACTIVE"
              : "IDLE",
    },
    {
      id: "crm",
      label: "CRM",
      metric: crmConnected ? "synced" : "pending",
      status: crmStatus,
      statusLabel:
        crmStatus === "connected"
          ? "CONNECTED"
          : crmStatus === "processing"
            ? "PROCESSING"
            : "IDLE",
    },
    {
      id: "optimize",
      label: "Optimization Loop",
      metric: optimizationStatus !== "inactive" ? "tuning" : "idle",
      status: optimizationStatus,
      statusLabel:
        optimizationStatus === "processing"
          ? "PROCESSING"
          : optimizationStatus === "running"
            ? "RUNNING"
            : "IDLE",
    },
  ];
}
