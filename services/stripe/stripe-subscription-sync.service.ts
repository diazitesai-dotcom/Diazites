import type Stripe from "stripe";

import { env } from "@/lib/env";
import { createBillingRepository } from "@/repositories/billing.repository";
import type { BillingPlanName } from "@/types/backend";
import type { SupabaseClient } from "@supabase/supabase-js";

const PLAN_AMOUNTS: Record<BillingPlanName, number> = {
  Starter: 497,
  Growth: 997,
  Domination: 1997,
};

function priceIdToPlanName(priceId: string | undefined): BillingPlanName | null {
  if (!priceId) return null;
  const a = env.STRIPE_PRICE_STARTER?.trim();
  const b = env.STRIPE_PRICE_GROWTH?.trim();
  const c = env.STRIPE_PRICE_DOMINATION?.trim();
  if (a && priceId === a) return "Starter";
  if (b && priceId === b) return "Growth";
  if (c && priceId === c) return "Domination";
  return null;
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    default:
      return "canceled";
  }
}

function customerId(sub: Stripe.Subscription): string {
  const c = sub.customer;
  return typeof c === "string" ? c : c.id;
}

/**
 * Persists subscription state from Stripe onto `billing` (service-role Supabase client).
 */
export async function syncSubscriptionToBilling(
  client: SupabaseClient,
  subscription: Stripe.Subscription,
  sessionMetadata?: Stripe.Metadata | null,
): Promise<void> {
  const businessId =
    (sessionMetadata?.business_id as string | undefined) ??
    (subscription.metadata?.business_id as string | undefined);
  if (!businessId) {
    console.warn("[stripe sync] missing business_id in subscription/session metadata");
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const metaPlan = subscription.metadata?.plan_name as BillingPlanName | undefined;
  const sessionPlan = sessionMetadata?.plan_name as BillingPlanName | undefined;
  const planName =
    metaPlan ??
    sessionPlan ??
    priceIdToPlanName(priceId) ??
    ("Starter" as BillingPlanName);

  const unitAmount = subscription.items.data[0]?.price?.unit_amount;
  const amount =
    typeof unitAmount === "number"
      ? unitAmount / 100
      : PLAN_AMOUNTS[planName] ?? PLAN_AMOUNTS.Starter;

  const billing = createBillingRepository(client);
  const { error } = await billing.upsertPlan({
    businessId,
    planName,
    amount,
    paymentStatus: mapStripeStatus(subscription.status),
    stripeCustomerId: customerId(subscription),
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId ?? null,
  });

  if (error) {
    console.error("[stripe sync] billing upsert failed", error);
  }
}

export async function markSubscriptionCanceled(
  client: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const businessId = subscription.metadata?.business_id as string | undefined;
  if (!businessId) return;

  const billing = createBillingRepository(client);
  const priceId = subscription.items.data[0]?.price?.id;
  const planName = priceIdToPlanName(priceId) ?? ("Starter" as BillingPlanName);
  const unitAmount = subscription.items.data[0]?.price?.unit_amount;
  const amount =
    typeof unitAmount === "number"
      ? unitAmount / 100
      : PLAN_AMOUNTS[planName] ?? PLAN_AMOUNTS.Starter;

  await billing.upsertPlan({
    businessId,
    planName,
    amount,
    paymentStatus: "canceled",
    stripeCustomerId: customerId(subscription),
    stripeSubscriptionId: null,
    stripePriceId: priceId ?? null,
  });
}
