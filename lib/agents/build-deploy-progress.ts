import { agentDisplayName } from "@/lib/agents/deployment-catalog";
import type { AgentType } from "@/types/domain";

export function buildDeployProgressSteps(agents: AgentType[]): string[] {
  const steps = ["Launching Growth Engine…", "Provisioning infrastructure…"];
  for (const agent of agents) {
    steps.push(agentDisplayName(agent));
  }
  steps.push("Meta provisioning", "Analytics sync");
  return steps;
}

export function estimateDeploySeconds(agentCount: number): number {
  return Math.max(28, agentCount * 8 + 20);
}
