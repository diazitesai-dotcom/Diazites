import Link from "next/link";

import { AgentMcpDocs } from "@/components/agents/agent-mcp-docs";
import { AgentMcpAccessPanel } from "@/components/agents/agent-mcp-access-panel";
import { AgentManagerClient } from "@/components/agents/agent-manager-client";
import { loadAgentDeploymentContext } from "@/lib/agents/load-agent-deployment-context";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getPublicAppUrl } from "@/lib/env";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserAgents } from "@/services/agents/agent.service";
import { listMcpConnections } from "@/services/mcp/mcp-connection.service";
import type { AgentMcpConnectionPublic } from "@/types/mcp";

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

  let mcpConnections: AgentMcpConnectionPublic[] = [];
  let mcpSetupError: string | null = null;
  try {
    const mcpResult = await listMcpConnections(supabase, user.id);
    if (mcpResult.success) {
      mcpConnections = mcpResult.data;
    } else {
      mcpSetupError = mcpResult.error;
    }
  } catch (e) {
    mcpSetupError = e instanceof Error ? e.message : "Could not load MCP connections";
  }

  const mcpEndpoint = `${getPublicAppUrl()}/api/mcp`;
  const deploymentContext = await loadAgentDeploymentContext();

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Automation"
        title="Agent Manager"
        description="Activate specialized AI agents for your roofing growth engine. Connect OpenClaw, Hermes, Cursor, and other MCP clients via Zernio or Diazites tokens."
      />
      <p className="-mt-6 text-sm text-muted-foreground">
        Full setup guide for connecting agents to this site:{" "}
        <Link href="/docs/agents" className="text-violet-300 underline">
          /docs/agents
        </Link>
        <Link
          href="/docs/agents"
          className={buttonVariants({ variant: "outline", size: "sm", className: "ml-3 rounded-xl" })}
        >
          Open agent connection docs
        </Link>
      </p>
      <AgentMcpDocs mcpEndpoint={mcpEndpoint} />
      <AgentMcpAccessPanel
        mcpEndpoint={mcpEndpoint}
        connections={mcpConnections}
        setupError={mcpSetupError}
      />
      <AgentManagerClient agents={agents} deploymentContext={deploymentContext} />
    </div>
  );
}
