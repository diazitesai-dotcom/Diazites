import Link from "next/link";

import { AgentMcpDocs } from "@/components/agents/agent-mcp-docs";
import { AgentMcpAccessPanel } from "@/components/agents/agent-mcp-access-panel";
import { AgentManagerClient } from "@/components/agents/agent-manager-client";
import { PlatformAgentRoster } from "@/components/agents/platform-agent-roster";
import { ModulePurpose } from "@/components/layout/module-purpose";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getPublicAppUrl } from "@/lib/env";
import { requireDashboardService } from "@/lib/access-control/guard";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserAgents } from "@/services/agents/agent.service";
import { listMcpConnections } from "@/services/mcp/mcp-connection.service";
import type { AgentMcpConnectionPublic } from "@/types/mcp";

export const dynamic = "force-dynamic";

export default async function AgentManagerPage() {
  await requireDashboardService("agents");
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
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Agents"
        title="Autonomous execution layer"
        description="Each agent opens a drill-down workspace — queue, logs, AI reasoning, campaign ownership, scoring, and approvals — not just summary cards."
      />
      <ModulePurpose
        title="Agent operations"
        description="Research through follow-up: each agent runs with transparent reasoning, connected tools, and enterprise approval modes from recommend-only to full autonomous."
      />
      <PlatformAgentRoster />
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
      <AgentManagerClient agents={agents} />
    </div>
  );
}
