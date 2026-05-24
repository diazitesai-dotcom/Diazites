export type OrchestrationFlowStatus = "live" | "active" | "running" | "processing" | "inactive";

export type OrchestrationFlowStep = {
  id: string;
  label: string;
  status: OrchestrationFlowStatus;
  statusLabel: string;
  /** Shown on the connector below this step (e.g. "132 visits") */
  flowMetric?: string;
};

const STATUS_LABEL: Record<OrchestrationFlowStatus, string> = {
  live: "LIVE",
  active: "ACTIVE",
  running: "RUNNING",
  processing: "PROCESSING",
  inactive: "IDLE",
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
}): OrchestrationFlowStep[] {
  const { visitors, leads, qualified, booked } = input.funnelCounts;
  const hasTraffic = visitors > 0;

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
  const followupStatus: OrchestrationFlowStatus =
    booked > 0 && followAgent !== "inactive" ? "active" : followAgent;

  return [
    {
      id: "traffic",
      label: "Traffic",
      status: hasTraffic ? "live" : "inactive",
      statusLabel: hasTraffic ? "LIVE" : STATUS_LABEL.inactive,
      flowMetric: formatCount(visitors, "visits"),
    },
    {
      id: "landing",
      label: "Landing Agent",
      status: landingStatus,
      statusLabel: STATUS_LABEL[landingStatus],
      flowMetric: formatCount(leads, "conversions"),
    },
    {
      id: "qualify",
      label: "Lead Qualification",
      status: qualifyStatus,
      statusLabel: STATUS_LABEL[qualifyStatus],
      flowMetric: formatCount(qualified, "scored"),
    },
    {
      id: "followup",
      label: "Follow-Up Agent",
      status: followupStatus,
      statusLabel: STATUS_LABEL[followupStatus],
      flowMetric: formatCount(booked, "booked"),
    },
  ];
}
