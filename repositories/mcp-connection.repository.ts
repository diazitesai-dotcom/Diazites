import type { SupabaseClient } from "@supabase/supabase-js";

import type { AgentType } from "@/types/domain";
import type { AgentMcpConnectionRow } from "@/types/mcp";
import type { McpClientType, McpScope } from "@/utils/mcp-constants";

export function createMcpConnectionRepository(client: SupabaseClient) {
  return {
    async listAllActive(limit = 500) {
      return client
        .from("agent_mcp_connections")
        .select(
          `
          id,
          business_id,
          label,
          client_type,
          token_prefix,
          allowed_agent_types,
          scopes,
          zernio_bridge_enabled,
          last_used_at,
          created_at,
          businesses ( id, name )
        `,
        )
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async revokeById(connectionId: string) {
      return client
        .from("agent_mcp_connections")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", connectionId)
        .is("revoked_at", null);
    },

    async listByBusiness(businessId: string) {
      return client
        .from("agent_mcp_connections")
        .select(
          "id, business_id, label, client_type, token_prefix, allowed_agent_types, scopes, zernio_bridge_enabled, last_used_at, revoked_at, created_at",
        )
        .eq("business_id", businessId)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
    },

    async findActiveByTokenHash(tokenHash: string) {
      return client
        .from("agent_mcp_connections")
        .select("*")
        .eq("token_hash", tokenHash)
        .is("revoked_at", null)
        .maybeSingle<AgentMcpConnectionRow>();
    },

    async create(input: {
      businessId: string;
      label: string;
      clientType: McpClientType;
      tokenHash: string;
      tokenPrefix: string;
      allowedAgentTypes: AgentType[];
      scopes: McpScope[];
      zernioBridgeEnabled: boolean;
    }) {
      return client
        .from("agent_mcp_connections")
        .insert({
          business_id: input.businessId,
          label: input.label,
          client_type: input.clientType,
          token_hash: input.tokenHash,
          token_prefix: input.tokenPrefix,
          allowed_agent_types: input.allowedAgentTypes,
          scopes: input.scopes,
          zernio_bridge_enabled: input.zernioBridgeEnabled,
        })
        .select(
          "id, business_id, label, client_type, token_prefix, allowed_agent_types, scopes, zernio_bridge_enabled, last_used_at, revoked_at, created_at",
        )
        .single();
    },

    async revoke(connectionId: string, businessId: string) {
      return client
        .from("agent_mcp_connections")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", connectionId)
        .eq("business_id", businessId)
        .is("revoked_at", null);
    },

    async touchLastUsed(connectionId: string) {
      return client
        .from("agent_mcp_connections")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", connectionId);
    },

    async updateAccess(
      connectionId: string,
      businessId: string,
      patch: {
        allowedAgentTypes?: AgentType[];
        scopes?: McpScope[];
        zernioBridgeEnabled?: boolean;
      },
    ) {
      const row: Record<string, unknown> = {};
      if (patch.allowedAgentTypes !== undefined) {
        row.allowed_agent_types = patch.allowedAgentTypes;
      }
      if (patch.scopes !== undefined) row.scopes = patch.scopes;
      if (patch.zernioBridgeEnabled !== undefined) {
        row.zernio_bridge_enabled = patch.zernioBridgeEnabled;
      }
      return client
        .from("agent_mcp_connections")
        .update(row)
        .eq("id", connectionId)
        .eq("business_id", businessId)
        .is("revoked_at", null)
        .select(
          "id, business_id, label, client_type, token_prefix, allowed_agent_types, scopes, zernio_bridge_enabled, last_used_at, revoked_at, created_at",
        )
        .single();
    },
  };
}
