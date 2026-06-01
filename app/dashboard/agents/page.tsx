import Link from "next/link";

import { AgentMcpAccessPanel } from "@/components/agents/agent-mcp-access-panel";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getPublicAppUrl } from "@/lib/env";
import { requireDashboardService } from "@/lib/access-control/guard";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listMcpConnections } from "@/services/mcp/mcp-connection.service";
import type { AgentMcpConnectionPublic } from "@/types/mcp";

export const dynamic = "force-dynamic";

export default async function AgentManagerPage() {
  await requireDashboardService("agents");
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

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
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Agents"
        title="Generate agent connection token"
        description="Create a bearer token so external AI agents (Hermes, OpenClaw, Cursor, Claude, or any MCP client) can securely access the agents and data you allow."
      />
      <AgentMcpAccessPanel
        mcpEndpoint={mcpEndpoint}
        connections={mcpConnections}
        setupError={mcpSetupError}
      />
      <div className="border-t border-white/[0.06] pt-6 text-center text-sm text-muted-foreground">
        Need help connecting your agent?{" "}
        <Link
          href="/docs/agents"
          className={buttonVariants({ variant: "outline", size: "sm", className: "ml-2 rounded-xl" })}
        >
          Open agent connection docs
        </Link>
      </div>
    </div>
  );
}
