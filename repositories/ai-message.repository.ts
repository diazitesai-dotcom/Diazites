import type { SupabaseClient } from "@supabase/supabase-js";

export function createAiMessageRepository(client: SupabaseClient) {
  return {
    async create(input: {
      leadId: string;
      businessId: string;
      channel?: string;
      messageBody: string;
      model?: string | null;
      status?: string;
    }) {
      return client
        .from("ai_messages")
        .insert({
          lead_id: input.leadId,
          business_id: input.businessId,
          channel: input.channel ?? "email",
          message_body: input.messageBody,
          model: input.model ?? null,
          status: input.status ?? "sent",
        })
        .select("*")
        .single();
    },

    async countByBusinessSince(businessId: string, since: Date) {
      return client
        .from("ai_messages")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("sent_at", since.toISOString());
    },
  };
}
