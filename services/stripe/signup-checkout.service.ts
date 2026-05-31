import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/plans";
import { getPublicAppUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { stripePriceIdForPlan } from "@/lib/stripe/plan-prices";
import { createSubscriptionCheckoutSession } from "@/services/stripe/checkout.service";
import type { BillingPlanName } from "@/types/backend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Legacy redirect checkout — prefer inline Payment Element on /signup when Stripe is configured.
 */
export async function createSignupTrialCheckoutSession(params: {
  userId: string;
  email: string;
  planName: BillingPlanName;
}): Promise<{ url: string } | null> {
  const stripe = getStripe();
  const priceId = stripePriceIdForPlan(params.planName);
  if (!stripe || !priceId) return null;

  const baseUrl = getPublicAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/onboarding?welcome=trial&checkout=success`,
    cancel_url: `${baseUrl}/signup?step=2&plan=${encodeURIComponent(params.planName)}`,
    client_reference_id: params.userId,
    allow_promotion_codes: true,
    customer_email: params.email,
    metadata: {
      user_id: params.userId,
      plan_name: params.planName,
      signup_checkout: "true",
    },
    subscription_data: {
      trial_period_days: DEFAULT_TRIAL_DAYS,
      metadata: {
        user_id: params.userId,
        plan_name: params.planName,
        signup_checkout: "true",
      },
    },
  });

  return session.url ? { url: session.url } : null;
}

/** After onboarding creates a business, use the standard billing checkout if needed. */
export async function createPostOnboardingCheckoutIfNeeded(params: {
  supabase: SupabaseClient;
  user: User;
  businessId: string;
  planName: BillingPlanName;
}): Promise<{ url: string } | null> {
  try {
    return await createSubscriptionCheckoutSession(params);
  } catch {
    return null;
  }
}
