import Link from "next/link";
import { Plug } from "lucide-react";

import { AdminMcpConnectionsTable } from "@/components/admin/admin-mcp-connections-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getPublicAppUrl } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listAllMcpConnectionsForAdmin } from "@/services/mcp/admin-mcp.service";
import { ZERNIO_MCP_URL } from "@/utils/mcp-constants";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  await requireAdmin();

  const adminClient = createServiceRoleClient();
  const result = await listAllMcpConnectionsForAdmin(adminClient);
  const connections = result.success ? result.data : [];
  const mcpEndpoint = `${getPublicAppUrl()}/api/mcp`;

  const knownAiClients = connections.filter((c) =>
    ["openclaw", "hermes", "cursor", "windsurf", "claude"].includes(c.client_type),
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Agents & MCP"
        description="Platform-wide view of external agent connections (OpenClaw, Hermes, Cursor, etc.) and Zernio MCP bridges."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardDescription>Active MCP tokens</CardDescription>
            <CardTitle className="text-2xl">{connections.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardDescription>Zernio bridge enabled</CardDescription>
            <CardTitle className="text-2xl">
              {connections.filter((c) => c.zernio_bridge_enabled).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardDescription>Known AI clients</CardDescription>
            <CardTitle className="text-2xl">{knownAiClients}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plug className="size-4 text-cyan-300" aria-hidden />
            MCP endpoints
          </CardTitle>
          <CardDescription>
            Tenants generate tokens and read setup docs on{" "}
            <Link href="/dashboard/agents" className="text-violet-300 underline">
              Dashboard → Agent Manager
            </Link>{" "}
            (Hermes, OpenClaw, Cursor + Zernio MCP). Admins can revoke connections below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Diazites MCP:</span>{" "}
            <code className="text-xs">{mcpEndpoint}</code>
          </p>
          <p>
            <span className="font-medium text-foreground">Zernio MCP (hosted):</span>{" "}
            <code className="text-xs">{ZERNIO_MCP_URL}</code>
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">All MCP connections</CardTitle>
          <CardDescription>
            Newest first. Revoking invalidates the bearer token immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AdminMcpConnectionsTable rows={connections} />
        </CardContent>
      </Card>
    </div>
  );
}
