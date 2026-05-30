import { AgentDeploymentProvider } from "@/components/agents/agent-deployment-provider";
import { SoftPaywallNotice, TrialBanner } from "@/components/billing/trial-banner";
import { loadAgentDeploymentContext } from "@/lib/agents/load-agent-deployment-context";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlatformAccess } from "@/services/billing/platform-access.service";
import { getUserAgents } from "@/services/agents/agent.service";

export async function AgentDeploymentShell({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const [agentsResult, deploymentContext, access] = await Promise.all([
    getUserAgents(supabase, user.id),
    loadAgentDeploymentContext(),
    getPlatformAccess(supabase, user.id),
  ]);

  const agents = (agentsResult.success ? agentsResult.data : []) as Array<{
    agent_type: string;
    status: string;
    activated_at: string | null;
  }>;

  return (
    <AgentDeploymentProvider agents={agents} deploymentContext={deploymentContext}>
      <TrialBanner trial={access.trial} shouldShowUpgrade={access.shouldShowUpgrade} />
      <SoftPaywallNotice
        visible={access.isSoftPaywall && !access.hasAccess}
        message="Your trial has ended. Upgrade to keep AI agents, workflows, and calling active."
      />
      {children}
    </AgentDeploymentProvider>
  );
}
