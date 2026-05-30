import type { User } from "@supabase/supabase-js";

import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/plans";
import { env, getPublicAppUrl } from "@/lib/env";
import { createBillingRepository } from "@/repositories/billing.repository";
import { requireStripe } from "@/lib/stripe";
import type { BillingPlanName } from "@/types/backend";
import type { SupabaseClient } from "@supabase/supabase-js";

const PRICE_ENV: Record<BillingPlanName, string> = {
  Starter: "STRIPE_PRICE_STARTER",
  Growth: "STRIPE_PRICE_GROWTH",
  Pro: "STRIPE_PRICE_PRO",
  Enterprise: "STRIPE_PRICE_PRO",
  Domination: "STRIPE_PRICE_DOMINATION",
};

function priceIdForPlan(plan: BillingPlanName): string {
  const key = PRICE_ENV[plan] ?? "STRIPE_PRICE_STARTER";
  const raw =
    key === "STRIPE_PRICE_STARTER"
      ? env.STRIPE_PRICE_STARTER
      : key === "STRIPE_PRICE_GROWTH"
        ? env.STRIPE_PRICE_GROWTH
        : key === "STRIPE_PRICE_PRO"
          ? env.STRIPE_PRICE_PRO ?? env.STRIPE_PRICE_DOMINATION
          : env.STRIPE_PRICE_DOMINATION;
  const id = raw?.trim() ?? "";
  if (!id) {
    throw new Error(
      `Missing Stripe Price ID for ${plan}. Set ${PRICE_ENV[plan] ?? "STRIPE_PRICE_*"} in the environment.`,
    );
  }
  return id;
}

export async function createSubscriptionCheckoutSession(params: {
  supabase: SupabaseClient;
  user: User;
  businessId: string;
  planName: BillingPlanName;
}): Promise<{ url: string }> {
  const stripe = requireStripe();
  const baseUrl = getPublicAppUrl();
  const priceId = priceIdForPlan(params.planName);

  const billing = createBillingRepository(params.supabase);
  const { data: existing } = await billing.getByBusinessId(params.businessId);
  const onNativeTrial =
    existing?.subscription_status === "trialing" && !existing?.stripe_subscription_id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/organization?tab=billing&checkout=success`,
    cancel_url: `${baseUrl}/dashboard/organization?tab=billing&checkout=canceled`,
    client_reference_id: params.businessId,
    allow_promotion_codes: true,
    metadata: {
      business_id: params.businessId,
      user_id: params.user.id,
      plan_name: params.planName,
    },
    subscription_data: {
      metadata: {
        business_id: params.businessId,
        plan_name: params.planName,
      },
      ...(onNativeTrial ? { trial_period_days: DEFAULT_TRIAL_DAYS } : {}),
    },
    ...(existing?.stripe_customer_id
      ? { customer: existing.stripe_customer_id }
      : { customer_email: params.user.email ?? undefined }),
  });

  const url = session.url;
  if (!url) throw new Error("Stripe Checkout did not return a redirect URL.");
  return { url };
}

export async function createBillingPortalSession(params: {
  supabase: SupabaseClient;
  stripeCustomerId: string;
}): Promise<{ url: string }> {
  const stripe = requireStripe();
  const baseUrl = getPublicAppUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/organization?tab=billing`,
  });

  return { url: session.url };
}
