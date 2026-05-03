import type { SupabaseClient } from "@supabase/supabase-js";

export function createReportRepository(client: SupabaseClient) {
  return {
    async upsertDailySnapshot(input: {
      businessId: string;
      reportDate: string;
      leads: number;
      spend: number;
      cpl: number;
      roi: number;
      conversions: number;
    }) {
      const { data: existing } = await client
        .from("reports")
        .select("id")
        .eq("business_id", input.businessId)
        .eq("report_date", input.reportDate)
        .maybeSingle();

      if (existing?.id) {
        return client
          .from("reports")
          .update({
            leads: input.leads,
            spend: input.spend,
            cpl: input.cpl,
            roi: input.roi,
            conversions: input.conversions,
          })
          .eq("id", existing.id)
          .select("*")
          .single();
      }

      return client
        .from("reports")
        .insert({
          business_id: input.businessId,
          report_date: input.reportDate,
          leads: input.leads,
          spend: input.spend,
          cpl: input.cpl,
          roi: input.roi,
          conversions: input.conversions,
        })
        .select("*")
        .single();
    },

    async listByBusiness(businessId: string, limit = 90) {
      return client
        .from("reports")
        .select("*")
        .eq("business_id", businessId)
        .order("report_date", { ascending: false })
        .limit(limit);
    },
  };
}
