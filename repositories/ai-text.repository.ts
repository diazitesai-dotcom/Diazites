import type { SupabaseClient } from "@supabase/supabase-js";

import type { AiTextAgentRow, AiTextDashboardStats, SmsCampaignRow, SmsSequenceRow } from "@/types/diazites-platform";

export function createAiTextRepository(client: SupabaseClient) {
  return {
    async listAgents(businessId: string) {
      return client
        .from("ai_text_agents")
        .select("*")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false });
    },

    async createAgent(input: {
      businessId: string;
      name: string;
      objective: string;
      personaConfig?: Record<string, unknown>;
      scriptConfig?: Record<string, unknown>;
    }) {
      return client
        .from("ai_text_agents")
        .insert({
          business_id: input.businessId,
          name: input.name,
          objective: input.objective,
          persona_config: input.personaConfig ?? {},
          script_config: input.scriptConfig ?? {},
          status: "draft",
        })
        .select("*")
        .single();
    },

    async updateAgent(
      id: string,
      businessId: string,
      patch: Partial<{ name: string; objective: string; status: string; script_config: Record<string, unknown> }>,
    ) {
      return client
        .from("ai_text_agents")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    async listCampaigns(businessId: string) {
      return client
        .from("sms_campaigns")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async createCampaign(input: {
      businessId: string;
      name: string;
      messageBody: string;
      aiTextAgentId?: string | null;
      audienceType?: string;
    }) {
      return client
        .from("sms_campaigns")
        .insert({
          business_id: input.businessId,
          name: input.name,
          message_body: input.messageBody,
          ai_text_agent_id: input.aiTextAgentId ?? null,
          audience_type: input.audienceType ?? "all_contacts",
        })
        .select("*")
        .single();
    },

    async updateCampaignStatus(id: string, businessId: string, status: string, extra?: Partial<SmsCampaignRow>) {
      return client
        .from("sms_campaigns")
        .update({
          status,
          ...extra,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    async insertCampaignSend(input: {
      businessId: string;
      campaignId: string;
      contactId?: string | null;
      leadId?: string | null;
      phone: string;
      status: string;
      providerMessageId?: string;
      errorDetail?: string;
    }) {
      return client.from("sms_campaign_sends").insert({
        business_id: input.businessId,
        campaign_id: input.campaignId,
        contact_id: input.contactId ?? null,
        lead_id: input.leadId ?? null,
        phone: input.phone,
        status: input.status,
        provider_message_id: input.providerMessageId ?? null,
        error_detail: input.errorDetail ?? null,
        sent_at: input.status === "sent" ? new Date().toISOString() : null,
      });
    },

    async listSequences(businessId: string) {
      return client
        .from("sms_sequences")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async listRecentMessages(businessId: string, limit = 30) {
      return client
        .from("messages")
        .select("*, conversations(channel, contact_id, lead_id)")
        .eq("business_id", businessId)
        .order("sent_at", { ascending: false })
        .limit(limit);
    },

    async dashboardStats(businessId: string): Promise<AiTextDashboardStats> {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [agents, campaigns, sequences, sends, messages] = await Promise.all([
        client.from("ai_text_agents").select("id, status").eq("business_id", businessId),
        client.from("sms_campaigns").select("id, status, stats").eq("business_id", businessId),
        client.from("sms_sequences").select("id, status").eq("business_id", businessId),
        client
          .from("sms_campaign_sends")
          .select("status, created_at")
          .eq("business_id", businessId)
          .gte("created_at", today.toISOString()),
        client
          .from("messages")
          .select("id, direction")
          .eq("business_id", businessId)
          .eq("direction", "outbound")
          .gte("sent_at", today.toISOString()),
      ]);

      const agentRows = agents.data ?? [];
      const sendRows = sends.data ?? [];
      const sent = sendRows.filter((s) => s.status === "sent" || s.status === "delivered").length;
      const failed = sendRows.filter((s) => s.status === "failed").length;
      const replied = sendRows.filter((s) => s.status === "replied").length;

      return {
        activeAgents: agentRows.filter((a) => a.status === "active").length,
        messagesSentToday: (messages.data ?? []).length + sent,
        campaignsActive: (campaigns.data ?? []).filter((c) => c.status === "sending" || c.status === "scheduled").length,
        replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
        sequencesActive: (sequences.data ?? []).filter((s) => s.status === "active").length,
        pipelineMovements: 0,
        workflowActionsTriggered: 0,
        failedDeliveries: failed,
      };
    },
  };
}
