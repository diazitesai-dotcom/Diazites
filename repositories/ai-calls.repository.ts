import type { SupabaseClient } from "@supabase/supabase-js";

import type { AiCallDashboardStats, AiCallingAgentRow } from "@/types/diazites-platform";

export function createAiCallsRepository(client: SupabaseClient) {
  return {
    async listAgents(businessId: string) {
      return client
        .from("ai_calling_agents")
        .select("*")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false });
    },

    async getAgent(id: string, businessId: string) {
      return client
        .from("ai_calling_agents")
        .select("*")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
    },

    async createAgent(input: {
      businessId: string;
      name: string;
      objective: string;
      voiceConfig?: Record<string, unknown>;
      scriptConfig?: Record<string, unknown>;
    }) {
      return client
        .from("ai_calling_agents")
        .insert({
          business_id: input.businessId,
          name: input.name,
          objective: input.objective,
          voice_config: input.voiceConfig ?? {},
          script_config: input.scriptConfig ?? {},
          status: "draft",
        })
        .select("*")
        .single();
    },

    async updateAgent(
      id: string,
      businessId: string,
      patch: Partial<{
        name: string;
        objective: string;
        status: string;
        voice_config: Record<string, unknown>;
        script_config: Record<string, unknown>;
        routing_config: Record<string, unknown>;
      }>,
    ) {
      return client
        .from("ai_calling_agents")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    async listCalls(businessId: string, limit = 50) {
      return client
        .from("diazites_calls")
        .select("*, ai_calling_agents(name)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async dashboardStats(businessId: string): Promise<AiCallDashboardStats> {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: agents } = await client
        .from("ai_calling_agents")
        .select("status")
        .eq("business_id", businessId);

      const { data: calls } = await client
        .from("diazites_calls")
        .select("direction, status, outcome, created_at")
        .eq("business_id", businessId)
        .gte("created_at", today.toISOString());

      const callRows = calls ?? [];
      const completed = callRows.filter((c) => c.status === "completed");
      const answered = completed.length;
      const total = callRows.length || 1;

      return {
        activeAgents: (agents ?? []).filter((a) => a.status === "active").length,
        callsToday: callRows.length,
        outbound: callRows.filter((c) => c.direction === "outbound").length,
        inbound: callRows.filter((c) => c.direction === "inbound").length,
        answerRate: Math.round((answered / total) * 100),
        qualifiedLeads: completed.filter((c) => c.outcome === "qualified").length,
        appointmentsBooked: completed.filter((c) => c.outcome === "appointment_booked").length,
        followUpsTriggered: 0,
        pipelineMovements: 0,
        workflowActionsTriggered: 0,
        revenueAttributed: 0,
      };
    },
  };
}

export type { AiCallingAgentRow };
