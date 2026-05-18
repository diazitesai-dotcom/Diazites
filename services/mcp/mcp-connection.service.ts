import type { SupabaseClient } from "@supabase/supabase-js";

import { generateMcpToken, hashMcpToken } from "@/lib/mcp/token";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createMcpConnectionRepository } from "@/repositories/mcp-connection.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { AgentType } from "@/types/domain";
import type {
  AgentMcpConnectionPublic,
  CreateMcpConnectionInput,
  McpAuthContext,
} from "@/types/mcp";
import {
  AGENT_TYPE_OPTIONS,
  DEFAULT_MCP_SCOPES,
  MCP_SCOPES,
  type McpScope,
} from "@/utils/mcp-constants";

export async function listMcpConnections(
  client: SupabaseClient,
  userId: string,
): Promise<ServiceResult<AgentMcpConnectionPublic[]>> {
  const business = await resolveBusiness(client, userId);
  if (!business.success) return business;

  const repo = createMcpConnectionRepository(client);
  const { data, error } = await repo.listByBusiness(business.data.id);
  if (error) return fail(error.message);
  return ok((data ?? []) as AgentMcpConnectionPublic[]);
}

export async function createMcpConnection(
  client: SupabaseClient,
  userId: string,
  input: CreateMcpConnectionInput,
): Promise<ServiceResult<{ connection: AgentMcpConnectionPublic; token: string }>> {
  const business = await resolveBusiness(client, userId);
  if (!business.success) return business;

  const label = input.label.trim();
  if (!label) return fail("Connection label is required");

  const allowed = normalizeAgentTypes(input.allowedAgentTypes);
  if (allowed.length === 0) {
    return fail("Select at least one Diazites agent this connection can access");
  }

  const scopes = normalizeScopes(input.scopes);
  if (input.zernioBridgeEnabled && !scopes.includes("zernio:read")) {
    scopes.push("zernio:read");
  }

  const { plain, hash, displayPrefix } = generateMcpToken();
  const repo = createMcpConnectionRepository(client);
  const { data, error } = await repo.create({
    businessId: business.data.id,
    label,
    clientType: input.clientType,
    tokenHash: hash,
    tokenPrefix: displayPrefix,
    allowedAgentTypes: allowed,
    scopes,
    zernioBridgeEnabled: input.zernioBridgeEnabled,
  });

  if (error || !data) {
    return fail(error?.message ?? "Failed to create MCP connection");
  }

  return ok({
    connection: data as AgentMcpConnectionPublic,
    token: plain,
  });
}

export async function revokeMcpConnection(
  client: SupabaseClient,
  userId: string,
  connectionId: string,
): Promise<ServiceResult<void>> {
  const business = await resolveBusiness(client, userId);
  if (!business.success) return business;

  const repo = createMcpConnectionRepository(client);
  const { error } = await repo.revoke(connectionId, business.data.id);
  if (error) return fail(error.message);
  return ok(undefined);
}

export async function updateMcpConnectionAccess(
  client: SupabaseClient,
  userId: string,
  connectionId: string,
  patch: {
    allowedAgentTypes: AgentType[];
    scopes: McpScope[];
    zernioBridgeEnabled: boolean;
  },
): Promise<ServiceResult<AgentMcpConnectionPublic>> {
  const business = await resolveBusiness(client, userId);
  if (!business.success) return business;

  const allowed = normalizeAgentTypes(patch.allowedAgentTypes);
  if (allowed.length === 0) {
    return fail("Select at least one agent");
  }

  let scopes = normalizeScopes(patch.scopes);
  if (patch.zernioBridgeEnabled && !scopes.includes("zernio:read")) {
    scopes = [...scopes, "zernio:read"];
  }

  const repo = createMcpConnectionRepository(client);
  const { data, error } = await repo.updateAccess(connectionId, business.data.id, {
    allowedAgentTypes: allowed,
    scopes,
    zernioBridgeEnabled: patch.zernioBridgeEnabled,
  });

  if (error || !data) return fail(error?.message ?? "Update failed");
  return ok(data as AgentMcpConnectionPublic);
}

export async function authenticateMcpRequest(
  client: SupabaseClient,
  bearerToken: string,
): Promise<ServiceResult<McpAuthContext>> {
  if (!bearerToken.startsWith("diaz_mcp_")) {
    return fail("Invalid MCP token", "INVALID_TOKEN");
  }

  const hash = hashMcpToken(bearerToken);
  const repo = createMcpConnectionRepository(client);
  const { data, error } = await repo.findActiveByTokenHash(hash);

  if (error) return fail(error.message);
  if (!data) return fail("Unknown or revoked MCP token", "INVALID_TOKEN");

  void repo.touchLastUsed(data.id);

  return ok({
    connectionId: data.id,
    businessId: data.business_id,
    allowedAgentTypes: data.allowed_agent_types as AgentType[],
    scopes: data.scopes as McpScope[],
    zernioBridgeEnabled: data.zernio_bridge_enabled,
  });
}

async function resolveBusiness(client: SupabaseClient, userId: string) {
  const businesses = createBusinessRepository(client);
  const { data } = await businesses.getByOwnerUserId(userId);
  if (!data) return fail("Complete business setup first", "NO_BUSINESS");
  return ok(data);
}

function normalizeAgentTypes(types: AgentType[]): AgentType[] {
  const valid = new Set(AGENT_TYPE_OPTIONS.map((a) => a.key));
  return [...new Set(types.filter((t) => valid.has(t)))];
}

function normalizeScopes(scopes: McpScope[]): McpScope[] {
  const validKeys = new Set(MCP_SCOPES.map((s) => s.key));
  const fromInput = scopes.length > 0 ? scopes : DEFAULT_MCP_SCOPES;
  return [...new Set(fromInput.filter((s) => validKeys.has(s)))];
}
