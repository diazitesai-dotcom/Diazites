import type { AgentType } from "@/types/domain";
import type { DeploymentGoalId } from "@/types/agent-deployment";
import { AGENT_STACKS } from "@/types/agent-deployment";

const GOAL_AGENTS: Record<DeploymentGoalId, AgentType[]> = {
  generate_leads: ["landing_page", "lead_qualification", "ai_follow_up"],
  launch_ads: ["social_ads", "search_ads", "retargeting"],
  build_landing_page: ["landing_page", "lead_qualification"],
  book_appointments: ["ai_follow_up", "lead_qualification"],
  retarget_visitors: ["retargeting", "social_ads"],
  automate_follow_up: ["ai_follow_up", "lead_qualification"],
  full_growth_engine: [
    "social_ads",
    "search_ads",
    "landing_page",
    "lead_qualification",
    "ai_follow_up",
    "retargeting",
  ],
};

export function recommendAgentsForGoal(goalId: DeploymentGoalId): AgentType[] {
  return [...GOAL_AGENTS[goalId]];
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

export function mapDbStatusToLifecycle(
  status: string,
  isDeploying: boolean,
): import("@/types/agent-deployment").AgentLifecycleState {
  if (isDeploying) return "deploying";
  switch (status) {
    case "active":
      return "live";
    case "pending":
      return "configuring";
    case "error":
      return "error";
    default:
      return "draft";
  }
}
