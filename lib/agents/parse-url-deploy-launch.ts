import { AGENT_STACKS, normalizeDeploymentGoalId } from "@/types/agent-deployment";
import type { AgentStackId, DeploymentLaunchParams } from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

export function parseUrlDeployLaunch(searchParams: URLSearchParams): {
  fromUrl: boolean;
  launch: DeploymentLaunchParams;
} {
  const deploy = searchParams.get("deploy");
  if (!deploy) return { fromUrl: false, launch: {} };

  if (deploy === "retargeting") {
    return {
      fromUrl: true,
      launch: {
        preset: "retargeting",
        agent: "retargeting",
        goal: "improve_conversion",
        mode: "autonomous",
        step: "plan",
        source: "opportunity",
      },
    };
  }

  if (deploy === "1" || deploy === "true") {
    const goal = normalizeDeploymentGoalId(searchParams.get("goal") ?? undefined);
    const stack = searchParams.get("stack") as AgentStackId | null;
    const agent = searchParams.get("agent") as AgentType | null;

    return {
      fromUrl: true,
      launch: {
        goal: goal ?? undefined,
        stack: stack && AGENT_STACKS.some((s) => s.id === stack) ? stack : undefined,
        agent: agent ?? undefined,
        source: "activate_agent",
      },
    };
  }

  return { fromUrl: false, launch: {} };
}
