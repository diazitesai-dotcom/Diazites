"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { activateAgent } from "@/services/agents/agent.service";
import type { DeployStackResult, DeploymentConfig, TimelineEvent } from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";
import type { AutonomousMode, DeploymentGoalId } from "@/types/agent-deployment";

export async function deployAgentStackAction(input: {
  goalId: DeploymentGoalId;
  agentTypes: AgentType[];
  config: DeploymentConfig;
  mode: AutonomousMode;
}): Promise<DeployStackResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const activated: AgentType[] = [];
  const timeline: TimelineEvent[] = [];
  const now = () => new Date().toISOString();

  timeline.push({
    id: "t0",
    at: now(),
    kind: "deployment",
    title: "Deployment initiated",
    detail: `Goal: ${input.goalId.replace(/_/g, " ")} · Mode: ${input.mode}`,
  });

  for (const agentType of input.agentTypes) {
    const result = await activateAgent(supabase, user.id, agentType);
    if (result.success) {
      activated.push(agentType);
      timeline.push({
        id: `agent-${agentType}`,
        at: now(),
        kind: "deployment",
        title: `${agentType.replace(/_/g, " ")} agent live`,
        detail: `${result.data.rulesCreated} automation rule(s) provisioned`,
      });
    } else {
      return { ok: false, error: result.error };
    }
  }

  if (input.config.budget) {
    timeline.push({
      id: "asset-budget",
      at: now(),
      kind: "campaign",
      title: "Budget profile applied",
      detail: `Daily budget: ${input.config.budget} · Platform: ${input.config.platform || "multi"}`,
    });
  }

  timeline.push({
    id: "campaign-launch",
    at: now(),
    kind: "campaign",
    title: "Campaign orchestration started",
    detail: `Offer: ${input.config.offer || "default"} · CTA: ${input.config.cta || "Get Started"}`,
  });

  timeline.push({
    id: "lead-ready",
    at: now(),
    kind: "lead",
    title: "Lead capture armed",
    detail: "CRM routing and qualification agents listening for inbound events",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents");
  revalidatePath("/dashboard/automations");

  return { ok: true, activated, timeline };
}
