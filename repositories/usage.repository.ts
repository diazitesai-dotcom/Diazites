import type { SupabaseClient } from "@supabase/supabase-js";

export function createUsageRepository(client: SupabaseClient) {
  return {
    async upsertPeriod(input: {
      businessId: string;
      periodStart: string;
      periodEnd: string;
      leadsCount: number;
      aiMessagesCount: number;
      campaignsActive: number;
      meta?: Record<string, unknown>;
    }) {
      const { data: existing } = await client
        .from("usage_snapshots")
        .select("id")
        .eq("business_id", input.businessId)
        .eq("period_start", input.periodStart)
        .maybeSingle();

      const row = {
        business_id: input.businessId,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        leads_count: input.leadsCount,
        ai_messages_count: input.aiMessagesCount,
        campaigns_active: input.campaignsActive,
        meta: input.meta ?? {},
      };

      if (existing?.id) {
        return client.from("usage_snapshots").update(row).eq("id", existing.id).select("*").single();
      }

      return client.from("usage_snapshots").insert(row).select("*").single();
    },
  };
}
