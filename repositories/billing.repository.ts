import type { SupabaseClient } from "@supabase/supabase-js";

import type { SubscriptionStatus } from "@/types/backend";
import type { BillingPlanName } from "@/types/backend";

export type BillingRow = {
  id: string;
  business_id: string;
  plan_name: string;
  amount: number;
  payment_status: string;
  subscription_status: SubscriptionStatus | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  billing_cycle: string;
  promo_code: string | null;
  promo_source: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  converted_at: string | null;
  canceled_at: string | null;
  updated_at: string;
};

export function createBillingRepository(client: SupabaseClient) {
  return {
    async getByBusinessId(businessId: string) {
      return client.from("billing").select("*").eq("business_id", businessId).maybeSingle();
    },

    async upsertPlan(input: {
      businessId: string;
      planName: BillingPlanName | string;
      amount: number;
      paymentStatus?: string;
      subscriptionStatus?: SubscriptionStatus;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      stripePriceId?: string | null;
      trialStartedAt?: string | null;
      trialEndsAt?: string | null;
      promoCode?: string | null;
      promoSource?: string | null;
      billingCycle?: string;
      convertedAt?: string | null;
    }) {
      return client
        .from("billing")
        .upsert(
          {
            business_id: input.businessId,
            plan_name: input.planName,
            amount: input.amount,
            payment_status: input.paymentStatus ?? "trialing",
            subscription_status: input.subscriptionStatus ?? "trialing",
            stripe_customer_id: input.stripeCustomerId ?? null,
            stripe_subscription_id: input.stripeSubscriptionId ?? null,
            stripe_price_id: input.stripePriceId ?? null,
            trial_started_at: input.trialStartedAt ?? null,
            trial_ends_at: input.trialEndsAt ?? null,
            promo_code: input.promoCode ?? null,
            promo_source: input.promoSource ?? null,
            billing_cycle: input.billingCycle ?? "monthly",
            converted_at: input.convertedAt ?? null,
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

    async updateSubscriptionFields(
      businessId: string,
      patch: Partial<{
        subscription_status: SubscriptionStatus;
        payment_status: string;
        trial_ends_at: string | null;
        converted_at: string | null;
        canceled_at: string | null;
        plan_name: string;
        amount: number;
      }>,
    ) {
      return client
        .from("billing")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("business_id", businessId)
        .select("*")
        .single();
    },
  };
}
