import type Stripe from "stripe";

import { env } from "@/lib/env";
import { planMonthlyAmount, normalizePlanName } from "@/lib/billing/plans";
import { createBillingRepository } from "@/repositories/billing.repository";
import type { BillingPlanName, SubscriptionStatus } from "@/types/backend";
import type { SupabaseClient } from "@supabase/supabase-js";

function priceIdToPlanName(priceId: string | undefined): BillingPlanName | null {
  if (!priceId) return null;
  const starter = env.STRIPE_PRICE_STARTER?.trim();
  const growth = env.STRIPE_PRICE_GROWTH?.trim();
  const pro = (env.STRIPE_PRICE_PRO ?? env.STRIPE_PRICE_DOMINATION)?.trim();
  if (starter && priceId === starter) return "Starter";
  if (growth && priceId === growth) return "Growth";
  if (pro && priceId === pro) return "Pro";
  return null;
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
      return "canceled";
    default:
      return "expired";
  }
}

function customerId(sub: Stripe.Subscription): string {
  const c = sub.customer;
  return typeof c === "string" ? c : c.id;
}

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
  const planName = normalizePlanName(
    metaPlan ?? sessionPlan ?? priceIdToPlanName(priceId) ?? "Starter",
  );

  const unitAmount = subscription.items.data[0]?.price?.unit_amount;
  const amount =
    typeof unitAmount === "number" ? unitAmount / 100 : planMonthlyAmount(planName);

  const subscriptionStatus = mapStripeStatus(subscription.status);
  const billing = createBillingRepository(client);
  const { error } = await billing.upsertPlan({
    businessId,
    planName,
    amount,
    paymentStatus: subscriptionStatus === "trialing" ? "trialing" : subscriptionStatus,
    subscriptionStatus,
    stripeCustomerId: customerId(subscription),
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId ?? null,
    convertedAt: subscriptionStatus === "active" ? new Date().toISOString() : null,
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
  const planName = normalizePlanName(priceIdToPlanName(priceId) ?? "Starter");
  const unitAmount = subscription.items.data[0]?.price?.unit_amount;
  const amount =
    typeof unitAmount === "number" ? unitAmount / 100 : planMonthlyAmount(planName);

  await billing.updateSubscriptionFields(businessId, {
    subscription_status: "canceled",
    payment_status: "canceled",
    canceled_at: new Date().toISOString(),
    plan_name: planName,
    amount,
  });
}
