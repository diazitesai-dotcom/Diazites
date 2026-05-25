import type { User } from "@supabase/supabase-js";

import { env, getPublicAppUrl } from "@/lib/env";
import { createBillingRepository } from "@/repositories/billing.repository";
import { requireStripe } from "@/lib/stripe";
import type { BillingPlanName } from "@/types/backend";
import type { SupabaseClient } from "@supabase/supabase-js";

const PRICE_ENV: Record<BillingPlanName, string> = {
  Starter: "STRIPE_PRICE_STARTER",
  Growth: "STRIPE_PRICE_GROWTH",
  Domination: "STRIPE_PRICE_DOMINATION",
};

function priceIdForPlan(plan: BillingPlanName): string {
  const raw =
    plan === "Starter"
      ? env.STRIPE_PRICE_STARTER
      : plan === "Growth"
        ? env.STRIPE_PRICE_GROWTH
        : env.STRIPE_PRICE_DOMINATION;
  const id = raw?.trim() ?? "";
  if (!id) {
    throw new Error(
      `Missing Stripe Price ID for ${plan}. Set ${PRICE_ENV[plan]} in the environment.`,
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/organization?tab=billing&checkout=success`,
    cancel_url: `${baseUrl}/dashboard/organization?tab=billing&checkout=canceled`,
    client_reference_id: params.businessId,
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
