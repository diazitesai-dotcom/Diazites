import type { StackHealthItem } from "@/lib/dashboard/mission-control-types";

function agentActive(agents: { agent_type: string; status: string }[], type: string): boolean {
  return agents.some((a) => a.agent_type === type && a.status === "active");
}

function agentPending(agents: { agent_type: string; status: string }[], type: string): boolean {
  return agents.some((a) => a.agent_type === type && a.status === "pending");
}

export function buildStackHealth(input: {
  agents: { agent_type: string; status: string }[];
  hasMeta?: boolean;
  hasGoogle?: boolean;
  crmConnected?: boolean;
}): StackHealthItem[] {
  const { agents, hasMeta, hasGoogle, crmConnected = true } = input;

  const landingOk =
    agentActive(agents, "landing_page") && agentActive(agents, "lead_qualification");
  const landingWarn = agentPending(agents, "landing_page") || agentPending(agents, "lead_qualification");
  const landingHealth: StackHealthItem["status"] = landingOk
    ? "healthy"
    : landingWarn
      ? "active"
      : agents.some((a) => a.agent_type === "landing_page")
        ? "warning"
        : "degraded";

  const paidOk =
    (hasMeta || hasGoogle) &&
    (agentActive(agents, "social_ads") || agentActive(agents, "search_ads"));
  const paidHealth: StackHealthItem["status"] = paidOk
    ? "healthy"
    : hasMeta || hasGoogle
      ? "warning"
      : "degraded";

  const trackingHealth: StackHealthItem["status"] =
    hasMeta && crmConnected ? "healthy" : hasMeta || hasGoogle ? "warning" : "degraded";

  const optimizationOk =
    agentActive(agents, "retargeting") ||
    agentActive(agents, "social_ads") ||
    agentActive(agents, "search_ads");
  const optimizationHealth: StackHealthItem["status"] = optimizationOk ? "active" : "warning";

  return [
    { id: "landing", label: "Landing Stack", status: landingHealth },
    { id: "paid", label: "Paid Ads Stack", status: paidHealth },
    { id: "tracking", label: "Tracking Layer", status: trackingHealth },
    { id: "optimization", label: "Optimization Loop", status: optimizationHealth },
  ];
}
