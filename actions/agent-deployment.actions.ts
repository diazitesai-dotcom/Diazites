"use server";

import { revalidatePath } from "next/cache";

import { agentDisplayName } from "@/lib/agents/deployment-catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { activateAgent } from "@/services/agents/agent.service";
import type {
  AutonomousMode,
  DeployStackResult,
  DeploymentConfig,
  DeploymentGoalId,
  TimelineEvent,
} from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

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
    timeline.push({
      id: `init-${agentType}`,
      at: now(),
      kind: "execution",
      title: `Initializing ${agentDisplayName(agentType)}`,
      detail: "Provisioning automation rules and webhooks",
    });

    const result = await activateAgent(supabase, user.id, agentType);
    if (result.success) {
      activated.push(agentType);
      timeline.push({
        id: `agent-${agentType}`,
        at: now(),
        kind: "deployment",
        title: `${agentDisplayName(agentType)} live`,
        detail: `${result.data.rulesCreated} automation rule(s) provisioned`,
      });
    } else {
      return { ok: false, error: result.error };
    }
  }

  timeline.push({
    id: "asset-landing",
    at: now(),
    kind: "asset",
    title: "Funnel assets generated",
    detail: `Offer: ${input.config.offer} · CTA: ${input.config.cta}`,
  });

  if (input.config.budget) {
    timeline.push({
      id: "asset-budget",
      at: now(),
      kind: "asset",
      title: "Budget profile applied",
      detail: `Daily budget: $${input.config.budget} · Platform: ${input.config.platform || "multi"}`,
    });
  }

  timeline.push({
    id: "campaign-launch",
    at: now(),
    kind: "campaign",
    title: "Campaign orchestration started",
    detail: `Audience: ${input.config.audience} · Voice: ${input.config.brandVoice.slice(0, 48)}…`,
  });

  timeline.push({
    id: "lead-ready",
    at: now(),
    kind: "lead",
    title: "Lead capture armed",
    detail: "CRM routing and qualification agents listening for inbound events",
  });

  timeline.push({
    id: "exec-optimize",
    at: now(),
    kind: "execution",
    title: "Optimization loop queued",
    detail:
      input.mode === "autonomous"
        ? "Agents will learn and adjust within guardrails"
        : "Awaiting approval for high-impact changes",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents");
  revalidatePath("/dashboard/automations");

  return { ok: true, activated, timeline };
}
