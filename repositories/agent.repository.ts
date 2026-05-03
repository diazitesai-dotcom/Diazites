import type { SupabaseClient } from "@supabase/supabase-js";

import type { AgentType } from "@/types/domain";

export function createAgentRepository(client: SupabaseClient) {
  return {
    async upsertActivation(input: {
      businessId: string;
      agentType: AgentType;
      status: "inactive" | "pending" | "active";
      activatedAt?: string | null;
    }) {
      return client
        .from("agents")
        .upsert(
          {
            business_id: input.businessId,
            agent_type: input.agentType,
            status: input.status,
            activated_at: input.activatedAt ?? new Date().toISOString(),
          },
          { onConflict: "business_id,agent_type" },
        )
        .select("*")
        .single();
    },

    async updateStatus(
      businessId: string,
      agentType: AgentType,
      status: "inactive" | "pending" | "active",
    ) {
      return client
        .from("agents")
        .update({ status, activated_at: status !== "inactive" ? new Date().toISOString() : null })
        .eq("business_id", businessId)
        .eq("agent_type", agentType)
        .select("*")
        .single();
    },

    async listByBusiness(businessId: string) {
      return client.from("agents").select("*").eq("business_id", businessId);
    },
  };
}
