import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createMcpConnectionRepository } from "@/repositories/mcp-connection.repository";

export type AdminMcpConnectionRow = {
  id: string;
  business_id: string;
  label: string;
  client_type: string;
  token_prefix: string;
  allowed_agent_types: string[];
  scopes: string[];
  zernio_bridge_enabled: boolean;
  last_used_at: string | null;
  created_at: string;
  businesses: { id: string; name: string } | { id: string; name: string }[] | null;
};

export async function listAllMcpConnectionsForAdmin(
  adminClient: SupabaseClient,
): Promise<ServiceResult<AdminMcpConnectionRow[]>> {
  const repo = createMcpConnectionRepository(adminClient);
  const { data, error } = await repo.listAllActive();
  if (error) return fail(error.message);
  return ok((data ?? []) as AdminMcpConnectionRow[]);
}

export async function adminRevokeMcpConnection(
  adminClient: SupabaseClient,
  connectionId: string,
): Promise<ServiceResult<void>> {
  const repo = createMcpConnectionRepository(adminClient);
  const { error } = await repo.revokeById(connectionId);
  if (error) return fail(error.message);
  return ok(undefined);
}
