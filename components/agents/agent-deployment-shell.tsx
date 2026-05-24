import { AgentDeploymentProvider } from "@/components/agents/agent-deployment-provider";
import { loadAgentDeploymentContext } from "@/lib/agents/load-agent-deployment-context";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserAgents } from "@/services/agents/agent.service";

export async function AgentDeploymentShell({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const [agentsResult, deploymentContext] = await Promise.all([
    getUserAgents(supabase, user.id),
    loadAgentDeploymentContext(),
  ]);

  const agents = (agentsResult.success ? agentsResult.data : []) as Array<{
    agent_type: string;
    status: string;
    activated_at: string | null;
  }>;

  return (
    <AgentDeploymentProvider agents={agents} deploymentContext={deploymentContext}>
      {children}
    </AgentDeploymentProvider>
  );
}
