"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { adminRevokeMcpConnectionAction } from "@/services/mcp/admin.actions";
import type { AdminMcpConnectionRow } from "@/services/mcp/admin-mcp.service";
import { MCP_CLIENT_TYPES } from "@/utils/mcp-constants";

type AdminMcpConnectionsTableProps = {
  rows: AdminMcpConnectionRow[];
};

function businessName(row: AdminMcpConnectionRow): string | null {
  const b = row.businesses;
  if (!b) return null;
  if (Array.isArray(b)) return b[0]?.name ?? null;
  return b.name;
}

export function AdminMcpConnectionsTable({ rows }: AdminMcpConnectionsTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function revoke(id: string) {
    startTransition(async () => {
      await adminRevokeMcpConnectionAction(id);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        No active MCP connections. Clients create tokens under{" "}
        <span className="font-medium text-foreground">Dashboard → Agent Manager</span>.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Business</th>
            <th className="px-3 py-2 font-medium">Label</th>
            <th className="px-3 py-2 font-medium">Client</th>
            <th className="px-3 py-2 font-medium">Token</th>
            <th className="px-3 py-2 font-medium">Agents</th>
            <th className="px-3 py-2 font-medium">Zernio</th>
            <th className="px-3 py-2 font-medium">Last used</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const clientLabel =
              MCP_CLIENT_TYPES.find((c) => c.key === row.client_type)?.name ?? row.client_type;
            return (
              <tr key={row.id} className="border-t border-border/40 align-top">
                <td className="px-3 py-2 text-xs">
                  {businessName(row) ?? row.business_id.slice(0, 8)}
                </td>
                <td className="px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{clientLabel}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.token_prefix}</td>
                <td className="px-3 py-2 text-xs">{row.allowed_agent_types.length}</td>
                <td className="px-3 py-2 text-xs">
                  {row.zernio_bridge_enabled ? "On" : "Off"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                  {row.last_used_at
                    ? formatDistanceToNow(new Date(row.last_used_at), { addSuffix: true })
                    : "Never"}
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => revoke(row.id)}
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
