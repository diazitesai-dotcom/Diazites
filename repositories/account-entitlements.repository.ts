import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountEntitlementsMap, EntitlementKey } from "@/types/entitlements";

type EntitlementRow = {
  entitlement_key: string;
  value_int: number | null;
  value_bool: boolean | null;
  plan_key: string;
};

export function createAccountEntitlementsRepository(client: SupabaseClient) {
  return {
    async refreshFromPlan(businessId: string, planKey: string) {
      return client.rpc("refresh_account_entitlements", {
        p_business_id: businessId,
        p_plan_key: planKey,
      });
    },

    async listForBusiness(businessId: string) {
      return client
        .from("account_entitlements")
        .select("entitlement_key, value_int, value_bool, plan_key")
        .eq("business_id", businessId);
    },

    async getBusinessPlanKey(businessId: string) {
      return client
        .from("businesses")
        .select("entitlement_plan_key")
        .eq("id", businessId)
        .maybeSingle();
    },

    async getUsage(businessId: string, featureKey: string, periodStart: string) {
      return client
        .from("feature_usage_counters")
        .select("quantity")
        .eq("business_id", businessId)
        .eq("feature_key", featureKey)
        .eq("period_start", periodStart)
        .maybeSingle();
    },

    async incrementUsage(
      businessId: string,
      featureKey: string,
      periodStart: string,
      delta: number,
    ) {
      const { data: existing } = await this.getUsage(businessId, featureKey, periodStart);
      const next = Number(existing?.quantity ?? 0) + delta;
      return client.from("feature_usage_counters").upsert(
        {
          business_id: businessId,
          feature_key: featureKey,
          period_start: periodStart,
          quantity: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,feature_key,period_start" },
      );
    },
  };
}

export function rowsToEntitlementsMap(rows: EntitlementRow[]): AccountEntitlementsMap {
  const map: AccountEntitlementsMap = {};
  for (const row of rows) {
    map[row.entitlement_key as EntitlementKey] = {
      int: row.value_int,
      bool: row.value_bool ?? undefined,
    };
  }
  return map;
}
