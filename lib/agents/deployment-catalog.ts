import type { AgentType } from "@/types/domain";
import type { DeploymentGoalId, StackFlowGraph } from "@/types/agent-deployment";
import { AGENT_STACKS, DEPLOYMENT_GOALS } from "@/types/agent-deployment";

const GOAL_AGENTS: Record<DeploymentGoalId, AgentType[]> = {
  generate_leads: ["landing_page", "lead_qualification", "ai_follow_up"],
  launch_ads: ["social_ads", "search_ads", "retargeting"],
  build_landing_page: ["landing_page", "lead_qualification"],
  improve_conversion: ["landing_page", "retargeting", "lead_qualification"],
  follow_up_leads: ["ai_follow_up", "lead_qualification"],
  deploy_full_growth_engine: [
    "social_ads",
    "search_ads",
    "landing_page",
    "lead_qualification",
    "ai_follow_up",
    "retargeting",
  ],
};

const AGENT_ROLES: Record<AgentType, string> = {
  social_ads: "Acquire on Meta",
  search_ads: "Capture intent on Google",
  landing_page: "Convert traffic",
  lead_qualification: "Score & route leads",
  ai_follow_up: "Nurture pipeline",
  retargeting: "Recover warm visitors",
};

const FLOW_ORDER: AgentType[] = [
  "social_ads",
  "search_ads",
  "landing_page",
  "lead_qualification",
  "ai_follow_up",
  "retargeting",
];

export function recommendAgentsForGoal(goalId: DeploymentGoalId): AgentType[] {
  return [...GOAL_AGENTS[goalId]];
}

export function expectedUpliftForGoal(goalId: DeploymentGoalId): string {
  return DEPLOYMENT_GOALS.find((g) => g.id === goalId)?.uplift ?? "+15–25% growth";
}

export function estimateSetupMinutes(agentCount: number): number {
  return Math.min(20, 4 + agentCount * 2);
}

export function impactForAgents(agents: AgentType[]): string {
  if (agents.length >= 5) return "Full-funnel orchestration — projected +25–40% pipeline lift";
  if (agents.some((a) => a === "social_ads" || a === "search_ads")) {
    return "Paid + nurture loop — projected +15–28% lead efficiency";
  }
  return "Inbound capture stack — projected +18–32% qualified leads";
}

export function stackById(id: (typeof AGENT_STACKS)[number]["id"]) {
  return AGENT_STACKS.find((s) => s.id === id);
}

export function agentDisplayName(key: AgentType): string {
  const names: Record<AgentType, string> = {
    social_ads: "Social Ads Agent",
    search_ads: "Search Ads Agent",
    landing_page: "Landing Page Agent",
    ai_follow_up: "AI Follow-Up Agent",
    retargeting: "Retargeting Agent",
    lead_qualification: "Lead Qualification Agent",
  };
  return names[key];
}

export function buildStackFlow(agents: AgentType[]): StackFlowGraph {
  const ordered = FLOW_ORDER.filter((a) => agents.includes(a));
  const nodes = ordered.map((agentType, i) => ({
    id: agentType,
    agentType,
    label: agentDisplayName(agentType),
    role: AGENT_ROLES[agentType],
  }));

  const edges: StackFlowGraph["edges"] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i];
    const to = ordered[i + 1];
    let label: string | undefined;
    if (from === "social_ads" || from === "search_ads") label = "traffic";
    else if (from === "landing_page") label = "leads";
    else if (from === "lead_qualification") label = "qualified";
    edges.push({ from, to, label });
  }

  if (ordered.includes("retargeting") && ordered.includes("landing_page")) {
    if (!edges.some((e) => e.from === "retargeting" && e.to === "landing_page")) {
      edges.push({ from: "retargeting", to: "landing_page", label: "re-engage" });
    }
  }

  if (ordered.length === 0) {
    const fallback = agents.map((agentType) => ({
      id: agentType,
      agentType,
      label: agentDisplayName(agentType),
      role: AGENT_ROLES[agentType],
    }));
    const fallbackEdges: StackFlowGraph["edges"] = [];
    for (let i = 0; i < agents.length - 1; i++) {
      fallbackEdges.push({ from: agents[i], to: agents[i + 1] });
    }
    return { nodes: fallback, edges: fallbackEdges };
  }

  return { nodes, edges };
}

export function mapDbStatusToLifecycle(
  status: string,
  isDeploying: boolean,
  mode?: "manual" | "guided" | "autonomous",
): import("@/types/agent-deployment").AgentLifecycleState {
  if (isDeploying) return "deploying";
  switch (status) {
    case "active":
      return mode === "autonomous" ? "learning" : "live";
    case "pending":
      return "configuring";
    case "error":
      return "error";
    default:
      return "draft";
  }
}

export function inferGoalFromHref(href: string): DeploymentGoalId | undefined {
  if (href.includes("/dashboard/engine")) return "deploy_full_growth_engine";
  if (href.includes("/dashboard/funnel")) return "build_landing_page";
  if (href.includes("/dashboard/ads")) return "launch_ads";
  if (href.includes("/dashboard/leads")) return "follow_up_leads";
  if (href.includes("/dashboard/campaigns")) return "launch_ads";
  if (href.includes("/dashboard/optimization")) return "improve_conversion";
  return undefined;
}
