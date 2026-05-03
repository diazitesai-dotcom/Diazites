import type { SupabaseClient } from "@supabase/supabase-js";

import type { SystemEventType } from "@/types/backend";

export function createSystemEventRepository(client: SupabaseClient) {
  return {
    async insert(input: {
      businessId: string;
      leadId?: string | null;
      eventType: SystemEventType | string;
      payload?: Record<string, unknown>;
    }) {
      return client
        .from("system_events")
        .insert({
          business_id: input.businessId,
          lead_id: input.leadId ?? null,
          event_type: input.eventType,
          payload: input.payload ?? {},
        })
        .select("*")
        .single();
    },

    async listByBusiness(businessId: string, limit = 100) {
      return client
        .from("system_events")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },
  };
}
