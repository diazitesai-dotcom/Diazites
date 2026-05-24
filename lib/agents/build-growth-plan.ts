import type { PlanRisk } from "@/lib/dashboard/mission-control-types";
import type {
  AutonomousMode,
  DeploymentConfig,
  DeploymentGoalId,
} from "@/types/agent-deployment";
import { DEPLOYMENT_GOALS } from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

import { expectedUpliftForGoal } from "@/lib/agents/deployment-catalog";

export type GrowthPlan = {
  title: string;
  expectedOutcome: string;
  confidence: number;
  risk: PlanRisk;
  stackItems: string[];
  guardrails: string[];
};

const STACK_SHORT: Record<AgentType, string> = {
  landing_page: "Landing",
  lead_qualification: "Qualification",
  ai_follow_up: "Follow-Up",
  retargeting: "Retargeting",
  social_ads: "Social Ads",
  search_ads: "Search Ads",
};

function planConfidence(agents: AgentType[]): number {
  const base = 74 + Math.min(agents.length * 2, 16);
  return Math.min(94, base);
}

function planRisk(mode: AutonomousMode, agents: AgentType[]): PlanRisk {
  if (mode === "autonomous") {
    return "medium";
  }
  if (agents.some((a) => a === "social_ads" || a === "search_ads") && agents.length >= 4) {
    return "medium";
  }
  return "low";
}

export function buildGrowthPlan(params: {
  goalId: DeploymentGoalId;
  agents: AgentType[];
  config: DeploymentConfig;
  mode: AutonomousMode;
  contextUplift?: string;
}): GrowthPlan {
  const { goalId, agents, config, mode, contextUplift } = params;
  const goalLabel = DEPLOYMENT_GOALS.find((g) => g.id === goalId)?.label ?? "Growth deployment";

  const stackItems = agents.map((a) => STACK_SHORT[a] ?? a.replace(/_/g, " "));

  const guardrails: string[] = [
    `$${config.budget || "25"} max daily spend`,
    "Rollback enabled",
  ];

  if (mode === "manual" || mode === "guided") {
    guardrails.push("Human approval for new campaigns");
  } else {
    guardrails.push("Auto-optimize within spend cap");
  }

  return {
    title: `AI Growth Plan · ${goalLabel}`,
    expectedOutcome: contextUplift ?? expectedUpliftForGoal(goalId),
    confidence: planConfidence(agents),
    risk: planRisk(mode, agents),
    stackItems,
    guardrails,
  };
}
