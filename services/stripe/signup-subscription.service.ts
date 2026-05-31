import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/plans";
import { getStripe } from "@/lib/stripe";
import { stripePriceIdForPlan } from "@/lib/stripe/plan-prices";
import { fail, ok, type ServiceResult } from "@/lib/result";
import type { BillingPlanName } from "@/types/backend";

export async function attachTrialSubscriptionFromSetupIntent(params: {
  setupIntentId: string;
  userId: string;
  planName: BillingPlanName;
}): Promise<ServiceResult<{ subscriptionId: string; customerId: string }>> {
  const stripe = getStripe();
  if (!stripe) return fail("Stripe is not configured.", "STRIPE_CONFIG");

  const setupIntent = await stripe.setupIntents.retrieve(params.setupIntentId);

  if (setupIntent.status !== "succeeded") {
    return fail("Payment method was not confirmed. Please try again.", "PAYMENT_INCOMPLETE");
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) {
    return fail("No payment method on file.", "PAYMENT_MISSING");
  }

  const customerId =
    typeof setupIntent.customer === "string"
      ? setupIntent.customer
      : setupIntent.customer?.id;

  if (!customerId) {
    return fail("Stripe customer missing for this signup.", "STRIPE_ERROR");
  }

  const priceId =
    setupIntent.metadata?.signup_price_id ?? stripePriceIdForPlan(params.planName);
  if (!priceId) {
    return fail("Stripe price is not configured for the selected plan.", "STRIPE_CONFIG");
  }

  await stripe.customers.update(customerId, {
    metadata: {
      user_id: params.userId,
      signup_plan: params.planName,
    },
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 5,
  });

  const activeTrial = existingSubs.data.find(
    (s) => s.status === "trialing" || s.status === "active",
  );

  if (activeTrial) {
    return ok({ subscriptionId: activeTrial.id, customerId });
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: DEFAULT_TRIAL_DAYS,
    default_payment_method: paymentMethodId,
    metadata: {
      user_id: params.userId,
      plan_name: params.planName,
      signup_checkout: "true",
    },
  });

  return ok({ subscriptionId: subscription.id, customerId });
}
