import type { SupabaseClient } from "@supabase/supabase-js";

import type { CampaignCreateInput } from "@/types/backend";

export function createCampaignRepository(client: SupabaseClient) {
  return {
    async create(input: CampaignCreateInput) {
      return client
        .from("campaigns")
        .insert({
          business_id: input.businessId,
          platform: input.platform,
          budget: input.budget ?? 0,
          goal: input.goal ?? null,
          location: input.location ?? null,
          status: input.status ?? "draft",
        })
        .select("*")
        .single();
    },

    async update(
      campaignId: string,
      data: Partial<{
        budget: number;
        goal: string | null;
        location: string | null;
        status: string;
        spend: number;
        leads_count: number;
        cpl: number;
        conversion_rate: number;
      }>,
    ) {
      return client.from("campaigns").update(data).eq("id", campaignId).select("*").single();
    },

    async listByBusiness(businessId: string) {
      return client
        .from("campaigns")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
    },

    async getById(id: string) {
      return client.from("campaigns").select("*").eq("id", id).maybeSingle();
    },
  };
}
