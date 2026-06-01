import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findZernioConnection,
  listBusinessAdConnections,
} from "@/lib/integrations/business-ad-connections";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { CurrentUserAccess } from "@/types/access-control";
import type { AgentType } from "@/types/domain";
import type { McpAuthContext } from "@/types/mcp";
import { AGENTS } from "@/utils/constants";
import type { McpScope } from "@/utils/mcp-constants";

export type OperatorMcpResolveResult =
  | { success: true; ctx: McpAuthContext; businessId: string }
  | { success: false; error: string };

/**
 * Builds an in-app MCP auth context for the GrowthOS operator — same tools as
 * external MCP clients, scoped to the user's enabled platform services.
 */
export async function buildOperatorMcpContext(
  client: SupabaseClient,
  userId: string,
  access: CurrentUserAccess,
): Promise<OperatorMcpResolveResult> {
  const businesses = createBusinessRepository(client);
  const { data: business, error } = await businesses.getByOwnerUserId(userId);
  if (error || !business?.id) {
    return { success: false, error: "No business profile found. Complete onboarding first." };
  }

  const scopes = scopesForOperator(access);
  const zernioBridgeEnabled = await isZernioConnected(client, business.id);

  // When an ad broker is connected, let the operator read/write across every
  // app linked to the workspace (e.g. all platforms behind Zernio).
  if (zernioBridgeEnabled) {
    if (!scopes.includes("zernio:read")) scopes.push("zernio:read");
    if (!scopes.includes("zernio:write")) scopes.push("zernio:write");
    if (!scopes.includes("campaigns:read")) scopes.push("campaigns:read");
    if (!scopes.includes("campaigns:write")) scopes.push("campaigns:write");
  }

  const ctx: McpAuthContext = {
    connectionId: "operator-in-app",
    businessId: business.id,
    allowedAgentTypes: AGENTS.map((a) => a.key as AgentType),
    scopes: [...new Set(scopes)],
    zernioBridgeEnabled,
  };

  return { success: true, ctx, businessId: business.id };
}

function scopesForOperator(access: CurrentUserAccess): McpScope[] {
  if (access.isOwnerAdmin) {
    return [
      "agents:read",
      "agents:write",
      "leads:read",
      "leads:write",
      "funnel:read",
      "funnel:write",
      "campaigns:read",
      "campaigns:write",
      "zernio:read",
      "zernio:write",
      "automations:trigger",
    ];
  }

  const enabled = new Set(access.enabledServiceKeys);
  const scopes: McpScope[] = ["agents:read", "leads:read"];

  if (enabled.has("basic_services") || enabled.has("mission_control")) {
    scopes.push("leads:read");
  }

  if (enabled.has("agents")) {
    scopes.push("agents:write");
  }

  if (enabled.has("ads_management")) {
    scopes.push("funnel:read", "funnel:write", "campaigns:read", "campaigns:write");
  }

  if (enabled.has("workflow_reporting")) {
    scopes.push("automations:trigger");
  }

  if (enabled.has("email_campaigns")) {
    scopes.push("leads:write");
  }

  return [...new Set(scopes)];
}

async function isZernioConnected(
  client: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const connections = await listBusinessAdConnections(client, businessId);
  return Boolean(findZernioConnection(connections));
}
