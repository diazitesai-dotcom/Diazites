import type { SupabaseClient } from "@supabase/supabase-js";

import type { AgentPermissionKey } from "@/types/marketing-os";

export function createAgentPermissionRepository(client: SupabaseClient) {
  return {
    async listByBusiness(businessId: string) {
      return client
        .from("agent_permissions")
        .select("*")
        .eq("business_id", businessId)
        .order("permission_key");
    },

    async upsert(input: {
      businessId: string;
      agentId?: string | null;
      adAccountId?: string | null;
      permissionKey: AgentPermissionKey;
      granted: boolean;
      requiresApproval?: boolean;
    }) {
      const row = {
        business_id: input.businessId,
        agent_id: input.agentId ?? null,
        ad_account_id: input.adAccountId ?? null,
        permission_key: input.permissionKey,
        granted: input.granted,
        requires_approval: input.requiresApproval ?? true,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await client
        .from("agent_permissions")
        .select("id")
        .eq("business_id", input.businessId)
        .eq("permission_key", input.permissionKey)
        .is("agent_id", input.agentId ?? null)
        .is("ad_account_id", input.adAccountId ?? null)
        .maybeSingle();

      if (existing?.id) {
        return client.from("agent_permissions").update(row).eq("id", existing.id).select("*").single();
      }
      return client.from("agent_permissions").insert(row).select("*").single();
    },

    async hasPermission(
      businessId: string,
      permissionKey: AgentPermissionKey,
      agentId?: string | null,
    ): Promise<{ granted: boolean; requiresApproval: boolean }> {
      const { data } = await client
        .from("agent_permissions")
        .select("granted, requires_approval")
        .eq("business_id", businessId)
        .eq("permission_key", permissionKey)
        .or(agentId ? `agent_id.eq.${agentId},agent_id.is.null` : "agent_id.is.null")
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          granted: Boolean(data.granted),
          requiresApproval: Boolean(data.requires_approval),
        };
      }
      return defaultPermission(permissionKey);
    },
  };
}

function defaultPermission(permissionKey: AgentPermissionKey) {
  const readOnly = permissionKey === "read_campaigns" || permissionKey === "pull_reports";
  return { granted: readOnly, requiresApproval: !readOnly };
}
