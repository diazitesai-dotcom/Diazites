import type { SupabaseClient } from "@supabase/supabase-js";

export function createAgentActionRepository(client: SupabaseClient) {
  return {
    async listByBusiness(businessId: string, limit = 40) {
      return client
        .from("agent_actions")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async insert(input: {
      businessId: string;
      agentType: string;
      actionType: string;
      summary: string;
      detail?: Record<string, unknown>;
      approvalState?: string | null;
    }) {
      return client
        .from("agent_actions")
        .insert({
          business_id: input.businessId,
          agent_type: input.agentType,
          action_type: input.actionType,
          summary: input.summary,
          detail: input.detail ?? {},
          approval_state: input.approvalState ?? null,
        })
        .select("*")
        .single();
    },
  };
}
