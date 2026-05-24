import type { AgentType } from "@/types/domain";
import type { DeploymentGoalId } from "@/types/agent-deployment";

export type LastDeploymentRecord = {
  goalId: DeploymentGoalId;
  agents: AgentType[];
  deployedAt: string;
  label: string;
};

const STORAGE_KEY = "diazites_last_deployment";

export function saveLastDeployment(record: LastDeploymentRecord) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function getLastDeployment(): LastDeploymentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastDeploymentRecord;
  } catch {
    return null;
  }
}

export function clearLastDeployment() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
