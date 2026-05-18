import { AgentMcpAccessPanel } from "@/components/agents/agent-mcp-access-panel";
import { AgentManagerGrid } from "@/components/agents/agent-manager-grid";
import { PageHeader } from "@/components/layout/page-header";
import { getPublicAppUrl } from "@/lib/env";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserAgents } from "@/services/agents/agent.service";
import { listMcpConnections } from "@/services/mcp/mcp-connection.service";

export const dynamic = "force-dynamic";

export default async function AgentManagerPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const result = await getUserAgents(supabase, user.id);
  const mcpResult = await listMcpConnections(supabase, user.id);
  const agents = (result.success ? result.data : []) as Array<{
    agent_type: string;
    status: string;
    activated_at: string | null;
  }>;
  const mcpConnections = mcpResult.success ? mcpResult.data : [];
  const mcpEndpoint = `${getPublicAppUrl()}/api/mcp`;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Automation"
        title="Agent Manager"
        description="Activate specialized AI agents for your roofing growth engine. Connect OpenClaw, Hermes, Cursor, and other MCP clients via Zernio or Diazites tokens."
      />
      <AgentMcpAccessPanel mcpEndpoint={mcpEndpoint} connections={mcpConnections} />
      <AgentManagerGrid agents={agents} />
    </div>
  );
}
