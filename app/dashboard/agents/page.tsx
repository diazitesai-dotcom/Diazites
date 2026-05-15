import { PageHeader } from "@/components/layout/page-header";
import { AgentManagerGrid } from "@/components/agents/agent-manager-grid";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserAgents } from "@/services/agents/agent.service";

export const dynamic = "force-dynamic";

export default async function AgentManagerPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const result = await getUserAgents(supabase, user.id);
  const agents = (result.success ? result.data : []) as Array<{
    agent_type: string;
    status: string;
    activated_at: string | null;
  }>;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Automation"
        title="Agent Manager"
        description="Activate specialized AI agents for your roofing growth engine. Each agent provisions automation rules you can wire to Zernio, Zapier, or webhooks."
      />
      <AgentManagerGrid agents={agents} />
    </div>
  );
}
