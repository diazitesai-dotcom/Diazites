import type { SupabaseClient } from "@supabase/supabase-js";

import type { UsageMetricKey } from "@/lib/billing/plans";

export function createUsageRecordsRepository(client: SupabaseClient) {
  return {
    async upsertMetric(input: {
      businessId: string;
      metricKey: UsageMetricKey | string;
      quantity: number;
      periodStart: string;
      periodEnd: string;
      includedLimit?: number | null;
    }) {
      const overage =
        input.includedLimit != null && input.quantity > input.includedLimit
          ? input.quantity - input.includedLimit
          : 0;

      return client
        .from("usage_records")
        .upsert(
          {
            business_id: input.businessId,
            metric_key: input.metricKey,
            quantity: input.quantity,
            period_start: input.periodStart,
            period_end: input.periodEnd,
            included_limit: input.includedLimit ?? null,
            overage_quantity: overage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id,metric_key,period_start,period_end" },
        )
        .select("*")
        .single();
    },

    async listForPeriod(businessId: string, periodStart: string, periodEnd: string) {
      return client
        .from("usage_records")
        .select("*")
        .eq("business_id", businessId)
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd);
    },
  };
}
