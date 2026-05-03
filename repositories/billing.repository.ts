import type { SupabaseClient } from "@supabase/supabase-js";

import type { BillingPlanName } from "@/types/backend";

export function createBillingRepository(client: SupabaseClient) {
  return {
    async getByBusinessId(businessId: string) {
      return client.from("billing").select("*").eq("business_id", businessId).maybeSingle();
    },

    async upsertPlan(input: {
      businessId: string;
      planName: BillingPlanName;
      amount: number;
      paymentStatus?: string;
      stripeCustomerId?: string | null;
    }) {
      return client
        .from("billing")
        .upsert(
          {
            business_id: input.businessId,
            plan_name: input.planName,
            amount: input.amount,
            payment_status: input.paymentStatus ?? "active",
            stripe_customer_id: input.stripeCustomerId ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id" },
        )
        .select("*")
        .single();
    },

    async updateStripeCustomer(businessId: string, stripeCustomerId: string) {
      return client
        .from("billing")
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq("business_id", businessId)
        .select("*")
        .single();
    },
  };
}
